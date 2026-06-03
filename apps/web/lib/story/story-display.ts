import { getStoryZones } from "@phantoria/game-core";

/** Libellé hub / menu : zones et niveaux réellement dans le contenu chargé. */
export function storyCampaignLabel(): string {
  const zones = getStoryZones();
  const total = zones.reduce((sum, z) => sum + z.levelCount, 0);
  const zLabel = zones.length === 1 ? "1 zone" : `${zones.length} zones`;
  return `${zLabel} · ${total} niveaux`;
}
