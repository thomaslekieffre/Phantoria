import { NextResponse } from "next/server";
import { STANDARD_MULTI_PULL_COUNT } from "@/lib/player/gacha-pool";
import { performStandardPull, type StandardPullPayment } from "@/lib/player/gacha-service";
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
      { results: [], gachaPityStandard: 0, error: "Non connecté" },
      { status: 401 },
    );
  }

  let body: { payment?: StandardPullPayment; count?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { results: [], gachaPityStandard: 0, error: "Corps invalide" },
      { status: 400 },
    );
  }

  const payment = body.payment;
  const count = body.count ?? 1;

  if (payment !== "ticket" && payment !== "gems") {
    return NextResponse.json(
      { results: [], gachaPityStandard: 0, error: "Paiement invalide" },
      { status: 400 },
    );
  }

  if (count !== 1 && count !== STANDARD_MULTI_PULL_COUNT) {
    return NextResponse.json(
      { results: [], gachaPityStandard: 0, error: "Nombre d'invocations invalide" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        results: [],
        gachaPityStandard: 0,
        error: "SUPABASE_SERVICE_ROLE_KEY manquante (invocations serveur)",
      },
      { status: 503 },
    );
  }

  const outcome = await performStandardPull(admin, user.id, payment, count, secureGachaRandom);
  const status = outcome.error ? 400 : 200;
  return NextResponse.json(outcome, { status });
}
