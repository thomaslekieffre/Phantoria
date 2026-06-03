"use client";

import {
  hydrateCombatState,
  isResumablePhase,
  parseRun,
  serializeRun,
  RUN_SAVE_KEY,
  type CombatState,
} from "@phantoria/game-core";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseEnabled } from "@/lib/supabase/config";

function loadLocal(): CombatState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(RUN_SAVE_KEY);
  if (!raw) return null;
  const state = parseRun(raw);
  if (!state || !isResumablePhase(state.phase)) return null;
  return state;
}

function saveLocal(state: CombatState): void {
  if (typeof window === "undefined") return;
  if (!isResumablePhase(state.phase)) {
    window.localStorage.removeItem(RUN_SAVE_KEY);
    return;
  }
  window.localStorage.setItem(RUN_SAVE_KEY, serializeRun(state));
}

function clearLocal(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(RUN_SAVE_KEY);
}

let cloudSaveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingCloudState: CombatState | null = null;

async function flushCloudSave(): Promise<void> {
  const state = pendingCloudState;
  pendingCloudState = null;
  if (!state || !isSupabaseEnabled()) return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.rpc("upsert_active_run", { p_state: state });
  if (error) console.warn("[run] upsert_active_run", error.message);
}

function scheduleCloudSave(state: CombatState): Promise<void> {
  pendingCloudState = state;
  if (cloudSaveTimer) clearTimeout(cloudSaveTimer);

  return new Promise((resolve) => {
    cloudSaveTimer = setTimeout(() => {
      cloudSaveTimer = null;
      void flushCloudSave().then(resolve);
    }, 750);
  });
}

export async function loadSavedRun(): Promise<CombatState | null> {
  if (!isSupabaseEnabled()) return loadLocal();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return loadLocal();

  const { data, error } = await supabase
    .from("active_runs")
    .select("state_json")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data?.state_json) {
    return loadLocal();
  }

  const hydrated = hydrateCombatState(data.state_json as CombatState);
  if (!isResumablePhase(hydrated.phase)) {
    await clearSavedRun();
    return null;
  }

  return hydrated;
}

export async function saveRun(state: CombatState): Promise<void> {
  if (!isSupabaseEnabled()) {
    saveLocal(state);
    return;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isResumablePhase(state.phase)) {
    if (cloudSaveTimer) {
      clearTimeout(cloudSaveTimer);
      cloudSaveTimer = null;
    }
    pendingCloudState = null;
    clearLocal();
    if (user) {
      if (state.phase === "won" || state.phase === "lost") {
        const { error } = await supabase.rpc("upsert_active_run", { p_state: state });
        if (error) console.warn("[run] upsert_active_run", error.message);
      } else {
        await supabase.rpc("clear_active_run");
      }
    }
    return;
  }

  saveLocal(state);

  if (!user) return;

  await scheduleCloudSave(state);
}

export async function clearSavedRun(): Promise<void> {
  if (cloudSaveTimer) {
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer = null;
  }
  pendingCloudState = null;
  clearLocal();
  if (!isSupabaseEnabled()) return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.rpc("clear_active_run");
}

export async function getSavedRunSummary(): Promise<{
  wave: number;
  phase: "fighting" | "reward_pick";
} | null> {
  const state = await loadSavedRun();
  if (!state || !isResumablePhase(state.phase)) return null;
  return { wave: state.wave, phase: state.phase as "fighting" | "reward_pick" };
}

export function useCloudSave(): boolean {
  return isSupabaseEnabled();
}
