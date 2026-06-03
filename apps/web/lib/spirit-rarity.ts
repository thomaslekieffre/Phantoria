import { getHubToCore, getTemplate, type Rarity } from "@phantoria/game-core";
import { entryByHubId } from "@/lib/player/gacha-pool";

export function rarityForTemplateKey(templateKey: string): Rarity {
  return getTemplate(templateKey).rarity;
}

export function rarityForHubId(hubId: string): Rarity | null {
  const fromPool = entryByHubId(hubId);
  if (fromPool) return fromPool.rarity;
  const key = getHubToCore()[hubId];
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
