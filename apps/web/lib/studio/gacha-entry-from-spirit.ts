import type { SpiritTemplateRow } from "@/app/api/studio/spirits/route";
import { entryByHubId } from "@/lib/player/gacha-pool";
import { defaultHueForTribe, tribeDisplayLabel } from "@/lib/studio/spirit-display";

export type GachaEntryDraft = {
  pool_id: string;
  hub_id: string;
  template_key: string;
  name: string;
  tribe: string;
  hue: string;
  rarity: string;
  sort_order: number;
};

/** Construit une entrée pool gacha depuis un esprit catalogue Studio. */
export function gachaEntryFromSpirit(
  spirit: SpiritTemplateRow,
  poolId: string,
  sortOrder: number,
): GachaEntryDraft | null {
  const hubId = spirit.hub_id?.trim();
  if (!hubId) return null;

  const fromPool = entryByHubId(hubId);
  const tribeLabel = tribeDisplayLabel(spirit.tribe);

  return {
    pool_id: poolId,
    hub_id: hubId,
    template_key: spirit.template_key,
    name: spirit.name,
    tribe: fromPool?.tribe ?? tribeLabel,
    hue: fromPool?.hue ?? defaultHueForTribe(spirit.tribe),
    rarity: spirit.rarity,
    sort_order: sortOrder,
  };
}
