"use client";

import {
  RUN_SAVE_KEY,
  parseRun,
  serializeRun,
  isResumablePhase,
  type CombatState,
} from "@phantoria/game-core";

export function loadSavedRun(): CombatState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(RUN_SAVE_KEY);
  if (!raw) return null;
  const state = parseRun(raw);
  if (!state || !isResumablePhase(state.phase)) return null;
  return state;
}

export function saveRun(state: CombatState): void {
  if (typeof window === "undefined") return;
  if (!isResumablePhase(state.phase)) {
    window.localStorage.removeItem(RUN_SAVE_KEY);
    return;
  }
  window.localStorage.setItem(RUN_SAVE_KEY, serializeRun(state));
}

export function clearSavedRun(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(RUN_SAVE_KEY);
}

export function getSavedRunSummary(): { wave: number; phase: CombatState["phase"] } | null {
  const state = loadSavedRun();
  if (!state) return null;
  return { wave: state.wave, phase: state.phase };
}
