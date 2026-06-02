"use client";

import Link from "next/link";
import {
  RUN_MAX_WAVES,
  getRunRelicDisplay,
  type RunMetaReward,
} from "@phantoria/game-core";

type RunEndRecapProps = {
  outcome: "won" | "lost";
  wave: number;
  runGold: number;
  relicIds: readonly string[];
  metaReward: RunMetaReward | null;
  metaPending: boolean;
  metaGrantError: string | null;
  onRestart: () => void;
};

export function RunEndRecap({
  outcome,
  wave,
  runGold,
  relicIds,
  metaReward,
  metaPending,
  metaGrantError,
  onRestart,
}: RunEndRecapProps) {
  const isVictory = outcome === "won";
  const relics = getRunRelicDisplay(relicIds);
  const totalRelics = relicIds.length;

  return (
    <div
      className={`run-recap run-recap--${outcome}`}
      role="dialog"
      aria-modal
      aria-label={isVictory ? "Victoire" : "Défaite"}
    >
      <div className="run-recap__card">
        <header className="run-recap__head">
          <span className="run-recap__emoji" aria-hidden>
            {isVictory ? "🏆" : "💀"}
          </span>
          <h2 className="run-recap__title">{isVictory ? "Run terminé !" : "Défaite…"}</h2>
          <p className="run-recap__subtitle">
            Vague {wave}/{RUN_MAX_WAVES}
            {isVictory ? " — victoire totale" : ""}
          </p>
        </header>

        <dl className="run-recap__stats">
          <div className="run-recap__stat">
            <dt>Or gagné</dt>
            <dd>{runGold} €</dd>
          </div>
          <div className="run-recap__stat">
            <dt>Reliques</dt>
            <dd>{totalRelics}</dd>
          </div>
        </dl>

        {relics.length > 0 ? (
          <ul className="run-recap__relics" aria-label="Reliques persistantes">
            {relics.map((r) => (
              <li key={r.id} className="run-recap__relic" title={r.description}>
                <span aria-hidden>{r.emoji}</span>
                <span className="run-recap__relic-name">
                  {r.name}
                  {r.count > 1 ? ` ×${r.count}` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <section className="run-recap__gacha" aria-label="Récompenses gacha">
          <h3 className="run-recap__gacha-title">Récompenses hub</h3>
          {metaPending ? (
            <p className="run-recap__gacha-pending">Crédit en cours…</p>
          ) : metaReward ? (
            <p className="run-recap__gacha-reward">
              <span>+{metaReward.tickets} ticket{metaReward.tickets > 1 ? "s" : ""}</span>
              <span className="run-recap__gacha-sep">·</span>
              <span>+{metaReward.gems} gemme{metaReward.gems > 1 ? "s" : ""}</span>
            </p>
          ) : metaGrantError ? null : (
            <p className="run-recap__gacha-pending">Aucune récompense hub</p>
          )}
          {metaGrantError ? <p className="run-recap__error">{metaGrantError}</p> : null}
          {!metaGrantError && metaReward && metaReward.tickets >= 1 ? (
            <p className="run-recap__gacha-hint">Assez pour un tirage standard !</p>
          ) : null}
        </section>

        <div className="run-recap__actions">
          {metaReward && metaReward.tickets >= 1 ? (
            <Link href="/gacha" className="run-recap__btn run-recap__btn--gacha">
              Tirer au gacha
            </Link>
          ) : null}
          <button type="button" className="run-recap__btn run-recap__btn--primary" onClick={onRestart}>
            {isVictory ? "Nouveau run" : "Recommencer"}
          </button>
        </div>
      </div>
    </div>
  );
}
