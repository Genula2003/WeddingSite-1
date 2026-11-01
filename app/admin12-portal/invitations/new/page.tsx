'use client';

import { useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  UserPlus,
  Copy,
  Check,
  Share2,
  ExternalLink,
  MessageCircle,
  Plus,
  ArrowRight,
  Sparkles,
  Mail,
} from 'lucide-react';

interface CreatedInvitationResult {
  rawToken: string;
  invitationUrl: string;
  invitation: {
    id: string;
    max_attendees: number;
    status: string;
  };
  guest: {
    id: string;
    full_name: string;
    household_name: string | null;
    phone: string | null;
  };
}

export default function NewInvitationPage() {
  const [fullName, setFullName] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [maxAttendees, setMaxAttendees] = useState(2);
  const [expiresAt, setExpiresAt] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatedInvitationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const [customWhatsAppMsg, setCustomWhatsAppMsg] = useState('');
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);

  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

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
    if (!result || !email) return;
    setSendingEmail(true);
    setEmailError(null);
    try {
      const urlToSend = normalizeInviteUrl(result.invitationUrl);
      const res = await fetch(`/api/invitations/${result.invitation.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationUrl: urlToSend,
          baseUrl: typeof window !== 'undefined' ? window.location.origin : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch email');
      setEmailSentSuccess(true);
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : 'Error sending email');
    } finally {
      setSendingEmail(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const clientBaseUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          householdName: householdName || null,
          email: email || null,
          phone: phone || null,
          maxAttendees: Number(maxAttendees),
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          privateNotes: privateNotes || null,
          baseUrl: clientBaseUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create invitation');
      }

      data.invitationUrl = normalizeInviteUrl(data.invitationUrl);

      setResult(data);
      const defaultMsg = `Dear ${data.guest.full_name}, you are warmly invited to celebrate the wedding of Chathura & Gimasha. Please find your personal invitation here: ${data.invitationUrl}`;
      setCustomWhatsAppMsg(defaultMsg);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating invitation';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink() {
    if (!result) return;
    const urlToCopy = normalizeInviteUrl(result.invitationUrl);
    await navigator.clipboard.writeText(urlToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    try {
      await fetch(`/api/invitations/${result.invitation.id}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: 'link_copied' }),
      });
    } catch {
    }
  }

  async function handleNativeShare() {
    if (!result) return;
    const urlToShare = normalizeInviteUrl(result.invitationUrl);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Wedding Invitation | Chathura & Gimasha',
          text: `Dear ${result.guest.full_name}, you are warmly invited to celebrate the wedding of Chathura & Gimasha.`,
          url: urlToShare,
        });
        await fetch(`/api/invitations/${result.invitation.id}/event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventType: 'share_initiated', metadata: { method: 'native_share' } }),
        });
      } catch {
      }
    } else {
      handleCopyLink();
    }
  }

  async function handleOpenWhatsApp() {
    if (!result) return;
    try {
      await fetch(`/api/invitations/${result.invitation.id}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: 'share_initiated', metadata: { channel: 'whatsapp' } }),
      });
    } catch {
    }

    const encoded = encodeURIComponent(customWhatsAppMsg);
    const cleanPhone = (result.guest.phone || '').replace(/[^0-9]/g, '');
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
    setWhatsAppModalOpen(false);
  }

  function handleReset() {
    setFullName('');
    setHouseholdName('');
    setEmail('');
    setPhone('');
    setMaxAttendees(2);
    setExpiresAt('');
    setPrivateNotes('');
    setResult(null);
    setCopied(false);
  }

  return (
    <AdminLayout>
      <div className="admin-header-row">
        <div>
          <h1 className="admin-header-title">Generate Personal Invitation</h1>
          <p className="admin-header-subtitle">
            Issue a cryptographically secure, individualized link for an honoured guest or household.
          </p>
        </div>

        <Link href="/admin12-portal/invitations" className="admin-btn admin-btn-secondary">
          <span>Back to Invitations</span>
        </Link>
      </div>

      {result ? (
        <div className="admin-card" style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#dcfce7',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Check size={28} />
          </div>

          <div className="invalid-eyebrow">
            <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />
            INVITATION ISSUED SUCCESSFULLY
          </div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '28px',
              color: 'var(--emerald-deep)',
              marginBottom: '6px',
            }}
          >
            {result.guest.full_name}
          </h2>
          {result.guest.household_name && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
              Household: {result.guest.household_name} &bull; Up to {result.invitation.max_attendees} seats
            </p>
          )}

          <div
            style={{
              background: '#faf6ee',
              border: '1px solid var(--gold-border)',
              borderRadius: '10px',
              padding: '14px 18px',
              margin: '20px 0',
              textAlign: 'left',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: 'var(--emerald-deep)',
            }}
          >
            {normalizeInviteUrl(result.invitationUrl)}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
            <button
              onClick={handleCopyLink}
              className="admin-btn admin-btn-primary"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Link Copied!' : 'Copy Invitation Link'}</span>
            </button>

            <button
              onClick={() => setWhatsAppModalOpen(true)}
              className="admin-btn admin-btn-gold"
            >
              <MessageCircle size={16} />
              <span>Share via WhatsApp</span>
            </button>

            {email && (
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || emailSentSuccess}
                className="admin-btn admin-btn-secondary"
              >
                <Mail size={16} />
                <span>
                  {sendingEmail
                    ? 'Sending Email...'
                    : emailSentSuccess
                    ? 'Email Sent!'
                    : 'Send via Email'}
                </span>
              </button>
            )}

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="admin-btn admin-btn-secondary"
              >
                <Share2 size={16} />
                <span>Native Share</span>
              </button>
            )}

            <a
              href={normalizeInviteUrl(result.invitationUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-secondary"
            >
              <ExternalLink size={16} />
              <span>Preview as Guest</span>
            </a>
          </div>

          {emailError && (
            <div style={{ color: '#991b1b', fontSize: '13px', marginBottom: '16px' }}>
              {emailError}
            </div>
          )}

          <div style={{ borderTop: '1px solid #f0e6d6', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <button
              onClick={handleReset}
              className="admin-btn admin-btn-secondary"
            >
              <Plus size={15} />
              <span>Create Another Invitation</span>
            </button>

            <Link
              href={`/admin12-portal/invitations/${result.invitation.id}`}
              className="admin-btn admin-btn-secondary"
            >
              <span>View Invitation Details</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="admin-card" style={{ maxWidth: '780px', margin: '0 auto' }}>
          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          <div className="admin-form-grid" style={{ marginBottom: '20px' }}>
            <div className="admin-field">
              <label htmlFor="fullName">Guest's Full Name *</label>
              <input
                id="fullName"
                type="text"
                required
                maxLength={120}
                placeholder="e.g. Kasun Perera"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label htmlFor="householdName">Household or Family Name (Optional)</label>
              <input
                id="householdName"
                type="text"
                maxLength={120}
                placeholder="e.g. The Perera Family"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label htmlFor="maxAttendees">Number of Authorized Attendees (Seats) *</label>
              <select
                id="maxAttendees"
                value={maxAttendees}
                onChange={(e) => setMaxAttendees(Number(e.target.value))}
              >
                {Array.from({ length: 20 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} {i === 0 ? 'Person' : 'People'}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-field">
              <label htmlFor="phone">Phone / WhatsApp Number (Optional)</label>
              <input
                id="phone"
                type="tel"
                placeholder="e.g. +94 77 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label htmlFor="email">Email Address (Optional)</label>
              <input
                id="email"
                type="email"
                placeholder="e.g. kasun@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label htmlFor="expiresAt">Invitation Expiration Date (Optional)</label>
              <input
                id="expiresAt"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-field" style={{ marginBottom: '24px' }}>
            <label htmlFor="privateNotes">Private Administrative Notes (Optional)</label>
            <textarea
              id="privateNotes"
              rows={3}
              placeholder="e.g. VIP table, groom's university friend, requires vegetarian lunch..."
              value={privateNotes}
              onChange={(e) => setPrivateNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              className="admin-btn admin-btn-primary"
              style={{ padding: '12px 24px' }}
            >
              <UserPlus size={16} />
              <span>{loading ? 'Generating...' : 'Generate Secure Invitation'}</span>
            </button>
          </div>
        </form>
      )}

      {whatsAppModalOpen && result && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', color: 'var(--emerald-deep)', marginBottom: '8px' }}>
              Share via WhatsApp
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Review or customize the invitation message before dispatching.
            </p>

            <textarea
              rows={5}
              className="admin-textarea"
              style={{ width: '100%', marginBottom: '16px' }}
              value={customWhatsAppMsg}
              onChange={(e) => setCustomWhatsAppMsg(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setWhatsAppModalOpen(false)}
                className="admin-btn admin-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="admin-btn admin-btn-gold"
              >
                <MessageCircle size={15} />
                <span>Open WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
