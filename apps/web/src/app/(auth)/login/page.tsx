'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PRODUCT_NAME } from '@clinicos/shared';

import { useAuth } from '../../../providers/auth-provider';

export default function LoginPage() {
  const { login, verify2fa } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2FA Challenge state
  const [requires2Factor, setRequires2Factor] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockOn(true);
    } else {
      setCapsLockOn(false);
    }
  };

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await login(email, password);

      if (res.requires2Factor && res.tempToken) {
        setRequires2Factor(true);
        setTempToken(res.tempToken);
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await verify2fa(tempToken, totpCode);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid authentication code or backup code';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Left Brand Panel (Desktop) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

        <div className="flex items-center space-x-3 z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">{PRODUCT_NAME}</span>
        </div>

        <div className="space-y-4 max-w-lg z-10">
          <h1 className="text-3xl font-semibold leading-tight">
            Calm, trustworthy, keyboard-first clinic management system.
          </h1>
          <p className="text-primary-foreground/80 text-sm">
            Streamlined operations for doctors, nurses, pharmacists, and administrators. Designed
            for patient safety and clinical clarity.
          </p>
        </div>

        <div className="text-xs text-primary-foreground/60 z-10">
          &copy; {new Date().getFullYear()} {PRODUCT_NAME}. All rights reserved.
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {requires2Factor ? 'Two-Factor Authentication' : 'Sign in to your account'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {requires2Factor
                ? 'Enter the 6-digit TOTP code from your authenticator app or a single-use backup code.'
                : 'Enter your clinic credentials to access the staff portal.'}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
            >
              {error}
            </div>
          )}

          {!requires2Factor ? (
            /* Primary Login Form */
            <form onSubmit={handleSubmitLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@clinic.com"
                  className="w-full px-3.5 py-2 text-sm bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-foreground" htmlFor="password">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {capsLockOn && <p className="text-xs text-warning pt-1">Caps Lock is ON</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-md shadow transition-colors"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            /* 2FA Verification Form */
            <form onSubmit={handleSubmit2fa} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground" htmlFor="totpCode">
                  Authentication Code / Backup Code
                </label>
                <input
                  id="totpCode"
                  type="text"
                  required
                  autoFocus
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="123456 or xxxx-xxxx"
                  className="w-full px-3.5 py-2 text-sm font-mono tracking-widest text-center bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-md shadow transition-colors"
              >
                {isSubmitting ? 'Verifying...' : 'Verify & Complete Sign In'}
              </button>

              <button
                type="button"
                onClick={() => setRequires2Factor(false)}
                className="w-full py-2 text-xs text-muted-foreground hover:text-foreground"
              >
                &larr; Back to login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
