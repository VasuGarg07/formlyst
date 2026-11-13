import {
    addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, query,
    serverTimestamp, Timestamp, updateDoc, where, writeBatch,
    type DocumentData, type DocumentSnapshot,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { Form, FormConfig, FormResponse } from './types';

const formsRef = collection(db, 'forms');
const responsesRef = collection(db, 'responses');

const uid = () => auth.currentUser!.uid;
const iso = (v: unknown) => (v instanceof Timestamp ? v.toDate().toISOString() : '');
const clean = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const toForm = (snap: DocumentSnapshot<DocumentData>): Form => {
    const d = snap.data()!;
    return { ...d, id: snap.id, shareUrl: snap.id, createdAt: iso(d.createdAt), updatedAt: iso(d.updatedAt) } as Form;
};

const toResponse = (snap: DocumentSnapshot<DocumentData>): FormResponse => {
    const d = snap.data()!;
    return { id: snap.id, formId: d.formId, responses: d.responses, userAgent: d.userAgent, ipAddress: '', submittedAt: iso(d.submittedAt) };
};

const ownedResponses = (formId: string) =>
    getDocs(query(responsesRef, where('formId', '==', formId), where('ownerId', '==', uid())));

export async function getForms(): Promise<Form[]> {
    const snap = await getDocs(query(formsRef, where('createdBy', '==', uid())));
    return snap.docs.map(toForm).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getFormById(id: string): Promise<Form> {
    const snap = await getDoc(doc(formsRef, id));
    if (!snap.exists()) throw new Error('Form not found');
    return toForm(snap);
}

export async function createForm(config: FormConfig): Promise<Form> {
    const ref = await addDoc(formsRef, {
        ...clean(config),
        createdBy: uid(),
        isActive: true,
        responseCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return getFormById(ref.id);
}

export async function updateForm(id: string, config: FormConfig): Promise<Form> {
    await updateDoc(doc(formsRef, id), { ...clean(config), updatedAt: serverTimestamp() });
    return getFormById(id);
}

export async function deleteForm(id: string): Promise<void> {
    await deleteAllResponses(id);
    await deleteDoc(doc(formsRef, id));
}

export async function duplicateForm(id: string): Promise<Form> {
    const original = await getFormById(id);
    const copy = await createForm({
        title: `${original.title} (Copy)`,
        description: original.description,
        steps: original.steps,
    });
    return toggleFormStatus(copy.id);
}

export async function toggleFormStatus(id: string): Promise<Form> {
    const form = await getFormById(id);
    await updateDoc(doc(formsRef, id), { isActive: !form.isActive });
    return getFormById(id);
}

export async function getPublicForm(shareUrl: string): Promise<Form> {
    return getFormById(shareUrl);
}

export async function submitResponse(shareUrl: string, responses: Record<string, unknown>): Promise<string> {
    const form = await getFormById(shareUrl);
    const ref = doc(responsesRef);
    const batch = writeBatch(db);
    batch.set(ref, {
        formId: shareUrl,
        ownerId: form.createdBy,
        responses: clean(responses),
        userAgent: navigator.userAgent,
        submittedAt: serverTimestamp(),
    });
    batch.update(doc(formsRef, shareUrl), { responseCount: increment(1) });
    await batch.commit();
    return ref.id;
}

export async function getResponses(formId: string): Promise<FormResponse[]> {
    const snap = await ownedResponses(formId);
    return snap.docs.map(toResponse).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function getResponseById(responseId: string): Promise<FormResponse> {
    const snap = await getDoc(doc(responsesRef, responseId));
    if (!snap.exists()) throw new Error('Response not found');
    return toResponse(snap);
}

export async function deleteResponse(id: string): Promise<void> {
    const { formId } = await getResponseById(id);
    const batch = writeBatch(db);
    batch.delete(doc(responsesRef, id));
    batch.update(doc(formsRef, formId), { responseCount: increment(-1) });
    await batch.commit();
}

export async function deleteAllResponses(formId: string): Promise<number> {
    const snap = await ownedResponses(formId);
    for (let i = 0; i < snap.docs.length; i += 400) {
        const batch = writeBatch(db);
        snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit();
    }
    await updateDoc(doc(formsRef, formId), { responseCount: 0 }).catch(() => undefined);
    return snap.size;
}
