import type { Rarity } from "@phantoria/game-core";
import { getHubToCore } from "@phantoria/game-core";
import {
  STANDARD_GACHA_POOL,
  WELCOME_GACHA_POOL,
  getGachaPool,
  listExtraGachaPoolIds,
  type GachaPoolEntry,
} from "./gacha-pool";

export type SpiritMeta = {
  hubId: string;
  templateKey: string;
  name: string;
  tribe: string;
  hue: string;
  rarity: Rarity;
  portraitUrl?: string;
};

let catalog: Record<string, SpiritMeta> = {};
let portraitByHub: Record<string, string> = {};
let contentVersion = 0;

export function setSpiritPortraitUrls(urls: Record<string, string | null | undefined>): void {
  portraitByHub = {};
  for (const [hubId, url] of Object.entries(urls)) {
    const trimmed = url?.trim();
    if (trimmed) portraitByHub[hubId] = trimmed;
  }
}

export function getSpiritPortraitUrl(hubId: string): string | undefined {
  return catalog[hubId]?.portraitUrl ?? portraitByHub[hubId];
}

function entryToMeta(e: GachaPoolEntry): SpiritMeta {
  return {
    hubId: e.hubId,
    templateKey: e.templateKey,
    name: e.name,
    tribe: e.tribe,
    hue: e.hue,
    rarity: e.rarity,
    portraitUrl: portraitByHub[e.hubId],
  };
}

function collectPoolEntries(): GachaPoolEntry[] {
  const seen = new Set<string>();
  const out: GachaPoolEntry[] = [];
  const add = (pool: GachaPoolEntry[]) => {
    for (const e of pool) {
      if (seen.has(e.hubId)) continue;
      seen.add(e.hubId);
      out.push(e);
    }
  };
  add(WELCOME_GACHA_POOL);
  add(STANDARD_GACHA_POOL);
  for (const poolId of listExtraGachaPoolIds()) {
    const pool = getGachaPool(poolId);
    if (pool) add(pool);
  }
  return out;
}

export function rebuildSpiritCatalog(): void {
  const next: Record<string, SpiritMeta> = {};
  for (const e of collectPoolEntries()) {
    next[e.hubId] = entryToMeta(e);
  }
  catalog = next;
  contentVersion += 1;
}

export function getSpiritCatalogVersion(): number {
  return contentVersion;
}

export function getSpiritMeta(hubId: string): SpiritMeta | undefined {
  return catalog[hubId];
}

export function getSpiritCatalog(): Readonly<Record<string, SpiritMeta>> {
  return catalog;
}

export function getDisplayPoolEntries(): GachaPoolEntry[] {
  return collectPoolEntries();
}

export function isKnownHubId(hubId: string): boolean {
  return hubId in getHubToCore() || hubId in catalog;
}
