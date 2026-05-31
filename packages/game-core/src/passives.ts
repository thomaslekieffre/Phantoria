import type { Combatant, Stats, Tribe } from "./types";

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
  roche_costaud: {
    name: "Granit vivant",
    description: "+6 DEF · −4 % capture",
    bonusDef: 6,
    captureResist: 0.04,
  },
  halo_bienveillant: {
    name: "Lueur apaisante",
    description: "Régénère 3 % PV max au début de son tour",
    turnRegenPct: 0.03,
  },
  murmure_sinistre: {
    name: "Chuchotement glaçant",
    description: "+10 % dégâts · +2 ATK",
    damageMult: 0.1,
    bonusAtk: 2,
  },
  brise_insaisissable: {
    name: "Pas du vent",
    description: "+2 VIT · +12 % dégâts",
    bonusVit: 2,
    damageMult: 0.12,
  },
  sigille_enma: {
    name: "Sceau royal",
    description: "+14 % dégâts · −10 % capture · +8 DEF",
    damageMult: 0.14,
    captureResist: 0.1,
    bonusDef: 8,
  },
};

/** Passif générique si aucune entrée explicite — couvre tout le pool vague */
export const TRIBE_DEFAULT_PASSIVES: Record<Tribe, PassiveTemplate> = {
  vaillants: {
    name: "Cœur vaillant",
    description: "+6 % dégâts · +3 DEF",
    damageMult: 0.06,
    bonusDef: 3,
  },
  mysterieux: {
    name: "Voile mystérieux",
    description: "+18 % remplissage d'âmes",
    soulGainMult: 0.18,
  },
  costauds: {
    name: "Épaule costaude",
    description: "+8 DEF · +2 ATK",
    bonusDef: 8,
    bonusAtk: 2,
  },
  mignons: {
    name: "Aura mignonne",
    description: "Régénère 2 % PV max au début de son tour",
    turnRegenPct: 0.02,
  },
  bienveillants: {
    name: "Chaleur bienveillante",
    description: "+15 % remplissage d'âmes · +1 VIT",
    soulGainMult: 0.15,
    bonusVit: 1,
  },
  sombres: {
    name: "Présence sombre",
    description: "+8 % dégâts · −6 % capture",
    damageMult: 0.08,
    captureResist: 0.06,
  },
  sinistres: {
    name: "Regard sinistre",
    description: "+10 % dégâts · −5 % capture",
    damageMult: 0.1,
    captureResist: 0.05,
  },
  insaisissables: {
    name: "Reflets fugitifs",
    description: "+3 VIT · +6 % dégâts",
    bonusVit: 3,
    damageMult: 0.06,
  },
  perfides: {
    name: "Fourberie",
    description: "+10 % dégâts · +2 ATK",
    damageMult: 0.1,
    bonusAtk: 2,
  },
  enma: {
    name: "Autorité enma",
    description: "+12 % dégâts · −8 % capture",
    damageMult: 0.12,
    captureResist: 0.08,
  },
  neants: {
    name: "Fragment du néant",
    description: "+10 % dégâts · −6 % capture",
    damageMult: 0.1,
    captureResist: 0.06,
  },
};

export function getPassive(templateKey: string, tribe?: Tribe): PassiveTemplate | undefined {
  return PASSIVE_BY_KEY[templateKey] ?? (tribe ? TRIBE_DEFAULT_PASSIVES[tribe] : undefined);
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

export function getPassiveDamageMult(templateKey: string, tribe?: Tribe): number {
  return 1 + (getPassive(templateKey, tribe)?.damageMult ?? 0);
}

export function getPassiveSoulMult(templateKey: string, tribe?: Tribe): number {
  return 1 + (getPassive(templateKey, tribe)?.soulGainMult ?? 0);
}

export function getPassiveCaptureResist(templateKey: string, tribe?: Tribe): number {
  return getPassive(templateKey, tribe)?.captureResist ?? 0;
}

export function getPassiveTurnRegenPct(templateKey: string, tribe?: Tribe): number {
  return getPassive(templateKey, tribe)?.turnRegenPct ?? 0;
}

/** Résumé court pour HUD */
export function formatPassiveLine(c: Pick<Combatant, "templateKey" | "tribe">): string | null {
  const p = getPassive(c.templateKey, c.tribe);
  if (!p) return null;
  return `${p.name} — ${p.description}`;
}
