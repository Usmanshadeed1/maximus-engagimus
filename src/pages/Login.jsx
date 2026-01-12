/**
 * Login Page
 * 
 * Handles user authentication with sign in and sign up forms.
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Loader2, Zap } from 'lucide-react';

export default function Login() {
  const { signIn, signUp, resetPassword, error, clearError } = useAuth();
  
  // Form mode: 'signin' | 'signup' | 'forgot'
  const [mode, setMode] = useState('signin');
  
  // Form state
  const [email, setEmail] = useState('test@test.com');
  const [password, setPassword] = useState('test1234');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [validationError, setValidationError] = useState('');

  /**
   * Reset form state when changing modes
   */
  const changeMode = (newMode) => {
    setMode(newMode);
    setPassword('');
    setConfirmPassword('');
    setSuccess('');
    setValidationError('');
    clearError();
  };

  /**
   * Validate form before submission
   */
  const validateForm = () => {
    setValidationError('');

    if (!email.trim()) {
      setValidationError('Email is required');
      return false;
    }

    if (!email.includes('@')) {
      setValidationError('Please enter a valid email address');
      return false;
    }

    if (mode === 'forgot') {
      return true;
    }

    if (!password) {
      setValidationError('Password is required');
      return false;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return false;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setValidationError('Full name is required');
        return false;
      }

      if (!organizationName.trim()) {
        setValidationError('Organization name is required');
        return false;
      }

      if (password !== confirmPassword) {
        setValidationError('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setSuccess('');
    clearError();

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        // Redirect happens automatically via AuthContext
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName, organizationName);
        if (error) throw error;
        setSuccess('Account created! Please check your email to confirm your account.');
        changeMode('signin');
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) throw error;
        setSuccess('Password reset email sent! Check your inbox.');
      }
    } catch (err) {
      // Error is handled by AuthContext
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[var(--bg)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-500 rounded-xl flex items-center justify-center">
            <Zap className="h-10 w-10 text-white" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Maximus <span className="text-primary-500">Engage</span>imus
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {mode === 'signin' && 'Sign in to your account'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'forgot' && 'Reset your password'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white shadow-lg dark:bg-[var(--card)] dark:border dark:border-gray-700 rounded-lg p-8">
          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-success-50 border border-success-200 text-success-700 rounded-md text-sm">
              {success}
            </div>
          )}

          {/* Error Messages */}
          {(error || validationError) && (
            <div className="mb-4 p-3 bg-error-50 border border-error-200 text-error-700 rounded-md text-sm">
              {/* Map technical init error to a friendly message and offer retry */}
              {validationError || (error === 'auth-init-timeout' ? (
                <div>
                  <p>We couldn't initialize authentication — please check your connection or try again.</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => window.location.reload()} className="btn-primary py-1 px-3">Retry</button>
                    <button type="button" onClick={() => { navigator.clipboard && navigator.clipboard.writeText(error); }} className="btn-ghost py-1 px-3">Copy error</button>
                  </div>
                </div>
              ) : error)}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (signup only) */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="fullName" className="form-label">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-base"
                  placeholder="John Doe"
                  disabled={loading}
                />
              </div>
            )}

            {/* Organization Name (signup only) */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="organizationName" className="form-label">
                  Organization Name
                </label>
                <input
                  id="organizationName"
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="input-base"
                  placeholder="Acme Marketing Agency"
                  disabled={loading}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
                placeholder="you@example.com"
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            {mode !== 'forgot' && (
              <div>
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-base pr-10"
                    placeholder="••••••••"
                    disabled={loading}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (signup only) */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-base"
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
            )}

            {/* Forgot Password Link (signin only) */}
            {mode === 'signin' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => changeMode('forgot')}
                  className="text-sm text-primary-500 hover:text-primary-600"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {mode === 'signin' && 'Signing in...'}
                  {mode === 'signup' && 'Creating account...'}
                  {mode === 'forgot' && 'Sending email...'}
                </span>
              ) : (
                <>
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Send Reset Email'}
                </>
              )}
            </button>
          </form>

          {/* Mode Toggle */}
          <div className="mt-6 text-center text-sm">
            {mode === 'signin' && (
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => changeMode('signup')}
                  className="text-primary-500 hover:text-primary-600 font-medium"
                >
                  Sign up
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => changeMode('signin')}
                  className="text-primary-500 hover:text-primary-600 font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <p className="text-gray-600">
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => changeMode('signin')}
                  className="text-primary-500 hover:text-primary-600 font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
