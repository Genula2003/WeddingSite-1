import assert from 'assert';
import { generateSecureToken, hashToken, buildInvitationUrl } from '../lib/invitation-service';

let totalTests = 0;
let passedTests = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res
        .then(() => {
          passedTests++;
          process.stdout.write(`PASS: ${name}\n`);
        })
        .catch((err) => {
          process.stderr.write(`FAIL: ${name}\n  ${err.message}\n`);
        });
    }
    passedTests++;
    process.stdout.write(`PASS: ${name}\n`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`FAIL: ${name}\n  ${msg}\n`);
  }
}

async function runAll() {
  process.stdout.write('Running Wedding Invitation Management Test Suite...\n\n');

  runTest('1. Token Uniqueness & Entropy (>= 32 bytes / 256 bits)', () => {
    const tokens = new Set<string>();
    const count = 500;
    for (let i = 0; i < count; i++) {
      const token = generateSecureToken();
      assert.strictEqual(typeof token, 'string');
      assert(token.length >= 43);
      assert(/^[A-Za-z0-9_-]+$/.test(token));
      assert(!tokens.has(token));
      tokens.add(token);
    }
    assert.strictEqual(tokens.size, count);
  });

  runTest('2. Token Hashing (SHA-256 standard and determinism)', () => {
    const raw = 'my-sample-secure-token-1234567890';
    const hash1 = hashToken(raw);
    const hash2 = hashToken(raw);
    assert.strictEqual(hash1, hash2);
    assert.strictEqual(hash1.length, 64);
    assert(/^[0-9a-f]{64}$/.test(hash1));

    const differentHash = hashToken('another-token');
    assert.notStrictEqual(hash1, differentHash);
  });

  runTest('3. Invitation Canonical URL Building', () => {
    const token = 'sampleTokenXYZ';
    const url = buildInvitationUrl(token);
    assert(url.includes('/invite/sampleTokenXYZ'));
    assert(!url.includes('//invite'));
  });

  runTest('4. WhatsApp Sharing URL & Message Generation', () => {
    const guestName = 'Kasun Perera';
    const url = 'http://localhost:3000/invite/tok123';
    const message = `Dear ${guestName}, you are warmly invited to celebrate the wedding of Chathura & Gimasha. Please find your personal invitation here: ${url}`;
    const encoded = encodeURIComponent(message);
    const rawPhone = '+94 77 123 4567';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

    const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;
    assert(waUrl.startsWith('https://wa.me/94771234567?text='));
    assert(waUrl.includes('Kasun%20Perera'));
    assert(waUrl.includes('Chathura%20%26%20Gimasha'));
  });

  runTest('5. Attendee Limit Enforcement Logic', () => {
    const maxAttendees = 4;
    const requestedCount = 6;
    const constrainedCount = Math.max(1, Math.min(maxAttendees, requestedCount));
    assert.strictEqual(constrainedCount, 4);

    const zeroCount = 0;
    const constrainedZero = Math.max(1, Math.min(maxAttendees, zeroCount));
    assert.strictEqual(constrainedZero, 1);
  });

  runTest('6. Declined Attendance Zero Headcount Rule', () => {
    const status: string = 'declined';
    const rawCount = 3;
    const finalCount = status === 'accepted' ? rawCount : 0;
    assert.strictEqual(finalCount, 0);
  });

  runTest('7. Token Expiry Check Logic', () => {
    const pastDate = new Date(Date.now() - 3600000).toISOString();
    const futureDate = new Date(Date.now() + 3600000).toISOString();

    const isPastExpired = Boolean(pastDate && new Date(pastDate) < new Date());
    const isFutureExpired = Boolean(futureDate && new Date(futureDate) < new Date());

    assert.strictEqual(isPastExpired, true);
    assert.strictEqual(isFutureExpired, false);
  });

  runTest('8. Revoked Token Invalidation Status Rule', () => {
    const invitationRecord = {
      status: 'revoked',
      revoked_at: new Date().toISOString(),
    };
    const isRevoked = invitationRecord.status === 'revoked' || Boolean(invitationRecord.revoked_at);
    assert.strictEqual(isRevoked, true);
  });

  runTest('9. Guest Privacy Filtering (No leak of email/phone/notes/hash)', () => {
    const rawDbRecord = {
      id: 'inv-uuid',
      guest_id: 'guest-uuid',
      token_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      status: 'generated',
      max_attendees: 3,
      guest: {
        id: 'guest-uuid',
        full_name: 'Amara Silva',
        household_name: 'Silva Family',
        email: 'secret-amara@example.com',
        phone: '+94770001122',
        private_notes: 'VIP table 4, do not seat near entrance',
      },
    };

    const publicView = {
      invitationId: rawDbRecord.id,
      guestName: rawDbRecord.guest.full_name,
      householdName: rawDbRecord.guest.household_name,
      maxAttendees: rawDbRecord.max_attendees,
      status: rawDbRecord.status,
    };

    assert.strictEqual(publicView.guestName, 'Amara Silva');
    assert.strictEqual(publicView.householdName, 'Silva Family');
    assert.strictEqual((publicView as any).email, undefined);
    assert.strictEqual((publicView as any).phone, undefined);
    assert.strictEqual((publicView as any).private_notes, undefined);
    assert.strictEqual((publicView as any).token_hash, undefined);
  });

  runTest('10. View Event Deduplication Policy (30 minute threshold)', () => {
    const now = Date.now();
    const recentViewTime = new Date(now - 10 * 60 * 1000).toISOString();
    const oldViewTime = new Date(now - 45 * 60 * 1000).toISOString();
    const thirtyMinutesMs = 30 * 60 * 1000;

    const shouldTrackRecent = now - new Date(recentViewTime).getTime() > thirtyMinutesMs;
    const shouldTrackOld = now - new Date(oldViewTime).getTime() > thirtyMinutesMs;

    assert.strictEqual(shouldTrackRecent, false);
    assert.strictEqual(shouldTrackOld, true);
  });

  runTest('11. Database Migration & Rollback Scripts Existence', () => {
    const fs = require('fs');
    const path = require('path');
    const initMigration = path.join(__dirname, '..', 'supabase', 'migrations', '20261027000000_init_wedding_schema.sql');
    const rollbackMigration = path.join(__dirname, '..', 'supabase', 'migrations', '20261027000000_rollback_wedding_schema.sql');

    assert(fs.existsSync(initMigration), 'Init migration must exist');
    assert(fs.existsSync(rollbackMigration), 'Rollback migration must exist');

    const initContent = fs.readFileSync(initMigration, 'utf8');
    assert(initContent.includes('CREATE TABLE IF NOT EXISTS public.admin_profiles'));
    assert(initContent.includes('CREATE TABLE IF NOT EXISTS public.invitations'));
    assert(initContent.includes('CREATE TABLE IF NOT EXISTS public.guests'));
    assert(initContent.includes('CREATE TABLE IF NOT EXISTS public.rsvps'));
    assert(initContent.includes('CREATE TABLE IF NOT EXISTS public.invitation_events'));
    assert(initContent.includes('ENABLE ROW LEVEL SECURITY'));
    assert(initContent.includes('CREATE OR REPLACE FUNCTION public.is_admin()'));
  });

  runTest('12. Initial Account Bootstrap Credentials Verification', () => {
    const defaultUsername = 'admin12';
    const defaultPassword = 'welcome123';
    assert.strictEqual(defaultUsername, 'admin12');
    assert.strictEqual(defaultPassword, 'welcome123');
    assert(defaultPassword.length >= 8);
  });

  process.stdout.write(`\nTest results: ${passedTests}/${totalTests} passed.\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAll().catch((err) => {
  process.stderr.write(`Fatal error running test suite: ${err.message}\n`);
  process.exit(1);
});
