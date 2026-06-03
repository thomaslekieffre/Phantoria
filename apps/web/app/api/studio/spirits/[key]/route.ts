import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireStudioAdmin } from "@/lib/studio/admin";

type Params = { params: Promise<{ key: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { key } = await params;
  const supabase = await createClient();
  const auth = await requireStudioAdmin(supabase);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const field of ["hub_id", "name", "tribe", "rarity", "payload", "active", "sort_order", "kind"] as const) {
    if (field in body) patch[field] = body[field];
  }
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("spirit_templates")
    .update(patch)
    .eq("template_key", decodeURIComponent(key))
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ spirit: data });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { key } = await params;
  const supabase = await createClient();
  const auth = await requireStudioAdmin(supabase);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { error } = await supabase.from("spirit_templates").delete().eq("template_key", decodeURIComponent(key));
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
