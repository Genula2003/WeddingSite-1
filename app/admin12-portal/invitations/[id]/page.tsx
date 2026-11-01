'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Share2,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Edit2,
  KeyRound,
  ShieldAlert,
  Mail,
} from 'lucide-react';
import type { InvitationWithDetails, InvitationEventType } from '@/lib/supabase/types';

export default function InvitationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [invitation, setInvitation] = useState<InvitationWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [replacementToken, setReplacementToken] = useState<string | null>(null);
  const [replacementUrl, setReplacementUrl] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editHousehold, setEditHousehold] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSeats, setEditSeats] = useState(1);
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatusMessage, setEmailStatusMessage] = useState<string | null>(null);

  function normalizeInviteUrl(url: string): string {
    if (!url) return '';
    if (typeof window !== 'undefined' && window.location.origin) {
      if (!window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1')) {
        return url.replace(/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, window.location.origin);
      }
    }
    return url;
  }

  async function handleSendEmail() {
    if (!invitation?.guest?.email) return;
    setSendingEmail(true);
    setEmailStatusMessage(null);
    try {
      const res = await fetch(`/api/invitations/${id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: typeof window !== 'undefined' ? window.location.origin : undefined,
          invitationUrl: replacementUrl ? normalizeInviteUrl(replacementUrl) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch email');
      setEmailStatusMessage('Email successfully sent via Resend.');
      loadDetails();
    } catch (err: unknown) {
      setEmailStatusMessage(err instanceof Error ? err.message : 'Error sending email');
    } finally {
      setSendingEmail(false);
    }
  }

  async function loadDetails() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invitations/${id}`);
      if (res.status === 401) {
        window.location.href = '/admin12-portal';
        return;
      }
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to load details');
      }
      const data = await res.json();
      setInvitation(data);
      if (data.guest) {
        setEditName(data.guest.full_name || '');
        setEditHousehold(data.guest.household_name || '');
        setEditEmail(data.guest.email || '');
        setEditPhone(data.guest.phone || '');
        setEditSeats(data.max_attendees || 1);
        setEditNotes(data.guest.private_notes || '');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading invitation';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetails();
  }, [id]);

  async function handleCopy() {
    if (replacementUrl) {
      const urlToCopy = normalizeInviteUrl(replacementUrl);
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    const currentUrl = `${window.location.origin}/admin12-portal/invitations/${id}`;
    await navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleMarkShared() {
    try {
      await fetch(`/api/invitations/${id}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: 'share_initiated' }),
      });
      loadDetails();
    } catch {
    }
  }

  async function handleRevoke() {
    if (!confirm('Are you sure you want to revoke this invitation? The guest link will immediately stop working.')) {
      return;
    }
    try {
      const res = await fetch(`/api/invitations/${id}/revoke`, { method: 'POST' });
      if (!res.ok) throw new Error('Revocation failed');
      loadDetails();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to revoke');
    }
  }

  async function handleReactivate() {
    try {
      const res = await fetch(`/api/invitations/${id}/reactivate`, { method: 'POST' });
      if (!res.ok) throw new Error('Reactivation failed');
      loadDetails();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to reactivate');
    }
  }

  async function handleReplaceToken() {
    if (!confirm('Replace this invitation token? The previous token will be invalidated permanently.')) {
      return;
    }
    try {
      const clientBaseUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const res = await fetch(`/api/invitations/${id}/replace-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: clientBaseUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Replacement failed');
      const normalized = normalizeInviteUrl(data.invitationUrl);
      setReplacementToken(data.rawToken);
      setReplacementUrl(normalized);
      loadDetails();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to replace token');
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this guest and invitation record permanently? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`/api/invitations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Deletion failed');
      router.push('/admin12-portal/invitations');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/invitations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxAttendees: editSeats,
          guest: {
            fullName: editName,
            householdName: editHousehold || null,
            email: editEmail || null,
            phone: editPhone || null,
            privateNotes: editNotes || null,
          },
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setIsEditing(false);
      loadDetails();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSavingEdit(false);
    }
  }

  function formatEventType(type: string) {
    const map: Record<string, string> = {
      created: 'Invitation Generated',
      link_copied: 'Link Copied',
      share_initiated: 'WhatsApp / Manual Share Initiated',
      sent: 'Marked Sent',
      delivered: 'Delivered',
      viewed: 'Opened by Guest',
      rsvp_submitted: 'RSVP Response Submitted',
      rsvp_updated: 'RSVP Response Updated',
      token_replaced: 'Replacement Security Token Generated',
      revoked: 'Invitation Revoked',
      reactivated: 'Invitation Reactivated',
    };
    return map[type] || type;
  }

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Loading invitation record...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!invitation) {
    return (
      <AdminLayout>
        <div className="admin-card" style={{ textAlign: 'center', padding: '40px' }}>
          <AlertTriangle size={32} style={{ margin: '0 auto 12px', color: '#dc2626' }} />
          <h2>Invitation Not Found</h2>
          <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>
            The requested invitation record does not exist or was deleted.
          </p>
          <Link href="/admin12-portal/invitations" className="admin-btn admin-btn-secondary" style={{ marginTop: '20px' }}>
            <ArrowLeft size={15} />
            <span>Back to Invitations</span>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const rsvp = invitation.rsvp;
  const isRevoked = invitation.status === 'revoked';

  return (
    <AdminLayout>
      <div className="admin-header-row">
        <div>
          <Link
            href="/admin12-portal/invitations"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginBottom: '10px',
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to All Invitations</span>
          </Link>
          <h1 className="admin-header-title">{invitation.guest?.full_name}</h1>
          <p className="admin-header-subtitle">
            {invitation.guest?.household_name ? `Household: ${invitation.guest.household_name} • ` : ''}
            Authorized capacity: {invitation.max_attendees} seats
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {invitation.guest?.email && (
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="admin-btn admin-btn-gold"
              title={`Send invitation to ${invitation.guest.email}`}
            >
              <Mail size={15} />
              <span>{sendingEmail ? 'Sending...' : 'Send via Email'}</span>
            </button>
          )}

          <button
            onClick={() => setIsEditing(true)}
            className="admin-btn admin-btn-secondary"
          >
            <Edit2 size={15} />
            <span>Edit Details</span>
          </button>

          <button
            onClick={handleReplaceToken}
            className="admin-btn admin-btn-secondary"
            title="Generate a completely new token if compromised"
          >
            <KeyRound size={15} />
            <span>Replace Token</span>
          </button>

          {isRevoked ? (
            <button
              onClick={handleReactivate}
              className="admin-btn admin-btn-primary"
            >
              <CheckCircle size={15} />
              <span>Reactivate</span>
            </button>
          ) : (
            <button
              onClick={handleRevoke}
              className="admin-btn admin-btn-danger"
            >
              <ShieldAlert size={15} />
              <span>Revoke Link</span>
            </button>
          )}

          <button
            onClick={handleDelete}
            className="admin-btn admin-btn-danger"
          >
            <Trash2 size={15} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {emailStatusMessage && (
        <div
          style={{
            background: emailStatusMessage.includes('Error') || emailStatusMessage.includes('Failed') ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${emailStatusMessage.includes('Error') || emailStatusMessage.includes('Failed') ? '#fecaca' : '#bbf7d0'}`,
            color: emailStatusMessage.includes('Error') || emailStatusMessage.includes('Failed') ? '#991b1b' : '#166534',
            padding: '12px 18px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '13px',
          }}
        >
          {emailStatusMessage}
        </div>
      )}

      {replacementUrl && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 600 }}>
            <KeyRound size={18} />
            <span>New Token Successfully Generated!</span>
          </div>
          <p style={{ fontSize: '13px', color: '#166534', margin: '6px 0 12px' }}>
            The old invitation link is now void. Copy and share this newly issued personal URL:
          </p>
          <div
            style={{
              background: '#ffffff',
              padding: '10px 14px',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '13px',
              border: '1px solid #86efac',
              wordBreak: 'break-all',
              marginBottom: '10px',
            }}
          >
            {normalizeInviteUrl(replacementUrl)}
          </div>
          <button
            onClick={handleCopy}
            className="admin-btn admin-btn-primary"
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy New Link'}</span>
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="admin-card-title">Invitation Status</h2>
            <span className={`admin-badge badge-${invitation.status}`}>
              {invitation.status.replace('_', ' ')}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Security Token Hash (SHA-256):</span>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all', marginTop: '2px', color: 'var(--emerald-deep)' }}>
                {invitation.token_hash}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Authorized Seats:</span>
              <strong>{invitation.max_attendees} {invitation.max_attendees === 1 ? 'person' : 'people'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Created At:</span>
              <span>{new Date(invitation.created_at).toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Last Viewed:</span>
              <span>
                {invitation.last_viewed_at
                  ? new Date(invitation.last_viewed_at).toLocaleString()
                  : 'Never viewed'}
              </span>
            </div>

            {invitation.expires_at && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Expires At:</span>
                <span>{new Date(invitation.expires_at).toLocaleDateString()}</span>
              </div>
            )}

            <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid #f2ece0' }}>
              <button
                onClick={handleMarkShared}
                className="admin-btn admin-btn-secondary"
                style={{ width: '100%', padding: '8px' }}
              >
                <Share2 size={14} />
                <span>Mark Link as Shared</span>
              </button>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="admin-card-title">RSVP Response</h2>
            <span className={`admin-badge badge-${rsvp?.attendance_status || 'pending'}`}>
              {rsvp?.attendance_status || 'pending'}
            </span>
          </div>

          {rsvp ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Attendance:</span>
                <strong style={{ color: rsvp.attendance_status === 'accepted' ? '#166534' : '#991b1b' }}>
                  {rsvp.attendance_status.toUpperCase()}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Attending Count:</span>
                <strong>{rsvp.attendee_count} {rsvp.attendee_count === 1 ? 'person' : 'people'}</strong>
              </div>

              {rsvp.attendee_names && rsvp.attendee_names.length > 0 && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Named Attendees:</span>
                  <div style={{ marginTop: '4px' }}>
                    {rsvp.attendee_names.map((name, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-block',
                          background: '#faf6ee',
                          border: '1px solid var(--gold-border)',
                          borderRadius: '4px',
                          padding: '2px 8px',
                          fontSize: '12px',
                          marginRight: '6px',
                          marginBottom: '4px',
                        }}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {rsvp.guest_message && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Guest Wish / Message:</span>
                  <p
                    style={{
                      marginTop: '4px',
                      background: '#fffbf2',
                      border: '1px solid var(--gold-border)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontStyle: 'italic',
                      color: 'var(--emerald-deep)',
                    }}
                  >
                    “{rsvp.guest_message}”
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Submitted:</span>
                <span>{new Date(rsvp.submitted_at).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-muted)' }}>
              <Clock size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p>Awaiting guest response</p>
            </div>
          )}
        </div>

        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="admin-card-title">Guest Contact Details</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Full Name:</span>
              <strong>{invitation.guest?.full_name}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Household:</span>
              <span>{invitation.guest?.household_name || '—'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
              <span>{invitation.guest?.phone || '—'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Email:</span>
              <span>{invitation.guest?.email || '—'}</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Administrative Notes:</span>
              <p style={{ marginTop: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {invitation.guest?.private_notes || 'None recorded'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <h2 className="admin-card-title">Audit History &amp; Event Timeline</h2>
        </div>

        {invitation.events && invitation.events.length > 0 ? (
          <div className="admin-timeline">
            {invitation.events.map((evt) => (
              <div key={evt.id} className="admin-timeline-item">
                <div className="admin-timeline-dot" />
                <div className="admin-timeline-title">
                  {formatEventType(evt.event_type)}
                </div>
                <div className="admin-timeline-time">
                  {new Date(evt.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No events logged yet.</p>
        )}
      </div>

      {isEditing && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', color: 'var(--emerald-deep)', marginBottom: '16px' }}>
              Edit Invitation &amp; Guest Details
            </h3>

            <form onSubmit={handleSaveEdit}>
              <div className="admin-field" style={{ marginBottom: '14px' }}>
                <label>Guest Full Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="admin-field" style={{ marginBottom: '14px' }}>
                <label>Household Name</label>
                <input
                  type="text"
                  value={editHousehold}
                  onChange={(e) => setEditHousehold(e.target.value)}
                />
              </div>

              <div className="admin-field" style={{ marginBottom: '14px' }}>
                <label>Max Attendees Limit (Seats)</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={editSeats}
                  onChange={(e) => setEditSeats(Number(e.target.value))}
                />
              </div>

              <div className="admin-field" style={{ marginBottom: '14px' }}>
                <label>Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>

              <div className="admin-field" style={{ marginBottom: '14px' }}>
                <label>Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>

              <div className="admin-field" style={{ marginBottom: '20px' }}>
                <label>Private Administrative Notes</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="admin-btn admin-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="admin-btn admin-btn-primary"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
