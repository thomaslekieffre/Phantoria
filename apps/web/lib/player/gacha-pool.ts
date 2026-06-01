import type { Rarity } from "@phantoria/game-core";
import type { SpiritId } from "@/components/hub/roster";

export type GachaPoolEntry = {
  hubId: SpiritId;
  templateKey: string;
  name: string;
  tribe: string;
  hue: string;
  rarity: Rarity;
};

/** 6 starters — bannière bienvenue (roue complète) */
export const WELCOME_GACHA_POOL: GachaPoolEntry[] = [
  { hubId: "bram", templateKey: "bram_vaillant", name: "Bram", tribe: "Vaillants", hue: "#f97316", rarity: "E" },
  { hubId: "nyx", templateKey: "nyx_mysterieux", name: "Nyx", tribe: "Mystérieux", hue: "#a855f7", rarity: "C" },
  { hubId: "luma", templateKey: "luma_mignon", name: "Luma", tribe: "Mignons", hue: "#ec4899", rarity: "B" },
  { hubId: "kiro", templateKey: "kiro_perfide", name: "Kiro", tribe: "Perfides", hue: "#22d3ee", rarity: "D" },
  { hubId: "roche", templateKey: "roche_costaud", name: "Roche", tribe: "Costauds", hue: "#78716c", rarity: "E" },
  { hubId: "halo", templateKey: "halo_bienveillant", name: "Halo", tribe: "Bienveillants", hue: "#fbbf24", rarity: "E" },
];

/** Pack général — pool élargi + S */
export const STANDARD_GACHA_POOL: GachaPoolEntry[] = [
  ...WELCOME_GACHA_POOL,
  { hubId: "murmure", templateKey: "murmure_sinistre", name: "Murmure", tribe: "Sinistres", hue: "#6b21a8", rarity: "D" },
  { hubId: "brise", templateKey: "brise_insaisissable", name: "Brise", tribe: "Insaisissables", hue: "#38bdf8", rarity: "D" },
  { hubId: "aurore", templateKey: "aurore_legende", name: "Aurore", tribe: "Bienveillants", hue: "#fde047", rarity: "S" },
];

export const STANDARD_PULL_TICKET_COST = 1;
export const STANDARD_PULL_GEM_COST = 50;
export const STANDARD_MULTI_PULL_COUNT = 10;

export function entryByHubId(hubId: SpiritId): GachaPoolEntry | undefined {
  return STANDARD_GACHA_POOL.find((e) => e.hubId === hubId);
}

export function pickFromPool(
  pool: GachaPoolEntry[],
  rarity: Rarity,
  random = Math.random,
): GachaPoolEntry {
  const matches = pool.filter((e) => e.rarity === rarity);
  if (matches.length > 0) {
    return matches[Math.floor(random() * matches.length)]!;
  }
  const order: Rarity[] = ["S", "A", "B", "C", "D", "E"];
  const idx = order.indexOf(rarity);
  for (let i = idx + 1; i < order.length; i++) {
    const fallback = pool.filter((e) => e.rarity === order[i]);
    if (fallback.length > 0) return fallback[Math.floor(random() * fallback.length)]!;
  }
  return pool[Math.floor(random() * pool.length)]!;
}

export function pickWelcomeEntry(owned: Set<string>, random = Math.random): GachaPoolEntry {
  const unowned = WELCOME_GACHA_POOL.filter((e) => !owned.has(e.hubId));
  const pool = unowned.length > 0 ? unowned : WELCOME_GACHA_POOL;
  return pool[Math.floor(random() * pool.length)]!;
}
