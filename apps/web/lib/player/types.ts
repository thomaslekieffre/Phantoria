import type { Rarity } from "@phantoria/game-core";
import type { SpiritId } from "@/components/hub/roster";
import { entryByHubId, STANDARD_GACHA_POOL, WELCOME_GACHA_POOL } from "./gacha-pool";

export type SpiritMeta = {
  hubId: SpiritId;
  templateKey: string;
  name: string;
  tribe: string;
  hue: string;
  rarity: Rarity;
};

export const SPIRIT_CATALOG: Record<SpiritId, SpiritMeta> = Object.fromEntries(
  STANDARD_GACHA_POOL.map((e) => [
    e.hubId,
    {
      hubId: e.hubId,
      templateKey: e.templateKey,
      name: e.name,
      tribe: e.tribe,
      hue: e.hue,
      rarity: e.rarity,
    },
  ]),
) as Record<SpiritId, SpiritMeta>;

export { WELCOME_GACHA_POOL, STANDARD_GACHA_POOL, entryByHubId };

export type DbProfile = {
  id: string;
  display_name: string;
  level: number;
  welcome_pulls_remaining: number;
  gacha_pity_standard: number;
};

export type DbCurrencies = {
  gold: number;
  gems: number;
  tickets: number;
};

export type DbPlayerSpirit = {
  id: string;
  hub_id: string;
  template_key: string;
  level: number;
  xp: number;
  hp_pct: number;
};

/** Progression histoire (DB), pas les niveaux éphémères du run roguelite. */
export type OwnedSpiritStats = {
  level: number;
  xp: number;
  hpPct: number;
};

export type DbRosterSlot = {
  slot_index: number;
  spirit_id: string | null;
  on_field: boolean;
  spirit?: DbPlayerSpirit | null;
};
