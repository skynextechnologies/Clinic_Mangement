'use client';

import React from 'react';
import { useAuth } from '../../providers/auth-provider';

export function SessionTimeoutDialog() {
  const { idleWarningVisible, stayLoggedIn, logout } = useAuth();

  if (!idleWarningVisible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md rounded-xl bg-card border border-border p-6 shadow-2xl space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-warning">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h2 id="session-timeout-title" className="text-lg font-semibold text-foreground">
              Session Timing Out
            </h2>
            <p className="text-xs text-muted-foreground">You have been inactive for 14 minutes.</p>
          </div>
        </div>

        <p className="text-sm text-foreground">
          For security and patient data privacy, your session will automatically log out in 60
          seconds if there is no activity.
        </p>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          >
            Log Out Now
          </button>
          <button
            type="button"
            onClick={stayLoggedIn}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow transition-colors"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}
