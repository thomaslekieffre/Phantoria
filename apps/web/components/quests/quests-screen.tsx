"use client";

import { useEffect } from "react";
import Link from "next/link";
import { GameShell } from "@/components/layout/game-shell";
import { useToast } from "@/components/providers/toast-provider";
import { useSound } from "@/lib/audio/use-sound";
import { useQuests } from "@/lib/quests/use-quests";
import { mainChainQuests } from "@/lib/quests/quests";
import type { QuestStatus } from "@/lib/quests/quest-state";
import "./quests.css";

function QuestRow({
  status,
  onClaim,
  claimingId,
}: {
  status: QuestStatus;
  onClaim: (id: string) => void;
  claimingId: string | null;
}) {
  const { quest, current, target, complete, claimed, readyToClaim } = status;
  const pct = target > 0 ? Math.round((current / target) * 100) : 0;
  const busy = claimingId === quest.id;

  return (
    <li className={`quest-row ${complete ? "quest-row--done" : ""} ${claimed ? "quest-row--claimed" : ""}`}>
      <div className="quest-row__head">
        <div>
          <h3 className="quest-row__title">{quest.title}</h3>
          <p className="quest-row__desc">{quest.description}</p>
        </div>
        <span className="quest-row__reward">{quest.reward.label}</span>
      </div>

      <div className="quest-row__bar" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={target}>
        <span style={{ width: `${pct}%` }} />
      </div>
      <div className="quest-row__foot">
        <span className="quest-row__prog">
          {current} / {target}
        </span>
        {claimed ? (
          <span className="quest-row__tag quest-row__tag--claimed">Réclamé</span>
        ) : readyToClaim ? (
          <button
            type="button"
            className="quest-row__claim"
            onClick={() => onClaim(quest.id)}
            disabled={busy}
          >
            {busy ? "…" : "Réclamer"}
          </button>
        ) : quest.href && !complete ? (
          <Link href={quest.href} className="quest-row__go">
            Y aller
          </Link>
        ) : (
          <span className="quest-row__tag">{complete ? "Terminé" : "En cours"}</span>
        )}
      </div>
    </li>
  );
}

function QuestSection({
  kicker,
  title,
  items,
  onClaim,
  claimingId,
}: {
  kicker: string;
  title: string;
  items: QuestStatus[];
  onClaim: (id: string) => void;
  claimingId: string | null;
}) {
  if (items.length === 0) return null;
  return (
    <section className="quests-section">
      <header className="quests-section__head">
        <p className="quests-section__kicker">{kicker}</p>
        <h2 className="quests-section__title">{title}</h2>
      </header>
      <ul className="quests-list">
        {items.map((s) => (
          <QuestRow key={s.quest.id} status={s} onClaim={onClaim} claimingId={claimingId} />
        ))}
      </ul>
    </section>
  );
}

export function QuestsScreen() {
  const toast = useToast();
  const { play } = useSound();
  const {
    statuses,
    mainSummary,
    pendingRewards,
    claim,
    claimError,
    claimingId,
    claimSuccessTick,
    lastClaimLabel,
  } = useQuests({
    trackLogin: true,
  });

  useEffect(() => {
    if (claimError) {
      toast.error(claimError);
      void play("ui_error");
    }
  }, [claimError, toast, play]);

  useEffect(() => {
    if (claimSuccessTick < 1) return;
    toast.reward(`Récompense : ${lastClaimLabel}`);
    void play("quest_claim");
  }, [claimSuccessTick, lastClaimLabel, toast, play]);

  const main = statuses.filter((s) => s.quest.chainId === mainChainQuests()[0]?.chainId);
  const daily = statuses.filter((s) => s.quest.category === "daily");
  const side = statuses.filter((s) => s.quest.category === "side");

  return (
    <GameShell active="quests">
      <div className="quests-scene">
        <header className="quests-top">
          <div>
            <p className="quests-top__kicker">Journal</p>
            <h1 className="quests-top__title">Quêtes</h1>
          </div>
          {pendingRewards > 0 ? (
            <p className="quests-top__badge">{pendingRewards} récompense{pendingRewards > 1 ? "s" : ""}</p>
          ) : (
            <p className="quests-top__meta">Objectifs campagne &amp; quotidiens</p>
          )}
        </header>

        <div className="quests-body">
          <article className="quests-main-card">
            <p className="quests-main-card__kicker">Quête principale</p>
            <h2 className="quests-main-card__title">{mainSummary.title}</h2>
            <div className="quests-main-card__bar">
              <span style={{ width: `${mainSummary.pct}%` }} />
            </div>
            <p className="quests-main-card__meta">
              {mainSummary.done} / {mainSummary.total} objectifs
            </p>
          </article>

          <QuestSection
            kicker="Chapitre I"
            title="Premiers pas"
            items={main}
            onClaim={claim}
            claimingId={claimingId}
          />
          <QuestSection
            kicker="Aujourd'hui"
            title="Quotidiennes"
            items={daily}
            onClaim={claim}
            claimingId={claimingId}
          />
          <QuestSection
            kicker="Exploration"
            title="Secondaires"
            items={side}
            onClaim={claim}
            claimingId={claimingId}
          />

          {claimError ? <p className="quests-error">{claimError}</p> : null}
        </div>
      </div>
    </GameShell>
  );
}
