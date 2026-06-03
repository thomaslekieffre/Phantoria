import type { CharacterTemplate } from "./types";
import raw from "../../../data/characters.json";

export const CHARACTER_CATALOG = raw.catalog as Record<string, CharacterTemplate>;
export const ENEMY_TEMPLATES = raw.enemies as Record<string, CharacterTemplate>;

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
  roche: "roche_costaud",
  halo: "halo_bienveillant",
  murmure: "murmure_sinistre",
  brise: "brise_insaisissable",
  aurore: "aurore_legende",
};
