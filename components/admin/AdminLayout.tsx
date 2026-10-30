'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Mail,
  UserPlus,
  Users,
  Settings,
  LogOut,
  ExternalLink,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
    } finally {
      router.push('/admin12-portal');
    }
  }

  const navItems = [
    { href: '/admin12-portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin12-portal/invitations', label: 'Invitations', icon: Mail },
    { href: '/admin12-portal/invitations/new', label: 'New Invitation', icon: UserPlus },
    { href: '/admin12-portal/guests', label: 'Guests', icon: Users },
    { href: '/admin12-portal/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="admin-portal-shell">
      <header className="admin-portal-nav">
        <div className="admin-portal-nav-inner">
          <div className="admin-portal-brand">
            <span>C ♥ G</span>
            <span className="admin-portal-brand-badge">Wedding Studio</span>
          </div>

          <nav className="admin-portal-links">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-portal-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-secondary"
              style={{ padding: '6px 12px', fontSize: '13px' }}
              title="Open Public Wedding Website in new tab"
            >
              <span>Site</span>
              <ExternalLink size={13} />
            </a>
            <button
              onClick={handleLogout}
              className="admin-btn admin-btn-danger"
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="admin-portal-content">{children}</main>
    </div>
  );
}
