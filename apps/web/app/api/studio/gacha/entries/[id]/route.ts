import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireStudioAdmin } from "@/lib/studio/admin";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireStudioAdmin(supabase);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const field of ["hub_id", "template_key", "name", "tribe", "hue", "rarity", "sort_order", "pool_id", "weight"] as const) {
    if (field in body) patch[field] = body[field];
  }
  if (typeof patch.weight === "number" && (patch.weight as number) <= 0) {
    return NextResponse.json({ error: "weight doit être > 0" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("gacha_pool_entries")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ entry: data });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireStudioAdmin(supabase);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { error } = await supabase.from("gacha_pool_entries").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
