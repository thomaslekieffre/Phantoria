import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireStudioAdmin } from "@/lib/studio/admin";

export type StoryLevelRow = {
  id: string;
  zone_id: number;
  level_index: number;
  title: string;
  intro: string;
  outro: string;
  enemies: unknown[];
  stars_round3: number;
  active: boolean;
};

export type StoryZoneRow = {
  id: number;
  name: string;
  emoji: string;
  tribe: string;
  level_count: number;
  sort_order: number;
};

export async function GET() {
  const supabase = await createClient();
  const auth = await requireStudioAdmin(supabase);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const [zonesRes, levelsRes] = await Promise.all([
    supabase.from("story_zones").select("*").order("sort_order"),
    supabase.from("story_levels").select("*").order("zone_id").order("level_index"),
  ]);

  if (zonesRes.error) return NextResponse.json({ error: zonesRes.error.message }, { status: 500 });
  if (levelsRes.error) return NextResponse.json({ error: levelsRes.error.message }, { status: 500 });

  return NextResponse.json({
    zones: zonesRes.data as StoryZoneRow[],
    levels: levelsRes.data as StoryLevelRow[],
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireStudioAdmin(supabase);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json()) as Partial<StoryLevelRow>;
  if (!body.id?.trim() || !body.zone_id || !body.title?.trim()) {
    return NextResponse.json({ error: "id, zone_id, title requis" }, { status: 400 });
  }

  let enemies = body.enemies ?? [];
  if (typeof body.enemies === "string") {
    try {
      enemies = JSON.parse(body.enemies);
    } catch {
      return NextResponse.json({ error: "enemies JSON invalide" }, { status: 400 });
    }
  }

  const row = {
    id: body.id.trim(),
    zone_id: body.zone_id,
    level_index: body.level_index ?? 1,
    title: body.title.trim(),
    intro: body.intro ?? "",
    outro: body.outro ?? "",
    enemies,
    stars_round3: body.stars_round3 ?? 10,
    active: body.active ?? true,
  };

  const { data, error } = await supabase.from("story_levels").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ level: data });
}
