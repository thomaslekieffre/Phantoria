import type { SupabaseClient } from "@supabase/supabase-js";
import type { SpiritId } from "@/components/hub/roster";
import { SPIRIT_CATALOG } from "./types";

export const WELCOME_PULLS_START = 6;
export const GACHA_STARTER_POOL: SpiritId[] = ["bram", "nyx", "luma", "kiro"];
export const GACHA_DUPLICATE_GEMS = 25;

export type GachaPullResult =
  | { kind: "spirit"; hubId: SpiritId; name: string; tribe: string; hue: string; duplicate: false }
  | { kind: "duplicate"; hubId: SpiritId; name: string; gems: number };

function pickHubId(owned: Set<string>): SpiritId {
  const unowned = GACHA_STARTER_POOL.filter((id) => !owned.has(id));
  const pool = unowned.length > 0 ? unowned : GACHA_STARTER_POOL;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

async function assignToRoster(supabase: SupabaseClient, userId: string, spiritId: string): Promise<void> {
  const { data: slots } = await supabase
    .from("roster_slots")
    .select("slot_index, spirit_id, on_field")
    .eq("user_id", userId)
    .order("slot_index");

  const free = (slots ?? []).find((s) => !s.spirit_id);
  if (!free) return;

  const fieldCount = (slots ?? []).filter((s) => s.on_field).length;
  const onField = fieldCount < 3;

  await supabase
    .from("roster_slots")
    .update({ spirit_id: spiritId, on_field: onField })
    .eq("user_id", userId)
    .eq("slot_index", free.slot_index);
}

export async function performWelcomePull(supabase: SupabaseClient): Promise<{
  result: GachaPullResult | null;
  welcomePullsRemaining: number;
  error?: string;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { result: null, welcomePullsRemaining: 0, error: "Non connecté" };

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("welcome_pulls_remaining")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile) {
    return { result: null, welcomePullsRemaining: 0, error: "Profil introuvable" };
  }

  if (profile.welcome_pulls_remaining <= 0) {
    return { result: null, welcomePullsRemaining: 0, error: "Plus d'invocations gratuites" };
  }

  const { data: ownedRows } = await supabase
    .from("player_spirits")
    .select("hub_id")
    .eq("user_id", user.id);

  const owned = new Set((ownedRows ?? []).map((r) => r.hub_id));
  const hubId = pickHubId(owned);
  const meta = SPIRIT_CATALOG[hubId];

  const { data: inserted, error: insertErr } = await supabase
    .from("player_spirits")
    .insert({
      user_id: user.id,
      hub_id: hubId,
      template_key: meta.templateKey,
    })
    .select("id")
    .single();

  let result: GachaPullResult;

  if (insertErr || !inserted) {
    const { data: currencies } = await supabase
      .from("player_currencies")
      .select("gems")
      .eq("user_id", user.id)
      .single();

    const gems = (currencies?.gems ?? 0) + GACHA_DUPLICATE_GEMS;
    await supabase.from("player_currencies").update({ gems }).eq("user_id", user.id);

    result = {
      kind: "duplicate",
      hubId,
      name: meta.name,
      gems: GACHA_DUPLICATE_GEMS,
    };
  } else {
    await assignToRoster(supabase, user.id, inserted.id);
    result = {
      kind: "spirit",
      hubId,
      name: meta.name,
      tribe: meta.tribe,
      hue: meta.hue,
      duplicate: false,
    };
  }

  const remaining = profile.welcome_pulls_remaining - 1;
  await supabase.from("profiles").update({ welcome_pulls_remaining: remaining }).eq("id", user.id);

  return { result, welcomePullsRemaining: remaining };
}
