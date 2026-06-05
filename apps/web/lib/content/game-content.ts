import type { SupabaseClient } from "@supabase/supabase-js";
import {
  setCharacterCatalog,
  setRunRewardPool,
  setStoryContent,
  type CharacterTemplate,
  type RunRewardDef,
  type StoryLevelDef,
  type StoryZoneDef,
} from "@phantoria/game-core";
import {
  applyGachaPools,
  clearExtraGachaPools,
  registerGachaPool,
  setGachaPoolMeta,
  STANDARD_MULTI_PULL_COUNT_DEFAULT,
  STANDARD_PULL_GEM_COST_DEFAULT,
  STANDARD_PULL_TICKET_COST_DEFAULT,
  type GachaPoolEntry,
} from "@/lib/player/gacha-pool";
import { rebuildSpiritCatalog, setSpiritPortraitUrls } from "@/lib/player/spirit-catalog";

export type GameContentSnapshot = {
  spirits: { catalog: Record<string, CharacterTemplate>; enemies: Record<string, CharacterTemplate>; hubToCore: Record<string, string> };
  gacha: {
    welcome: GachaPoolEntry[];
    standard: GachaPoolEntry[];
    extraPools: Record<string, GachaPoolEntry[]>;
    ticketCost: number;
    gemCost: number;
    multiCount: number;
    poolMeta: Record<string, { bannerUrl?: string | null }>;
  };
  story: { zones: StoryZoneDef[]; levels: StoryLevelDef[] };
  runRewards: RunRewardDef[];
  spiritPortraits: Record<string, string>;
  source: "db" | "empty";
};

/** État vide — aucun fallback code au runtime. */
export function emptyGameContent(): GameContentSnapshot {
  return {
    spirits: { catalog: {}, enemies: {}, hubToCore: {} },
    gacha: {
      welcome: [],
      standard: [],
      extraPools: {},
      ticketCost: STANDARD_PULL_TICKET_COST_DEFAULT,
      gemCost: STANDARD_PULL_GEM_COST_DEFAULT,
      multiCount: STANDARD_MULTI_PULL_COUNT_DEFAULT,
      poolMeta: {},
    },
    story: { zones: [], levels: [] },
    runRewards: [],
    spiritPortraits: {},
    source: "empty",
  };
}

export function applyGameContent(content: GameContentSnapshot): void {
  setCharacterCatalog(content.spirits.catalog, content.spirits.enemies, content.spirits.hubToCore);
  applyGachaPools(content.gacha.welcome, content.gacha.standard, {
    ticketCost: content.gacha.ticketCost,
    gemCost: content.gacha.gemCost,
    multiCount: content.gacha.multiCount,
  });
  clearExtraGachaPools();
  for (const [poolId, entries] of Object.entries(content.gacha.extraPools)) {
    registerGachaPool(poolId, entries);
  }
  for (const [poolId, meta] of Object.entries(content.gacha.poolMeta)) {
    setGachaPoolMeta(poolId, meta);
  }
  setStoryContent(content.story.zones, content.story.levels);
  setRunRewardPool(content.runRewards);
  setSpiritPortraitUrls(content.spiritPortraits);
  rebuildSpiritCatalog();
}

type SpiritRow = {
  template_key: string;
  kind: "catalog" | "enemy";
  hub_id: string | null;
  portrait_url?: string | null;
  name: string;
  tribe: string;
  rarity: string;
  payload: CharacterTemplate;
  active: boolean;
};

type GachaPoolRow = {
  id: string;
  ticket_cost: number;
  gem_cost: number;
  multi_count: number;
  active: boolean;
  banner_url?: string | null;
};
type GachaEntryRow = {
  pool_id: string;
  hub_id: string;
  template_key: string;
  name: string;
  tribe: string;
  hue: string;
  rarity: string;
  sort_order: number;
  weight?: number;
};
type StoryZoneRow = { id: number; name: string; emoji: string; tribe: string; level_count: number; sort_order: number };
type StoryLevelRow = {
  id: string;
  zone_id: number;
  level_index: number;
  title: string;
  intro: string;
  outro: string;
  enemies: StoryLevelDef["enemies"];
  stars_round3: number;
  active: boolean;
};
type RunRewardRow = { id: string; payload: RunRewardDef; sort_order: number; active: boolean };

