/**
 * Supabase config — publishable values only.
 *
 * URL and anon key are injected at build time from server secrets
 * TUBEPILOT_SUPABASE_URL and TUBEPILOT_SUPABASE_ANON_KEY (see vite.config.ts).
 * Both are publishable — safe to ship to the browser. RLS enforces access.
 * Service role key stays server-only.
 */

const url = import.meta.env.VITE_SUPABASE_URL ?? "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const SUPABASE_CONFIG = {
  url,
  anonKey,
} as const;

export function isSupabaseConfigured(): boolean {
  return SUPABASE_CONFIG.url.startsWith("https://") && SUPABASE_CONFIG.anonKey.length > 0;
}
