import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Heart, Eye, EyeOff, AlertCircle, Users, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const schema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['SENIOR', 'CAREGIVER']),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof schema>;

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'SENIOR' },
  });

  const selectedRole = watch('role');

  async function onSubmit(data: RegisterForm) {
    setError('');
    try {
      await registerUser({ email: data.email, password: data.password, role: data.role, firstName: data.firstName, lastName: data.lastName });
      navigate('/app', { replace: true });
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Registration failed. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <div className="px-4 py-4 flex items-center gap-2">
        <div className="w-10 h-10 bg-teal-700 rounded-xl flex items-center justify-center">
          <Heart className="w-6 h-6 text-white fill-white" aria-hidden="true" />
        </div>
        <span className="text-xl font-bold text-teal-800">CareCompanion</span>
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 py-8 max-w-md mx-auto w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create account</h1>
        <p className="text-gray-500 mb-6">Join CareCompanion today</p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700" role="alert">
            <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Role selection */}
          <div>
            <span className="label">I am a</span>
            <div className="grid grid-cols-2 gap-3">
              {(['SENIOR', 'CAREGIVER'] as const).map(role => (
                <label
                  key={role}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedRole === role
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-warm-200 bg-white hover:border-teal-300'
                  }`}
                >
                  <input type="radio" value={role} {...register('role')} className="sr-only" />
                  {role === 'SENIOR' ? (
                    <User className="w-7 h-7 text-teal-700" aria-hidden="true" />
                  ) : (
                    <Users className="w-7 h-7 text-teal-700" aria-hidden="true" />
                  )}
                  <span className="font-semibold text-gray-800 text-sm">
                    {role === 'SENIOR' ? 'Senior (I need care)' : 'Caregiver (I provide care)'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="label">First Name</label>
              <input id="firstName" type="text" autoComplete="given-name" className={`input-field ${errors.firstName ? 'border-red-400' : ''}`} {...register('firstName')} />
              {errors.firstName && <p className="text-red-600 text-xs mt-1" role="alert">{errors.firstName.message}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="label">Last Name</label>
              <input id="lastName" type="text" autoComplete="family-name" className={`input-field ${errors.lastName ? 'border-red-400' : ''}`} {...register('lastName')} />
              {errors.lastName && <p className="text-red-600 text-xs mt-1" role="alert">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" autoComplete="email" className={`input-field ${errors.email ? 'border-red-400' : ''}`} {...register('email')} />
            {errors.email && <p className="text-red-600 text-sm mt-1" role="alert">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="reg-password" className="label">Password</label>
            <div className="relative">
              <input id="reg-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" className={`input-field pr-12 ${errors.password ? 'border-red-400' : ''}`} {...register('password')} />
              <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-600 text-sm mt-1" role="alert">{errors.password.message}</p>}
          </div>

          <div>
            <label htmlFor="confirm-password" className="label">Confirm Password</label>
            <input id="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" className={`input-field ${errors.confirmPassword ? 'border-red-400' : ''}`} {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="text-red-600 text-sm mt-1" role="alert">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" className="btn-primary w-full text-lg mt-2" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-teal-700 font-semibold hover:underline">Sign in</Link>
        </p>

        <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
          By registering, you agree to our{' '}
          <Link to="/privacy" className="text-teal-600 hover:underline">Privacy Policy</Link>.
          This app does not replace professional medical advice.
        </p>
      </div>
    </div>
  );
}
