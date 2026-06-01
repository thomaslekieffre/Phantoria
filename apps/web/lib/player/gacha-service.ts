import type { SupabaseClient } from "@supabase/supabase-js";
import {
  GACHA_DUPLICATE_GEMS,
  GACHA_HARD_PITY,
  getSRateAtPity,
  nextPityCounter,
  rollGachaRarity,
  type Rarity,
} from "@phantoria/game-core";
import type { SpiritId } from "@/components/hub/roster";
import {
  pickFromPool,
  pickWelcomeEntry,
  STANDARD_GACHA_POOL,
  STANDARD_MULTI_PULL_COUNT,
  STANDARD_PULL_GEM_COST,
  STANDARD_PULL_TICKET_COST,
} from "./gacha-pool";

export const WELCOME_PULLS_START = 6;

export type GachaPullResult =
  | {
      kind: "spirit";
      hubId: SpiritId;
      name: string;
      tribe: string;
      hue: string;
      rarity: Rarity;
      duplicate: false;
    }
  | {
      kind: "duplicate";
      hubId: SpiritId;
      name: string;
      rarity: Rarity;
      gems: number;
    };

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

async function grantSpirit(
  supabase: SupabaseClient,
  userId: string,
  entry: { hubId: SpiritId; templateKey: string; name: string; tribe: string; hue: string; rarity: Rarity },
): Promise<GachaPullResult> {
  const { data: inserted, error: insertErr } = await supabase
    .from("player_spirits")
    .insert({
      user_id: userId,
      hub_id: entry.hubId,
      template_key: entry.templateKey,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    const { data: currencies } = await supabase
      .from("player_currencies")
      .select("gems")
      .eq("user_id", userId)
      .single();

    const gems = GACHA_DUPLICATE_GEMS[entry.rarity];
    await supabase
      .from("player_currencies")
      .update({ gems: (currencies?.gems ?? 0) + gems })
      .eq("user_id", userId);

    return {
      kind: "duplicate",
      hubId: entry.hubId,
      name: entry.name,
      rarity: entry.rarity,
      gems,
    };
  }

  await assignToRoster(supabase, userId, inserted.id);
  return {
    kind: "spirit",
    hubId: entry.hubId,
    name: entry.name,
    tribe: entry.tribe,
    hue: entry.hue,
    rarity: entry.rarity,
    duplicate: false,
  };
}

export async function performWelcomePull(
  supabase: SupabaseClient,
  userId: string,
  random = Math.random,
): Promise<{
  result: GachaPullResult | null;
  welcomePullsRemaining: number;
  error?: string;
}> {
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("welcome_pulls_remaining")
    .eq("id", userId)
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
    .eq("user_id", userId);

  const owned = new Set((ownedRows ?? []).map((r) => r.hub_id));
  const entry = pickWelcomeEntry(owned, random);
  const result = await grantSpirit(supabase, userId, entry);

  const remaining = profile.welcome_pulls_remaining - 1;
  await supabase.from("profiles").update({ welcome_pulls_remaining: remaining }).eq("id", userId);

  return { result, welcomePullsRemaining: remaining };
}

export type StandardPullPayment = "ticket" | "gems";

export async function performStandardPull(
  supabase: SupabaseClient,
  userId: string,
  payment: StandardPullPayment,
  count = 1,
  random = Math.random,
): Promise<{
  results: GachaPullResult[];
  gachaPityStandard: number;
  error?: string;
}> {
  const pullCount =
    count === STANDARD_MULTI_PULL_COUNT ? STANDARD_MULTI_PULL_COUNT : count === 1 ? 1 : 0;
  if (pullCount === 0) {
    return { results: [], gachaPityStandard: 0, error: "Nombre d'invocations invalide" };
  }

  const [{ data: profile }, { data: currencies }] = await Promise.all([
    supabase.from("profiles").select("gacha_pity_standard").eq("id", userId).single(),
    supabase.from("player_currencies").select("gems, tickets").eq("user_id", userId).single(),
  ]);

  if (!profile || !currencies) {
    return { results: [], gachaPityStandard: 0, error: "Profil introuvable" };
  }

  const ticketCost = STANDARD_PULL_TICKET_COST * pullCount;
  const gemCost = STANDARD_PULL_GEM_COST * pullCount;

  if (payment === "ticket") {
    if (currencies.tickets < ticketCost) {
      return {
        results: [],
        gachaPityStandard: profile.gacha_pity_standard ?? 0,
        error: "Pas assez de tickets",
      };
    }
    await supabase
      .from("player_currencies")
      .update({ tickets: currencies.tickets - ticketCost })
      .eq("user_id", userId);
  } else {
    if (currencies.gems < gemCost) {
      return {
        results: [],
        gachaPityStandard: profile.gacha_pity_standard ?? 0,
        error: "Pas assez de gemmes",
      };
    }
    await supabase
      .from("player_currencies")
      .update({ gems: currencies.gems - gemCost })
      .eq("user_id", userId);
  }

  let pity = profile.gacha_pity_standard ?? 0;
  const results: GachaPullResult[] = [];

  for (let i = 0; i < pullCount; i++) {
    const rarity = rollGachaRarity(pity, random);
    const entry = pickFromPool(STANDARD_GACHA_POOL, rarity, random);
    const result = await grantSpirit(supabase, userId, entry);
    results.push(result);
    pity = nextPityCounter(pity, rarity);
  }

  await supabase.from("profiles").update({ gacha_pity_standard: pity }).eq("id", userId);

  return { results, gachaPityStandard: pity };
}

export { GACHA_HARD_PITY, getSRateAtPity };
