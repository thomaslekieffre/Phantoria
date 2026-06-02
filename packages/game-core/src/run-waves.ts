/** Composition des vagues roguelite — esprits tirés au sort, bosses par palier */

import { ALL_SPIRIT_KEYS, getTemplate } from "./characters";
import type { Rarity } from "./types";

export const RUN_MAX_WAVES = 200;

export type RunWaveKind = "normal" | "boss" | "mega_boss" | "final_boss";

export type RunWaveSetup = {
  kind: RunWaveKind;
  label: string;
  enemyKeys: string[];
  enemyLevel: number;
  /** Multiplicateur stats par ennemi (défaut 1) */
  enemyStatMults: number[];
};

const FINAL_BOSS_KEY = "boss_solmaar";
/** Templates boss dédiés — exclus du pool sauf boss final (lore) */
const LEGACY_BOSS_KEYS = new Set(["boss_gardien", "boss_colosse", FINAL_BOSS_KEY]);

const RARITY_ORDER: Record<Rarity, number> = {
  E: 0,
  D: 1,
  C: 2,
  B: 3,
  A: 4,
  S: 5,
};

const RARITY_WEIGHT_BY_WAVE: Record<Rarity, (wave: number) => number> = {
  E: () => 1,
  D: (w) => (w >= 2 ? 1 : 0),
  C: (w) => (w >= 3 ? 1 : 0),
  B: (w) => (w >= 5 ? 0.6 : 0),
  A: (w) => (w >= 8 ? 0.35 : 0),
  S: (w) => (w >= 12 ? 0.15 : 0),
};

export function getRunWaveKind(wave: number): RunWaveKind {
  if (wave === RUN_MAX_WAVES) return "final_boss";
  if (wave > 0 && wave % 50 === 0) return "mega_boss";
  if (wave > 0 && wave % 10 === 0) return "boss";
  return "normal";
}

export function getRunWaveKindLabel(kind: RunWaveKind): string {
  switch (kind) {
    case "boss":
      return "Boss";
    case "mega_boss":
      return "Méga boss";
    case "final_boss":
      return "Boss final";
    default:
      return "Vague";
  }
}

function spiritPoolForWave(wave: number): string[] {
  return ALL_SPIRIT_KEYS.filter((key) => {
    if (LEGACY_BOSS_KEYS.has(key)) return false;
    const rarity = getTemplate(key).rarity;
    return RARITY_WEIGHT_BY_WAVE[rarity](wave) > 0;
  });
}

function bossPoolForWave(wave: number, kind: RunWaveKind): string[] {
  const minOrder = kind === "mega_boss" ? RARITY_ORDER.A : RARITY_ORDER.B;
  return spiritPoolForWave(wave).filter((key) => RARITY_ORDER[getTemplate(key).rarity] >= minOrder);
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

function pickBossSpirit(wave: number, kind: RunWaveKind, rng: () => number): string {
  const pool = bossPoolForWave(wave, kind);
  if (pool.length === 0) {
    const fallback = spiritPoolForWave(wave);
    return pickWeightedUnique(fallback, 1, wave, rng)[0] ?? "ombre_faible";
  }
  return pickWeightedUnique(pool, 1, wave, rng)[0]!;
}

function enemyLevelForWave(wave: number): number {
  return wave === 1 ? 3 : 2 + wave;
}

function enemyCount(wave: number, allyCount: number): number {
  const allies = Math.max(1, allyCount);
  if (wave === 1 && allies === 1) return 1;
  if (wave <= 2) return Math.min(3, allies <= 2 ? 2 : 3);
  return Math.min(3, 1 + Math.floor(allies / 2) + Math.floor(wave / 3));
}

function pickMinions(wave: number, count: number, rng: () => number): string[] {
  const pool = spiritPoolForWave(wave);
  if (pool.length === 0 || count <= 0) return [];
  return pickWeightedUnique(pool, count, wave, rng);
}

function setupFromKeys(
  kind: RunWaveKind,
  wave: number,
  keys: string[],
  level: number,
  mults: number[],
): RunWaveSetup {
  return {
    kind,
    label: getRunWaveKindLabel(kind),
    enemyKeys: keys,
    enemyLevel: level,
    enemyStatMults: mults,
  };
}

export function getRunWaveSetup(
  wave: number,
  allyCount: number,
  rng: () => number = Math.random,
): RunWaveSetup {
  const allies = Math.max(1, allyCount);
  const level = enemyLevelForWave(wave);
  const kind = getRunWaveKind(wave);

  // Vague 1 solo — tuto capture (Ombre errante)
  if (wave === 1 && allies === 1) {
    return setupFromKeys("normal", wave, ["ombre_faible"], 3, [1]);
  }

  if (kind === "final_boss") {
    const adds = pickMinions(wave, 2, rng);
    const keys = [FINAL_BOSS_KEY, ...adds];
    return setupFromKeys(kind, wave, keys, level + 5, [1.5, ...adds.map(() => 1.15)]);
  }

  if (kind === "mega_boss") {
    const bossKey = pickBossSpirit(wave, kind, rng);
    const adds = pickMinions(wave, 2, rng);
    const keys = [bossKey, ...adds];
    return setupFromKeys(kind, wave, keys, level + 3, [1.35, ...adds.map(() => 1)]);
  }

  if (kind === "boss") {
    const bossKey = pickBossSpirit(wave, kind, rng);
    const addCount = wave >= 60 ? 2 : 1;
    const adds = pickMinions(wave, addCount, rng);
    const keys = [bossKey, ...adds];
    return setupFromKeys(kind, wave, keys, level + 1, [1.25, ...adds.map(() => 1)]);
  }

  const pool = spiritPoolForWave(wave);
  const count = enemyCount(wave, allies);
  const keys = pickWeightedUnique(pool, count, wave, rng);
  return setupFromKeys("normal", wave, keys, level, keys.map(() => 1));
}
