'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { TableRowSkeleton } from '@/components/SkeletonLoader';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Home,
  Mail,
  Phone,
} from 'lucide-react';

interface GuestWithInvites {
  id: string;
  full_name: string;
  household_name: string | null;
  email: string | null;
  phone: string | null;
  preferred_language: string | null;
  private_notes: string | null;
  created_at: string;
  invitations?: Array<{
    id: string;
    status: string;
    max_attendees: number;
    rsvp?: {
      attendance_status: string;
      attendee_count: number;
    };
  }>;
}

export default function AdminGuestsPage() {
  const [guests, setGuests] = useState<GuestWithInvites[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      const res = await fetch(`/api/guests?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = '/admin12-portal';
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setGuests(data.guests || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGuests();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchGuests]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <AdminLayout>
      <div className="admin-header-row">
        <div>
          <h1 className="admin-header-title">Guest Directory &amp; Households</h1>
          <p className="admin-header-subtitle">
            Manage invited contacts, family households, dietary notes and link associations ({totalCount} guests).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => fetchGuests()}
            disabled={loading}
            className="admin-btn admin-btn-secondary"
            title="Refresh guest list"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <Link href="/admin12-portal/invitations/new" className="admin-btn admin-btn-primary">
            <Plus size={16} />
            <span>Add Guest / Invitation</span>
          </Link>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-filters-bar">
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search by guest name, household, email or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="admin-search-input"
              style={{ paddingLeft: '34px', width: '100%' }}
            />
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Guest Full Name</th>
                <th>Household / Family</th>
                <th>Contact Info</th>
                <th>Seats</th>
                <th>RSVP Status</th>
                <th>Notes</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowSkeleton rows={pageSize} columns={6} />
              ) : guests.length > 0 ? (
                guests.map((g) => {
                const invite = g.invitations && g.invitations[0];
                const rsvp = invite?.rsvp;
                const rsvpState = rsvp?.attendance_status || 'pending';

                return (
                  <tr key={g.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--emerald-deep)' }}>
                        {g.full_name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Added {new Date(g.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      {g.household_name ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Home size={13} color="var(--gold-dark)" />
                          <span>{g.household_name}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {g.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={11} color="var(--text-muted)" />
                            <span>{g.phone}</span>
                          </div>
                        )}
                        {g.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Mail size={11} color="var(--text-muted)" />
                            <span>{g.email}</span>
                          </div>
                        )}
                        {!g.phone && !g.email && <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </div>
                    </td>
                    <td>
                      {invite ? (
                        <span>
                          <strong>{invite.max_attendees}</strong>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}> seats</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {invite ? (
                        <span className={`admin-badge badge-${rsvpState}`}>
                          {rsvpState}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No link</span>
                      )}
                    </td>
                    <td>
                      {g.private_notes ? (
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }} title={g.private_notes}>
                          {g.private_notes.length > 25 ? `${g.private_notes.slice(0, 25)}…` : g.private_notes}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div className="admin-actions-cell">
                        {invite && (
                          <Link
                            href={`/admin12-portal/invitations/${invite.id}`}
                            className="admin-icon-btn"
                            title="View linked invitation"
                          >
                            <ExternalLink size={14} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted)' }}>
                    No guest profiles found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {!loading && guests.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
              <Users size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ fontSize: '15px', fontWeight: 500 }}>No guests found.</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>
                Create an invitation to add a guest to the registry.
              </p>
            </div>
          )}
        </div>

        <div className="admin-pagination">
          <div>
            Showing {guests.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(page * pageSize, totalCount)} of {totalCount} guests
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="admin-icon-btn"
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="admin-icon-btn"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
