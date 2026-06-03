import type { Rarity } from "@phantoria/game-core";

export type GachaPoolEntry = {
  hubId: string;
  templateKey: string;
  name: string;
  tribe: string;
  hue: string;
  rarity: Rarity;
};

/** 6 starters — bannière bienvenue (roue complète) */
const DEFAULT_WELCOME_GACHA_POOL: GachaPoolEntry[] = [
  { hubId: "bram", templateKey: "bram_vaillant", name: "Bram", tribe: "Vaillants", hue: "#f97316", rarity: "E" },
  { hubId: "nyx", templateKey: "nyx_mysterieux", name: "Nyx", tribe: "Mystérieux", hue: "#a855f7", rarity: "C" },
  { hubId: "luma", templateKey: "luma_mignon", name: "Luma", tribe: "Mignons", hue: "#ec4899", rarity: "B" },
  { hubId: "kiro", templateKey: "kiro_perfide", name: "Kiro", tribe: "Perfides", hue: "#22d3ee", rarity: "D" },
  { hubId: "roche", templateKey: "roche_costaud", name: "Roche", tribe: "Costauds", hue: "#78716c", rarity: "E" },
  { hubId: "halo", templateKey: "halo_bienveillant", name: "Halo", tribe: "Bienveillants", hue: "#fbbf24", rarity: "E" },
];

/** Pack général — pool élargi + S */
const DEFAULT_STANDARD_GACHA_POOL: GachaPoolEntry[] = [
  ...DEFAULT_WELCOME_GACHA_POOL,
  { hubId: "murmure", templateKey: "murmure_sinistre", name: "Murmure", tribe: "Sinistres", hue: "#6b21a8", rarity: "D" },
  { hubId: "brise", templateKey: "brise_insaisissable", name: "Brise", tribe: "Insaisissables", hue: "#38bdf8", rarity: "D" },
  { hubId: "aurore", templateKey: "aurore_legende", name: "Aurore", tribe: "Bienveillants", hue: "#fde047", rarity: "S" },
];

export let WELCOME_GACHA_POOL: GachaPoolEntry[] = [...DEFAULT_WELCOME_GACHA_POOL];
export let STANDARD_GACHA_POOL: GachaPoolEntry[] = [...DEFAULT_STANDARD_GACHA_POOL];
export let STANDARD_PULL_TICKET_COST = 1;
export let STANDARD_PULL_GEM_COST = 50;
export let STANDARD_MULTI_PULL_COUNT = 10;

export function applyGachaPools(
  welcome: GachaPoolEntry[],
  standard: GachaPoolEntry[],
  costs?: { ticketCost?: number; gemCost?: number; multiCount?: number },
): void {
  WELCOME_GACHA_POOL = [...welcome];
  STANDARD_GACHA_POOL = [...standard];
  if (costs?.ticketCost != null) STANDARD_PULL_TICKET_COST = costs.ticketCost;
  if (costs?.gemCost != null) STANDARD_PULL_GEM_COST = costs.gemCost;
  if (costs?.multiCount != null) STANDARD_MULTI_PULL_COUNT = costs.multiCount;
}

export function resetGachaPools(): void {
  WELCOME_GACHA_POOL = [...DEFAULT_WELCOME_GACHA_POOL];
  STANDARD_GACHA_POOL = [...DEFAULT_STANDARD_GACHA_POOL];
  STANDARD_PULL_TICKET_COST = 1;
  STANDARD_PULL_GEM_COST = 50;
  STANDARD_MULTI_PULL_COUNT = 10;
  EXTRA_GACHA_POOLS.clear();
}

const EXTRA_GACHA_POOLS = new Map<string, GachaPoolEntry[]>();

export function registerGachaPool(poolId: string, entries: GachaPoolEntry[]): void {
  if (poolId === "welcome" || poolId === "standard") return;
  EXTRA_GACHA_POOLS.set(poolId, [...entries]);
}

export function getGachaPool(poolId: string): GachaPoolEntry[] | undefined {
  if (poolId === "welcome") return WELCOME_GACHA_POOL;
  if (poolId === "standard") return STANDARD_GACHA_POOL;
  return EXTRA_GACHA_POOLS.get(poolId);
}

export function listExtraGachaPoolIds(): string[] {
  return [...EXTRA_GACHA_POOLS.keys()];
}

export function clearExtraGachaPools(): void {
  EXTRA_GACHA_POOLS.clear();
}

export const STANDARD_PULL_TICKET_COST_DEFAULT = 1;
export const STANDARD_PULL_GEM_COST_DEFAULT = 50;
export const STANDARD_MULTI_PULL_COUNT_DEFAULT = 10;

export function entryByHubId(hubId: string): GachaPoolEntry | undefined {
  const pools: GachaPoolEntry[][] = [WELCOME_GACHA_POOL, STANDARD_GACHA_POOL];
  for (const poolId of listExtraGachaPoolIds()) {
    const extra = getGachaPool(poolId);
    if (extra) pools.push(extra);
  }
  for (const pool of pools) {
    const hit = pool.find((e) => e.hubId === hubId);
    if (hit) return hit;
  }
  return undefined;
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
