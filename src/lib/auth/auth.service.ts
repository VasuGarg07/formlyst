import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
    type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../firebase';
import type { LoginData, RegisterData, User } from './auth.types';

export const toUser = (u: FirebaseUser): User => ({
    id: u.uid,
    username: u.displayName || u.email?.split('@')[0] || 'User',
    email: u.email || '',
});

const MESSAGES: Record<string, string> = {
    'auth/invalid-credential': 'Invalid email or password',
    'auth/email-already-in-use': 'This email is already registered',
    'auth/weak-password': 'Password must be at least 6 characters',
    'auth/too-many-requests': 'Too many attempts, try again later',
    'auth/popup-closed-by-user': 'Sign-in was cancelled',
};

export const authError = (e: any): string => MESSAGES[e?.code] || e?.message || 'Something went wrong';

export const register = async ({ username, email, password }: RegisterData): Promise<User> => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName: username });
    return toUser(user);
};

export const login = async ({ email, password }: LoginData): Promise<User> => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return toUser(user);
};

export const loginWithGoogle = async (): Promise<User> => {
    const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
    return toUser(user);
};

export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

export const logout = () => signOut(auth);
