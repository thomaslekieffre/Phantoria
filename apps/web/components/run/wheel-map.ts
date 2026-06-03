import { getHubToCore } from "@phantoria/game-core";
import { entryByHubId } from "@/lib/player/gacha-pool";
import { getDisplayPoolEntries, getSpiritMeta } from "@/lib/player/spirit-catalog";

/** Teintes pour templates hors pools gacha (ennemis run, etc.). */
const ENEMY_TEMPLATE_HUES: Record<string, string> = {
  ombre_faible: "#6366f1",
  neant_scout: "#14b8a6",
};

/** hub_id → template_key game-core (DB, gacha, ou défaut HUB_TO_CORE). */
export function hubIdToTemplateKey(hubId: string): string | undefined {
  const fromHub = getHubToCore()[hubId];
  if (fromHub) return fromHub;
  const meta = getSpiritMeta(hubId);
  if (meta?.templateKey) return meta.templateKey;
  const entry = entryByHubId(hubId);
  if (entry?.templateKey) return entry.templateKey;
  return undefined;
}

export function getCoreToHub(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(getHubToCore()).map(([hub, core]) => [core, hub]),
  );
}

export function hubIdForTemplateKey(templateKey: string): string | undefined {
  return getCoreToHub()[templateKey];
}

export function hueForTemplateKey(templateKey: string): string {
  const hub = hubIdForTemplateKey(templateKey);
  if (hub) return getSpiritMeta(hub)?.hue ?? ENEMY_TEMPLATE_HUES[templateKey] ?? "#6366f1";
  for (const e of getDisplayPoolEntries()) {
    if (e.templateKey === templateKey) return e.hue;
  }
  return ENEMY_TEMPLATE_HUES[templateKey] ?? "#6366f1";
}
