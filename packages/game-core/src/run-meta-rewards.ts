import { RUN_MAX_WAVES } from "./run-waves";

export type RunMetaOutcome = "won" | "lost";

export type RunMetaReward = {
  tickets: number;
  gems: number;
};

/** Récompenses persistantes hub (gacha) en fin de run — roguelite → gacha */
export function computeRunMetaReward(wave: number, outcome: RunMetaOutcome): RunMetaReward {
  const w = Math.max(0, Math.floor(wave));
  if (w <= 0) return { tickets: 0, gems: 0 };

  const ticketsFromWaves = Math.floor(w / 5);
  const gemsFromWaves = Math.floor(w / 20);

  if (outcome === "won") {
    const fullClear = w >= RUN_MAX_WAVES;
    return {
      tickets: ticketsFromWaves + 3 + (fullClear ? 5 : 0),
      gems: gemsFromWaves + 15 + (fullClear ? 25 : 0),
    };
  }

  return {
    tickets: Math.max(1, ticketsFromWaves),
    gems: gemsFromWaves,
  };
}
