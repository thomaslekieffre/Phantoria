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
  for (const field of ["payload", "sort_order", "active"] as const) {
    if (field in body) {
      if (field === "payload" && typeof body.payload === "string") {
        try {
          patch.payload = JSON.parse(body.payload as string);
        } catch {
          return NextResponse.json({ error: "payload JSON invalide" }, { status: 400 });
        }
      } else {
        patch[field] = body[field];
      }
    }
  }

  const { data, error } = await supabase
    .from("run_rewards")
    .update(patch)
    .eq("id", decodeURIComponent(id))
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ reward: data });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireStudioAdmin(supabase);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { error } = await supabase.from("run_rewards").delete().eq("id", decodeURIComponent(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
