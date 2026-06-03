"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import type { HubEvent } from "@/lib/hub/hub-events";
import { useQuests } from "@/lib/quests/use-quests";
import { hpTone, isFieldSlotIndex, isSpiritId, type SpiritSlot } from "./roster";
import { SpiritPortrait } from "./spirit-portrait";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { storyCampaignLabel } from "@/lib/story/story-display";

type HubPanelProps = {
  selected: SpiritSlot | null;
  selectedSlotIndex: number | null;
  onRemoveFromWheel?: () => void;
  onClearSelection?: () => void;
  benchPicker?: ReactNode;
  hasSpirits?: boolean;
  spiritCount?: number;
  runsCompleted?: number;
  hubEvent?: HubEvent | null;
};

export function HubPanel({
  selected,
  selectedSlotIndex,
  onRemoveFromWheel,
  onClearSelection,
  benchPicker,
  hasSpirits = true,
  spiritCount = 0,
  runsCompleted = 0,
  hubEvent = null,
}: HubPanelProps) {
  const { mainSummary } = useQuests({ trackLogin: true });
  const onField =
    selectedSlotIndex != null && isFieldSlotIndex(selectedSlotIndex) && selected && !selected.empty;
  const hasSelection = Boolean(selected && !selected.empty && isSpiritId(selected.id));

  return (
    <aside className="hub-panel" aria-label="Fiche et actions">
      <div
        className={`hub-panel__block hub-panel__block--sheet ${hasSelection ? "hub-panel__block--sheet-open" : "hub-panel__block--sheet-empty"}`}
        onClick={
          hasSelection
            ? (e) => {
                if (e.target === e.currentTarget) onClearSelection?.();
              }
            : undefined
        }
        onKeyDown={undefined}
      >
        {hasSelection && selected && isSpiritId(selected.id) ? (
          <section
            className="spirit-sheet"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={undefined}
          >
            <button
              type="button"
              className="hub-panel__sheet-close"
              aria-label="Fermer la fiche"
              onClick={onClearSelection}
            >
              ×
            </button>
            <div className="spirit-sheet__hero" style={{ "--hue": selected.hue } as CSSProperties}>
              <SpiritPortrait id={selected.id} className="spirit-sheet__art" />
              <div className="spirit-sheet__meta">
                <span className="spirit-sheet__tribe">{selected.tribe}</span>
                <h2 className="spirit-sheet__name">
                  {selected.name}
                  {selected.rarity ? <RarityBadge rarity={selected.rarity} size="md" /> : null}
                </h2>
                <span
                  className={`spirit-sheet__status ${onField ? "spirit-sheet__status--on" : ""}`}
                >
                  {onField
                    ? `Sur le terrain · empl. ${(selectedSlotIndex ?? 0) + 1}`
                    : `En réserve · empl. ${(selectedSlotIndex ?? 0) + 1}`}
                </span>
              </div>
            </div>

            <div className="spirit-sheet__stat">
              <div className="spirit-sheet__stat-head">
                <span>Points de vie</span>
                <span className="spirit-sheet__stat-val">{selected.hp}%</span>
              </div>
              <div
                className={`spirit-sheet__hp spirit-sheet__hp--${hpTone(selected.hp)}`}
                role="progressbar"
                aria-valuenow={selected.hp}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${selected.hp}%` }} />
              </div>
            </div>

            <p className="spirit-sheet__hint">
              2 clics sur la roue pour échanger. Les 3 emplacements devant (haut) partent en combat.
            </p>

            {onRemoveFromWheel ? (
              <button
                type="button"
                className="spirit-sheet__action spirit-sheet__action--ghost"
                onClick={onRemoveFromWheel}
              >
                Retirer de la roue
              </button>
            ) : null}
          </section>
        ) : (
          <section className="spirit-sheet spirit-sheet--empty">
            <p className="spirit-sheet__placeholder">
              {hasSpirits
                ? "Sélectionne un emplacement sur la roue"
                : "Roue vide — va au gacha pour invoquer"}
            </p>
            {!hasSpirits ? (
              <Link href="/gacha" className="spirit-sheet__action">
                Ouvrir le gacha
              </Link>
            ) : null}
          </section>
        )}
      </div>

      {benchPicker ? <div className="hub-panel__block hub-panel__block--bench">{benchPicker}</div> : null}

      <div className="hub-panel__block hub-panel__block--stats hub-panel__stats">
        <div className="hub-panel__stat">
          <span className="hub-panel__stat-val">{runsCompleted}</span>
          <span className="hub-panel__stat-lbl">Runs</span>
        </div>
        <div className="hub-panel__stat">
          <span className="hub-panel__stat-val">{spiritCount}</span>
          <span className="hub-panel__stat-lbl">Esprits</span>
        </div>
      </div>

      <div className="hub-panel__block hub-panel__block--quest">
        <Link href="/quests" className="hub-panel__quest">
          <span className="hub-panel__quest-kicker">Quête active</span>
          <span className="hub-panel__quest-title">{mainSummary.title}</span>
          <span className="hub-panel__quest-bar">
            <span style={{ width: `${mainSummary.pct}%` }} />
          </span>
          <span className="hub-panel__quest-meta">
            {mainSummary.done} / {mainSummary.total} objectifs
          </span>
        </Link>
      </div>

      {hubEvent ? (
        <div className="hub-panel__block hub-panel__block--event">
          <Link href={hubEvent.href} className="hub-panel__event">
            <span className="hub-panel__event-dot" />
            <span className="hub-panel__event-body">
              <span className="hub-panel__event-kicker">Événement</span>
              <span className="hub-panel__event-title">{hubEvent.title}</span>
            </span>
            <span className="hub-panel__event-chevron" aria-hidden>
              ›
            </span>
          </Link>
        </div>
      ) : null}

      <div className="hub-panel__block hub-panel__block--plays hub-panel__plays">
        {hasSpirits ? (
          <Link href="/run" className="play play--run">
            <span className="play__label">Roguelite</span>
            <span className="play__title">
              Lancer un run <span className="play__emoji" aria-hidden>🚀</span>
            </span>
            <span className="play__desc">Vagues · capture · roue ×6</span>
          </Link>
        ) : (
          <span className="play play--run play--locked" aria-disabled>
            <span className="play__label">Roguelite</span>
            <span className="play__title">Run verrouillé</span>
            <span className="play__desc">Invoque un esprit au gacha</span>
          </span>
        )}
        {hasSpirits ? (
          <Link href="/story" className="play play--story">
            <span className="play__label">Campagne</span>
            <span className="play__title">Mode Histoire</span>
            <span className="play__desc">{storyCampaignLabel()}</span>
          </Link>
        ) : (
          <Link href="/gacha" className="play play--story">
            <span className="play__label">Campagne</span>
            <span className="play__title">Gacha d&apos;abord</span>
            <span className="play__desc">Esprits requis pour l&apos;histoire</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
