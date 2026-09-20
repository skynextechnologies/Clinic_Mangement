'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../providers/auth-provider';
import { fetchApi } from '../../../lib/api-client';

interface SessionItem {
  id: string;
  userAgent?: string;
  ip?: string;
  createdAt: string;
  expiresAt: string;
}

interface TotpSetupData {
  secret: string;
  otpauthUrl: string;
  qrCodeUrl: string;
}

export default function AccountSecurityPage() {
  const { user, accessToken, logoutAll } = useAuth();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // 2FA state
  const [setupData, setSetupData] = useState<TotpSetupData | null>(null);
  const [totpToken, setTotpToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [disablePassword, setDisablePassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSessions = async () => {
    if (!accessToken) return;
    try {
      setLoadingSessions(true);
      const res = await fetchApi<{ sessions: SessionItem[] }>('/api/v1/auth/sessions', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSessions(res.data.sessions);
    } catch {
      // Ignore
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [accessToken]);

  const handleSetup2FA = async () => {
    setError(null);
    try {
      const res = await fetchApi<TotpSetupData>('/api/v1/auth/2fa/setup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSetupData(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate 2FA setup';
      setError(msg);
    }
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData) return;
    setError(null);

    try {
      const res = await fetchApi<{ message: string; backupCodes: string[] }>(
        '/api/v1/auth/2fa/enable',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ secret: setupData.secret, token: totpToken }),
        },
      );

      setSuccess('2FA has been successfully enabled on your account!');
      setBackupCodes(res.data.backupCodes);
      setSetupData(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid 6-digit TOTP token';
      setError(msg);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await fetchApi('/api/v1/auth/2fa/disable', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ password: disablePassword }),
      });

      setSuccess('2FA has been disabled.');
      setDisablePassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid password';
      setError(msg);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await fetchApi(`/api/v1/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      fetchSessions();
    } catch {
      // Ignore
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Account Security</h1>
        <p className="text-xs text-muted-foreground pt-1">
          Manage your two-factor authentication, backup codes, and active login sessions.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-lg bg-success/10 border border-success/20 text-success text-sm">
          {success}
        </div>
      )}

      {/* 2FA Section */}
      <section className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Two-Factor Authentication (TOTP)
            </h2>
            <p className="text-xs text-muted-foreground">
              Secure your account using Google Authenticator, Authy, or 1Password.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user?.twoFactorEnabled
                  ? 'bg-success/10 text-success'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        {!user?.twoFactorEnabled && !setupData && (
          <button
            type="button"
            onClick={handleSetup2FA}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow transition-colors"
          >
            Enable 2FA
          </button>
        )}

        {/* 2FA Setup QR Display */}
        {setupData && (
          <div className="border border-border rounded-lg p-4 space-y-4 bg-background">
            <h3 className="text-sm font-semibold text-foreground">Scan QR Code</h3>
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <img
                src={setupData.qrCodeUrl}
                alt="2FA QR Code"
                className="w-44 h-44 rounded-lg border border-border"
              />
              <div className="space-y-2 text-xs">
                <p className="text-muted-foreground">
                  1. Scan this QR code with your authenticator app.
                </p>
                <p className="text-muted-foreground">
                  2. Manual key:{' '}
                  <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
                    {setupData.secret}
                  </code>
                </p>
                <p className="text-muted-foreground">
                  3. Enter the generated 6-digit code below to verify setup.
                </p>
              </div>
            </div>

            <form onSubmit={handleEnable2FA} className="flex space-x-3 pt-2 max-w-sm">
              <input
                type="text"
                required
                maxLength={6}
                value={totpToken}
                onChange={(e) => setTotpToken(e.target.value)}
                placeholder="123456"
                className="flex-1 px-3 py-1.5 text-sm font-mono text-center bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow"
              >
                Verify & Activate
              </button>
            </form>
          </div>
        )}

        {/* Backup Codes Display Modal */}
        {backupCodes && (
          <div className="border border-success/30 bg-success/5 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Single-Use Backup Codes</h3>
            <p className="text-xs text-muted-foreground">
              Save these 10 backup codes in a safe place. If you lose your phone, each code can be
              used once to log in.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs text-center bg-background p-3 rounded border border-border">
              {backupCodes.map((code, idx) => (
                <div key={idx} className="p-1.5 bg-muted rounded">
                  {code}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setBackupCodes(null)}
              className="text-xs text-primary font-medium hover:underline"
            >
              I have saved my backup codes
            </button>
          </div>
        )}

        {/* Disable 2FA */}
        {user?.twoFactorEnabled && (
          <form
            onSubmit={handleDisable2FA}
            className="flex items-center space-x-3 pt-4 border-t border-border"
          >
            <input
              type="password"
              required
              placeholder="Confirm password to disable 2FA"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              className="px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring w-64"
            />
            <button
              type="submit"
              className="px-4 py-1.5 text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md shadow"
            >
              Disable 2FA
            </button>
          </form>
        )}
      </section>

      {/* Active Sessions Section */}
      <section className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Active Login Sessions</h2>
            <p className="text-xs text-muted-foreground">
              Devices and browsers currently logged into your account.
            </p>
          </div>
          <button
            type="button"
            onClick={logoutAll}
            className="px-3 py-1.5 text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md transition-colors"
          >
            Log Out All Other Devices
          </button>
        </div>

        {loadingSessions ? (
          <p className="text-xs text-muted-foreground">Loading active sessions...</p>
        ) : (
          <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {sessions.map((s) => (
              <div key={s.id} className="p-3.5 flex justify-between items-center text-xs">
                <div>
                  <p className="font-medium text-foreground">{s.userAgent || 'Unknown Browser'}</p>
                  <p className="text-muted-foreground pt-0.5">
                    IP: {s.ip || '127.0.0.1'} &bull; Logged in:{' '}
                    {new Date(s.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevokeSession(s.id)}
                  className="px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 rounded transition-colors"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
