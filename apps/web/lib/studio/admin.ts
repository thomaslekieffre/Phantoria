import type { SupabaseClient } from "@supabase/supabase-js";

export type StudioAuthResult =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403; error: string };

/** Vérifie que l'utilisateur connecté a `profiles.is_admin`. */
export async function requireStudioAdmin(supabase: SupabaseClient): Promise<StudioAuthResult> {
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, status: 401, error: "Non connecté" };
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile?.is_admin) {
    return { ok: false, status: 403, error: "Accès studio réservé aux admins" };
  }

  return { ok: true, userId: user.id };
}
