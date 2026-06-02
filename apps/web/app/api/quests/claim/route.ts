import { NextResponse } from "next/server";
import { claimQuestRewardServer } from "@/lib/player/quest-service";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ reward: null, error: "Non connecté" }, { status: 401 });
  }

  let body: { questId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reward: null, error: "Corps invalide" }, { status: 400 });
  }

  const questId = body.questId;
  if (typeof questId !== "string" || !questId.trim()) {
    return NextResponse.json({ reward: null, error: "Quête invalide" }, { status: 400 });
  }

  const result = await claimQuestRewardServer(supabase, user.id, questId.trim());
  const status = result.error ? 400 : 200;
  return NextResponse.json(result, { status });
}
