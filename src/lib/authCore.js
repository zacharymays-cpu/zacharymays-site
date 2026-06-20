// Pure / injectable auth helpers — CommonJS so `node --test` can import them
// (the .ts wrapper auth.ts pulls these in plus the real Supabase clients).

function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

// Injectable: real callers pass createSupabaseAdminClient() (service-role).
async function isActiveDecryptor(adminClient, email) {
  const { data } = await adminClient
    .from('authorized_decryptors').select('email')
    .eq('email', String(email).toLowerCase()).eq('is_active', true).maybeSingle();
  return !!data;
}

module.exports = { adminEmails, isActiveDecryptor };
