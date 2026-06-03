import { NextResponse } from "next/server";
import { fetchGameContent } from "@/lib/content/game-content";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const content = await fetchGameContent(supabase);
  return NextResponse.json(content);
}
