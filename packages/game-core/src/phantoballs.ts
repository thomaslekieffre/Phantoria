import type { Tribe } from "./types";

/** Balls tribales GDD — bonus si tribu cible dans le groupe, malus sinon */
export const TRIBAL_BALL_IDS = ["lumi", "flam", "ombra", "glace", "terra", "neant"] as const;
export type TribalBallId = (typeof TRIBAL_BALL_IDS)[number];

export type TribalBallInfo = {
  id: TribalBallId;
  name: string;
  emoji: string;
  /** Multiplicateur si tribu compatible */
  matchMult: number;
  /** Multiplicateur si tribu incompatible */
  mismatchMult: number;
  tribes: readonly Tribe[];
};

export const TRIBAL_BALL_INFO: Record<TribalBallId, TribalBallInfo> = {
  lumi: {
    id: "lumi",
    name: "Lumiball",
    emoji: "🟡",
    matchMult: 1.5,
    mismatchMult: 0.5,
    tribes: ["mignons", "bienveillants"],
  },
  flam: {
    id: "flam",
    name: "Flamball",
    emoji: "🔴",
    matchMult: 2,
    mismatchMult: 0.5,
    tribes: ["vaillants", "costauds"],
  },
  ombra: {
    id: "ombra",
    name: "Ombraball",
    emoji: "🟣",
    matchMult: 2,
    mismatchMult: 0.5,
    tribes: ["sombres", "sinistres"],
  },
  glace: {
    id: "glace",
    name: "Glaceball",
    emoji: "🩵",
    matchMult: 2,
    mismatchMult: 0.5,
    tribes: ["mysterieux", "perfides"],
  },
  terra: {
    id: "terra",
    name: "Terraball",
    emoji: "🟤",
    matchMult: 2,
    mismatchMult: 0.5,
    tribes: ["insaisissables", "enma"],
  },
  neant: {
    id: "neant",
    name: "Néantball",
    emoji: "⚫",
    matchMult: 2.5,
    mismatchMult: 0.5,
    tribes: ["neants"],
  },
};

export type PhantoballType = "standard" | TribalBallId;

export type RunBallStock = {
  standard: number;
  tribal: Record<TribalBallId, number>;
};

export function createEmptyTribalStock(): Record<TribalBallId, number> {
  return Object.fromEntries(TRIBAL_BALL_IDS.map((id) => [id, 0])) as Record<TribalBallId, number>;
}

export const RUN_START_BALLS: RunBallStock = {
  standard: 5,
  tribal: createEmptyTribalStock(),
};

export function totalTribalBalls(stock: RunBallStock): number {
  return TRIBAL_BALL_IDS.reduce((sum, id) => sum + (stock.tribal[id] ?? 0), 0);
}

export function hasAnyBall(stock: RunBallStock): boolean {
  return stock.standard > 0 || totalTribalBalls(stock) > 0;
}

export function tribalBallMatches(ballId: TribalBallId, targetTribe: Tribe): boolean {
  return TRIBAL_BALL_INFO[ballId].tribes.includes(targetTribe);
}

export function getBallCaptureMult(ball: PhantoballType, targetTribe?: Tribe): number {
  if (ball === "standard") return 1;
  const info = TRIBAL_BALL_INFO[ball];
  if (!targetTribe) return info.matchMult;
  return tribalBallMatches(ball, targetTribe) ? info.matchMult : info.mismatchMult;
}

export function formatBallLabel(ball: PhantoballType): string {
  if (ball === "standard") return "Phantoball";
  const info = TRIBAL_BALL_INFO[ball];
  return info.name;
}

export function formatBallShort(ball: PhantoballType): string {
  if (ball === "standard") return "🔵 Standard";
  const info = TRIBAL_BALL_INFO[ball];
  return `${info.emoji} ${info.name}`;
}

/** Meilleure ball tribale en stock pour une tribu cible */
export function bestTribalBallFor(
  stock: RunBallStock,
  targetTribe: Tribe,
): { id: TribalBallId; mult: number } | null {
  let best: { id: TribalBallId; mult: number } | null = null;
  for (const id of TRIBAL_BALL_IDS) {
    if ((stock.tribal[id] ?? 0) <= 0) continue;
    const mult = getBallCaptureMult(id, targetTribe);
    if (!best || mult > best.mult) best = { id, mult };
  }
  return best;
}

export function pickRandomTribalBall(rng: () => number = Math.random): TribalBallId {
  const idx = Math.floor(rng() * TRIBAL_BALL_IDS.length);
  return TRIBAL_BALL_IDS[idx]!;
}

/** Migre les saves v1 (tribal: number) vers le stock par type */
export function migrateRunBalls(raw: unknown): RunBallStock {
  if (!raw || typeof raw !== "object") return { ...RUN_START_BALLS, tribal: createEmptyTribalStock() };

  const r = raw as { standard?: number; tribal?: number | Record<TribalBallId, number> };
  const standard = typeof r.standard === "number" ? r.standard : RUN_START_BALLS.standard;

  if (typeof r.tribal === "number") {
    const tribal = createEmptyTribalStock();
    if (r.tribal > 0) tribal.lumi = r.tribal;
    return { standard, tribal };
  }

  if (r.tribal && typeof r.tribal === "object") {
    return {
      standard,
      tribal: { ...createEmptyTribalStock(), ...r.tribal },
    };
  }

  return { standard, tribal: createEmptyTribalStock() };
}
