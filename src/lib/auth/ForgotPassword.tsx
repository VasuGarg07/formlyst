import { Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { TextInput } from '../ui';
import { resetPasswordThunk } from './authSlice';
import { useAuthDispatch } from './useRedux';
import type { ResetPasswordData } from './auth.types';

export function ForgotPassword() {
    const [loading, setLoading] = useState(false);
    const dispatch = useAuthDispatch();
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordData>({
        defaultValues: { email: '' },
    });

    const onSubmit = async ({ email }: ResetPasswordData) => {
        setLoading(true);
        try {
            await (dispatch(resetPasswordThunk(email) as any)).unwrap();
            navigate('/auth/login');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h1>Reset password</h1>
            <p className="auth-sub">Enter your email and we will send you a reset link.</p>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="auth-field">
                    <div className="auth-field-head"><label htmlFor="email">Email</label></div>
                    <TextInput id="email" type="email" placeholder="Enter your email" icon={<Mail size={15} />}
                        error={errors.email?.message}
                        {...register('email', { required: 'Email is required' })} />
                </div>

                <button type="submit" disabled={loading} className="auth-btn-primary">
                    {loading ? 'Sending…' : 'Send reset link'}
                </button>
            </form>

            <p className="auth-signup">
                Remember your password? <Link to="/auth/login">Sign in</Link>
            </p>
        </>
    );
}
