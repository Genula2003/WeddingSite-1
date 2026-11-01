'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { StatCardSkeleton, RecentActivitySkeleton } from '@/components/SkeletonLoader';
import {
  Users,
  Mail,
  Send,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  HelpCircle,
  UserCheck,
  Plus,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface DashboardStats {
  totalInvitedSeats: number;
  totalInvitations: number;
  invitationsShared: number;
  invitationsAwaitingDelivery: number;
  invitationsViewed: number;
  confirmedAttendance: number;
  declinedAttendance: number;
  pendingRsvp: number;
  totalExpectedAttendees: number;
  recentEvents: Array<{
    id: string;
    event_type: string;
    created_at: string;
    metadata?: Record<string, unknown>;
    invitation?: {
      guest?: {
        full_name?: string;
      };
    };
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchStats() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.status === 401) {
        window.location.href = '/admin12-portal';
        return;
      }
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to load statistics');
      }
      const data = await res.json();
      setStats(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading dashboard';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  function formatEventType(type: string) {
    const map: Record<string, string> = {
      created: 'Invitation created',
      link_copied: 'Invitation link copied',
      share_initiated: 'WhatsApp share initiated',
      sent: 'Marked as sent',
      delivered: 'Delivered',
      viewed: 'Opened & viewed by guest',
      rsvp_submitted: 'RSVP submitted',
      rsvp_updated: 'RSVP updated',
      token_replaced: 'Replacement link generated',
      revoked: 'Invitation revoked',
      reactivated: 'Invitation reactivated',
    };
    return map[type] || type;
  }

  return (
    <AdminLayout>
      <div className="admin-header-row">
        <div>
          <div className="invalid-eyebrow">
            <Sparkles size={13} style={{ display: 'inline', marginRight: '4px' }} />
            CHATHURA &amp; GIMASHA WEDDING
          </div>
          <h1 className="admin-header-title">Executive Dashboard</h1>
          <p className="admin-header-subtitle">
            Real-time invitation lifecycle, delivery tracking, and RSVP metrics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="admin-btn admin-btn-secondary"
            title="Refresh statistics"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <Link href="/admin12-portal/invitations/new" className="admin-btn admin-btn-primary">
            <Plus size={16} />
            <span>Create New Invitation</span>
          </Link>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '14px 18px',
            borderRadius: '10px',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      <div className="admin-stats-grid">
        {loading ? (
          <StatCardSkeleton count={9} />
        ) : (
          <>
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Total Invited Seats</span>
            <Users size={18} />
          </div>
          <div className="admin-stat-value">{stats?.totalInvitedSeats ?? '—'}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Combined guest capacity authorized
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Invitations Generated</span>
            <Mail size={18} />
          </div>
          <div className="admin-stat-value">{stats?.totalInvitations ?? '—'}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Unique cryptographic tokens issued
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Shared or Sent</span>
            <Send size={18} />
          </div>
          <div className="admin-stat-value">{stats?.invitationsShared ?? '—'}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Links distributed via WhatsApp/manual
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Awaiting Delivery</span>
            <Clock size={18} />
          </div>
          <div className="admin-stat-value">{stats?.invitationsAwaitingDelivery ?? '—'}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Created but not yet marked shared
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Invitations Viewed</span>
            <Eye size={18} />
          </div>
          <div className="admin-stat-value">{stats?.invitationsViewed ?? '—'}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Distinct links opened by guests
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Confirmed Attendance</span>
            <CheckCircle size={18} color="#16a34a" />
          </div>
          <div className="admin-stat-value" style={{ color: '#166534' }}>
            {stats?.confirmedAttendance ?? '—'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Parties attending with acceptance
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Declined Attendance</span>
            <XCircle size={18} color="#dc2626" />
          </div>
          <div className="admin-stat-value" style={{ color: '#991b1b' }}>
            {stats?.declinedAttendance ?? '—'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Parties gracefully unable to attend
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Pending Responses</span>
            <HelpCircle size={18} color="#d97706" />
          </div>
          <div className="admin-stat-value" style={{ color: '#b45309' }}>
            {stats?.pendingRsvp ?? '—'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            No response recorded yet
          </div>
        </div>

        <div className="admin-stat-card" style={{ border: '1px solid var(--gold)' }}>
          <div className="admin-stat-top">
            <span className="admin-stat-label" style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>
              Expected Attendees
            </span>
            <UserCheck size={18} color="var(--gold)" />
          </div>
          <div className="admin-stat-value" style={{ color: 'var(--gold-dark)' }}>
            {stats?.totalExpectedAttendees ?? '—'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Actual headcount from accepted RSVPs
          </div>
        </div>
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="admin-card-title">Recent Activity Feed</h2>
            <Link
              href="/admin12-portal/invitations"
              style={{ fontSize: '13px', color: 'var(--emerald-deep)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <RecentActivitySkeleton items={5} />
          ) : stats?.recentEvents && stats.recentEvents.length > 0 ? (
            <div className="admin-timeline">
              {stats.recentEvents.map((evt) => {
                const guestName = evt.invitation?.guest?.full_name || 'Guest';
                return (
                  <div key={evt.id} className="admin-timeline-item">
                    <div className="admin-timeline-dot" />
                    <div className="admin-timeline-title">
                      {formatEventType(evt.event_type)} &mdash; <strong>{guestName}</strong>
                    </div>
                    <div className="admin-timeline-time">
                      {new Date(evt.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted)' }}>
              <Mail size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p>No activity recorded yet.</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>
                Generate your first invitation link to start tracking.
              </p>
            </div>
          )}
        </div>

        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="admin-card-title">Quick Actions &amp; Workflows</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Link
              href="/admin12-portal/invitations/new"
              className="admin-btn admin-btn-primary"
              style={{ justifyContent: 'flex-start', padding: '14px 18px' }}
            >
              <Plus size={18} />
              <div>
                <div style={{ fontWeight: 600 }}>Create New Guest Invitation</div>
                <div style={{ fontSize: '12px', opacity: 0.85, fontWeight: 400 }}>
                  Generate secure personal link for an individual, couple or family
                </div>
              </div>
            </Link>

            <Link
              href="/admin12-portal/invitations"
              className="admin-btn admin-btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '14px 18px' }}
            >
              <Mail size={18} />
              <div>
                <div style={{ fontWeight: 600 }}>Manage &amp; Share Invitations</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                  Copy personal links, initiate WhatsApp messages, check delivery status
                </div>
              </div>
            </Link>

            <Link
              href="/admin12-portal/guests"
              className="admin-btn admin-btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '14px 18px' }}
            >
              <Users size={18} />
              <div>
                <div style={{ fontWeight: 600 }}>Household &amp; Guest Directory</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                  View organized families, dietary preferences, and private contact notes
                </div>
              </div>
            </Link>

            <a
              href="/api/export"
              className="admin-btn admin-btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '14px 18px' }}
            >
              <UserCheck size={18} />
              <div>
                <div style={{ fontWeight: 600 }}>Export Accepted Guests (Excel)</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                  Download catering and seating list as formatted .xlsx file
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
