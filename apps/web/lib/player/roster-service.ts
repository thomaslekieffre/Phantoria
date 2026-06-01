import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MAX_WHEEL,
  isSpiritId,
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

function emptySlot(index: number): SpiritSlot {
  return {
    id: `empty-${index + 1}` as SpiritSlot["id"],
    name: "Libre",
    tribe: "—",
    hp: 0,
    onField: false,
    hue: "#475569",
    empty: true,
  };
}

export function buildEmptyRoster(): SpiritSlot[] {
  return Array.from({ length: MAX_WHEEL }, (_, i) => emptySlot(i));
}

export function buildRosterFromDb(slots: DbRosterSlot[]): SpiritSlot[] {
  const byIndex = new Map(slots.map((s) => [s.slot_index, s]));

  return Array.from({ length: MAX_WHEEL }, (_, slotIndex) => {
    const slot = byIndex.get(slotIndex);
    const spirit = slot?.spirit;
    if (!spirit || !isSpiritId(spirit.hub_id)) return emptySlot(slotIndex);

    const meta = SPIRIT_CATALOG[spirit.hub_id];
    return {
      id: spirit.hub_id,
      name: meta.name,
      tribe: meta.tribe,
      hp: spirit.hp_pct,
      onField: Boolean(slot?.on_field),
      hue: meta.hue,
    };
  });
}

export async function fetchPlayerSnapshot(supabase: SupabaseClient): Promise<PlayerSnapshot | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: currencies }, { data: spirits }, { data: slots }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, level, welcome_pulls_remaining").eq("id", user.id).single(),
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

export async function persistRosterField(
  supabase: SupabaseClient,
  hubId: SpiritId,
  onField: boolean,
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
    .select("slot_index, spirit_id, on_field")
    .eq("user_id", user.id);

  const current = (slots ?? []).find((s) => s.spirit_id === spirit.id);
  if (!current) return false;

  if (onField) {
    const fieldCount = (slots ?? []).filter((s) => s.on_field).length;
    if (fieldCount >= 3) return false;
  }

  const { error } = await supabase
    .from("roster_slots")
    .update({ on_field: onField })
    .eq("user_id", user.id)
    .eq("slot_index", current.slot_index);

  return !error;
}