export async function fetchGameContent(supabase: SupabaseClient): Promise<GameContentSnapshot> {
  const [spiritsRes, poolsRes, entriesRes, zonesRes, levelsRes, rewardsRes] = await Promise.all([
    supabase.from("spirit_templates").select("*").eq("active", true).order("sort_order"),
    supabase.from("gacha_pools").select("*").eq("active", true),
    supabase.from("gacha_pool_entries").select("*").order("sort_order"),
    supabase.from("story_zones").select("*").order("sort_order"),
    supabase.from("story_levels").select("*").eq("active", true).order("level_index"),
    supabase.from("run_rewards").select("*").eq("active", true).order("sort_order"),
  ]);

  const hasDb =
    (spiritsRes.data?.length ?? 0) > 0 ||
    (entriesRes.data?.length ?? 0) > 0 ||
    (levelsRes.data?.length ?? 0) > 0 ||
    (rewardsRes.data?.length ?? 0) > 0;

  if (!hasDb) return emptyGameContent();

  const content = emptyGameContent();
  content.source = "db";

  if (spiritsRes.data?.length) {
    const catalog: Record<string, CharacterTemplate> = {};
    const enemies: Record<string, CharacterTemplate> = {};
    const hubToCore: Record<string, string> = {};
    const spiritPortraits: Record<string, string> = {};
    for (const row of spiritsRes.data as SpiritRow[]) {
      const template = {
        ...row.payload,
        key: row.template_key,
        name: row.name,
        tribe: row.tribe as CharacterTemplate["tribe"],
        rarity: row.rarity as CharacterTemplate["rarity"],
      };
      if (row.kind === "catalog") catalog[row.template_key] = template;
      else enemies[row.template_key] = template;
      if (row.hub_id) {
        hubToCore[row.hub_id] = row.template_key;
        const portrait = row.portrait_url?.trim();
        if (portrait) spiritPortraits[row.hub_id] = portrait;
      }
    }
    content.spirits = { catalog, enemies, hubToCore };
    content.spiritPortraits = spiritPortraits;
  }

  const pools = (poolsRes.data ?? []) as GachaPoolRow[];
  const entries = (entriesRes.data ?? []) as GachaEntryRow[];

  const poolMeta: Record<string, { bannerUrl?: string | null }> = {};
  for (const p of pools) {
    if (p.banner_url) poolMeta[p.id] = { bannerUrl: p.banner_url };
  }
  content.gacha.poolMeta = poolMeta;

  const standardPool = pools.find((p) => p.id === "standard");
  const welcomePool = pools.find((p) => p.id === "welcome");
  if (standardPool) {
    content.gacha.ticketCost = standardPool.ticket_cost;
    content.gacha.gemCost = standardPool.gem_cost;
    content.gacha.multiCount = standardPool.multi_count;
  } else if (welcomePool) {
    content.gacha.ticketCost = welcomePool.ticket_cost;
    content.gacha.gemCost = welcomePool.gem_cost;
    content.gacha.multiCount = welcomePool.multi_count;
  }

  if (entries.length) {
    const toEntry = (e: GachaEntryRow): GachaPoolEntry => ({
      hubId: e.hub_id as GachaPoolEntry["hubId"],
      templateKey: e.template_key,
      name: e.name,
      tribe: e.tribe,
      hue: e.hue,
      rarity: e.rarity as GachaPoolEntry["rarity"],
      weight: e.weight ?? 100,
    });
    content.gacha.welcome = entries.filter((e) => e.pool_id === "welcome").map(toEntry);
    content.gacha.standard = entries.filter((e) => e.pool_id === "standard").map(toEntry);
    const extra: Record<string, GachaPoolEntry[]> = {};
    for (const e of entries) {
      if (e.pool_id === "welcome" || e.pool_id === "standard") continue;
      const entry = toEntry(e);
      extra[e.pool_id] = extra[e.pool_id] ?? [];
      extra[e.pool_id]!.push(entry);
    }
    content.gacha.extraPools = extra;
  }

  if (zonesRes.data?.length) {
    content.story.zones = (zonesRes.data as StoryZoneRow[]).map((z) => ({
      id: z.id,
      name: z.name,
      emoji: z.emoji,
      tribe: z.tribe,
      levelCount: z.level_count,
    }));
  }

  if (levelsRes.data?.length) {
    content.story.levels = (levelsRes.data as StoryLevelRow[]).map((l) => ({
      id: l.id,
      zoneId: l.zone_id,
      index: l.level_index,
      title: l.title,
      intro: l.intro,
      outro: l.outro,
      enemies: l.enemies,
      starsRound3: l.stars_round3,
    }));
  }

  if (rewardsRes.data?.length) {
    content.runRewards = (rewardsRes.data as RunRewardRow[]).map((r) => r.payload);
  }

  return content;
}
