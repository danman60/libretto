import { createClient } from '@supabase/supabase-js';

function getUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL!;
}

function getAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
}

const DB_OPTIONS = { db: { schema: 'libretto' as const } };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: any = null;

/** Client-side Supabase (anon key, limited by RLS) — lazy singleton */
export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(getUrl(), getAnonKey(), DB_OPTIONS);
  }
  return _supabase;
}

/** Server-side Supabase (service role, bypasses RLS) */
export function getServiceSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return createClient(getUrl(), serviceRoleKey, DB_OPTIONS);
}
