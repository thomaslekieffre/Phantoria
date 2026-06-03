import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CHARACTER_CATALOG,
  ENEMY_TEMPLATES,
  HUB_TO_CORE,
  RUN_REWARD_POOL,
  STORY_LEVELS,
  STORY_ZONES,
  type CharacterTemplate,
} from "@phantoria/game-core";
import {
  STANDARD_GACHA_POOL,
  STANDARD_MULTI_PULL_COUNT,
  STANDARD_PULL_GEM_COST,
  STANDARD_PULL_TICKET_COST,
  WELCOME_GACHA_POOL,
} from "@/lib/player/gacha-pool";

export type SeedReport = {
  spirits: number;
  gachaEntries: number;
  storyZones: number;
  storyLevels: number;
  runRewards: number;
};

export async function seedStudioContentFromCodebase(supabase: SupabaseClient): Promise<SeedReport> {
  const spiritRows = [
    ...Object.entries(CHARACTER_CATALOG).map(([key, t], i) => ({
      template_key: key,
      kind: "catalog" as const,
      hub_id: Object.entries(HUB_TO_CORE).find(([, v]) => v === key)?.[0] ?? null,
      name: t.name,
      tribe: t.tribe,
      rarity: t.rarity,
      payload: t as CharacterTemplate,
      active: true,
      sort_order: i,
    })),
    ...Object.entries(ENEMY_TEMPLATES).map(([key, t], i) => ({
      template_key: key,
      kind: "enemy" as const,
      hub_id: null,
      name: t.name,
      tribe: t.tribe,
      rarity: t.rarity,
      payload: t as CharacterTemplate,
      active: true,
      sort_order: 1000 + i,
    })),
  ];

  await supabase.from("spirit_templates").upsert(spiritRows, { onConflict: "template_key" });

  await supabase.from("gacha_pools").upsert(
    [
      { id: "welcome", ticket_cost: 0, gem_cost: 0, multi_count: 1, active: true },
      {
        id: "standard",
        ticket_cost: STANDARD_PULL_TICKET_COST,
        gem_cost: STANDARD_PULL_GEM_COST,
        multi_count: STANDARD_MULTI_PULL_COUNT,
        active: true,
      },
    ],
    { onConflict: "id" },
  );

  const gachaEntries = [
    ...WELCOME_GACHA_POOL.map((e, i) => ({
      pool_id: "welcome",
      hub_id: e.hubId,
      template_key: e.templateKey,
      name: e.name,
      tribe: e.tribe,
      hue: e.hue,
      rarity: e.rarity,
      sort_order: i,
    })),
    ...STANDARD_GACHA_POOL.map((e, i) => ({
      pool_id: "standard",
      hub_id: e.hubId,
      template_key: e.templateKey,
      name: e.name,
      tribe: e.tribe,
      hue: e.hue,
      rarity: e.rarity,
      sort_order: i,
    })),
  ];

  await supabase.from("gacha_pool_entries").delete().neq("pool_id", "");
  const { error: gachaErr } = await supabase.from("gacha_pool_entries").insert(gachaEntries);
  if (gachaErr) throw new Error(gachaErr.message);

  await supabase.from("story_zones").upsert(
    STORY_ZONES.map((z, i) => ({
      id: z.id,
      name: z.name,
      emoji: z.emoji,
      tribe: z.tribe,
      level_count: z.levelCount,
      sort_order: i,
    })),
    { onConflict: "id" },
  );

  await supabase.from("story_levels").upsert(
    STORY_LEVELS.map((l) => ({
      id: l.id,
      zone_id: l.zoneId,
      level_index: l.index,
      title: l.title,
      intro: l.intro,
      outro: l.outro,
      enemies: l.enemies,
      stars_round3: l.starsRound3,
      active: true,
    })),
    { onConflict: "id" },
  );

  await supabase.from("run_rewards").upsert(
    RUN_REWARD_POOL.map((r, i) => ({
      id: r.id,
      payload: r,
      sort_order: i,
      active: true,
    })),
    { onConflict: "id" },
  );

  return {
    spirits: spiritRows.length,
    gachaEntries: gachaEntries.length,
    storyZones: STORY_ZONES.length,
    storyLevels: STORY_LEVELS.length,
    runRewards: RUN_REWARD_POOL.length,
  };
}
