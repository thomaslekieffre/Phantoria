import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireStudioAdmin } from "@/lib/studio/admin";
import { seedStudioContentFromCodebase } from "@/lib/studio/seed-content";

export async function POST() {
  const supabase = await createClient();
  const auth = await requireStudioAdmin(supabase);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const report = await seedStudioContentFromCodebase(supabase);
    return NextResponse.json({ ok: true, report });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur seed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
