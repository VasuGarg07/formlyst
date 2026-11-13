import { onAuthStateChanged } from 'firebase/auth';
import { type ReactNode, useEffect } from 'react';
import { auth } from '../firebase';
import { toUser } from './auth.service';
import { setUser } from './authSlice';
import { useAuthDispatch } from './useRedux';

export function AuthProvider({ children }: { children: ReactNode }) {
    const dispatch = useAuthDispatch();

    useEffect(
        () => onAuthStateChanged(auth, (u) => { dispatch(setUser(u ? toUser(u) : null)); }),
        [dispatch],
    );

    return <>{children}</>;
}
