import type { StorySave } from "@/lib/story/story-progress";
import type { DailyQuestFlags } from "@/lib/quests/quest-progress";
import type { QuestDef, QuestKind } from "@/lib/quests/quests";

export type QuestContext = {
  spiritCount: number;
  fieldReady: boolean;
  runsCompleted: number;
  storySave: StorySave;
  daily: DailyQuestFlags;
};

export type QuestStatus = {
  quest: QuestDef;
  current: number;
  target: number;
  complete: boolean;
  claimed: boolean;
  readyToClaim: boolean;
};

function evaluateKind(kind: QuestKind, ctx: QuestContext): { current: number; target: number } {
  switch (kind.type) {
    case "spirits_owned":
      return { current: Math.min(ctx.spiritCount, kind.count), target: kind.count };
    case "field_ready":
      return { current: ctx.fieldReady ? 1 : 0, target: 1 };
    case "story_clear":
      return {
        current: ctx.storySave.levels[kind.levelId]?.cleared ? 1 : 0,
        target: 1,
      };
    case "story_stars_level": {
      const stars = ctx.storySave.levels[kind.levelId]?.stars ?? 0;
      return { current: Math.min(stars, kind.stars), target: kind.stars };
    }
    case "runs_completed":
      return { current: Math.min(ctx.runsCompleted, kind.count), target: kind.count };
    case "story_stars_total": {
      const total = Object.values(ctx.storySave.levels).reduce((sum, l) => sum + (l.stars ?? 0), 0);
      return { current: Math.min(total, kind.count), target: kind.count };
    }
    case "daily_flag":
      return { current: ctx.daily[kind.flag] ? 1 : 0, target: 1 };
    default:
      return { current: 0, target: 1 };
  }
}

export function evaluateQuest(quest: QuestDef, ctx: QuestContext, claimed: boolean): QuestStatus {
  const { current, target } = evaluateKind(quest.kind, ctx);
  const complete = current >= target;
  return {
    quest,
    current,
    target,
    complete,
    claimed,
    readyToClaim: complete && !claimed,
  };
}

export function evaluateAllQuests(
  quests: QuestDef[],
  ctx: QuestContext,
  claimedIds: string[],
): QuestStatus[] {
  const claimedSet = new Set(claimedIds);
  return quests.map((q) => evaluateQuest(q, ctx, claimedSet.has(q.id)));
}

export function mainChainSummary(statuses: QuestStatus[]): {
  title: string;
  done: number;
  total: number;
  pct: number;
} {
  const main = statuses.filter((s) => s.quest.chainId);
  const title = main[0]?.quest.chainTitle ?? "Quête principale";
  const total = main.length;
  const done = main.filter((s) => s.complete).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return { title, done, total, pct };
}

export function unclaimedCount(statuses: QuestStatus[]): number {
  return statuses.filter((s) => s.readyToClaim).length;
}
