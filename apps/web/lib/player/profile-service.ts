import type { SupabaseClient } from "@supabase/supabase-js";

const DISPLAY_NAME_MAX = 24;

export function sanitizeDisplayName(raw: string): string {
  return raw.trim().slice(0, DISPLAY_NAME_MAX);
}

export async function persistDisplayName(
  supabase: SupabaseClient,
  displayName: string,
): Promise<{ ok: boolean; error?: string }> {
  const name = sanitizeDisplayName(displayName);
  if (name.length < 2) {
    return { ok: false, error: "Au moins 2 caractères." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non connecté." };

  const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
