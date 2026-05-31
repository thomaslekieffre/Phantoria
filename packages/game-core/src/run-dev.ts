import { getRunWaveKind, RUN_MAX_WAVES } from "./run-waves";
import type { CombatEngine } from "./combat-engine";

/** Prochaine vague boss/méga/final après `wave` */
export function nextBossWave(wave: number): number {
  let w = wave + 1;
  while (w <= RUN_MAX_WAVES && getRunWaveKind(w) === "normal") {
    w += 1;
  }
  return Math.min(w, RUN_MAX_WAVES);
}

/** Saute à la prochaine vague boss (depuis combat ou boutique) */
export function devJumpToBoss(engine: CombatEngine): boolean {
  const state = engine.getState();
  if (state.phase === "lost" || state.phase === "won") return false;

  const target = nextBossWave(state.wave);
  if (target <= state.wave) return false;

  return engine.devForceWave(target);
}
