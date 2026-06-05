import type { SpiritTemplateRow } from "@/app/api/studio/spirits/route";
import { entryByHubId } from "@/lib/player/gacha-pool";
import type { GachaEntryDraft } from "@/lib/studio/gacha-entry-from-spirit";
import { defaultHueForTribe, tribeDisplayLabel } from "@/lib/studio/spirit-display";

export type GachaCatalogPick = {
  template_key: string;
  hub_id: string;
  name: string;
  tribe: string;
  rarity: string;
};

/** Catalogue Studio — spirit_templates DB uniquement. */
export function mergeGachaCatalog(spirits: SpiritTemplateRow[]): GachaCatalogPick[] {
  const picks: GachaCatalogPick[] = [];

  for (const s of spirits) {
    if (s.kind !== "catalog" || !s.active || !s.hub_id?.trim()) continue;
    picks.push({
      template_key: s.template_key,
      hub_id: s.hub_id,
      name: s.name,
      tribe: tribeDisplayLabel(s.tribe),
      rarity: s.rarity,
    });
  }

  return picks.sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

export function gachaEntryFromCatalogPick(
  pick: GachaCatalogPick,
  poolId: string,
  sortOrder: number,
): GachaEntryDraft {
  const fromPool = entryByHubId(pick.hub_id);
  return {
    pool_id: poolId,
    hub_id: pick.hub_id,
    template_key: pick.template_key,
    name: pick.name,
    tribe: fromPool?.tribe ?? pick.tribe,
    hue: fromPool?.hue ?? defaultHueForTribe(pick.tribe),
    rarity: pick.rarity,
    sort_order: sortOrder,
  };
}
