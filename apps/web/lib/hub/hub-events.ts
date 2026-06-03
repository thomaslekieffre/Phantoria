/** Événements hub — fallback hors ligne si table Supabase absente. */

export type HubEvent = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  /** Afficher la pastille « actif » sur le bandeau */
  active: boolean;
};

export const FALLBACK_HUB_EVENT: HubEvent = {
  id: "lune-captures",
  title: "Lune des captures",
  subtitle: "Bonus capture en run — lance une partie",
  href: "/events",
  active: true,
};

/** @deprecated Préférer hubEvent depuis PlayerProvider ou fetchActiveHubEvent */
export function getActiveHubEvent(): HubEvent | null {
  return FALLBACK_HUB_EVENT;
}
