# Chathura & Gimasha — Wedding Invitation & Private Management Platform

A wedding invitation and private guest management system for the wedding of Chathura & Gimasha on December 03, 2026 at The Deer Park Hotel, Girithale.

## Overview

The platform features two distinct experiences:

1. **Public Wedding Invitation Website**: Preserved cinematic wedding experience featuring video hero, audio melody player, Kandyan wedding illustration, interactive cover screen, countdown timer, couple biography, poruwa and lunch ceremony details, RSVP, guestbook wishes, and venue directions.
2. **Private Administrator Portal (`/admin12-portal`)**: Unlinked, non-indexed administrative suite with executive metrics, guest directory, cryptographic token generator, delivery lifecycle tracking, WhatsApp share dialogs, token rotation/revocation, RSVP management, and Excel export.

## Architecture

- **Framework**: Next.js 15 (App Router) & React 19
- **Backend & Database**: Supabase PostgreSQL with strict Row Level Security (RLS)
- **Authentication**: Supabase Auth with server-side session cookies (SSR) and username-to-email mapping
- **Security & Cryptography**: 256-bit random invitation tokens, SHA-256 hash storage at rest, rate-limited administrator endpoints
- **Styling**: Vanilla CSS design system with ivory, forest-green and champagne-gold theme

## Environment Configuration

Create `.env.local` based on `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_BOOTSTRAP_USERNAME=admin12
ADMIN_BOOTSTRAP_PASSWORD=welcome123
ADMIN_BOOTSTRAP_EMAIL=admin12@wedding.internal
```

## Database Setup

1. Open your Supabase project dashboard -> SQL Editor.
2. Execute the schema migration file located at:
   `supabase/migrations/20261027000000_init_wedding_schema.sql`
3. The migration sets up:
   - Tables: `admin_profiles`, `guests`, `invitations`, `rsvps`, `invitation_events`, `guest_wishes`
   - Foreign key cascades and performance indexes
   - Row Level Security (RLS) on all tables
   - `is_admin()` security definer function and authenticated administrator policies

To rollback schema changes if ever needed:
Execute `supabase/migrations/20261027000000_rollback_wedding_schema.sql`.

## Provisioning the Initial Administrator

Run the automated provisioning script:

```bash
npm run provision-admin
```

This creates or updates the initial account:
- **Username**: `admin12`
- **Initial Password**: `welcome123`
- **Internal Email**: `admin12@wedding.internal` (or value of `ADMIN_BOOTSTRAP_EMAIL`)
- **Status**: Flagged with `must_change_password = true`

Upon logging in at `/admin12-portal`, the administrator is prompted to set a permanent, custom password before dashboard access is granted.

## Local Development

```bash
npm install
npm run dev
```

Open:
- Public wedding site: `http://localhost:3000`
- Private administrator portal: `http://localhost:3000/admin12-portal`

## Automated Test Suite

Run the built-in automated verification tests:

```bash
npm test
```

Tests verify:
- Cryptographic token generation entropy (>= 32 bytes)
- Deterministic SHA-256 token hashing
- Canonical invitation URL construction
- WhatsApp message encoding and phone number sanitization
- Authorized attendee boundary limits (1 to 20 seats)
- Declined attendance zero-count enforcement
- Token expiration detection
- Revoked token rejection
- Public guest privacy protection (no leaks of phone, email, notes, or token hashes)
- View tracking event deduplication (30-minute threshold)
- Migration and rollback script existence and structure
- Initial bootstrap credential standards

To verify TypeScript typing and production build:

```bash
npx tsc --noEmit
npm run build
```

## Security & Privacy Highlights

- **Token Protection**: Raw invitation tokens are never saved to the database. Only their cryptographic SHA-256 hash is stored.
- **Instant Revocation & Replacement**: Compromised links can be revoked instantly or replaced with a new token while preserving guest history.
- **No Direct Table Exposure**: Public guests only receive narrow, sanitized response payloads through verified server routes.
- **Search Engine Blocking**: `/admin12-portal/`, `/invite/`, `/api/` are blocked in `robots.ts` and marked with `noindex, nofollow` metadata.
- **Brute Force Defense**: Rate limiting prevents automated credential attacks.

## Production Deployment Checklist

1. Deploy repository to Vercel, Netlify, or any Node.js hosting platform.
2. In the hosting provider's dashboard, configure the environment variables from `.env.example`.
3. Set `NEXT_PUBLIC_SITE_URL` to your production domain (e.g., `https://chathura-gimasha.wedding`).
4. Ensure Supabase migrations have been executed on the production database.
5. Run `npm run provision-admin` once against the production Supabase instance.
6. Log in at `/admin12-portal` with `admin12` and `welcome123`, update your password, and begin issuing invitations.
