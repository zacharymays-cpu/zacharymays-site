'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';

const IDLE_MS = 15 * 60 * 1000; // 15 minutes (NIST SP 800-53 AC-11)
const EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

export default function IdleTimeout() {
  const router = useRouter();
  const timer = useRef(null);

  useEffect(() => {
    function reset() {
      clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        router.push('/admin/login?reason=idle');
      }, IDLE_MS);
    }

    reset();
    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      clearTimeout(timer.current);
      EVENTS.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [router]);

  return null;
}
