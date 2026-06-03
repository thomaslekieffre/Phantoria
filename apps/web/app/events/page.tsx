"use client";

import Link from "next/link";
import { GameShell } from "@/components/layout/game-shell";
import { usePlayer } from "@/components/providers/player-provider";

export default function EventsPage() {
  const { hubEvent } = usePlayer();

  return (
    <GameShell active="more">
      <div className="page-stub page-stub--wide">
        <h1>Événements</h1>
        {hubEvent ? (
          <article className="page-event-card">
            <p className="page-event-card__kicker">En cours</p>
            <h2 className="page-event-card__title">{hubEvent.title}</h2>
            <p className="page-event-card__body">{hubEvent.subtitle}</p>
            <p className="page-event-card__body">
              Pendant cet événement, les captures en run sont mises en avant — termine des runs pour
              progresser et remplir ta roue.
            </p>
            <Link href={hubEvent.href === "/events" ? "/run" : hubEvent.href} className="spirit-sheet__action page-event-card__cta">
              Lancer un run
            </Link>
          </article>
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
