/**
 * Supabase config — publishable values only.
 *
 * URL and anon key are safe to commit (they're designed for browser use;
 * RLS enforces access control). Service role key stays in server secrets
 * and is only read from `process.env.TUBEPILOT_SUPABASE_SERVICE_ROLE_KEY`.
 *
 * TODO: kullanıcı URL + anon key gönderdiğinde bu değerler doldurulacak.
 */

export const SUPABASE_CONFIG = {
  url: "__SUPABASE_URL__",
  anonKey: "__SUPABASE_ANON_KEY__",
} as const;

export function isSupabaseConfigured(): boolean {
  return (
    SUPABASE_CONFIG.url.startsWith("https://") &&
    !SUPABASE_CONFIG.anonKey.startsWith("__")
  );
}
