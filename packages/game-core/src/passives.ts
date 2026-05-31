import type { Combatant, Stats } from "./types";

/** Passif d'esprit / ennemi — affiché + appliqué en combat */
export interface PassiveTemplate {
  name: string;
  description: string;
  /** +% dégâts infligés (0.08 = +8 %) */
  damageMult?: number;
  /** +% remplissage jauge d'âmes */
  soulGainMult?: number;
  /** −% chance de capture (ennemis) */
  captureResist?: number;
  /** % PV max soignés au début du tour */
  turnRegenPct?: number;
  bonusAtk?: number;
  bonusDef?: number;
  bonusVit?: number;
  bonusHp?: number;
}

export const PASSIVE_BY_KEY: Record<string, PassiveTemplate> = {
  bram_vaillant: {
    name: "Carapace vaillante",
    description: "+8 % dégâts · +5 DEF",
    damageMult: 0.08,
    bonusDef: 5,
  },
  nyx_mysterieux: {
    name: "Brume intérieure",
    description: "+25 % remplissage d'âmes · +1 VIT",
    soulGainMult: 0.25,
    bonusVit: 1,
  },
  luma_mignon: {
    name: "Douceur réconfortante",
    description: "Régénère 4 % PV max au début de son tour",
    turnRegenPct: 0.04,
  },
  kiro_perfide: {
    name: "Lame perfide",
    description: "+12 % dégâts · +3 ATK",
    damageMult: 0.12,
    bonusAtk: 3,
  },
  ombre_faible: {
    name: "Ombre fugace",
    description: "−8 % chance de capture · +1 VIT",
    captureResist: 0.08,
    bonusVit: 1,
  },
  neant_scout: {
    name: "Éclat corrompu",
    description: "+10 % dégâts · −5 % capture",
    damageMult: 0.1,
    captureResist: 0.05,
  },
  boss_gardien: {
    name: "Brume gardienne",
    description: "+15 % dégâts · −12 % capture · +20 DEF",
    damageMult: 0.15,
    captureResist: 0.12,
    bonusDef: 20,
  },
  boss_colosse: {
    name: "Peau du néant",
    description: "+20 % dégâts · −15 % capture · régén. 3 % PV/tour",
    damageMult: 0.2,
    captureResist: 0.15,
    turnRegenPct: 0.03,
  },
  boss_solmaar: {
    name: "Corruption solaire",
    description: "+25 % dégâts · −20 % capture · +30 ATK",
    damageMult: 0.25,
    captureResist: 0.2,
    bonusAtk: 30,
  },
};

export function getPassive(templateKey: string): PassiveTemplate | undefined {
  return PASSIVE_BY_KEY[templateKey];
}

export function applyPassiveToStats(stats: Stats, passive?: PassiveTemplate): Stats {
  if (!passive) return stats;
  return {
    hp: stats.hp + (passive.bonusHp ?? 0),
    atk: stats.atk + (passive.bonusAtk ?? 0),
    def: stats.def + (passive.bonusDef ?? 0),
    vit: stats.vit + (passive.bonusVit ?? 0),
  };
}

export function getPassiveDamageMult(templateKey: string): number {
  return 1 + (getPassive(templateKey)?.damageMult ?? 0);
}

export function getPassiveSoulMult(templateKey: string): number {
  return 1 + (getPassive(templateKey)?.soulGainMult ?? 0);
}

export function getPassiveCaptureResist(templateKey: string): number {
  return getPassive(templateKey)?.captureResist ?? 0;
}

export function getPassiveTurnRegenPct(templateKey: string): number {
  return getPassive(templateKey)?.turnRegenPct ?? 0;
}

/** Résumé court pour HUD */
export function formatPassiveLine(c: Pick<Combatant, "templateKey">): string | null {
  const p = getPassive(c.templateKey);
  if (!p) return null;
  return `${p.name} — ${p.description}`;
}
