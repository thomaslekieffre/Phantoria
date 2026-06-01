/** Événements hub affichés au sanctuaire (config v0 — pas encore en DB). */

export type HubEvent = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  /** Afficher la pastille « actif » sur le bandeau */
  active: boolean;
};

const EVENTS: HubEvent[] = [
  {
    id: "lune-captures",
    title: "Lune des captures",
    subtitle: "Bonus capture en run — lance une partie",
    href: "/events",
    active: true,
  },
];

export function getActiveHubEvent(): HubEvent | null {
  return EVENTS.find((e) => e.active) ?? null;
}
