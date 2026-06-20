import { requireAdmin } from '../../../lib/auth';
import PersonsClient from './PersonsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function PersonsAdminPage() {
  try {
    await requireAdmin();
  } catch (e) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Personnel identity</h1>
        <p style={{ color: '#b00' }}>{e.message}</p>
      </main>
    );
  }
  return (
    <main style={{ padding: 24 }}>
      <h1>Personnel identity</h1>
      <p style={{ opacity: 0.7, maxWidth: 640 }}>
        Search by P-label or name. Reveal and publish require decryptor authorization;
        every reveal is logged. Revealed names are shown only here, to you.
      </p>
      <PersonsClient />
    </main>
  );
}
