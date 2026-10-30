import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyAdminPage() {
  redirect('/admin12-portal');
}
