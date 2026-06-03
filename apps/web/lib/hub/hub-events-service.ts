import type { SupabaseClient } from "@supabase/supabase-js";
import {
  pickHubEventForDisplay,
  resolveGameEventEffects,
  rowToHubEventDef,
  toHubEventBanner,
  type GameEventEffects,
  type HubEvent,
  type HubEventDef,
} from "@/lib/hub/event-mechanics";

type HubEventRow = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  kind?: string;
  config?: unknown;
  priority?: number;
};

const SELECT =
  "id, title, subtitle, href, active, starts_at, ends_at, kind, config, priority";

/** Events actifs en DB (flag `active`), sans fallback fictif. */
export async function fetchHubEventsCatalog(
  supabase?: SupabaseClient | null,
): Promise<HubEventDef[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("hub_events")
    .select(SELECT)
    .eq("active", true)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];

  return (data as HubEventRow[]).map(rowToHubEventDef);
}

/** @deprecated Utiliser fetchHubEventsCatalog */
export async function fetchActiveHubEvents(
  supabase?: SupabaseClient | null,
): Promise<HubEventDef[]> {
  return fetchHubEventsCatalog(supabase);
}

export async function fetchGameEventEffects(
  supabase?: SupabaseClient | null,
): Promise<GameEventEffects> {
  const events = await fetchHubEventsCatalog(supabase);
  return resolveGameEventEffects(events);
}

/** Bandeau principal — uniquement depuis la DB */
export async function fetchActiveHubEvent(
  supabase?: SupabaseClient | null,
): Promise<HubEvent | null> {
  const events = await fetchHubEventsCatalog(supabase);
  return toHubEventBanner(pickHubEventForDisplay(events));
}
