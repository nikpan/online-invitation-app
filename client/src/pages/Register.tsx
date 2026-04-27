import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isAxiosError } from 'axios';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  display_name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
});

type RegisterFormData = z.infer<typeof schema>;

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(schema) });

  const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    setServerError('');
    try {
      await registerUser(data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message =
        isAxiosError<{ error?: string }>(err) && err.response?.data?.error
          ? err.response.data.error
          : 'Something went wrong. Please try again.';
      setServerError(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🎉 Invitely</h1>
          <p className="mt-2 text-gray-500">Create beautiful party invitations</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create your account</h2>

          {serverError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label htmlFor="display_name" className="label">
                Your name
              </label>
              <input
                id="display_name"
                type="text"
                autoComplete="name"
                className={`input ${errors.display_name ? 'input-error' : ''}`}
                placeholder="Alex Johnson"
                {...register('display_name')}
              />
              {errors.display_name && (
                <p className="error-text">{errors.display_name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="At least 8 characters"
                {...register('password')}
              />
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>

            <button type="submit" className="btn-primary w-full mt-2" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
