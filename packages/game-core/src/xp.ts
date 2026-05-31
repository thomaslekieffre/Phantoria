import { statsAtLevel } from "./formulas";
import { applyPassiveToStats, getPassive } from "./passives";
import { getTemplate } from "./characters";
import type { Combatant, Rarity } from "./types";
import { MAX_LEVEL_BY_RARITY } from "./types";

const RARITY_XP_MULT: Record<Rarity, number> = {
  E: 1,
  D: 1.12,
  C: 1.28,
  B: 1.45,
  A: 1.7,
  S: 2,
};

/** XP requis pour passer au niveau suivant */
export function xpToNextLevel(level: number, rarity: Rarity): number {
  const cap = MAX_LEVEL_BY_RARITY[rarity];
  if (level >= cap) return 0;
  const tier = RARITY_XP_MULT[rarity];
  return Math.floor(16 + level * 9 * tier);
}

/** XP gagnée quand un ennemi est mis KO */
export function xpFromDefeated(
  defeated: Pick<Combatant, "level" | "rarity">,
  wave: number,
): number {
  const base = (10 + defeated.level * 5) * RARITY_XP_MULT[defeated.rarity];
  return Math.max(1, Math.floor(base * (1 + wave * 0.012)));
}

export type LevelUpResult = { leveled: boolean; newLevel: number; levelsGained: number };

/** Ajoute de l'XP et monte de niveau si besoin (run uniquement) */
export function grantXp(combatant: Combatant, amount: number): LevelUpResult {
  const cap = MAX_LEVEL_BY_RARITY[combatant.rarity];
  if (combatant.level >= cap || amount <= 0) {
    return { leveled: false, newLevel: combatant.level, levelsGained: 0 };
  }

  combatant.xp += amount;
  let levelsGained = 0;
  const hpRatio = combatant.maxHp > 0 ? combatant.hp / combatant.maxHp : 1;

  while (combatant.level < cap) {
    const need = xpToNextLevel(combatant.level, combatant.rarity);
    if (need <= 0 || combatant.xp < need) break;
    combatant.xp -= need;
    combatant.level += 1;
    levelsGained += 1;
    refreshStatsForLevel(combatant, hpRatio);
  }

  return {
    leveled: levelsGained > 0,
    newLevel: combatant.level,
    levelsGained,
  };
}

/** Recalcule les stats au niveau actuel (conserve le ratio PV) */
export function refreshStatsForLevel(combatant: Combatant, hpRatio = combatant.maxHp > 0 ? combatant.hp / combatant.maxHp : 1): void {
  const template = getTemplate(combatant.templateKey);
  let stats = statsAtLevel(template.base, combatant.level);
  stats = applyPassiveToStats(stats, getPassive(combatant.templateKey));
  combatant.maxHp = stats.hp;
  combatant.hp = Math.max(1, Math.min(combatant.maxHp, Math.floor(combatant.maxHp * hpRatio)));
  combatant.atk = stats.atk;
  combatant.def = stats.def;
  combatant.vit = stats.vit;
}

/** Donne de l'XP à tous les alliés vivants sur la roue */
export function grantXpToAllies(allies: Combatant[], amount: number): LevelUpResult[] {
  return allies
    .filter((a) => a.side === "ally" && !a.ko)
    .map((a) => grantXp(a, amount));
}
