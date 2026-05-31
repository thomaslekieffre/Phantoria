import { TRIBE_INFO } from "./tribes";
import type { SkillTemplate, Targeting } from "./types";

function targetingLabel(t: Targeting): string {
  switch (t) {
    case "single":
      return "Mono";
    case "aoe":
      return "Zone";
    case "random":
      return "Aléatoire";
  }
}

/** Texte lisible pour une compétence (attaque ou amultime) */
export function describeSkill(skill: SkillTemplate): string {
  if (skill.description) return skill.description;

  const parts = [`${targetingLabel(skill.targeting)}`, `${Math.round(skill.power * 100)} % ATK`];
  if (skill.tribe) {
    parts.push(`bonus tribu ${TRIBE_INFO[skill.tribe].label}`);
  }
  return parts.join(" · ");
}

export function describeTargeting(t: Targeting): string {
  switch (t) {
    case "single":
      return "Une cible ennemie";
    case "aoe":
      return "Tous les ennemis visibles";
    case "random":
      return "Une cible ennemie au hasard";
  }
}
