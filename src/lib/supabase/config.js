// Single source of truth for which Supabase project the site talks to.
// Env vars (set in Vercel) win; the hardcoded production values are the
// fallback so a missing env var can never silently point one page at a
// different database than the rest of the site.
//
// Public anon key only (RLS-gated, safe in client bundles). The service-role
// key is intentionally NOT here — it stays env-only (see supabase/admin.js).
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';

// Alias: most page components reference the key as ANON_KEY.
export const ANON_KEY = SUPABASE_ANON_KEY;
