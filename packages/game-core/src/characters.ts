import type { CharacterTemplate } from "./types";
import raw from "../../../data/characters.json";

export const CHARACTER_CATALOG = raw.catalog as Record<string, CharacterTemplate>;
export const ENEMY_TEMPLATES = raw.enemies as Record<string, CharacterTemplate>;

let catalogOverride: Record<string, CharacterTemplate> | null = null;
let enemyOverride: Record<string, CharacterTemplate> | null = null;
let hubToCoreOverride: Record<string, string> | null = null;

function activeCatalog(): Record<string, CharacterTemplate> {
  return catalogOverride ?? CHARACTER_CATALOG;
}

function activeEnemies(): Record<string, CharacterTemplate> {
  return enemyOverride ?? ENEMY_TEMPLATES;
}

export function setCharacterCatalog(
  catalog: Record<string, CharacterTemplate>,
  enemies: Record<string, CharacterTemplate>,
  hubToCore?: Record<string, string>,
): void {
  catalogOverride = catalog;
  enemyOverride = enemies;
  hubToCoreOverride = hubToCore ?? null;
}

export function resetCharacterCatalog(): void {
  catalogOverride = null;
  enemyOverride = null;
  hubToCoreOverride = null;
}

export function getTemplate(key: string): CharacterTemplate {
  const t = activeCatalog()[key] ?? activeEnemies()[key];
  if (!t) throw new Error(`Personnage inconnu : ${key}`);
  return t;
}

/** Tous les esprits du run — alliés capturables + errants */
export function allSpiritKeys(): string[] {
  return [...Object.keys(activeCatalog()), ...Object.keys(activeEnemies())];
}

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

export function getHubToCore(): Record<string, string> {
  return hubToCoreOverride ?? HUB_TO_CORE;
}
