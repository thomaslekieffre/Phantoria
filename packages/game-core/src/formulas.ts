import { CAPTURE_MAX_CHANCE, CAPTURE_MIN_CHANCE, CAPTURE_RATE_BY_RARITY, type Rarity, type Stats, type Tribe } from "./types";
import { getTypeMultiplier } from "./tribes";
import type { PhantoballType } from "./phantoballs";
import { getBallCaptureMult } from "./phantoballs";

export function levelMultiplier(level: number): number {
  return 1 + (level - 1) * 0.04;
}

export function statsAtLevel(base: Stats, level: number): Stats {
  const mult = levelMultiplier(level);
  return {
    hp: Math.floor(base.hp * mult),
    atk: Math.floor(base.atk * mult),
    def: Math.floor(base.def * mult),
    vit: base.vit,
  };
}

export function computeDamage(
  atk: number,
  def: number,
  power: number,
  attackerTribe: Parameters<typeof getTypeMultiplier>[0],
  defenderTribe: Parameters<typeof getTypeMultiplier>[1],
): number {
  const typeMult = getTypeMultiplier(attackerTribe, defenderTribe);
  return Math.max(1, Math.floor(atk * power * typeMult - def * 0.35));
}

/** Gain d'Âmes proportionnel aux dégâts (playtest v0) */
export function soulGainFromDamage(damage: number, maxHp: number): number {
  return Math.min(0.5, (damage / maxHp) * 0.35);
}

export function computeCaptureChance(
  rarity: Rarity,
  hpRatio: number,
  ball: PhantoballType = "standard",
  captureBonus = 0,
  targetTribe?: Tribe,
): number {
  const base = CAPTURE_RATE_BY_RARITY[rarity];
  /** Bonus PV bas adouci — évite 100 % dès qu'on peut lancer la ball */
  const lowHpMult = 1 + 0.55 * (1 - hpRatio);
  const ballMult = getBallCaptureMult(ball, targetTribe);
  const chance = base * ballMult * lowHpMult + captureBonus;
  return Math.min(CAPTURE_MAX_CHANCE, Math.max(CAPTURE_MIN_CHANCE, chance));
}

export function rollCapture(chance: number, rng = Math.random): boolean {
  return rng() < chance;
}
