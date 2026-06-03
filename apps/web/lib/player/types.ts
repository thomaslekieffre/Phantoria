export type { SpiritMeta } from "./spirit-catalog";
export { getSpiritMeta, getSpiritCatalog, getDisplayPoolEntries } from "./spirit-catalog";
export { WELCOME_GACHA_POOL, STANDARD_GACHA_POOL, entryByHubId } from "./gacha-pool";

export type DbProfile = {
  id: string;
  display_name: string;
  level: number;
  runs_completed: number;
  welcome_pulls_remaining: number;
  gacha_pity_standard: number;
  is_admin?: boolean;
  created_at?: string;
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
