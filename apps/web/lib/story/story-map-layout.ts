/** Positions % sur la scène (x gauche→droite, y haut→bas) */

export type MapNodePos = { x: number; y: number };

/** 15 niveaux, du bas (1) vers le haut (15), bien espacés */
export const STORY_MAP_NODE_POSITIONS: MapNodePos[] = [
  { x: 50, y: 95 },
  { x: 30, y: 88.5 },
  { x: 70, y: 82 },
  { x: 30, y: 75.5 },
  { x: 50, y: 69 }, // Boss 5
  { x: 70, y: 62.5 },
  { x: 30, y: 56 },
  { x: 70, y: 49.5 },
  { x: 30, y: 43 },
  { x: 50, y: 36.5 }, // Boss 10
  { x: 20, y: 30 },
  { x: 80, y: 23.5 },
  { x: 20, y: 17 },
  { x: 80, y: 10.5 },
  { x: 50, y: 4 }, // Boss 15
];

export const STORY_BOSS_LEVELS = new Set([5, 10, 15]);

export function isBossLevel(index: number): boolean {
  return STORY_BOSS_LEVELS.has(index);
}

/** Courbe SVG lisse passant par tous les nœuds */
export function buildMapTrailPath(positions: MapNodePos[], stageW: number, stageH: number): string {
  if (positions.length === 0) return "";

  const pts = positions.map((p) => ({
    x: (p.x / 100) * stageW,
    y: (p.y / 100) * stageH,
  }));

  let d = `M ${pts[0]!.x} ${pts[0]!.y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]!;
    const cur = pts[i]!;
    const midY = (prev.y + cur.y) / 2;
    d += ` C ${prev.x} ${midY}, ${cur.x} ${midY}, ${cur.x} ${cur.y}`;
  }
  return d;
}

export const STORY_MAP_STAGE_HEIGHT = 2400;
