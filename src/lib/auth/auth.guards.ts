import { redirect, type LoaderFunctionArgs } from 'react-router';
import { auth } from '../firebase';

export const protectedLoader = async ({ request }: LoaderFunctionArgs) => {
    await auth.authStateReady();
    if (auth.currentUser) return null;

    const url = new URL(request.url);
    const params = new URLSearchParams({ redirect: url.pathname + url.search });
    throw redirect(`/auth/login?${params}`);
};

export const publicOnlyLoader = async () => {
    await auth.authStateReady();
    if (auth.currentUser) throw redirect('/');
    return null;
};
