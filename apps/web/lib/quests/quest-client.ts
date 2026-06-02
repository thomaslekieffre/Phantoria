import type { DailyQuestFlags } from "@/lib/quests/quest-progress";

export type QuestClaimResult = {
  reward: { gold: number; gems: number; tickets: number } | null;
  error?: string;
};

export async function claimQuestRemote(questId: string): Promise<QuestClaimResult> {
  const res = await fetch("/api/quests/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questId }),
  });
  return (await res.json()) as QuestClaimResult;
}

export async function recordQuestDailyRemote(flag: keyof DailyQuestFlags): Promise<void> {
  await fetch("/api/quests/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ flag }),
  });
}

export async function recordStoryVictoryRemote(
  levelId: string,
  stars: 1 | 2 | 3,
  round: number,
): Promise<{ error?: string }> {
  const res = await fetch("/api/story/victory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ levelId, stars, round }),
  });
  return (await res.json()) as { error?: string };
}
