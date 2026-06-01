import { NextResponse } from "next/server";
import type { RunMetaOutcome } from "@phantoria/game-core";
import { claimRunMetaReward } from "@/lib/player/run-meta-service";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ reward: null, error: "Non connecté" }, { status: 401 });
  }

  let body: { wave?: number; outcome?: RunMetaOutcome };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reward: null, error: "Corps invalide" }, { status: 400 });
  }

  const wave = body.wave;
  const outcome = body.outcome;

  if (typeof wave !== "number" || wave < 1 || !Number.isInteger(wave)) {
    return NextResponse.json({ reward: null, error: "Vague invalide" }, { status: 400 });
  }

  if (outcome !== "won" && outcome !== "lost") {
    return NextResponse.json({ reward: null, error: "Résultat invalide" }, { status: 400 });
  }

  const result = await claimRunMetaReward(supabase, user.id, wave, outcome);
  const status = result.error ? 400 : 200;
  return NextResponse.json(result, { status });
}
