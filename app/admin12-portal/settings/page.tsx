'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Lock,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  ShieldCheck,
  KeyRound,
  Server,
  RefreshCw,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [testingSupabase, setTestingSupabase] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<string | null>(null);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setStatusMessage(null);

    if (newPassword.length < 8) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
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
      setStatusMessage({ type: 'success', text: 'Administrator password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error updating password' });
    } finally {
      setLoading(false);
    }
  }

  async function testSupabaseConnection() {
    setTestingSupabase(true);
    setSupabaseStatus(null);
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.configured) {
        setSupabaseStatus('Connected & Operational');
      } else {
        setSupabaseStatus('Supabase credentials missing or invalid in environment');
      }
    } catch {
      setSupabaseStatus('Connection test failed');
    } finally {
      setTestingSupabase(false);
    }
  }

  return (
    <AdminLayout>
      <div className="admin-header-row">
        <div>
          <h1 className="admin-header-title">System &amp; Security Settings</h1>
          <p className="admin-header-subtitle">
            Manage administrative credentials, database connectivity, and data exports.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="admin-card-title">Change Admin Password</h2>
          </div>

          {statusMessage && (
            <div
              style={{
                background: statusMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${statusMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                color: statusMessage.type === 'success' ? '#166534' : '#991b1b',
                padding: '12px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
              }}
            >
              {statusMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div className="admin-field" style={{ marginBottom: '14px' }}>
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="At least 8 characters"
              />
            </div>

            <div className="admin-field" style={{ marginBottom: '20px' }}>
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Repeat password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="admin-btn admin-btn-primary"
              style={{ width: '100%', padding: '10px' }}
            >
              <Lock size={15} />
              <span>{loading ? 'Updating...' : 'Update Password'}</span>
            </button>
          </form>
        </div>

        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="admin-card-title">Backend Connectivity &amp; Architecture</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Backend Provider:</span>
              <strong>Supabase PostgreSQL &amp; Auth SSR</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status Check:</span>
              <span>{supabaseStatus || 'Ready to test'}</span>
            </div>

            <button
              onClick={testSupabaseConnection}
              disabled={testingSupabase}
              className="admin-btn admin-btn-secondary"
              style={{ width: '100%', padding: '8px' }}
            >
              <Server size={14} />
              <span>{testingSupabase ? 'Testing Connection...' : 'Test Supabase Connection'}</span>
            </button>

            <div style={{ borderTop: '1px solid #f2ece0', paddingTop: '14px', marginTop: '4px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--emerald-deep)', marginBottom: '8px' }}>
                Full Data Export
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Download comprehensive spreadsheet of all guest records, invitation links, attendance, and attendee lists.
              </p>
              <a
                href="/api/export"
                className="admin-btn admin-btn-gold"
                style={{ width: '100%', padding: '10px' }}
              >
                <FileSpreadsheet size={15} />
                <span>Export Workbook (.xlsx)</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: '24px' }}>
        <div className="admin-card-head">
          <h2 className="admin-card-title">Security &amp; Revocation Protocol</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <div style={{ background: '#faf7f0', padding: '16px', borderRadius: '8px', border: '1px solid var(--gold-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--emerald-deep)', fontWeight: 600, marginBottom: '6px' }}>
              <KeyRound size={16} />
              <span>Cryptographic Token Isolation</span>
            </div>
            <p>
              Tokens are 32 random bytes (256-bit entropy). Only their SHA-256 hash is persisted at rest. Even with direct database read access, tokens cannot be reversed.
            </p>
          </div>

          <div style={{ background: '#faf7f0', padding: '16px', borderRadius: '8px', border: '1px solid var(--gold-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--emerald-deep)', fontWeight: 600, marginBottom: '6px' }}>
              <ShieldCheck size={16} />
              <span>Instant Revocation</span>
            </div>
            <p>
              If a link is accidentally shared in a public group or compromised, click "Revoke Link" on the invitation details page to disable access immediately.
            </p>
          </div>

          <div style={{ background: '#faf7f0', padding: '16px', borderRadius: '8px', border: '1px solid var(--gold-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--emerald-deep)', fontWeight: 600, marginBottom: '6px' }}>
              <RefreshCw size={16} />
              <span>Seamless Replacement</span>
            </div>
            <p>
              Use "Replace Token" to generate a brand new link for the same guest without deleting their historical RSVP status or guest notes.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
