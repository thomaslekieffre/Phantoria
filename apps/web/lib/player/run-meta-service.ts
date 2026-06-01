import type { SupabaseClient } from "@supabase/supabase-js";
import type { RunMetaOutcome, RunMetaReward } from "@phantoria/game-core";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeRunMetaReward } from "@phantoria/game-core";
import type { CombatState } from "@phantoria/game-core";

type RpcRow = { tickets: number; gems: number };

/** Via RPC Postgres (recommandé — fonctionne avec la session joueur). */
async function claimViaRpc(
  supabase: SupabaseClient,
  wave: number,
  outcome: RunMetaOutcome,
): Promise<{ reward: RunMetaReward | null; error?: string }> {
  const { data, error } = await supabase.rpc("claim_run_meta_reward", {
    p_wave: wave,
    p_outcome: outcome,
  });

  if (error) {
    return { reward: null, error: error.message };
  }

  const row = data as RpcRow | null;
  if (!row || typeof row.tickets !== "number") {
    return { reward: null, error: "Réponse serveur invalide" };
  }

  return { reward: { tickets: row.tickets, gems: row.gems } };
}

/** Secours si la migration RPC n'est pas encore appliquée. */
async function claimViaAdmin(
  supabase: SupabaseClient,
  userId: string,
  wave: number,
  outcome: RunMetaOutcome,
): Promise<{ reward: RunMetaReward | null; error?: string }> {
  const { data: run, error: runErr } = await supabase
    .from("active_runs")
    .select("state_json")
    .eq("user_id", userId)
    .maybeSingle();

  if (runErr || !run) {
    return { reward: null, error: "Aucune run active à clôturer" };
  }

  const state = run.state_json as CombatState;
  if (state.phase !== outcome) {
    return { reward: null, error: "État de run invalide" };
  }
  if (state.wave !== wave) {
    return { reward: null, error: "Vague incohérente" };
  }

  const reward = computeRunMetaReward(wave, outcome);

  const { data: currencies, error: curErr } = await supabase
    .from("player_currencies")
    .select("gems, tickets")
    .eq("user_id", userId)
    .single();

  if (curErr || !currencies) {
    return { reward: null, error: "Monnaies introuvables" };
  }

  const { error: updateErr } = await supabase
    .from("player_currencies")
    .update({
      tickets: currencies.tickets + reward.tickets,
      gems: currencies.gems + reward.gems,
    })
    .eq("user_id", userId);

  if (updateErr) {
    return { reward: null, error: "Impossible d'ajouter les récompenses" };
  }

  await supabase.from("active_runs").delete().eq("user_id", userId);

  const { data: profile } = await supabase.from("profiles").select("runs_completed").eq("id", userId).single();

  if (profile) {
    await supabase
      .from("profiles")
      .update({ runs_completed: (profile.runs_completed ?? 0) + 1 })
      .eq("id", userId);
  }

  return { reward };
}

export async function claimRunMetaReward(
  sessionClient: SupabaseClient,
  userId: string,
  wave: number,
  outcome: RunMetaOutcome,
): Promise<{ reward: RunMetaReward | null; error?: string }> {
  const rpcResult = await claimViaRpc(sessionClient, wave, outcome);

  if (!rpcResult.error) {
    return rpcResult;
  }

  const rpcMissing =
    rpcResult.error.includes("claim_run_meta_reward") ||
    rpcResult.error.includes("Could not find the function");

  if (!rpcMissing) {
    return rpcResult;
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      reward: null,
      error:
        "Applique la migration claim_run_meta_reward sur Supabase, ou ajoute SUPABASE_SERVICE_ROLE_KEY dans .env.local",
    };
  }

  return claimViaAdmin(admin, userId, wave, outcome);
}
