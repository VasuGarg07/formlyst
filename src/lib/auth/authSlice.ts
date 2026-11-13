import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { toastService } from '../shared';
import * as service from './auth.service';
import type { LoginData, RegisterData, User } from './auth.types';

export interface AuthState {
    user: User | null;
    isLoggedIn: boolean;
    loading: boolean;
    initializing: boolean;
}

const initialState: AuthState = {
    user: null,
    isLoggedIn: false,
    loading: false,
    initializing: true,
};

const thunk = <Arg, Result>(name: string, fn: (arg: Arg) => Promise<Result>) =>
    createAsyncThunk<Result, Arg, { rejectValue: string }>(`auth/${name}`, async (arg, { rejectWithValue }) => {
        try {
            return await fn(arg);
        } catch (e) {
            return rejectWithValue(service.authError(e));
        }
    });

export const loginThunk = thunk('login', (data: LoginData) => service.login(data));
export const googleLoginThunk = thunk('google', (_: void) => service.loginWithGoogle());
export const registerThunk = thunk('register', (data: RegisterData) => service.register(data));
export const resetPasswordThunk = thunk('resetPassword', (email: string) => service.resetPassword(email));
export const logoutThunk = thunk('logout', (_: void) => service.logout());

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser(state, action: PayloadAction<User | null>) {
            state.user = action.payload;
            state.isLoggedIn = !!action.payload;
            state.initializing = false;
        },
    },
    extraReducers: (builder) => {
        const signedIn = (state: AuthState, action: PayloadAction<User>) => {
            state.loading = false;
            state.user = action.payload;
            state.isLoggedIn = true;
        };
        const failed = (state: AuthState, action: { payload?: string }) => {
            state.loading = false;
            toastService.error(String(action.payload));
        };
        builder
            .addCase(loginThunk.pending, (state) => { state.loading = true; })
            .addCase(loginThunk.fulfilled, (state, action) => { signedIn(state, action); toastService.success('Login successful'); })
            .addCase(loginThunk.rejected, failed)
            .addCase(googleLoginThunk.fulfilled, (state, action) => { signedIn(state, action); toastService.success('Login successful'); })
            .addCase(googleLoginThunk.rejected, failed)
            .addCase(registerThunk.fulfilled, (state, action) => { signedIn(state, action); toastService.success('Account created'); })
            .addCase(registerThunk.rejected, failed)
            .addCase(resetPasswordThunk.fulfilled, () => { toastService.success('Password reset email sent'); })
            .addCase(resetPasswordThunk.rejected, failed)
            .addCase(logoutThunk.fulfilled, (state) => {
                state.user = null;
                state.isLoggedIn = false;
                toastService.info('Logged out');
            });
    },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
