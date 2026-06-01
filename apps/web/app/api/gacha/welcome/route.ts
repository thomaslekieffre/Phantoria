import { NextResponse } from "next/server";
import { performWelcomePull } from "@/lib/player/gacha-service";
import { secureGachaRandom } from "@/lib/player/gacha-random";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { results: [], welcomePullsRemaining: 0, error: "Non connecté" },
      { status: 401 },
    );
  }

  let all = false;
  try {
    const body = await request.json();
    all = Boolean(body?.all);
  } catch {
    /* corps vide = ×1 */
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        results: [],
        welcomePullsRemaining: 0,
        error: "SUPABASE_SERVICE_ROLE_KEY manquante (invocations serveur)",
      },
      { status: 503 },
    );
  }

  const outcome = await performWelcomePull(admin, user.id, { all }, secureGachaRandom);
  const status = outcome.error ? 400 : 200;
  return NextResponse.json(outcome, { status });
}
