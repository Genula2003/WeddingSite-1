'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { TableRowSkeleton } from '@/components/SkeletonLoader';
import {
  Search,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Share2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FilterX,
  FileSpreadsheet,
} from 'lucide-react';
import type { InvitationWithDetails } from '@/lib/supabase/types';

export default function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState<InvitationWithDetails[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [rsvpStatus, setRsvpStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'name'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status !== 'all') params.set('status', status);
      if (rsvpStatus !== 'all') params.set('rsvpStatus', rsvpStatus);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const res = await fetch(`/api/invitations?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = '/admin12-portal';
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [search, status, rsvpStatus, page, pageSize, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvitations();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchInvitations]);

  function handleResetFilters() {
    setSearch('');
    setStatus('all');
    setRsvpStatus('all');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
  }

  async function handleCopy(inv: InvitationWithDetails) {
    const url = `${window.location.origin}/admin12-portal/invitations/${inv.id}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <AdminLayout>
      <div className="admin-header-row">
        <div>
          <h1 className="admin-header-title">Guest Invitations</h1>
          <p className="admin-header-subtitle">
            Search, track delivery, review RSVPs, and manage personalized links ({totalCount} total)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a href="/api/export" className="admin-btn admin-btn-secondary" title="Export as Excel">
            <FileSpreadsheet size={15} />
            <span>Export Excel</span>
          </a>

          <button
            onClick={() => fetchInvitations()}
            disabled={loading}
            className="admin-btn admin-btn-secondary"
            title="Refresh list"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <Link href="/admin12-portal/invitations/new" className="admin-btn admin-btn-primary">
            <Plus size={16} />
            <span>Create Invitation</span>
          </Link>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-filters-bar">
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
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
              placeholder="Search by guest, household, email or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="admin-search-input"
              style={{ paddingLeft: '34px', width: '100%' }}
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="admin-select"
          >
            <option value="all">All Invitation Statuses</option>
            <option value="generated">Generated (Unshared)</option>
            <option value="link_copied">Link Copied</option>
            <option value="share_initiated">Share Initiated</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="viewed">Viewed</option>
            <option value="revoked">Revoked</option>
            <option value="expired">Expired</option>
          </select>

          <select
            value={rsvpStatus}
            onChange={(e) => {
              setRsvpStatus(e.target.value);
              setPage(1);
            }}
            className="admin-select"
          >
            <option value="all">All RSVP Responses</option>
            <option value="accepted">Accepted (Attending)</option>
            <option value="declined">Declined</option>
            <option value="pending">Pending Response</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split('-') as ['created_at' | 'name', 'asc' | 'desc'];
              setSortBy(sb);
              setSortOrder(so);
            }}
            className="admin-select"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="name-asc">Guest Name (A–Z)</option>
            <option value="name-desc">Guest Name (Z–A)</option>
          </select>

          {(search || status !== 'all' || rsvpStatus !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="admin-btn admin-btn-secondary"
              style={{ padding: '8px 12px', fontSize: '13px' }}
              title="Reset all filters"
            >
              <FilterX size={14} />
              <span>Clear</span>
            </button>
          )}
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Guest &amp; Household</th>
                <th>Invited Seats</th>
                <th>Invitation Status</th>
                <th>RSVP Response</th>
                <th>Attending</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowSkeleton rows={pageSize} columns={7} />
              ) : invitations.length > 0 ? (
                invitations.map((inv) => {
                const rsvp = inv.rsvp;
                const rsvpState = rsvp?.attendance_status || 'pending';
                return (
                  <tr key={inv.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--emerald-deep)' }}>
                        {inv.guest?.full_name || 'Guest'}
                      </div>
                      {inv.guest?.household_name && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {inv.guest.household_name}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{inv.max_attendees}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {' '}{inv.max_attendees === 1 ? 'seat' : 'seats'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge badge-${inv.status}`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge badge-${rsvpState}`}>
                        {rsvpState}
                      </span>
                    </td>
                    <td>
                      {rsvpState === 'accepted' ? (
                        <strong style={{ color: '#166534' }}>{rsvp?.attendee_count || 1}</strong>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {new Date(inv.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions-cell">
                        <button
                          onClick={() => handleCopy(inv)}
                          className="admin-icon-btn"
                          title="Copy details link"
                        >
                          {copiedId === inv.id ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                        </button>
                        <Link
                          href={`/admin12-portal/invitations/${inv.id}`}
                          className="admin-icon-btn"
                          title="Open invitation details & management"
                        >
                          <ExternalLink size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted)' }}>
                    No invitations match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {!loading && invitations.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '16px', fontWeight: 500 }}>No invitations matched your criteria.</p>
              <p style={{ fontSize: '13px', marginTop: '6px' }}>
                Try adjusting your search terms or filters above.
              </p>
            </div>
          )}
        </div>

        <div className="admin-pagination">
          <div>
            Showing {invitations.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(page * pageSize, totalCount)} of {totalCount} records
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="pageSizeSelect" style={{ fontSize: '12px' }}>
              Rows per page:
            </label>
            <select
              id="pageSizeSelect"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="admin-select"
              style={{ padding: '4px 8px', fontSize: '12px' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="admin-icon-btn"
              title="Previous page"
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
              title="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
