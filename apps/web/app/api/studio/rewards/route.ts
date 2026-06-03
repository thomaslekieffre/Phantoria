import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireStudioAdmin } from "@/lib/studio/admin";

export type RunRewardRow = {
  id: string;
  payload: Record<string, unknown>;
  sort_order: number;
  active: boolean;
};

export async function GET() {
  const supabase = await createClient();
  const auth = await requireStudioAdmin(supabase);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await supabase.from("run_rewards").select("*").order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rewards: data as RunRewardRow[] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireStudioAdmin(supabase);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json()) as Partial<RunRewardRow>;
  if (!body.id?.trim() || !body.payload) {
    return NextResponse.json({ error: "id et payload requis" }, { status: 400 });
  }

  let payload = body.payload;
  if (typeof body.payload === "string") {
    try {
      payload = JSON.parse(body.payload);
    } catch {
      return NextResponse.json({ error: "payload JSON invalide" }, { status: 400 });
    }
  }

  const row = {
    id: body.id.trim(),
    payload,
    sort_order: body.sort_order ?? 0,
    active: body.active ?? true,
  };

  const { data, error } = await supabase.from("run_rewards").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ reward: data });
}
