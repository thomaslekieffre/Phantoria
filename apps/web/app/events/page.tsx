"use client";

import Link from "next/link";
import { GameShell } from "@/components/layout/game-shell";
import { usePlayer } from "@/components/providers/player-provider";
import {
  eventPageDescription,
  hubEventDisplayStatus,
  toHubEventBanner,
} from "@/lib/hub/event-mechanics";

const STATUS_LABEL = {
  live: "En cours",
  upcoming: "Bientôt",
  ended: "Terminé",
} as const;

export default function EventsPage() {
  const { hubEvents } = usePlayer();

  const visible = hubEvents
    .map((def) => ({ def, status: hubEventDisplayStatus(def), banner: toHubEventBanner(def)! }))
    .filter((row) => row.status !== "ended");

  return (
    <GameShell active="more">
      <div className="page-stub page-stub--wide">
        <h1>Événements</h1>
        {visible.length === 0 ? (
          <p>Aucun événement actif pour le moment.</p>
        ) : (
          <ul className="page-events-list">
            {visible.map(({ def, status, banner }) => (
              <li key={def.id}>
                <article className="page-event-card">
                  <p className="page-event-card__kicker">{STATUS_LABEL[status]}</p>
                  <h2 className="page-event-card__title">{banner.title}</h2>
                  <p className="page-event-card__body">{banner.subtitle}</p>
                  <p className="page-event-card__body">{eventPageDescription(def)}</p>
                  <Link
                    href={banner.href === "/events" ? "/run" : banner.href}
                    className="spirit-sheet__action page-event-card__cta"
                  >
                    {def.kind === "gacha_banner" ? "Voir le gacha" : "Lancer un run"}
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        )}
        <Link href="/" className="page-stub__back">
          ← Retour au sanctuaire
        </Link>
      </div>
    </GameShell>
  );
}
