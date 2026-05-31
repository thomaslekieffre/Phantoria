import { TRIBES, type Tribe } from "./types";

export const TRIBE_INFO: Record<Tribe, { label: string; emoji: string }> = {
  vaillants: { label: "Vaillants", emoji: "⚔️" },
  mysterieux: { label: "Mystérieux", emoji: "🔮" },
  costauds: { label: "Costauds", emoji: "💪" },
  mignons: { label: "Mignons", emoji: "🌸" },
  bienveillants: { label: "Bienveillants", emoji: "💚" },
  sombres: { label: "Sombres", emoji: "🌑" },
  sinistres: { label: "Sinistres", emoji: "💀" },
  insaisissables: { label: "Insaisissables", emoji: "💨" },
  perfides: { label: "Perfides", emoji: "🐍" },
  enma: { label: "Enma", emoji: "👑" },
  neants: { label: "Néants", emoji: "❓" },
};

/** Ligne = attaque, colonne = défense. Absent = ×1 */
const WEAKNESS: Partial<Record<Tribe, Partial<Record<Tribe, number>>>> = {
  vaillants: { mysterieux: 0.5, costauds: 0.5, sombres: 2, sinistres: 2 },
  mysterieux: { vaillants: 2, mignons: 2, sombres: 0.5, sinistres: 0.5 },
  costauds: { vaillants: 2, insaisissables: 2, perfides: 0.5, enma: 0.5 },
  mignons: { mysterieux: 0.5, costauds: 2, bienveillants: 2, enma: 0.5 },
  bienveillants: { mignons: 2, sinistres: 2, perfides: 0.5, neants: 0.5 },
  sombres: { vaillants: 2, mignons: 0.5, insaisissables: 2, enma: 0.5 },
  sinistres: { vaillants: 0.5, costauds: 2, bienveillants: 2, neants: 0.5 },
  insaisissables: { mysterieux: 2, costauds: 0.5, sombres: 2, neants: 0.5 },
  perfides: { vaillants: 0.5, mignons: 2, sinistres: 2, insaisissables: 0.5 },
  enma: { bienveillants: 2, insaisissables: 2, neants: 2 },
  neants: { mysterieux: 2, bienveillants: 2, insaisissables: 2, perfides: 0 },
};

export function getTypeMultiplier(attacker: Tribe, defender: Tribe): number {
  if (attacker === defender) return 1;
  return WEAKNESS[attacker]?.[defender] ?? 1;
}

export type TribeMatchups = {
  strong: Tribe[];
  weak: Tribe[];
  immune: Tribe[];
};

/** Tribus dont les attaques sont fortes / faibles / nulles contre `defender` */
export function getMatchupsVs(defender: Tribe): TribeMatchups {
  const strong: Tribe[] = [];
  const weak: Tribe[] = [];
  const immune: Tribe[] = [];

  for (const attacker of TRIBES) {
    const mult = getTypeMultiplier(attacker, defender);
    if (mult >= 2) strong.push(attacker);
    else if (mult <= 0) immune.push(attacker);
    else if (mult <= 0.5) weak.push(attacker);
  }

  return { strong, weak, immune };
}

export function formatMatchupMultiplier(mult: number): string {
  if (mult >= 2) return "×2";
  if (mult <= 0) return "×0";
  if (mult <= 0.5) return "×½";
  return "×1";
}
