/**
 * Supabase config — publishable values only.
 * URL and anon key are publishable (safe to ship). Service role stays server-only.
 */

export const SUPABASE_CONFIG = {
  url: "https://kyipcezxvqveahrirmyg.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5aXBjZXp4dnF2ZWFocmlybXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NTQ2OTAsImV4cCI6MjEwMDEzMDY5MH0.rSZwPbzlruL3dncAVNs7GGWZAMvrxK3FAbqYEdD70Ls",
} as const;

export function isSupabaseConfigured(): boolean {
  return SUPABASE_CONFIG.url.startsWith('https://') && SUPABASE_CONFIG.anonKey.length > 0;
}
