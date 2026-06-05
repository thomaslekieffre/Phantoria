import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireStudioAdmin } from "@/lib/studio/admin";

export type SpiritTemplateRow = {
  template_key: string;
  kind: "catalog" | "enemy";
  hub_id: string | null;
  name: string;
  tribe: string;
  rarity: string;
  payload: Record<string, unknown>;
  active: boolean;
  sort_order: number;
  portrait_url?: string | null;
  updated_at: string;
};

export async function GET() {
  const supabase = await createClient();
  const auth = await requireStudioAdmin(supabase);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await supabase
    .from("spirit_templates")
    .select("*")
    .order("sort_order")
    .order("template_key");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ spirits: data as SpiritTemplateRow[] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireStudioAdmin(supabase);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json()) as Partial<SpiritTemplateRow>;
  if (!body.template_key?.trim() || !body.name?.trim() || !body.kind) {
    return NextResponse.json({ error: "template_key, name et kind requis" }, { status: 400 });
  }

  const row = {
    template_key: body.template_key.trim(),
    kind: body.kind,
    hub_id: body.hub_id?.trim() || null,
    name: body.name.trim(),
    tribe: body.tribe?.trim() || "vaillants",
    rarity: body.rarity?.trim() || "E",
    payload: body.payload ?? {},
    active: body.active ?? true,
    sort_order: body.sort_order ?? 0,
    portrait_url: body.portrait_url?.trim() || null,
  };

  const { data, error } = await supabase.from("spirit_templates").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ spirit: data });
}
