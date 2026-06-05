import type { Rarity } from "@phantoria/game-core";

export type GachaPoolEntry = {
  hubId: string;
  templateKey: string;
  name: string;
  tribe: string;
  hue: string;
  rarity: Rarity;
  /** Poids relatif dans la même rareté (défaut 100). */
  weight?: number;
};

export type GachaPoolMeta = {
  bannerUrl?: string | null;
};

const DEFAULT_ENTRY_WEIGHT = 100;

function entryWeight(e: GachaPoolEntry): number {
  const w = e.weight ?? DEFAULT_ENTRY_WEIGHT;
  return w > 0 ? w : DEFAULT_ENTRY_WEIGHT;
}

export function pickWeighted(pool: GachaPoolEntry[], random = Math.random): GachaPoolEntry {
  if (pool.length === 0) throw new Error("empty gacha pool");
  if (pool.length === 1) return pool[0]!;
  let total = 0;
  for (const e of pool) total += entryWeight(e);
  let roll = random() * total;
  for (const e of pool) {
    roll -= entryWeight(e);
    if (roll <= 0) return e;
  }
  return pool[pool.length - 1]!;
}

/** Pools runtime — remplis uniquement via applyGachaPools (contenu DB). */
export let WELCOME_GACHA_POOL: GachaPoolEntry[] = [];
export let STANDARD_GACHA_POOL: GachaPoolEntry[] = [];
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
  WELCOME_GACHA_POOL = [];
  STANDARD_GACHA_POOL = [];
  STANDARD_PULL_TICKET_COST = 1;
  STANDARD_PULL_GEM_COST = 50;
  STANDARD_MULTI_PULL_COUNT = 10;
  EXTRA_GACHA_POOLS.clear();
  GACHA_POOL_META.clear();
}

const EXTRA_GACHA_POOLS = new Map<string, GachaPoolEntry[]>();
const GACHA_POOL_META = new Map<string, GachaPoolMeta>();

export function registerGachaPool(poolId: string, entries: GachaPoolEntry[], meta?: GachaPoolMeta): void {
  if (poolId === "welcome" || poolId === "standard") return;
  EXTRA_GACHA_POOLS.set(poolId, [...entries]);
  if (meta) GACHA_POOL_META.set(poolId, meta);
}

export function setGachaPoolMeta(poolId: string, meta: GachaPoolMeta): void {
  GACHA_POOL_META.set(poolId, meta);
}

export function getGachaPoolMeta(poolId: string): GachaPoolMeta | undefined {
  return GACHA_POOL_META.get(poolId);
}

export function getGachaPoolBanner(poolId: string): string | undefined {
  const url = GACHA_POOL_META.get(poolId)?.bannerUrl;
  return url?.trim() || undefined;
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
  GACHA_POOL_META.clear();
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
  if (matches.length > 0) return pickWeighted(matches, random);
  const order: Rarity[] = ["S", "A", "B", "C", "D", "E"];
  const idx = order.indexOf(rarity);
  for (let i = idx + 1; i < order.length; i++) {
    const fallback = pool.filter((e) => e.rarity === order[i]);
    if (fallback.length > 0) return pickWeighted(fallback, random);
  }
  return pickWeighted(pool, random);
}

export function pickWelcomeEntry(owned: Set<string>, random = Math.random): GachaPoolEntry {
  const unowned = WELCOME_GACHA_POOL.filter((e) => !owned.has(e.hubId));
  const pool = unowned.length > 0 ? unowned : WELCOME_GACHA_POOL;
  return pickWeighted(pool, random);
}
