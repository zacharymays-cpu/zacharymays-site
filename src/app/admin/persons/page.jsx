import { requireAdmin } from '../../../lib/auth';
import AdminNav from '../AdminNav';
import PersonsClient from './PersonsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function PersonsAdminPage() {
  try {
    await requireAdmin();
  } catch (e) {
    return (
      <main style={{ padding: '3rem', maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 600 }}>Personnel identity</h1>
        <p style={{ color: '#b00', marginTop: '0.75rem' }}>{e.message}</p>
      </main>
    );
  }
  return (
    <main style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <AdminNav active="/admin/persons" />
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Personnel identity</h1>
        <p style={{ opacity: 0.7, marginTop: '0.4rem', maxWidth: 640 }}>
          Search by P-label or name; separate multiple with commas to look up a batch at once.
          Reveal and publish require decryptor authorization; every reveal is logged.
          Revealed names are shown only here, to you.
        </p>
      </header>
      <PersonsClient />
    </main>
  );
}
