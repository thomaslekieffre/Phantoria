import { NextResponse } from "next/server";
import { performWelcomePull } from "@/lib/player/gacha-service";
import { secureGachaRandom } from "@/lib/player/gacha-random";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { result: null, welcomePullsRemaining: 0, error: "Non connecté" },
      { status: 401 },
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        result: null,
        welcomePullsRemaining: 0,
        error: "SUPABASE_SERVICE_ROLE_KEY manquante (invocations serveur)",
      },
      { status: 503 },
    );
  }

  const outcome = await performWelcomePull(admin, user.id, secureGachaRandom);
  const status = outcome.error ? 400 : 200;
  return NextResponse.json(outcome, { status });
}
