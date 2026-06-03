import { NextResponse } from "next/server";
import { isWithinEventWindow, rowToHubEventDef } from "@/lib/hub/event-mechanics";
import { performEventGachaPull, type StandardPullPayment } from "@/lib/player/gacha-service";
import { STANDARD_MULTI_PULL_COUNT } from "@/lib/player/gacha-pool";
import { secureGachaRandom } from "@/lib/player/gacha-random";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ results: [], gachaPityStandard: 0, error: "Non connecté" }, { status: 401 });
  }

  let body: { eventId?: string; payment?: StandardPullPayment; count?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ results: [], gachaPityStandard: 0, error: "Corps invalide" }, { status: 400 });
  }

  const eventId = body.eventId?.trim();
  const payment = body.payment;
  const count = body.count ?? 1;

  if (!eventId) {
    return NextResponse.json({ results: [], gachaPityStandard: 0, error: "eventId requis" }, { status: 400 });
  }
  if (payment !== "ticket" && payment !== "gems") {
    return NextResponse.json({ results: [], gachaPityStandard: 0, error: "Paiement invalide" }, { status: 400 });
  }
  if (count !== 1 && count !== STANDARD_MULTI_PULL_COUNT) {
    return NextResponse.json({ results: [], gachaPityStandard: 0, error: "Nombre d'invocations invalide" }, { status: 400 });
  }

  const { data: row, error: evErr } = await supabase
    .from("hub_events")
    .select("id, title, subtitle, href, active, starts_at, ends_at, kind, config, priority")
    .eq("id", eventId)
    .single();

  if (evErr || !row) {
    return NextResponse.json({ results: [], gachaPityStandard: 0, error: "Event introuvable" }, { status: 404 });
  }

  const event = rowToHubEventDef(row);
  if (event.kind !== "gacha_banner" || !event.active || !isWithinEventWindow(event.starts_at, event.ends_at)) {
    return NextResponse.json({ results: [], gachaPityStandard: 0, error: "Event gacha inactif" }, { status: 400 });
  }

  const cfg = event.config as import("@/lib/hub/event-mechanics").GachaBannerEventConfig;
  const { poolId, ticketCost, gemCost, multiCount } = cfg;
  if (!poolId) {
    return NextResponse.json({ results: [], gachaPityStandard: 0, error: "poolId manquant sur l'event" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { results: [], gachaPityStandard: 0, error: "SUPABASE_SERVICE_ROLE_KEY manquante" },
      { status: 503 },
    );
  }

  const outcome = await performEventGachaPull(
    admin,
    user.id,
    poolId,
    payment,
    count,
    { ticketCost, gemCost, multiCount },
    secureGachaRandom,
  );
  return NextResponse.json(outcome, { status: outcome.error ? 400 : 200 });
}
