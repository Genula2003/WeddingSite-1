'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected frontend errors for diagnostics
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <main className="invalid-invitation-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="invalid-invitation-card" style={{ maxWidth: '540px', width: '100%', textAlign: 'center' }}>
        <div className="invalid-eyebrow">✦ NOTICE ✦</div>
        <h1 className="invalid-title" style={{ fontFamily: "'Cormorant Upright', serif", fontSize: 'clamp(30px, 4.5vw, 40px)', marginTop: '8px' }}>
          Something went wrong
        </h1>
        <div className="invalid-flourish" aria-hidden="true" style={{ margin: '14px 0 20px', color: '#c59b43', letterSpacing: '4px' }}>
          ── ♥ ──
        </div>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.65, fontSize: '15px', marginBottom: '28px' }}>
          An unexpected display error occurred while rendering this page. You can try refreshing or return to the main invitation.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => reset()} className="btn" type="button">
            Try Again
          </button>
          <Link href="/" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            Back to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}

