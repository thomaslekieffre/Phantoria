import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MAX_WHEEL,
  emptyWheelSlot,
  isFieldSlotIndex,
  isSpiritId,
  swapRosterSlotsLocal,
  type SpiritId,
  type SpiritSlot,
} from "@/components/hub/roster";
import { SPIRIT_CATALOG, type DbCurrencies, type DbPlayerSpirit, type DbProfile, type DbRosterSlot } from "./types";

export type PlayerSnapshot = {
  profile: DbProfile;
  currencies: DbCurrencies;
  roster: SpiritSlot[];
  unlockedHubIds: SpiritId[];
  spiritCount: number;
};

export function buildEmptyRoster(): SpiritSlot[] {
  return Array.from({ length: MAX_WHEEL }, (_, i) => emptyWheelSlot(i));
}

export function buildRosterFromDb(slots: DbRosterSlot[]): SpiritSlot[] {
  const byIndex = new Map(slots.map((s) => [s.slot_index, s]));

  return Array.from({ length: MAX_WHEEL }, (_, slotIndex) => {
    const slot = byIndex.get(slotIndex);
    const spirit = slot?.spirit;
    if (!spirit || !isSpiritId(spirit.hub_id)) return emptyWheelSlot(slotIndex);

    const meta = SPIRIT_CATALOG[spirit.hub_id];
    return {
      id: spirit.hub_id,
      name: meta.name,
      tribe: meta.tribe,
      hp: spirit.hp_pct,
      onField: isFieldSlotIndex(slotIndex),
      hue: meta.hue,
      rarity: meta.rarity,
    };
  });
}

export async function fetchPlayerSnapshot(supabase: SupabaseClient): Promise<PlayerSnapshot | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: currencies }, { data: spirits }, { data: slots }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, level, welcome_pulls_remaining, gacha_pity_standard").eq("id", user.id).single(),
    supabase.from("player_currencies").select("gold, gems, tickets").eq("user_id", user.id).single(),
    supabase.from("player_spirits").select("id, hub_id, template_key, level, xp, hp_pct").eq("user_id", user.id),
    supabase
      .from("roster_slots")
      .select("slot_index, spirit_id, on_field")
      .eq("user_id", user.id)
      .order("slot_index"),
  ]);

  if (!profile || !currencies) return null;

  const spiritById = new Map((spirits ?? []).map((s) => [s.id, s as DbPlayerSpirit]));
  const enriched: DbRosterSlot[] = (slots ?? []).map((s) => ({
    ...s,
    spirit: s.spirit_id ? (spiritById.get(s.spirit_id) ?? null) : null,
  }));

  const roster =
    enriched.length > 0 ? buildRosterFromDb(enriched) : buildEmptyRoster();
  const unlockedHubIds = (spirits ?? [])
    .map((s) => s.hub_id)
    .filter((id): id is SpiritId => isSpiritId(id));

  return {
    profile: profile as DbProfile,
    currencies: currencies as DbCurrencies,
    roster,
    unlockedHubIds,
    spiritCount: spirits?.length ?? 0,
  };
}

function fieldFlagForSlot(slotIndex: number, spiritId: string | null): boolean {
  return spiritId != null && isFieldSlotIndex(slotIndex);
}

async function updateRosterSlot(
  supabase: SupabaseClient,
  userId: string,
  slotIndex: number,
  spiritId: string | null,
): Promise<boolean> {
  const { error } = await supabase
    .from("roster_slots")
    .update({ spirit_id: spiritId, on_field: fieldFlagForSlot(slotIndex, spiritId) })
    .eq("user_id", userId)
    .eq("slot_index", slotIndex);

  return !error;
}

export async function persistRosterSwap(
  supabase: SupabaseClient,
  fromIndex: number,
  toIndex: number,
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= MAX_WHEEL || toIndex >= MAX_WHEEL) {
    return false;
  }

  const { data: slots } = await supabase
    .from("roster_slots")
    .select("slot_index, spirit_id")
    .eq("user_id", user.id);

  const from = (slots ?? []).find((s) => s.slot_index === fromIndex);
  const to = (slots ?? []).find((s) => s.slot_index === toIndex);
  if (!from || !to) return false;

  const fromSpirit = from.spirit_id;
  const toSpirit = to.spirit_id;

  const okFrom = await updateRosterSlot(supabase, user.id, fromIndex, toSpirit);
  const okTo = await updateRosterSlot(supabase, user.id, toIndex, fromSpirit);
  return okFrom && okTo;
}

/** Place un esprit possédé sur un emplacement (échange si déjà sur la roue ou case occupée). */
export async function persistPlaceSpiritOnSlot(
  supabase: SupabaseClient,
  hubId: SpiritId,
  toIndex: number,
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || toIndex < 0 || toIndex >= MAX_WHEEL) return false;

  const { data: spirit } = await supabase
    .from("player_spirits")
    .select("id")
    .eq("user_id", user.id)
    .eq("hub_id", hubId)
    .maybeSingle();

  if (!spirit) return false;

  const { data: slots } = await supabase
    .from("roster_slots")
    .select("slot_index, spirit_id")
    .eq("user_id", user.id)
    .order("slot_index");

  const current = (slots ?? []).find((s) => s.spirit_id === spirit.id);
  if (current?.slot_index === toIndex) return true;

  if (current) {
    return persistRosterSwap(supabase, current.slot_index, toIndex);
  }

  const target = (slots ?? []).find((s) => s.slot_index === toIndex);
  if (!target) return false;

  if (!target.spirit_id) {
    return updateRosterSlot(supabase, user.id, toIndex, spirit.id);
  }

  const free = (slots ?? []).find((s) => !s.spirit_id);
  if (!free) return false;

  const displaced = target.spirit_id;
  const okTarget = await updateRosterSlot(supabase, user.id, toIndex, spirit.id);
  const okBench = await updateRosterSlot(supabase, user.id, free.slot_index, displaced);
  return okTarget && okBench;
}

export async function persistPlaceSpiritFirstFree(
  supabase: SupabaseClient,
  hubId: SpiritId,
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: slots } = await supabase
    .from("roster_slots")
    .select("slot_index, spirit_id")
    .eq("user_id", user.id)
    .order("slot_index");

  const free = (slots ?? []).find((s) => !s.spirit_id);
  if (!free) return false;

  return persistPlaceSpiritOnSlot(supabase, hubId, free.slot_index);
}

export async function persistRemoveSpiritFromWheel(
  supabase: SupabaseClient,
  hubId: SpiritId,
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: spirit } = await supabase
    .from("player_spirits")
    .select("id")
    .eq("user_id", user.id)
    .eq("hub_id", hubId)
    .maybeSingle();

  if (!spirit) return false;

  const { data: slots } = await supabase
    .from("roster_slots")
    .select("slot_index, spirit_id")
    .eq("user_id", user.id);

  const current = (slots ?? []).find((s) => s.spirit_id === spirit.id);
  if (!current) return false;

  return updateRosterSlot(supabase, user.id, current.slot_index, null);
}
