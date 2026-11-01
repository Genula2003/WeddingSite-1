'use client';

import React from 'react';

/**
 * Reusable Card Skeleton for wedding section cards
 */
export function CardSkeleton({
  type = 'details',
}: {
  type?: 'details' | 'rsvp' | 'wishes' | 'countdown';
}) {
  return (
    <div
      className={`card-skeleton-wrap card-skeleton-${type}`}
      aria-busy="true"
      aria-label="Loading content"
      role="status"
    >
      <div
        className="skeleton-bar skeleton-eyebrow skeleton-shimmer"
        style={{ width: '140px', margin: '0 auto 12px' }}
      />
      <div
        className="skeleton-bar skeleton-title-main skeleton-shimmer"
        style={{ width: '280px', height: '36px', margin: '0 auto 20px' }}
      />

      <div className="skeleton-flourish" style={{ marginBottom: '24px' }}>
        <span className="skeleton-flourish-line skeleton-shimmer" />
        <span className="skeleton-flourish-gem" />
        <span className="skeleton-flourish-line skeleton-shimmer" />
      </div>

      {type === 'countdown' && (
        <div className="skeleton-countdown-grid">
          <div className="skeleton-countdown-box skeleton-shimmer" />
          <div className="skeleton-countdown-box skeleton-shimmer" />
          <div className="skeleton-countdown-box skeleton-shimmer" />
          <div className="skeleton-countdown-box skeleton-shimmer" />
        </div>
      )}

      {type === 'details' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            maxWidth: '600px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          <div
            className="skeleton-box skeleton-shimmer"
            style={{ height: '140px', borderRadius: '18px' }}
          />
          <div
            className="skeleton-box skeleton-shimmer"
            style={{ height: '140px', borderRadius: '18px' }}
          />
        </div>
      )}

      {type === 'rsvp' && (
        <div
          style={{
            maxWidth: '440px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <div className="skeleton-bar skeleton-shimmer" style={{ width: '220px', height: '24px' }} />
          <div
            className="skeleton-bar skeleton-shimmer"
            style={{ width: '100%', height: '48px', borderRadius: '12px' }}
          />
          <div
            className="skeleton-bar skeleton-shimmer"
            style={{ width: '180px', height: '44px', borderRadius: '9999px' }}
          />
        </div>
      )}

      {type === 'wishes' && (
        <div
          style={{
            maxWidth: '520px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <div
            className="skeleton-bar skeleton-shimmer"
            style={{ width: '100%', height: '80px', borderRadius: '14px' }}
          />
          <div
            className="skeleton-bar skeleton-shimmer"
            style={{ width: '160px', height: '42px', borderRadius: '9999px' }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Reusable Stat Card Skeleton for Dashboard KPI metrics
 */
export function StatCardSkeleton({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="admin-stat-card skeleton-stat-card"
          aria-busy="true"
          aria-label="Loading metric"
          role="status"
        >
          <div className="admin-stat-top">
            <div className="skeleton-bar skeleton-shimmer" style={{ width: '110px', height: '14px' }} />
            <div
              className="skeleton-bar skeleton-shimmer"
              style={{ width: '22px', height: '22px', borderRadius: '6px' }}
            />
          </div>
          <div
            className="skeleton-bar skeleton-shimmer"
            style={{ width: '60px', height: '34px', margin: '10px 0 8px' }}
          />
          <div className="skeleton-bar skeleton-shimmer" style={{ width: '150px', height: '12px' }} />
        </div>
      ))}
    </>
  );
}

/**
 * Reusable Table Row Skeleton for Data Tables
 */
export function TableRowSkeleton({
  rows = 5,
  columns = 7,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="skeleton-table-row" aria-busy="true" role="status">
          {Array.from({ length: columns }).map((_, c) => (
            <td key={c}>
              <div
                className="skeleton-bar skeleton-shimmer"
                style={{
                  width: c === 0 ? '75%' : c === columns - 1 ? '50%' : '60%',
                  height: '16px',
                  borderRadius: '4px',
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * Reusable Activity List Skeleton for Recent Events / Audit Logs
 */
export function RecentActivitySkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="skeleton-activity-list" aria-busy="true" role="status">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid rgba(20, 62, 38, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div
              className="skeleton-bar skeleton-shimmer"
              style={{ width: '32px', height: '32px', borderRadius: '50%' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <div className="skeleton-bar skeleton-shimmer" style={{ width: '40%', height: '14px' }} />
              <div className="skeleton-bar skeleton-shimmer" style={{ width: '25%', height: '11px' }} />
            </div>
          </div>
          <div className="skeleton-bar skeleton-shimmer" style={{ width: '70px', height: '12px' }} />
        </div>
      ))}
    </div>
  );
}

/**
 * Reusable Form Input Skeleton
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%' }}
      aria-busy="true"
      role="status"
    >
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton-bar skeleton-shimmer" style={{ width: '120px', height: '14px' }} />
          <div
            className="skeleton-bar skeleton-shimmer"
            style={{ width: '100%', height: '42px', borderRadius: '8px' }}
          />
        </div>
      ))}
      <div
        className="skeleton-bar skeleton-shimmer"
        style={{ width: '140px', height: '40px', borderRadius: '8px', marginTop: '8px' }}
      />
    </div>
  );
}

export default CardSkeleton;
