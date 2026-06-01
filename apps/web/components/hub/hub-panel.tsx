"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import type { HubEvent } from "@/lib/hub/hub-events";
import { hpTone, isFieldSlotIndex, isSpiritId, type SpiritSlot } from "./roster";
import { SpiritPortrait } from "./spirit-portrait";
import { RarityBadge } from "@/components/ui/rarity-badge";

type HubPanelProps = {
  selected: SpiritSlot | null;
  selectedSlotIndex: number | null;
  onRemoveFromWheel?: () => void;
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
  benchPicker,
  hasSpirits = true,
  spiritCount = 0,
  runsCompleted = 0,
  hubEvent = null,
}: HubPanelProps) {
  const onField =
    selectedSlotIndex != null && isFieldSlotIndex(selectedSlotIndex) && selected && !selected.empty;

  return (
    <aside className="hub-panel" aria-label="Fiche et actions">
      {selected && !selected.empty && isSpiritId(selected.id) ? (
        <section className="spirit-sheet">
          <div
            className="spirit-sheet__hero"
            style={{ "--hue": selected.hue } as CSSProperties}
          >
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

      {benchPicker}

      <div className="hub-panel__section">
        <Link href="/quests" className="hub-panel__quest">
          <span className="hub-panel__quest-kicker">Quête active</span>
          <span className="hub-panel__quest-title">Premiers pas dans le néant</span>
          <span className="hub-panel__quest-bar">
            <span style={{ width: "40%" }} />
          </span>
          <span className="hub-panel__quest-meta">2 / 5 objectifs</span>
        </Link>
      </div>

      <div className="hub-panel__section hub-panel__stats">
        <div className="hub-panel__stat">
          <span className="hub-panel__stat-val">{runsCompleted}</span>
          <span className="hub-panel__stat-lbl">Runs</span>
        </div>
        <div className="hub-panel__stat">
          <span className="hub-panel__stat-val">{spiritCount}</span>
          <span className="hub-panel__stat-lbl">Esprits</span>
        </div>
        {hubEvent ? (
          <Link href={hubEvent.href} className="hub-panel__event">
            <span className="hub-panel__event-dot" />
            <span>
              <span className="hub-panel__event-kicker">Événement</span>
              <span className="hub-panel__event-title">{hubEvent.title}</span>
            </span>
          </Link>
        ) : null}
      </div>

      <div className="hub-panel__section hub-panel__plays">
        {hasSpirits ? (
          <Link href="/run" className="play play--run">
            <span className="play__label">Roguelite</span>
            <span className="play__title">Lancer un run</span>
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
            <span className="play__desc">11 zones · 165 niveaux</span>
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
