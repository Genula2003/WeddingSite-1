'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User, AlertCircle, Sparkles, CheckCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin12');
  const [password, setPassword] = useState('welcome123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabaseUnconfigured, setSupabaseUnconfigured] = useState(false);

  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  useEffect(() => {
    async function checkExistingSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (!data.configured) {
          setSupabaseUnconfigured(true);
          return;
        }
        if (data.authenticated) {
          if (data.mustChangePassword) {
            setRequirePasswordChange(true);
          } else {
            router.push('/admin12-portal/dashboard');
          }
        }
      } catch {
      }
    }
    checkExistingSession();
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      if (data.mustChangePassword) {
        setRequirePasswordChange(true);
      } else {
        router.push('/admin12-portal/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword === 'welcome123') {
      setError('Please choose a different password than the temporary bootstrap password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setPasswordChanging(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setPasswordChangeSuccess(true);
      setTimeout(() => {
        router.push('/admin12-portal/dashboard');
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password';
      setError(msg);
    } finally {
      setPasswordChanging(false);
    }
  }

  return (
    <main className="admin-portal-login-wrap">
      <div className="admin-portal-login-card">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="invalid-eyebrow">
            <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />
            PRIVATE ADMINISTRATION
          </div>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '34px',
              color: 'var(--emerald-deep)',
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: '6px',
            }}
          >
            Wedding Studio
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Chathura &amp; Gimasha — Dec 03, 2026
          </p>
          <div className="invalid-flourish" style={{ margin: '12px auto' }}>── ♥ ──</div>
        </div>

        {supabaseUnconfigured && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '14px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Supabase Setup Required</strong>
              <p style={{ marginTop: '4px', lineHeight: 1.5 }}>
                Environment variables <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and <code>SUPABASE_SERVICE_ROLE_KEY</code> are not configured.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {requirePasswordChange ? (
          <div>
            <div
              style={{
                background: '#fefce8',
                border: '1px solid #fef08a',
                color: '#854d0e',
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '18px',
              }}
            >
              <strong>Security Requirement:</strong> You must update your bootstrap password before proceeding to the dashboard.
            </div>

            {passwordChangeSuccess ? (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  padding: '14px',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <CheckCircle size={28} style={{ margin: '0 auto 8px', color: '#16a34a' }} />
                <p style={{ fontWeight: 600 }}>Password successfully updated!</p>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>Redirecting to dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange}>
                <div className="admin-field" style={{ marginBottom: '16px' }}>
                  <label htmlFor="newPassword">New Password (at least 8 characters)</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>

                <div className="admin-field" style={{ marginBottom: '22px' }}>
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordChanging}
                  className="admin-btn admin-btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                >
                  {passwordChanging ? 'Updating Password...' : 'Save New Password & Continue'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <div className="admin-field" style={{ marginBottom: '16px' }}>
              <label htmlFor="username" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} />
                <span>Administrator Username or Email</span>
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="admin12"
              />
            </div>

            <div className="admin-field" style={{ marginBottom: '22px' }}>
              <label htmlFor="password" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={14} />
                <span>Password</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ width: '100%', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || supabaseUnconfigured}
              className="admin-btn admin-btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
          Authorized wedding administration only. Unauthorized access attempts are monitored and rate limited.
        </div>
      </div>
    </main>
  );
}
