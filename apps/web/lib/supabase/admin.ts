import { createClient } from "@supabase/supabase-js";
import { isSupabaseEnabled } from "./config";

/** Client service role — mutations gacha uniquement côté serveur (bypass RLS). */
export function createAdminClient() {
  if (!isSupabaseEnabled()) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function hasAdminClient(): boolean {
  return createAdminClient() !== null;
}
