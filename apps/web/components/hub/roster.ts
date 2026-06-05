import { getHubToCore, type Rarity } from "@phantoria/game-core";
import { WELCOME_GACHA_POOL } from "@/lib/player/gacha-pool";
import { getSpiritMeta } from "@/lib/player/spirit-catalog";

/** Identifiant hub (clé dynamique depuis la DB / game-core). */
export type SpiritId = string;

export type SpiritSlot = {
  id: SpiritId | `empty-${number}`;
  name: string;
  tribe: string;
  hp: number;
  onField: boolean;
  hue: string;
  rarity?: Rarity;
  empty?: boolean;
};

export const MAX_FIELD = 3;
export const MAX_WHEEL = 6;

/** Positions visuelles « devant » sur la roue (arc du haut : 12h, 1h30, 10h30). */
export const FIELD_SLOT_INDICES: readonly number[] = [0, 1, 5];

const FIELD_SLOT_SET = new Set(FIELD_SLOT_INDICES);

export function isFieldSlotIndex(slotIndex: number): boolean {
  return FIELD_SLOT_SET.has(slotIndex);
}

/** Les 3 emplacements terrain (devant) sont occupés. */
export function rosterFieldReady(roster: SpiritSlot[]): boolean {
  let filled = 0;
  for (const i of FIELD_SLOT_INDICES) {
    const slot = roster[i];
    if (slot && !slot.empty && isSpiritId(slot.id)) filled++;
  }
  return filled >= MAX_FIELD;
}

export function emptyWheelSlot(slotIndex: number): SpiritSlot {
  return {
    id: `empty-${slotIndex + 1}` as SpiritSlot["id"],
    name: "Libre",
    tribe: "—",
    hp: 0,
    onField: false,
    hue: "#475569",
    empty: true,
  };
}

export function placeSpiritOnSlotLocal(
  roster: SpiritSlot[],
  slotIndex: number,
  spirit: Pick<SpiritSlot, "id" | "name" | "tribe" | "hp" | "hue" | "rarity">,
): SpiritSlot[] {
  if (slotIndex < 0 || slotIndex >= MAX_WHEEL) return roster;

  const fromIndex = roster.findIndex((s) => s.id === spirit.id);
  if (fromIndex >= 0) return swapRosterSlotsLocal(roster, fromIndex, slotIndex);

  const next = [...roster];
  next[slotIndex] = { ...spirit, onField: false, empty: undefined };
  return applyFieldFlags(next);
}

export function removeFromRosterLocal(roster: SpiritSlot[], slotIndex: number): SpiritSlot[] {
  if (slotIndex < 0 || slotIndex >= MAX_WHEEL) return roster;
  const next = [...roster];
  next[slotIndex] = emptyWheelSlot(slotIndex);
  return applyFieldFlags(next);
}

export function applyFieldFlags(roster: SpiritSlot[]): SpiritSlot[] {
  return roster.map((s, i) => ({
    ...s,
    onField: !s.empty && isFieldSlotIndex(i),
  }));
}

export function swapRosterSlotsLocal(roster: SpiritSlot[], fromIndex: number, toIndex: number): SpiritSlot[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= MAX_WHEEL || toIndex >= MAX_WHEEL) {
    return roster;
  }
  const next = [...roster];
  [next[fromIndex], next[toIndex]] = [next[toIndex]!, next[fromIndex]!];
  return applyFieldFlags(next);
}

export function rosterIndexForHubId(roster: SpiritSlot[], hubId: SpiritId): number {
  return roster.findIndex((s) => s.id === hubId);
}

function slotFromMeta(hubId: SpiritId, hp: number): SpiritSlot | null {
  const meta = getSpiritMeta(hubId);
  if (!meta) return null;
  return {
    id: hubId,
    name: meta.name,
    tribe: meta.tribe,
    hp,
    onField: false,
    hue: meta.hue,
    rarity: meta.rarity,
  };
}

/** Roue mock locale (hors Supabase) — dérivée du pool welcome DB. */
export function buildMockInitialRoster(): SpiritSlot[] {
  const pick = (hubId: string, hp: number) => slotFromMeta(hubId, hp) ?? emptyWheelSlot(0);
  const starters = WELCOME_GACHA_POOL.slice(0, 4);
  const hps = [100, 72, 100, 88];

  return applyFieldFlags([
    starters[0] ? pick(starters[0].hubId, hps[0]!) : emptyWheelSlot(0),
    starters[1] ? pick(starters[1].hubId, hps[1]!) : emptyWheelSlot(1),
    emptyWheelSlot(2),
    starters[2] ? pick(starters[2].hubId, hps[2]!) : emptyWheelSlot(3),
    emptyWheelSlot(4),
    starters[3] ? pick(starters[3].hubId, hps[3]!) : emptyWheelSlot(5),
  ]);
}

export function hpTone(hp: number) {
  if (hp >= 80) return "ok";
  if (hp >= 45) return "warn";
  return "low";
}

export function isSpiritId(id: SpiritSlot["id"] | string): id is SpiritId {
  if (typeof id !== "string" || id.startsWith("empty-")) return false;
  return id in getHubToCore() || getSpiritMeta(id) != null;
}
