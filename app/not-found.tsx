import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="invalid-invitation-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="invalid-invitation-card" style={{ maxWidth: '540px', width: '100%', textAlign: 'center' }}>
        <div className="invalid-eyebrow">✦ 404 &bull; PAGE NOT FOUND ✦</div>
        <h1 className="invalid-title" style={{ fontFamily: "'Cormorant Upright', serif", fontSize: 'clamp(32px, 5vw, 44px)', marginTop: '8px' }}>
          Lost on the Journey
        </h1>
        <div className="invalid-flourish" aria-hidden="true" style={{ margin: '14px 0 20px', color: '#c59b43', letterSpacing: '4px' }}>
          ── ◇ ──
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--emerald-deep)', marginBottom: '12px' }}>
          This celebration page could not be found
        </h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.65, fontSize: '15px', marginBottom: '28px' }}>
          The page you are looking for may have been moved, renamed, or is currently unavailable. Please return to the homepage to celebrate with us.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn" style={{ textDecoration: 'none' }}>
            Return to Wedding Invitation
          </Link>
          <Link href="/admin12-portal" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            Staff Portal
          </Link>
        </div>
      </div>
    </main>
  );
}

