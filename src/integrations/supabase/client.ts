import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_CONFIG, isSupabaseConfigured } from "./config";
import type { Database } from "./database.types";

/**
 * Browser Supabase client — publishable key + persisted session.
 * Server code should NOT import this; use a server-only client instead.
 */

const key = SUPABASE_CONFIG.anonKey;

function buildFetch(): typeof fetch {
  // Opaque sb_publishable_ keys aren't JWTs; strip default Authorization
  // header so PostgREST doesn't fail with "Expected 3 parts in JWT".
  if (!key.startsWith("sb_")) return fetch;
  return (input, init) => {
    const h = new Headers(init?.headers);
    if (h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
    h.set("apikey", key);
    return fetch(input, { ...init, headers: h });
  };
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_CONFIG.url,
  key,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "tp-auth",
    },
    global: { fetch: buildFetch() },
  },
);

export { isSupabaseConfigured };
