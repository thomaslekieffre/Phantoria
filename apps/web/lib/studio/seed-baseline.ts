import type { GachaPoolEntry } from "@/lib/player/gacha-pool";

/** Données initiales — utilisées uniquement par seed Studio → DB, jamais au runtime. */
export const SEED_WELCOME_GACHA_POOL: GachaPoolEntry[] = [
  { hubId: "bram", templateKey: "bram_vaillant", name: "Bram", tribe: "Vaillants", hue: "#f97316", rarity: "E", weight: 100 },
  { hubId: "nyx", templateKey: "nyx_mysterieux", name: "Nyx", tribe: "Mystérieux", hue: "#a855f7", rarity: "C" },
  { hubId: "luma", templateKey: "luma_mignon", name: "Luma", tribe: "Mignons", hue: "#ec4899", rarity: "B" },
  { hubId: "kiro", templateKey: "kiro_perfide", name: "Kiro", tribe: "Perfides", hue: "#22d3ee", rarity: "D" },
  { hubId: "roche", templateKey: "roche_costaud", name: "Roche", tribe: "Costauds", hue: "#78716c", rarity: "E", weight: 130 },
  { hubId: "halo", templateKey: "halo_bienveillant", name: "Halo", tribe: "Bienveillants", hue: "#fbbf24", rarity: "E", weight: 90 },
];

export const SEED_STANDARD_GACHA_POOL: GachaPoolEntry[] = [
  ...SEED_WELCOME_GACHA_POOL,
  { hubId: "murmure", templateKey: "murmure_sinistre", name: "Murmure", tribe: "Sinistres", hue: "#6b21a8", rarity: "D" },
  { hubId: "brise", templateKey: "brise_insaisissable", name: "Brise", tribe: "Insaisissables", hue: "#38bdf8", rarity: "D" },
  { hubId: "aurore", templateKey: "aurore_legende", name: "Aurore", tribe: "Bienveillants", hue: "#fde047", rarity: "S" },
];

export const SEED_STANDARD_PULL_TICKET_COST = 1;
export const SEED_STANDARD_PULL_GEM_COST = 50;
export const SEED_STANDARD_MULTI_PULL_COUNT = 10;
