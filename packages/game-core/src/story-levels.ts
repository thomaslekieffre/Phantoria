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
      "Une ombre errante rôde aux lisières du camp. C'est l'occasion idéale de tester ton équipe sur le terrain.",
    outro: "La menace est repoussée. Le sanctuaire peut respirer… pour l'instant.",
    enemies: [{ key: "ombre_faible", level: 1, statMult: 0.88 }],
    starsRound3: 8,
  },
  {
    id: "1-2",
    zoneId: 1,
    index: 2,
    title: "Lisière sombre",
    intro: "Les ombres s'épaississent au-delà du sentier. Une présence hostile te guette.",
    outro: "Tu repousses l'ombre, mais le néant semble plus proche qu'avant.",
    enemies: [{ key: "ombre_faible", level: 2, statMult: 0.92 }],
    starsRound3: 9,
  },
  {
    id: "1-3",
    zoneId: 1,
    index: 3,
    title: "Duo d'ombres",
    intro: "Deux silhouettes encapuchonnées bloquent la route. Elles avancent en tandem.",
    outro: "Les deux ombres se dissipent. La route est libre… pour quelques pas.",
    enemies: [
      { key: "ombre_faible", level: 2, statMult: 0.88 },
      { key: "ombre_faible", level: 2, statMult: 0.88 },
    ],
    starsRound3: 10,
  },
  {
    id: "1-4",
    zoneId: 1,
    index: 4,
    title: "Éclaireur du néant",
    intro: "Un éclaireur néant observe le camp depuis les hauteurs. Il faut le neutraliser avant qu'il ne lève l'alarme.",
    outro: "L'éclaireur tombe, mais tu sens qu'il n'était que le premier messager.",
    enemies: [{ key: "neant_scout", level: 3, statMult: 0.9 }],
    starsRound3: 10,
  },
  {
    id: "1-5",
    zoneId: 1,
    index: 5,
    title: "Gardien des brumes",
    intro:
      "Un gardien des brumes barre le passage. Sa lame d'ombre brille d'une lueur malveillante — premier véritable obstacle de la zone.",
    outro: "Le gardien s'effondre dans la brume. Les Vaillants peuvent avancer un peu plus loin.",
    enemies: [{ key: "boss_gardien", level: 4, statMult: 0.88 }],
    starsRound3: 14,
  },
  {
    id: "1-6",
    zoneId: 1,
    index: 6,
    title: "Corruption",
    intro: "L'air est lourd. Un éclaireur néant traîne une traînée de corruption sur le sol.",
    outro: "La corruption faiblit, mais la brume revient toujours.",
    enemies: [{ key: "neant_scout", level: 4, statMult: 0.94 }],
    starsRound3: 11,
  },
  {
    id: "1-7",
    zoneId: 1,
    index: 7,
    title: "Patrouille",
    intro: "Deux éclaireurs patrouillent en mirroir. Ils te repèrent en même temps.",
    outro: "Patrouille neutralisée. Le camp envoie des renforts vers l'est.",
    enemies: [
      { key: "neant_scout", level: 4, statMult: 0.9 },
      { key: "neant_scout", level: 4, statMult: 0.9 },
    ],
    starsRound3: 12,
  },
  {
    id: "1-8",
    zoneId: 1,
    index: 8,
    title: "Embuscade",
    intro: "Une ombre et un éclaireur tendent une embuscade au détour du chemin.",
    outro: "L'embuscade est déjouée. Tu gagnes du terrain sur les lisières.",
    enemies: [
      { key: "ombre_faible", level: 5, statMult: 0.92 },
      { key: "neant_scout", level: 5, statMult: 0.9 },
    ],
    starsRound3: 12,
  },
  {
    id: "1-9",
    zoneId: 1,
    index: 9,
    title: "Convergence",
    intro: "Trois hostiles convergent vers ta position. Pas de retraite possible.",
    outro: "Tu tiens bon malgré le nombre. Le sanctuaire applaudit ton avancée.",
    enemies: [
      { key: "ombre_faible", level: 5, statMult: 0.88 },
      { key: "ombre_faible", level: 5, statMult: 0.88 },
      { key: "neant_scout", level: 5, statMult: 0.9 },
    ],
    starsRound3: 13,
  },
  {
    id: "1-10",
    zoneId: 1,
    index: 10,
    title: "Brume épaisse",
    intro:
      "Le gardien des brumes revient, renforcé par deux ombres. La brume est si épaisse qu'on ne voit plus le ciel.",
    outro: "La brume se lève enfin. Tu as franchi la moitié du chemin des Vaillants.",
    enemies: [
      { key: "boss_gardien", level: 5, statMult: 0.92 },
      { key: "ombre_faible", level: 3, statMult: 0.85 },
      { key: "ombre_faible", level: 3, statMult: 0.85 },
    ],
    starsRound3: 16,
  },
  {
    id: "1-11",
    zoneId: 1,
    index: 11,
    title: "Rocher et ombre",
    intro: "Un bloc de pierre animé bloque la route pendant qu'une ombre frappe depuis l'arrière.",
    outro: "Le rocher s'immobilise. Les ombres reculent une fois de plus.",
    enemies: [
      { key: "roche_costaud", level: 5, statMult: 0.9 },
      { key: "ombre_faible", level: 5, statMult: 0.92 },
    ],
    starsRound3: 13,
  },
  {
    id: "1-12",
    zoneId: 1,
    index: 12,
    title: "Tranchée",
    intro: "Deux éclaireurs néant tiennent une tranchée creusée dans le sol corrompu.",
    outro: "La tranchée est sécurisée. Plus qu'un dernier effort avant le cœur de la zone.",
    enemies: [
      { key: "neant_scout", level: 6, statMult: 0.94 },
      { key: "neant_scout", level: 6, statMult: 0.94 },
    ],
    starsRound3: 14,
  },
  {
    id: "1-13",
    zoneId: 1,
    index: 13,
    title: "Triple menace",
    intro: "Ombres et éclaireurs encerclent ton équipe. La mêlée est inévitable.",
    outro: "Encerclement brisé. Les Vaillants contrôlent presque toute la lisière.",
    enemies: [
      { key: "ombre_faible", level: 6, statMult: 0.9 },
      { key: "neant_scout", level: 6, statMult: 0.92 },
      { key: "ombre_faible", level: 6, statMult: 0.9 },
    ],
    starsRound3: 14,
  },
  {
    id: "1-14",
    zoneId: 1,
    index: 14,
    title: "Avant-poste",
    intro: "Un avant-poste néant : éclaireurs et un roche errant gardent l'accès au col.",
    outro: "L'avant-poste tombe. Seul le colosse du néant te sépare de la victoire totale.",
    enemies: [
      { key: "neant_scout", level: 6, statMult: 0.92 },
      { key: "neant_scout", level: 6, statMult: 0.92 },
      { key: "roche_costaud", level: 6, statMult: 0.88 },
    ],
    starsRound3: 15,
  },
  {
    id: "1-15",
    zoneId: 1,
    index: 15,
    title: "Colosse du néant",
    intro:
      "Au sommet du col, le colosse du néant domine la vallée. Vaincre cette masse, c'est prouver que les Vaillants tiennent debout.",
    outro:
      "Le colosse s'effondre. La Terre des Vaillants est sécurisée — mais au loin, d'autres zones appellent ton équipe.",
    enemies: [{ key: "boss_colosse", level: 5, statMult: 0.85 }],
    starsRound3: 20,
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
