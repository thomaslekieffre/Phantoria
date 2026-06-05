import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireStudioAdmin } from "@/lib/studio/admin";

export type GachaPoolRow = {
  id: string;
  ticket_cost: number;
  gem_cost: number;
  multi_count: number;
  active: boolean;
  banner_url?: string | null;
};

export type GachaEntryRow = {
  id: string;
  pool_id: string;
  hub_id: string;
  template_key: string;
  name: string;
  tribe: string;
  hue: string;
  rarity: string;
  sort_order: number;
  weight: number;
};

export async function GET() {
  const supabase = await createClient();
  const auth = await requireStudioAdmin(supabase);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const [poolsRes, entriesRes] = await Promise.all([
    supabase.from("gacha_pools").select("*").order("id"),
    supabase.from("gacha_pool_entries").select("*").order("sort_order"),
  ]);

  if (poolsRes.error) return NextResponse.json({ error: poolsRes.error.message }, { status: 500 });
  if (entriesRes.error) return NextResponse.json({ error: entriesRes.error.message }, { status: 500 });

  return NextResponse.json({
    pools: poolsRes.data as GachaPoolRow[],
    entries: entriesRes.data as GachaEntryRow[],
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireStudioAdmin(supabase);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json()) as Partial<GachaEntryRow>;
  if (!body.pool_id || !body.hub_id || !body.template_key || !body.name) {
    return NextResponse.json({ error: "pool_id, hub_id, template_key, name requis" }, { status: 400 });
  }

  const row = {
    pool_id: body.pool_id,
    hub_id: body.hub_id,
    template_key: body.template_key,
    name: body.name,
    tribe: body.tribe ?? "",
    hue: body.hue ?? "#86efac",
    rarity: body.rarity ?? "E",
    sort_order: body.sort_order ?? 0,
    weight: typeof body.weight === "number" && body.weight > 0 ? body.weight : 100,
  };

  const { data, error } = await supabase.from("gacha_pool_entries").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ entry: data });
}
