import type { CharacterTemplate } from "./types";

export const CHARACTER_CATALOG: Record<string, CharacterTemplate> = {
  bram_vaillant: {
    key: "bram_vaillant",
    name: "Bram",
    tribe: "vaillants",
    rarity: "E",
    base: { hp: 120, atk: 18, def: 14, vit: 8 },
    skills: {
      basic: { id: "bram_basic", name: "Coup d'épée", power: 1, targeting: "single" },
      special1: {
        id: "bram_s1",
        name: "Charge vaillante",
        power: 1.6,
        targeting: "single",
        tribe: "vaillants",
      },
      special2: {
        id: "bram_s2",
        name: "Mur de boucliers",
        power: 0.8,
        targeting: "aoe",
      },
    },
  },
  nyx_mysterieux: {
    key: "nyx_mysterieux",
    name: "Nyx",
    tribe: "mysterieux",
    rarity: "C",
    base: { hp: 80, atk: 22, def: 8, vit: 14 },
    skills: {
      basic: { id: "nyx_basic", name: "Éclat brumeux", power: 1, targeting: "single" },
      special1: {
        id: "nyx_s1",
        name: "Mirage",
        power: 1.4,
        targeting: "random",
      },
      special2: {
        id: "nyx_s2",
        name: "Énigme",
        power: 1.2,
        targeting: "aoe",
        tribe: "mysterieux",
      },
    },
  },
  luma_mignon: {
    key: "luma_mignon",
    name: "Luma",
    tribe: "mignons",
    rarity: "B",
    base: { hp: 95, atk: 16, def: 10, vit: 10 },
    skills: {
      basic: { id: "luma_basic", name: "Pétale", power: 1, targeting: "single" },
      special1: {
        id: "luma_s1",
        name: "Douceur",
        power: 1.3,
        targeting: "single",
      },
      special2: {
        id: "luma_s2",
        name: "Bourrasque rose",
        power: 1.1,
        targeting: "aoe",
        tribe: "mignons",
      },
    },
  },
  kiro_perfide: {
    key: "kiro_perfide",
    name: "Kiro",
    tribe: "perfides",
    rarity: "D",
    base: { hp: 88, atk: 20, def: 9, vit: 12 },
    skills: {
      basic: { id: "kiro_basic", name: "Crochet", power: 1, targeting: "single" },
      special1: {
        id: "kiro_s1",
        name: "Embuscade",
        power: 1.5,
        targeting: "single",
      },
      special2: {
        id: "kiro_s2",
        name: "Nuée venimeuse",
        power: 1,
        targeting: "aoe",
        tribe: "perfides",
      },
    },
  },
};

export const ENEMY_TEMPLATES: Record<string, CharacterTemplate> = {
  ombre_faible: {
    key: "ombre_faible",
    name: "Ombre errante",
    tribe: "sombres",
    rarity: "E",
    base: { hp: 70, atk: 14, def: 6, vit: 9 },
    skills: {
      basic: { id: "ombre_basic", name: "Griffure", power: 1, targeting: "single" },
      special1: { id: "ombre_s1", name: "Voile", power: 1.2, targeting: "single" },
      special2: { id: "ombre_s2", name: "Ténèbres", power: 0.9, targeting: "aoe" },
    },
  },
  neant_scout: {
    key: "neant_scout",
    name: "Éclaireur néant",
    tribe: "neants",
    rarity: "D",
    base: { hp: 90, atk: 18, def: 8, vit: 11 },
    skills: {
      basic: { id: "neant_basic", name: "Corruption", power: 1, targeting: "single" },
      special1: { id: "neant_s1", name: "Faille", power: 1.3, targeting: "single" },
      special2: { id: "neant_s2", name: "Vortex", power: 1, targeting: "aoe", tribe: "neants" },
    },
  },
  boss_gardien: {
    key: "boss_gardien",
    name: "Gardien des brumes",
    tribe: "sombres",
    rarity: "B",
    base: { hp: 200, atk: 32, def: 20, vit: 10 },
    skills: {
      basic: { id: "gardien_basic", name: "Lame d'ombre", power: 1.1, targeting: "single" },
      special1: { id: "gardien_s1", name: "Mur de brume", power: 1.4, targeting: "single", tribe: "sombres" },
      special2: { id: "gardien_s2", name: "Éclipse", power: 1.05, targeting: "aoe", tribe: "sombres" },
    },
  },
  boss_colosse: {
    key: "boss_colosse",
    name: "Colosse du néant",
    tribe: "neants",
    rarity: "A",
    base: { hp: 340, atk: 42, def: 28, vit: 9 },
    skills: {
      basic: { id: "colosse_basic", name: "Poing du vide", power: 1.15, targeting: "single" },
      special1: { id: "colosse_s1", name: "Fracture", power: 1.55, targeting: "single", tribe: "neants" },
      special2: { id: "colosse_s2", name: "Cataclysme", power: 1.1, targeting: "aoe", tribe: "neants" },
    },
  },
  boss_solmaar: {
    key: "boss_solmaar",
    name: "Solmaar corrompu",
    tribe: "neants",
    rarity: "S",
    base: { hp: 520, atk: 48, def: 34, vit: 12 },
    skills: {
      basic: { id: "solmaar_basic", name: "Verdict ancien", power: 1.2, targeting: "single" },
      special1: { id: "solmaar_s1", name: "Corruption solaire", power: 1.7, targeting: "single", tribe: "neants" },
      special2: { id: "solmaar_s2", name: "Néant final", power: 1.25, targeting: "aoe", tribe: "neants" },
    },
  },
};

export function getTemplate(key: string): CharacterTemplate {
  const t = CHARACTER_CATALOG[key] ?? ENEMY_TEMPLATES[key];
  if (!t) throw new Error(`Personnage inconnu : ${key}`);
  return t;
}

/** Tous les esprits du run — alliés capturables + errants */
export const ALL_SPIRIT_KEYS = [
  ...Object.keys(CHARACTER_CATALOG),
  ...Object.keys(ENEMY_TEMPLATES),
] as const;

export type SpiritTemplateKey = (typeof ALL_SPIRIT_KEYS)[number];

export function isSpiritKey(key: string): key is SpiritTemplateKey {
  return (ALL_SPIRIT_KEYS as readonly string[]).includes(key);
}

/** Clés hub → game-core */
export const HUB_TO_CORE: Record<string, string> = {
  bram: "bram_vaillant",
  nyx: "nyx_mysterieux",
  luma: "luma_mignon",
  kiro: "kiro_perfide",
};
