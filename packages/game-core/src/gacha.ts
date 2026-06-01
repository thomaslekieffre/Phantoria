import type { Rarity } from "./types";

/** Taux de base hors pity (hors S, normalisés après échec S) */
export const GACHA_BASE_WEIGHTS: Record<Rarity, number> = {
  S: 0.01,
  A: 0.04,
  B: 0.09,
  C: 0.18,
  D: 0.28,
  E: 0.4,
};

/** Gemmes offertes sur doublon (tirage standard) */
export const GACHA_DUPLICATE_GEMS: Record<Rarity, number> = {
  E: 15,
  D: 25,
  C: 40,
  B: 60,
  A: 100,
  S: 200,
};

export const GACHA_HARD_PITY = 100;

/** Taux S selon pity (pulls depuis le dernier S) — GDD */
export function getSRateAtPity(pity: number): number {
  if (pity >= GACHA_HARD_PITY) return 1;
  if (pity >= 99) return 0.25;
  if (pity >= 95) return 0.15;
  if (pity >= 90) return 0.1;
  if (pity >= 80) return 0.06;
  if (pity >= 70) return 0.04;
  if (pity >= 60) return 0.03;
  if (pity >= 50) return 0.02;
  return GACHA_BASE_WEIGHTS.S;
}

export function rollGachaRarity(pity: number, random = Math.random): Rarity {
  if (pity >= GACHA_HARD_PITY) return "S";

  const sRate = getSRateAtPity(pity);
  if (random() < sRate) return "S";

  const rest: Rarity[] = ["A", "B", "C", "D", "E"];
  let total = 0;
  for (const r of rest) total += GACHA_BASE_WEIGHTS[r];
  let roll = random() * total;
  for (const r of rest) {
    roll -= GACHA_BASE_WEIGHTS[r];
    if (roll <= 0) return r;
  }
  return "E";
}

export function nextPityCounter(currentPity: number, rolled: Rarity): number {
  return rolled === "S" ? 0 : currentPity + 1;
}
