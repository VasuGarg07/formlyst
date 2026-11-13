import { KeyRound, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { TextInput } from '../ui';
import { registerThunk } from './authSlice';
import { useAuthDispatch } from './useRedux';
import type { RegisterData } from './auth.types';

export function Register() {
    const [loading, setLoading] = useState(false);
    const dispatch = useAuthDispatch();
    const navigate = useNavigate();

    const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterData>({
        defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
    });

    const password = watch('password');

    const onSubmit = async (data: RegisterData) => {
        setLoading(true);
        try {
            await (dispatch(registerThunk(data) as any)).unwrap();
            navigate('/');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h1>Create account</h1>
            <p className="auth-sub">Fill in the details below to get started.</p>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="auth-field">
                    <div className="auth-field-head"><label htmlFor="username">Username</label></div>
                    <TextInput id="username" placeholder="Choose a username" icon={<User size={15} />}
                        error={errors.username?.message}
                        {...register('username', { required: 'Username is required' })} />
                </div>

                <div className="auth-field">
                    <div className="auth-field-head"><label htmlFor="email">Email</label></div>
                    <TextInput id="email" type="email" placeholder="Enter your email" icon={<Mail size={15} />}
                        error={errors.email?.message}
                        {...register('email', {
                            required: 'Email is required',
                            pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' },
                        })} />
                </div>

                <div className="auth-field">
                    <div className="auth-field-head"><label htmlFor="password">Password</label></div>
                    <TextInput id="password" type="password" placeholder="Create a password" icon={<KeyRound size={15} />}
                        showPasswordToggle error={errors.password?.message}
                        {...register('password', {
                            required: 'Password is required',
                            minLength: { value: 6, message: 'Password must be at least 6 characters' },
                        })} />
                </div>

                <div className="auth-field">
                    <div className="auth-field-head"><label htmlFor="confirmPassword">Confirm Password</label></div>
                    <TextInput id="confirmPassword" type="password" placeholder="Confirm your password" icon={<KeyRound size={15} />}
                        showPasswordToggle error={errors.confirmPassword?.message}
                        {...register('confirmPassword', {
                            required: 'Please confirm your password',
                            validate: (value) => value === password || "Passwords don't match",
                        })} />
                </div>


                <button type="submit" disabled={loading} className="auth-btn-primary">
                    {loading ? 'Creating account…' : 'Create Account'}
                </button>
            </form>

            <p className="auth-signup">
                Already have an account? <Link to="/auth/login">Sign in</Link>
            </p>
        </>
    );
}
