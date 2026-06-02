import { NextResponse } from "next/server";
import { syncStoryLevelToDb } from "@/lib/player/quest-service";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  let body: { levelId?: string; stars?: number; round?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const { levelId, stars, round } = body;
  if (typeof levelId !== "string" || !levelId.trim()) {
    return NextResponse.json({ error: "Niveau invalide" }, { status: 400 });
  }
  if (typeof stars !== "number" || stars < 1 || stars > 3) {
    return NextResponse.json({ error: "Étoiles invalides" }, { status: 400 });
  }
  if (typeof round !== "number" || round < 1) {
    return NextResponse.json({ error: "Round invalide" }, { status: 400 });
  }

  const result = await syncStoryLevelToDb(
    supabase,
    levelId.trim(),
    stars as 1 | 2 | 3,
    round,
  );
  const status = result.error ? 400 : 200;
  return NextResponse.json(result, { status });
}
