import { RUN_MAX_WAVES } from "./run-waves";

export type RunMetaOutcome = "won" | "lost";

export type RunMetaReward = {
  tickets: number;
  gems: number;
};

/** Récompenses persistantes hub (gacha) en fin de run — ~1 tirage / 2–3 runs */
export function computeRunMetaReward(wave: number, outcome: RunMetaOutcome): RunMetaReward {
  const w = Math.max(0, Math.floor(wave));
  if (w <= 0) return { tickets: 0, gems: 0 };

  const ticketsFromWaves = Math.floor(w / 30);
  const gemsFromWaves = Math.floor(w / 40);

  if (outcome === "won") {
    const fullClear = w >= RUN_MAX_WAVES;
    const milestoneBonus = w >= 50 ? 1 : 0;
    return {
      tickets: ticketsFromWaves + 1 + milestoneBonus + (fullClear ? 2 : 0),
      gems: gemsFromWaves + 5 + (fullClear ? 20 : 0),
    };
  }

  return {
    tickets: ticketsFromWaves,
    gems: gemsFromWaves,
  };
}
