import type { CombatState } from "./types";
import { migrateRunBalls } from "./phantoballs";
import { RUN_START_GOLD } from "./run-rewards";

export const RUN_SAVE_VERSION = 1;
export const RUN_SAVE_KEY = "phantoria_run_v1";

export type RunSavePayload = {
  version: number;
  savedAt: number;
  state: CombatState;
};

/** Valeurs par défaut pour états sauvegardés avant une migration */
export function hydrateCombatState(raw: CombatState): CombatState {
  return {
    ...raw,
    runGold: raw.runGold ?? RUN_START_GOLD,
    runBalls: migrateRunBalls(raw.runBalls),
    shopRerollCount: raw.shopRerollCount ?? 0,
    freeRewardPicked: raw.freeRewardPicked ?? false,
    attackFocusId: raw.attackFocusId ?? null,
    battleMode: raw.battleMode ?? "run",
    storyLevelId: raw.storyLevelId ?? null,
    combatants: raw.combatants.map((c) => ({
      ...c,
      xp: c.xp ?? 0,
    })),
  };
}

export function serializeRun(state: CombatState): string {
  const payload: RunSavePayload = {
    version: RUN_SAVE_VERSION,
    savedAt: Date.now(),
    state: {
      ...state,
      events: state.events.slice(-80),
    },
  };
  return JSON.stringify(payload);
}

export function parseRun(json: string): CombatState | null {
  try {
    const payload = JSON.parse(json) as RunSavePayload;
    if (!payload?.state || payload.version !== RUN_SAVE_VERSION) return null;
    if (payload.state.phase === "won" || payload.state.phase === "lost") return null;
    return hydrateCombatState(payload.state);
  } catch {
    return null;
  }
}

export function isResumablePhase(phase: CombatState["phase"]): boolean {
  return phase === "fighting" || phase === "reward_pick";
}
