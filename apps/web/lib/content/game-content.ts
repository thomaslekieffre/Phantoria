import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CHARACTER_CATALOG,
  ENEMY_TEMPLATES,
  HUB_TO_CORE,
  setCharacterCatalog,
  setRunRewardPool,
  setStoryContent,
  STORY_LEVELS,
  STORY_ZONES,
  RUN_REWARD_POOL,
  type CharacterTemplate,
  type RunRewardDef,
  type StoryLevelDef,
  type StoryZoneDef,
} from "@phantoria/game-core";
import {
  applyGachaPools,
  clearExtraGachaPools,
  registerGachaPool,
  STANDARD_GACHA_POOL,
  STANDARD_MULTI_PULL_COUNT,
  STANDARD_PULL_GEM_COST,
  STANDARD_PULL_TICKET_COST,
  WELCOME_GACHA_POOL,
  type GachaPoolEntry,
} from "@/lib/player/gacha-pool";
import { rebuildSpiritCatalog } from "@/lib/player/spirit-catalog";

export type GameContentSnapshot = {
  spirits: { catalog: Record<string, CharacterTemplate>; enemies: Record<string, CharacterTemplate>; hubToCore: Record<string, string> };
  gacha: {
    welcome: GachaPoolEntry[];
    standard: GachaPoolEntry[];
    extraPools: Record<string, GachaPoolEntry[]>;
    ticketCost: number;
    gemCost: number;
    multiCount: number;
  };
  story: { zones: StoryZoneDef[]; levels: StoryLevelDef[] };
  runRewards: RunRewardDef[];
  source: "db" | "fallback";
};

export function defaultGameContent(): GameContentSnapshot {
  return {
    spirits: { catalog: { ...CHARACTER_CATALOG }, enemies: { ...ENEMY_TEMPLATES }, hubToCore: { ...HUB_TO_CORE } },
    gacha: {
      welcome: [...WELCOME_GACHA_POOL],
      standard: [...STANDARD_GACHA_POOL],
      extraPools: {},
      ticketCost: STANDARD_PULL_TICKET_COST,
      gemCost: STANDARD_PULL_GEM_COST,
      multiCount: STANDARD_MULTI_PULL_COUNT,
    },
    story: { zones: [...STORY_ZONES], levels: [...STORY_LEVELS] },
    runRewards: [...RUN_REWARD_POOL],
    source: "fallback",
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
  setStoryContent(content.story.zones, content.story.levels);
  setRunRewardPool(content.runRewards);
  rebuildSpiritCatalog();
}

type SpiritRow = {
  template_key: string;
  kind: "catalog" | "enemy";
  hub_id: string | null;
  name: string;
  tribe: string;
  rarity: string;
  payload: CharacterTemplate;
  active: boolean;
};

type GachaPoolRow = { id: string; ticket_cost: number; gem_cost: number; multi_count: number; active: boolean };
type GachaEntryRow = {
  pool_id: string;
  hub_id: string;
  template_key: string;
  name: string;
  tribe: string;
  hue: string;
  rarity: string;
  sort_order: number;
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
  const fallback = defaultGameContent();

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

  if (!hasDb) return fallback;

  const content = defaultGameContent();
  content.source = "db";

  if (spiritsRes.data?.length) {
    const catalog: Record<string, CharacterTemplate> = {};
    const enemies: Record<string, CharacterTemplate> = {};
    const hubToCore: Record<string, string> = {};
    for (const row of spiritsRes.data as SpiritRow[]) {
      const template = { ...row.payload, key: row.template_key, name: row.name, tribe: row.tribe as CharacterTemplate["tribe"], rarity: row.rarity as CharacterTemplate["rarity"] };
      if (row.kind === "catalog") catalog[row.template_key] = template;
      else enemies[row.template_key] = template;
      if (row.hub_id) hubToCore[row.hub_id] = row.template_key;
    }
    content.spirits = { catalog, enemies, hubToCore: Object.keys(hubToCore).length ? hubToCore : content.spirits.hubToCore };
  }

  const pools = (poolsRes.data ?? []) as GachaPoolRow[];
  const entries = (entriesRes.data ?? []) as GachaEntryRow[];
  if (entries.length) {
    const toEntry = (e: GachaEntryRow): GachaPoolEntry => ({
      hubId: e.hub_id as GachaPoolEntry["hubId"],
      templateKey: e.template_key,
      name: e.name,
      tribe: e.tribe,
      hue: e.hue,
      rarity: e.rarity as GachaPoolEntry["rarity"],
    });
    const welcomePool = pools.find((p) => p.id === "welcome");
    const standardPool = pools.find((p) => p.id === "standard");
    const welcomeEntries = entries.filter((e) => e.pool_id === "welcome").map(toEntry);
    const standardEntries = entries.filter((e) => e.pool_id === "standard").map(toEntry);
    if (welcomeEntries.length) content.gacha.welcome = welcomeEntries;
    if (standardEntries.length) content.gacha.standard = standardEntries;
    const extra: Record<string, GachaPoolEntry[]> = {};
    for (const e of entries) {
      if (e.pool_id === "welcome" || e.pool_id === "standard") continue;
      const entry = toEntry(e);
      extra[e.pool_id] = extra[e.pool_id] ?? [];
      extra[e.pool_id]!.push(entry);
    }
    content.gacha.extraPools = extra;
    // Coûts pack général : pool "standard" uniquement (welcome = gratuit, multi_count 1)
    if (standardPool) {
      content.gacha.ticketCost = standardPool.ticket_cost;
      content.gacha.gemCost = standardPool.gem_cost;
      content.gacha.multiCount = standardPool.multi_count;
    } else if (welcomePool) {
      content.gacha.ticketCost = welcomePool.ticket_cost;
      content.gacha.gemCost = welcomePool.gem_cost;
      content.gacha.multiCount = welcomePool.multi_count;
    }
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
