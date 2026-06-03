import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireStudioAdmin } from "@/lib/studio/admin";

export type HubEventRow = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

export async function GET() {
  const supabase = await createClient();
  const auth = await requireStudioAdmin(supabase);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data, error } = await supabase
    .from("hub_events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data as HubEventRow[] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireStudioAdmin(supabase);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as Partial<HubEventRow>;
  if (!body.id?.trim() || !body.title?.trim() || !body.subtitle?.trim()) {
    return NextResponse.json({ error: "id, title et subtitle requis" }, { status: 400 });
  }

  const row = {
    id: body.id.trim(),
    title: body.title.trim(),
    subtitle: body.subtitle.trim(),
    href: body.href?.trim() || "/events",
    active: Boolean(body.active),
    starts_at: body.starts_at || null,
    ends_at: body.ends_at || null,
  };

  const { data, error } = await supabase.from("hub_events").insert(row).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ event: data });
}
