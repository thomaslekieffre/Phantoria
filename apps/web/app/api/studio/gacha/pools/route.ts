import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireStudioAdmin } from "@/lib/studio/admin";
import type { GachaPoolRow } from "@/app/api/studio/gacha/route";

const POOL_ID_RE = /^[a-z][a-z0-9-]{1,48}$/;

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireStudioAdmin(supabase);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json()) as Partial<GachaPoolRow>;
  const id = body.id?.trim().toLowerCase();
  if (!id || !POOL_ID_RE.test(id)) {
    return NextResponse.json(
      { error: "ID invalide (a-z, 0-9, tirets, min 2 car., ex: mon-event-2026)" },
      { status: 400 },
    );
  }

  const row = {
    id,
    ticket_cost: body.ticket_cost ?? 1,
    gem_cost: body.gem_cost ?? 50,
    multi_count: body.multi_count ?? 10,
    active: body.active ?? true,
  };

  const { data, error } = await supabase.from("gacha_pools").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ pool: data });
}
