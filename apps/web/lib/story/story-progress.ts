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

export function getLevelProgress(levelId: string): StoryLevelProgress | null {
  return loadStorySave().levels[levelId] ?? null;
}

export function isStoryLevelUnlocked(levelId: string, zoneId: number, index: number): boolean {
  if (index <= 1) return true;
  const prevId = `${zoneId}-${index - 1}`;
  return Boolean(loadStorySave().levels[prevId]?.cleared);
}

export function recordStoryVictory(
  levelId: string,
  stars: 1 | 2 | 3,
  round: number,
): StoryLevelProgress {
  const save = loadStorySave();
  const prev = save.levels[levelId];
  const next: StoryLevelProgress = {
    cleared: true,
    stars: Math.max(prev?.stars ?? 0, stars) as 1 | 2 | 3,
    bestRound: prev?.bestRound != null ? Math.min(prev.bestRound, round) : round,
  };
  save.levels[levelId] = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORY_KEY, JSON.stringify(save));
  }
  return next;
}

export function totalStoryStars(): number {
  return Object.values(loadStorySave().levels).reduce((sum, l) => sum + (l.stars ?? 0), 0);
}
