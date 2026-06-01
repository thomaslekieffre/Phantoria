import Link from "next/link";
import { GameShell } from "@/components/layout/game-shell";
import { getActiveHubEvent } from "@/lib/hub/hub-events";

export default function EventsPage() {
  const event = getActiveHubEvent();

  return (
    <GameShell active="more">
      <div className="page-stub page-stub--wide">
        <h1>Événements</h1>
        {event ? (
          <>
            <article className="page-event-card">
              <p className="page-event-card__kicker">En cours</p>
              <h2 className="page-event-card__title">{event.title}</h2>
              <p className="page-event-card__body">{event.subtitle}</p>
              <p className="page-event-card__body">
                Pendant cet événement, les captures en run sont mises en avant — termine des runs pour
                progresser et remplir ta roue.
              </p>
              <Link href={event.href} className="spirit-sheet__action page-event-card__cta">
                {event.href === "/run" ? "Lancer un run" : "Voir"}
              </Link>
            </article>
          </>
        ) : (
          <p>Aucun événement actif pour le moment.</p>
        )}
        <Link href="/" className="page-stub__back">
          ← Retour au sanctuaire
        </Link>
      </div>
    </GameShell>
  );
}
