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

export const INITIAL_ROSTER: SpiritSlot[] = [
  { id: "bram", name: "Bram", tribe: "Vaillants", hp: 100, onField: true, hue: "#f97316", rarity: "E" },
  { id: "nyx", name: "Nyx", tribe: "Mystérieux", hp: 72, onField: true, hue: "#a855f7", rarity: "C" },
  { id: "luma", name: "Luma", tribe: "Mignons", hp: 100, onField: true, hue: "#ec4899", rarity: "B" },
  { id: "kiro", name: "Kiro", tribe: "Malins", hp: 88, onField: false, hue: "#22d3ee", rarity: "D" },
  { id: "empty-5", name: "Libre", tribe: "—", hp: 0, onField: false, hue: "#475569", empty: true },
  { id: "empty-6", name: "Libre", tribe: "—", hp: 0, onField: false, hue: "#475569", empty: true },
];

export function hpTone(hp: number) {
  if (hp >= 80) return "ok";
  if (hp >= 45) return "warn";
  return "low";
}

export function isSpiritId(id: SpiritSlot["id"] | string): id is SpiritId {
  return SPIRIT_IDS.includes(id as SpiritId);
}
