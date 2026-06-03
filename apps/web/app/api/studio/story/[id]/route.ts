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
  for (const field of ["zone_id", "level_index", "title", "intro", "outro", "enemies", "stars_round3", "active"] as const) {
    if (field in body) {
      if (field === "enemies" && typeof body.enemies === "string") {
        try {
          patch.enemies = JSON.parse(body.enemies as string);
        } catch {
          return NextResponse.json({ error: "enemies JSON invalide" }, { status: 400 });
        }
      } else {
        patch[field] = body[field];
      }
    }
  }

  const { data, error } = await supabase
    .from("story_levels")
    .update(patch)
    .eq("id", decodeURIComponent(id))
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ level: data });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireStudioAdmin(supabase);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { error } = await supabase.from("story_levels").delete().eq("id", decodeURIComponent(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
