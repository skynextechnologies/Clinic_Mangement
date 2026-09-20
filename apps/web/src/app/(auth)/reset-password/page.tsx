'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { fetchApi } from '../../../lib/api-client';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetchApi<{ message: string }>('/api/v1/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
      setMessage(res.data.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired password reset token';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
        <p className="text-xs text-muted-foreground">
          Enter your new secure password (minimum 12 characters).
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {message && (
        <div className="p-3.5 rounded-lg bg-success/10 border border-success/20 text-success text-sm space-y-2">
          <p>{message}</p>
          <Link href="/login" className="block text-xs font-semibold underline">
            Proceed to Sign In &rarr;
          </Link>
        </div>
      )}

      {!message && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="newPassword" className="text-xs font-medium text-foreground">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              required
              minLength={12}
              autoFocus
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 12 characters"
              className="w-full px-3.5 py-2 text-sm bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !token}
            className="w-full py-2.5 px-4 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-md shadow transition-colors"
          >
            {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>
      )}

      <div className="text-center pt-2">
        <Link href="/login" className="text-xs text-primary hover:underline">
          &larr; Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Suspense fallback={<p className="text-xs text-muted-foreground">Loading...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
