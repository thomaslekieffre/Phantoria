/** Mode histoire — zones, niveaux, étoiles */

export type StoryEnemySetup = {
  key: string;
  level?: number;
  statMult?: number;
};

export type StoryLevelDef = {
  id: string;
  zoneId: number;
  index: number;
  title: string;
  intro: string;
  outro: string;
  enemies: StoryEnemySetup[];
  /** 3★ si le combat se termine en ≤ ce nombre de rounds */
  starsRound3: number;
};

export type StoryZoneDef = {
  id: number;
  name: string;
  emoji: string;
  tribe: string;
  levelCount: number;
};

export const STORY_ZONES: StoryZoneDef[] = [
  { id: 1, name: "Terre des Vaillants", emoji: "⚔️", tribe: "Vaillants", levelCount: 15 },
  { id: 2, name: "Labyrinthe des Mystérieux", emoji: "🔮", tribe: "Mystérieux", levelCount: 15 },
  { id: 3, name: "Forteresse des Costauds", emoji: "💪", tribe: "Costauds", levelCount: 15 },
];

export const STORY_LEVELS: StoryLevelDef[] = [
  {
    id: "1-1",
    zoneId: 1,
    index: 1,
    title: "Premiers pas",
    intro:
      "Une ombre errante rôde aux lisières du camp. C’est l’occasion idéale de tester ton équipe sur le terrain.",
    outro: "La menace est repoussée. Le sanctuaire peut respirer… pour l’instant.",
    enemies: [{ key: "ombre_faible", level: 1, statMult: 0.88 }],
    starsRound3: 8,
  },
];

export function getStoryZone(zoneId: number): StoryZoneDef | undefined {
  return STORY_ZONES.find((z) => z.id === zoneId);
}

export function getStoryLevel(levelId: string): StoryLevelDef | undefined {
  return STORY_LEVELS.find((l) => l.id === levelId);
}

export function getStoryLevelByCoords(zoneId: number, index: number): StoryLevelDef | undefined {
  return STORY_LEVELS.find((l) => l.zoneId === zoneId && l.index === index);
}

export function levelsForZone(zoneId: number): StoryLevelDef[] {
  return STORY_LEVELS.filter((l) => l.zoneId === zoneId).sort((a, b) => a.index - b.index);
}

/** Étoiles obtenues après victoire (0 si pas gagné) */
export function computeStoryStars(
  level: StoryLevelDef,
  opts: { phase: string; round: number; events: { kind: string; targetId?: string }[]; allyInstanceIds: string[] },
): 0 | 1 | 2 | 3 {
  if (opts.phase !== "won") return 0;

  let stars: 1 | 2 | 3 = 1;
  const allySet = new Set(opts.allyInstanceIds);
  const allyKo = opts.events.some((e) => e.kind === "ko" && e.targetId && allySet.has(e.targetId));
  if (!allyKo) stars = 2;
  if (opts.round <= level.starsRound3) stars = 3;
  return stars;
}
