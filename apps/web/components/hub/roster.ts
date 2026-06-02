import type { Rarity } from "@phantoria/game-core";

export type SpiritId =
  | "bram"
  | "nyx"
  | "luma"
  | "kiro"
  | "roche"
  | "halo"
  | "murmure"
  | "brise"
  | "aurore";

const SPIRIT_IDS: SpiritId[] = [
  "bram",
  "nyx",
  "luma",
  "kiro",
  "roche",
  "halo",
  "murmure",
  "brise",
  "aurore",
];

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

export const INITIAL_ROSTER: SpiritSlot[] = applyFieldFlags([
  { id: "bram", name: "Bram", tribe: "Vaillants", hp: 100, onField: false, hue: "#f97316", rarity: "E" },
  { id: "nyx", name: "Nyx", tribe: "Mystérieux", hp: 72, onField: false, hue: "#a855f7", rarity: "C" },
  { id: "empty-3", name: "Libre", tribe: "—", hp: 0, onField: false, hue: "#475569", empty: true },
  { id: "kiro", name: "Kiro", tribe: "Malins", hp: 88, onField: false, hue: "#22d3ee", rarity: "D" },
  { id: "empty-5", name: "Libre", tribe: "—", hp: 0, onField: false, hue: "#475569", empty: true },
  { id: "luma", name: "Luma", tribe: "Mignons", hp: 100, onField: false, hue: "#ec4899", rarity: "B" },
]);

export function hpTone(hp: number) {
  if (hp >= 80) return "ok";
  if (hp >= 45) return "warn";
  return "low";
}

export function isSpiritId(id: SpiritSlot["id"] | string): id is SpiritId {
  return SPIRIT_IDS.includes(id as SpiritId);
}
