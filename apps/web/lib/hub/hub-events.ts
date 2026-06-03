/** Événements hub — fallback hors ligne si table Supabase absente. */

export type { HubEvent, HubEventDef, HubEventKind, GameEventEffects } from "@/lib/hub/event-mechanics";
export { toHubEventBanner } from "@/lib/hub/event-mechanics";

import type { HubEvent } from "@/lib/hub/event-mechanics";

export const FALLBACK_HUB_EVENT: HubEvent = {
  id: "lune-captures",
  title: "Lune des captures",
  subtitle: "Bonus capture en run — lance une partie",
  href: "/run",
  active: true,
};

/** @deprecated Préférer hubEvent depuis PlayerProvider ou fetchActiveHubEvents */
export function getActiveHubEvent(): HubEvent | null {
  return FALLBACK_HUB_EVENT;
}
