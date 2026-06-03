import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireStudioAdmin } from "@/lib/studio/admin";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireStudioAdmin(supabase);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  if (typeof body.title === "string") patch.title = body.title.trim();
  if (typeof body.subtitle === "string") patch.subtitle = body.subtitle.trim();
  if (typeof body.href === "string") patch.href = body.href.trim();
  if (typeof body.active === "boolean") patch.active = body.active;
  if (body.starts_at === null || typeof body.starts_at === "string") patch.starts_at = body.starts_at;
  if (body.ends_at === null || typeof body.ends_at === "string") patch.ends_at = body.ends_at;

  const { data, error } = await supabase.from("hub_events").update(patch).eq("id", id).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ event: data });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireStudioAdmin(supabase);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { error } = await supabase.from("hub_events").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
