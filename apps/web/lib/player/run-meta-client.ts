import type { RunMetaOutcome, RunMetaReward } from "@phantoria/game-core";

type ClaimResponse = {
  reward: RunMetaReward | null;
  error?: string;
};

export async function claimRunMetaReward(
  wave: number,
  outcome: RunMetaOutcome,
): Promise<ClaimResponse> {
  const res = await fetch("/api/run/meta-reward", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wave, outcome }),
  });

  const body = (await res.json()) as ClaimResponse;
  if (!res.ok) {
    return { reward: null, error: body.error ?? "Récompense run impossible" };
  }
  return body;
}
