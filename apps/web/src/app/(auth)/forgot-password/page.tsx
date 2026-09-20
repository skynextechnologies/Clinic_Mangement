'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../lib/api-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetchApi<{ message: string }>('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage(res.data.message);
    } catch {
      setMessage('If an account exists with that email, a password reset link has been sent.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">Forgot Password</h1>
          <p className="text-xs text-muted-foreground">
            Enter your account email address. If registered, we will send a password reset link.
          </p>
        </div>

        {message && (
          <div className="p-3.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-medium text-foreground">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-md shadow transition-colors"
          >
            {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link href="/login" className="text-xs text-primary hover:underline">
            &larr; Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
