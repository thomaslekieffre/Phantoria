import { getTemplate, HUB_TO_CORE, type Rarity } from "@phantoria/game-core";

export function rarityForTemplateKey(templateKey: string): Rarity {
  return getTemplate(templateKey).rarity;
}

export function rarityForHubId(hubId: string): Rarity | null {
  const key = HUB_TO_CORE[hubId];
  if (!key) return null;
  return getTemplate(key).rarity;
}

export const RARITY_LABEL: Record<Rarity, string> = {
  S: "S",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  E: "E",
};
