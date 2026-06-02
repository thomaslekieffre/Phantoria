import type { SupabaseClient } from "@supabase/supabase-js";
import { isFieldSlotIndex } from "@/components/hub/roster";
import { evaluateQuest, type QuestContext } from "@/lib/quests/quest-state";
import { getQuestById } from "@/lib/quests/quests";
import type { StorySave } from "@/lib/story/story-progress";
import type { DailyQuestFlags } from "@/lib/quests/quest-progress";

export type QuestProgressSnapshot = {
  claimed: string[];
  daily: DailyQuestFlags;
};

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function fetchStorySaveFromDb(
  supabase: SupabaseClient,
  userId: string,
): Promise<StorySave> {
  const { data } = await supabase
    .from("player_story_levels")
    .select("level_id, stars, cleared, best_round")
    .eq("user_id", userId);

  const levels: StorySave["levels"] = {};
  for (const row of data ?? []) {
    levels[row.level_id] = {
      stars: row.stars as 0 | 1 | 2 | 3,
      cleared: row.cleared,
      bestRound: row.best_round ?? undefined,
    };
  }
  return { levels };
}

export async function fetchQuestProgressFromDb(
  supabase: SupabaseClient,
  userId: string,
): Promise<QuestProgressSnapshot> {
  const [{ data: claims }, { data: daily }] = await Promise.all([
    supabase.from("player_quest_claims").select("quest_id").eq("user_id", userId),
    supabase
      .from("player_quest_daily")
      .select("login_done, story_win, run_done, quest_date")
      .eq("user_id", userId)
      .eq("quest_date", todayUtc())
      .maybeSingle(),
  ]);

  return {
    claimed: (claims ?? []).map((c) => c.quest_id),
    daily: {
      login: daily?.login_done ?? false,
      storyWin: daily?.story_win ?? false,
      runDone: daily?.run_done ?? false,
    },
  };
}

export async function buildQuestContextFromDb(
  supabase: SupabaseClient,
  userId: string,
): Promise<QuestContext> {
  const [
    { count: spiritCount },
    { data: slots },
    { data: profile },
    storySave,
    questProgress,
  ] = await Promise.all([
    supabase.from("player_spirits").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("roster_slots").select("slot_index, spirit_id").eq("user_id", userId),
    supabase.from("profiles").select("runs_completed").eq("id", userId).single(),
    fetchStorySaveFromDb(supabase, userId),
    fetchQuestProgressFromDb(supabase, userId),
  ]);

  const fieldCount = (slots ?? []).filter(
    (s) => s.spirit_id != null && isFieldSlotIndex(s.slot_index),
  ).length;

  return {
    spiritCount: spiritCount ?? 0,
    fieldReady: fieldCount >= 3,
    runsCompleted: profile?.runs_completed ?? 0,
    storySave,
    daily: questProgress.daily,
  };
}

export async function claimQuestRewardServer(
  supabase: SupabaseClient,
  userId: string,
  questId: string,
): Promise<{ reward: { gold: number; gems: number; tickets: number } | null; error?: string }> {
  const quest = getQuestById(questId);
  if (!quest) {
    return { reward: null, error: "Quête inconnue" };
  }

  const progress = await fetchQuestProgressFromDb(supabase, userId);
  if (progress.claimed.includes(questId)) {
    return { reward: null, error: "Quête déjà réclamée" };
  }

  const ctx = await buildQuestContextFromDb(supabase, userId);
  const status = evaluateQuest(quest, ctx, false);
  if (!status.complete) {
    return { reward: null, error: "Objectif non terminé" };
  }

  const gold = quest.reward.gold ?? 0;
  const gems = quest.reward.gems ?? 0;
  const tickets = quest.reward.tickets ?? 0;

  const { data, error } = await supabase.rpc("claim_quest_reward", {
    p_quest_id: questId,
    p_gold: gold,
    p_gems: gems,
    p_tickets: tickets,
  });

  if (error) {
    return { reward: null, error: error.message };
  }

  const row = data as { gold?: number; gems?: number; tickets?: number } | null;
  return {
    reward: {
      gold: row?.gold ?? gold,
      gems: row?.gems ?? gems,
      tickets: row?.tickets ?? tickets,
    },
  };
}

export async function syncStoryLevelToDb(
  supabase: SupabaseClient,
  levelId: string,
  stars: 1 | 2 | 3,
  round: number,
): Promise<{ error?: string; goldEarned?: number }> {
  const { data, error } = await supabase.rpc("record_story_victory", {
    p_level_id: levelId,
    p_stars: stars,
    p_round: round,
  });
  if (error) return { error: error.message };
  const row = data as { gold_earned?: number } | null;
  return { goldEarned: row?.gold_earned ?? 0 };
}

export async function syncQuestDailyFlagRemote(
  supabase: SupabaseClient,
  flag: "login" | "storyWin" | "runDone",
): Promise<void> {
  const map = { login: "login", storyWin: "story_win", runDone: "run_done" } as const;
  await supabase.rpc("record_quest_daily_flag", { p_flag: map[flag] });
}
