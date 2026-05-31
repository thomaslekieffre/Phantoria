/** Composition des vagues roguelite — esprits tirés au sort */

import { ALL_SPIRIT_KEYS, getTemplate } from "./characters";
import type { Rarity } from "./types";

export type RunWaveSetup = {
  enemyKeys: string[];
  enemyLevel: number;
};

const RARITY_WEIGHT_BY_WAVE: Record<Rarity, (wave: number) => number> = {
  E: () => 1,
  D: (w) => (w >= 2 ? 1 : 0),
  C: (w) => (w >= 3 ? 1 : 0),
  B: (w) => (w >= 5 ? 0.6 : 0),
  A: (w) => (w >= 8 ? 0.35 : 0),
  S: (w) => (w >= 12 ? 0.15 : 0),
};

function spiritPoolForWave(wave: number): string[] {
  return ALL_SPIRIT_KEYS.filter((key) => {
    const rarity = getTemplate(key).rarity;
    return RARITY_WEIGHT_BY_WAVE[rarity](wave) > 0;
  });
}

function pickWeightedUnique(
  pool: string[],
  count: number,
  wave: number,
  rng: () => number,
): string[] {
  if (pool.length === 0) return [];

  const picks: string[] = [];
  let bag = pool.slice();

  while (picks.length < count) {
    if (bag.length === 0) bag = pool.slice();

    const weights = bag.map((key) => {
      const t = getTemplate(key);
      const waveWeight = RARITY_WEIGHT_BY_WAVE[t.rarity](wave);
      return Math.max(0.05, waveWeight);
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = rng() * total;

    for (let i = 0; i < bag.length; i += 1) {
      roll -= weights[i]!;
      if (roll <= 0) {
        picks.push(bag[i]!);
        bag.splice(i, 1);
        break;
      }
    }
  }

  return picks;
}

function enemyCount(wave: number, allyCount: number): number {
  const allies = Math.max(1, allyCount);
  if (wave === 1 && allies === 1) return 1;
  if (wave <= 2) return Math.min(3, allies <= 2 ? 2 : 3);
  return Math.min(3, 1 + Math.floor(allies / 2) + Math.floor(wave / 3));
}

export function getRunWaveSetup(
  wave: number,
  allyCount: number,
  rng: () => number = Math.random,
): RunWaveSetup {
  const allies = Math.max(1, allyCount);
  const enemyLevel = wave === 1 ? 3 : 2 + wave;
  const count = enemyCount(wave, allies);

  // Vague 1 solo — tuto capture (Ombre errante)
  if (wave === 1 && allies === 1) {
    return { enemyKeys: ["ombre_faible"], enemyLevel: 3 };
  }

  const pool = spiritPoolForWave(wave);
  const enemyKeys = pickWeightedUnique(pool, count, wave, rng);

  return { enemyKeys, enemyLevel };
}
