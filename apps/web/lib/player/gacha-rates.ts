import {
  GACHA_BASE_WEIGHTS,
  GACHA_HARD_PITY,
  getSRateAtPity,
  type Rarity,
} from "@phantoria/game-core";
import type { GachaPoolEntry } from "@/lib/player/gacha-pool";

const REST_RARITIES: Rarity[] = ["A", "B", "C", "D", "E"];

function entryWeight(e: GachaPoolEntry): number {
  const w = e.weight ?? 100;
  return w > 0 ? w : 100;
}

/** Probabilité de tirer une rareté (hors welcome). */
export function rarityPullProbability(rarity: Rarity, pity: number): number {
  if (pity >= GACHA_HARD_PITY) return rarity === "S" ? 1 : 0;
  const sRate = getSRateAtPity(pity);
  if (rarity === "S") return sRate;
  const restTotal = REST_RARITIES.reduce((sum, r) => sum + GACHA_BASE_WEIGHTS[r], 0);
  return (1 - sRate) * (GACHA_BASE_WEIGHTS[rarity] / restTotal);
}

/** Probabilité d'obtenir un esprit précis (poids intra-rareté inclus). */
export function spiritPullProbability(
  entry: GachaPoolEntry,
  pool: GachaPoolEntry[],
  options: {
    mode: "welcome" | "gacha";
    pity?: number;
    owned?: Set<string>;
  },
): number {
  const w = entryWeight(entry);

  if (options.mode === "welcome") {
    const unowned = pool.filter((e) => !options.owned?.has(e.hubId));
    const active = unowned.length > 0 ? unowned : pool;
    if (!active.some((e) => e.hubId === entry.hubId)) return 0;
    const sum = active.reduce((s, e) => s + entryWeight(e), 0);
    return w / sum;
  }

  const pity = options.pity ?? 0;
  const rarityProb = rarityPullProbability(entry.rarity, pity);
  const same = pool.filter((e) => e.rarity === entry.rarity);
  const sum = same.reduce((s, e) => s + entryWeight(e), 0);
  return rarityProb * (w / sum);
}

export function formatRatePct(p: number): string {
  if (p <= 0) return "0%";
  if (p >= 0.01) return `${Math.round(p * 1000) / 10}%`;
  if (p >= 0.001) return `${Math.round(p * 10000) / 100}%`;
  return `${(p * 100).toFixed(3)}%`;
}
