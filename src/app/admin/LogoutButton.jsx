'use client';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        marginLeft: 'auto',
        padding: '5px 14px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 700,
        border: '1px solid rgba(244,240,232,0.18)',
        background: 'transparent',
        color: 'rgba(244,240,232,0.62)',
        cursor: 'pointer',
      }}
    >
      Sign out
    </button>
  );
}
