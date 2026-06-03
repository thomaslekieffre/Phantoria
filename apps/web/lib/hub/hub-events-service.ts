import type { SupabaseClient } from "@supabase/supabase-js";
import type { HubEvent } from "@/lib/hub/hub-events";
import { FALLBACK_HUB_EVENT } from "@/lib/hub/hub-events";

type HubEventRow = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

function rowToEvent(row: HubEventRow): HubEvent {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    href: row.href,
    active: row.active,
  };
}

function isWithinWindow(row: HubEventRow, now = Date.now()): boolean {
  if (row.starts_at && Date.parse(row.starts_at) > now) return false;
  if (row.ends_at && Date.parse(row.ends_at) < now) return false;
  return true;
}

/** Événement hub actif — DB Supabase ou fallback local. */
export async function fetchActiveHubEvent(
  supabase?: SupabaseClient | null,
): Promise<HubEvent | null> {
  if (!supabase) return FALLBACK_HUB_EVENT;

  const { data, error } = await supabase
    .from("hub_events")
    .select("id, title, subtitle, href, active, starts_at, ends_at")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error || !data?.length) return FALLBACK_HUB_EVENT;

  const match = (data as HubEventRow[]).find((row) => row.active && isWithinWindow(row));
  return match ? rowToEvent(match) : null;
}
