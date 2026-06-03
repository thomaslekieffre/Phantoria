import { NextResponse } from "next/server";
import { syncQuestDailyFlagRemote } from "@/lib/player/quest-service";
import { createClient } from "@/lib/supabase/server";

const FLAGS = ["login"] as const;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Non connecté" }, { status: 401 });
  }

  let body: { flag?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Corps invalide" }, { status: 400 });
  }

  const flag = body.flag;
  if (!FLAGS.includes(flag as (typeof FLAGS)[number])) {
    return NextResponse.json({ ok: false, error: "Flag invalide" }, { status: 400 });
  }

  await syncQuestDailyFlagRemote(supabase, flag as (typeof FLAGS)[number]);
  return NextResponse.json({ ok: true });
}
