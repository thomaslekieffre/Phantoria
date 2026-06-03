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

/** Roue mock locale (hors Supabase) — dérivée des pools chargés. */
export function buildMockInitialRoster(): SpiritSlot[] {
  const pick = (hubId: string, hp: number) => slotFromMeta(hubId, hp) ?? emptyWheelSlot(0);
  const byHub = (id: string) => WELCOME_GACHA_POOL.find((e) => e.hubId === id);
  const bram = byHub("bram")?.hubId ?? WELCOME_GACHA_POOL[0]?.hubId;
  const nyx = byHub("nyx")?.hubId ?? WELCOME_GACHA_POOL[1]?.hubId;
  const kiro = byHub("kiro")?.hubId ?? WELCOME_GACHA_POOL[3]?.hubId;
  const luma = byHub("luma")?.hubId ?? WELCOME_GACHA_POOL[2]?.hubId;

  return applyFieldFlags([
    bram ? pick(bram, 100) : emptyWheelSlot(0),
    nyx ? pick(nyx, 72) : emptyWheelSlot(1),
    emptyWheelSlot(2),
    kiro ? pick(kiro, 88) : emptyWheelSlot(3),
    emptyWheelSlot(4),
    luma ? pick(luma, 100) : emptyWheelSlot(5),
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
