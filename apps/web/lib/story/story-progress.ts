import { recordDailyStoryWin } from "@/lib/quests/quest-progress";
import { recordStoryVictoryRemote } from "@/lib/quests/quest-client";
import { isSupabaseEnabled } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

const STORY_KEY = "phantoria_story_v1";

export type StoryLevelProgress = {
  stars: 0 | 1 | 2 | 3;
  cleared: boolean;
  bestRound?: number;
};

export type StorySave = {
  levels: Record<string, StoryLevelProgress>;
};

function emptySave(): StorySave {
  return { levels: {} };
}

export function loadStorySave(): StorySave {
  if (typeof window === "undefined") return emptySave();
  try {
    const raw = localStorage.getItem(STORY_KEY);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw) as StorySave;
    return parsed?.levels ? parsed : emptySave();
  } catch {
    return emptySave();
  }
}

export function saveStorySave(save: StorySave): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORY_KEY, JSON.stringify(save));
}

export function getLevelProgress(levelId: string, save: StorySave = loadStorySave()): StoryLevelProgress | null {
  return save.levels[levelId] ?? null;
}

export function isStoryLevelUnlocked(
  levelId: string,
  zoneId: number,
  index: number,
  save: StorySave = loadStorySave(),
): boolean {
  void levelId;
  if (index <= 1) return true;
  const prevId = `${zoneId}-${index - 1}`;
  return Boolean(save.levels[prevId]?.cleared);
}

export function totalStoryStars(save: StorySave = loadStorySave()): number {
  return Object.values(save.levels).reduce((sum, l) => sum + (l.stars ?? 0), 0);
}

function mergeVictory(
  save: StorySave,
  levelId: string,
  stars: 1 | 2 | 3,
  round: number,
): StoryLevelProgress {
  const prev = save.levels[levelId];
  const next: StoryLevelProgress = {
    cleared: true,
    stars: Math.max(prev?.stars ?? 0, stars) as 1 | 2 | 3,
    bestRound: prev?.bestRound != null ? Math.min(prev.bestRound, round) : round,
  };
  save.levels[levelId] = next;
  return next;
}

/** Persiste victoire histoire (local + Supabase si connecté). */
export async function recordStoryVictory(
  levelId: string,
  stars: 1 | 2 | 3,
  round: number,
): Promise<StoryLevelProgress> {
  const save = loadStorySave();
  const next = mergeVictory(save, levelId, stars, round);
  saveStorySave(save);
  recordDailyStoryWin();

  if (isSupabaseEnabled()) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await recordStoryVictoryRemote(levelId, stars, round);
    }
  }

  return next;
}

/** Fusionne la save locale vers Supabase (première connexion après offline). */
export async function syncLocalStoryToRemote(): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const local = loadStorySave();
  for (const [levelId, prog] of Object.entries(local.levels)) {
    if (!prog.cleared || (prog.stars ?? 0) < 1) continue;
    await recordStoryVictoryRemote(levelId, prog.stars as 1 | 2 | 3, prog.bestRound ?? 1);
  }
}
