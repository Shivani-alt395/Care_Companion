import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Heart, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    setError('');
    try {
      await login(data.email, data.password);
      navigate('/app', { replace: true });
    } catch {
      setError('Invalid email or password. Please try again.');
    }
  }

  async function demoLogin(type: 'senior' | 'caregiver') {
    setError('');
    const email = type === 'senior' ? 'demo.senior@carecompanion.app' : 'demo.caregiver@carecompanion.app';
    try {
      await login(email, 'Demo@1234');
      navigate('/app', { replace: true });
    } catch {
      setError('Demo login failed. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-2">
        <div className="w-10 h-10 bg-teal-700 rounded-xl flex items-center justify-center">
          <Heart className="w-6 h-6 text-white fill-white" aria-hidden="true" />
        </div>
        <span className="text-xl font-bold text-teal-800">CareCompanion</span>
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 py-8 max-w-md mx-auto w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
        <p className="text-gray-500 mb-8">Sign in to continue</p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700" role="alert">
            <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`input-field ${errors.email ? 'border-red-400' : ''}`}
              {...register('email')}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-red-600 text-sm mt-1" role="alert">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`input-field pr-12 ${errors.password ? 'border-red-400' : ''}`}
                {...register('password')}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-red-600 text-sm mt-1" role="alert">{errors.password.message}</p>
            )}
          </div>

          <button type="submit" className="btn-primary w-full text-lg" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-warm-200" />
          <span className="text-gray-400 text-sm">or try demo</span>
          <div className="flex-1 h-px bg-warm-200" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => demoLogin('senior')} className="btn-secondary text-sm">
            Demo Senior
          </button>
          <button onClick={() => demoLogin('caregiver')} className="btn-secondary text-sm">
            Demo Caregiver
          </button>
        </div>

        <p className="text-center text-gray-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-teal-700 font-semibold hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
