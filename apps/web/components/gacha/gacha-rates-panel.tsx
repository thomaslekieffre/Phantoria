"use client";

import { useEffect, useState } from "react";
import {
  GACHA_BASE_WEIGHTS,
  GACHA_DUPLICATE_GEMS,
  GACHA_HARD_PITY,
  getSRateAtPity,
  type Rarity,
} from "@phantoria/game-core";
import { SpiritPortrait } from "@/components/hub/spirit-portrait";
import type { SpiritId } from "@/components/hub/roster";
import type { GachaPoolEntry } from "@/lib/player/gacha-pool";
import { useGameContent } from "@/components/providers/game-content-provider";
import { STANDARD_GACHA_POOL, WELCOME_GACHA_POOL, getGachaPool } from "@/lib/player/gacha-pool";

const RARITY_CLASS: Record<Rarity, string> = {
  S: "gacha-rarity--s",
  A: "gacha-rarity--a",
  B: "gacha-rarity--b",
  C: "gacha-rarity--c",
  D: "gacha-rarity--d",
  E: "gacha-rarity--e",
};

function SpiritList({
  names,
  owned,
}: {
  names: { hubId: SpiritId; name: string }[];
  owned: Set<SpiritId>;
}) {
  return (
    <span className="gacha-rates__spirits">
      {names.map((s, i) => (
        <span key={s.hubId}>
          {i > 0 ? ", " : ""}
          <span className={owned.has(s.hubId) ? "gacha-rates__spirit--owned" : undefined}>{s.name}</span>
          {owned.has(s.hubId) ? " ✓" : ""}
        </span>
      ))}
    </span>
  );
}

function RarityPoolModal({
  rarity,
  spirits,
  ownedIds,
  rateLabel,
  onClose,
}: {
  rarity: Rarity;
  spirits: GachaPoolEntry[];
  ownedIds: Set<SpiritId>;
  rateLabel: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="gacha-pool-modal" role="dialog" aria-modal aria-labelledby="gacha-pool-modal-title">
      <button type="button" className="gacha-pool-modal__backdrop" aria-label="Fermer" onClick={onClose} />
      <div className={`gacha-pool-modal__card ${RARITY_CLASS[rarity]}`}>
        <header className="gacha-pool-modal__head">
          <span className={`gacha-pool-modal__badge ${RARITY_CLASS[rarity]}`}>{rarity}</span>
          <div>
            <h2 id="gacha-pool-modal-title" className="gacha-pool-modal__title">
              Rareté {rarity}
            </h2>
            <p className="gacha-pool-modal__rate">{rateLabel}</p>
          </div>
          <button type="button" className="gacha-pool-modal__close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </header>

        {spirits.length === 0 ? (
          <p className="gacha-pool-modal__empty">Aucun esprit dans ce pack pour l&apos;instant.</p>
        ) : (
          <ul className="gacha-pool-modal__grid">
            {spirits.map((spirit) => {
              const owned = ownedIds.has(spirit.hubId);
              return (
                <li
                  key={spirit.hubId}
                  className={`gacha-pool-modal__spirit ${owned ? "gacha-pool-modal__spirit--owned" : ""}`}
                >
                  <div className="gacha-pool-modal__portrait-wrap">
                    <SpiritPortrait id={spirit.hubId} className="gacha-pool-modal__art" />
                    {owned ? <span className="gacha-pool-modal__owned-tag">Possédé</span> : null}
                  </div>
                  <span className="gacha-pool-modal__name">{spirit.name}</span>
                  <span className="gacha-pool-modal__tribe">{spirit.tribe}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function RatesRow({
  rarity,
  spirits,
  rateLabel,
  ownedIds,
  onOpen,
}: {
  rarity: Rarity;
  spirits: GachaPoolEntry[];
  rateLabel: string;
  ownedIds: Set<SpiritId>;
  onOpen: (r: Rarity) => void;
}) {
  const canOpen = spirits.length > 0;

  return (
    <button
      type="button"
      className={`gacha-rates__row gacha-rates__row--btn ${RARITY_CLASS[rarity]}`}
      disabled={!canOpen}
      onClick={() => onOpen(rarity)}
      aria-haspopup="dialog"
    >
      <div className="gacha-rates__badge">{rarity}</div>
      <div className="gacha-rates__info">
        <span className="gacha-rates__pct">{rateLabel}</span>
        {canOpen ? (
          <SpiritList
            names={spirits.map((s) => ({ hubId: s.hubId, name: s.name }))}
            owned={ownedIds}
          />
        ) : (
          <span className="gacha-rates__spirits">—</span>
        )}
      </div>
      {canOpen ? <span className="gacha-rates__chevron" aria-hidden /> : null}
    </button>
  );
}

export function GachaRatesPanel({
  pack,
  gachaPityStandard,
  ownedIds,
  eventPoolId,
}: {
  pack: "welcome" | "standard" | "event";
  gachaPityStandard: number;
  ownedIds: Set<SpiritId>;
  eventPoolId?: string;
}) {
  const { version: contentVersion } = useGameContent();
  const [modalRarity, setModalRarity] = useState<Rarity | null>(null);
  void contentVersion;
  const eventPool = eventPoolId ? getGachaPool(eventPoolId) : undefined;
  const pool =
    pack === "welcome"
      ? WELCOME_GACHA_POOL
      : pack === "event" && eventPool?.length
        ? eventPool
        : STANDARD_GACHA_POOL;

  const sRatePct = Math.round(getSRateAtPity(gachaPityStandard) * 1000) / 10;
  const atHardPity = gachaPityStandard >= GACHA_HARD_PITY;

  function rateLabelFor(r: Rarity): string {
    if (pack === "welcome") return "Pool fixe";
    if (pack === "event") return "Pool event limité";
    if (r === "S") return atHardPity ? "100%" : `${sRatePct}%`;
    const pct = Math.round(GACHA_BASE_WEIGHTS[r] * 100);
    return `${pct}% · doublon +${GACHA_DUPLICATE_GEMS[r]}💎`;
  }

  function modalRateLabel(r: Rarity): string {
    if (pack === "welcome") return "Garanti sans doublon tant qu'il reste des esprits uniques";
    if (r === "S") return atHardPity ? "100% — hard pity actif" : `${sRatePct}% (pity actuel)`;
    return `${Math.round(GACHA_BASE_WEIGHTS[r] * 100)}% · doublon +${GACHA_DUPLICATE_GEMS[r]} gemmes`;
  }

  const modalSpirits = modalRarity ? pool.filter((e) => e.rarity === modalRarity) : [];

  if (pack === "welcome") {
    return (
      <>
        <aside className="gacha-rates">
          <h3 className="gacha-rates__title">Contenu du pack</h3>
          <p className="gacha-rates__lead">6 esprits distincts — clique une rareté pour voir le détail.</p>
          <div className="gacha-rates__list">
            {(["B", "C", "D", "E"] as Rarity[]).map((r) => {
              const spirits = pool.filter((e) => e.rarity === r);
              if (spirits.length === 0) return null;
              return (
                <RatesRow
                  key={r}
                  rarity={r}
                  spirits={spirits}
                  rateLabel={rateLabelFor(r)}
                  ownedIds={ownedIds}
                  onOpen={setModalRarity}
                />
              );
            })}
          </div>
        </aside>
        {modalRarity ? (
          <RarityPoolModal
            rarity={modalRarity}
            spirits={modalSpirits}
            ownedIds={ownedIds}
            rateLabel={modalRateLabel(modalRarity)}
            onClose={() => setModalRarity(null)}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <aside className="gacha-rates">
        <h3 className="gacha-rates__title">Taux d&apos;obtention</h3>
        <p className="gacha-rates__lead">
          Pity {gachaPityStandard}/{GACHA_HARD_PITY}
          {atHardPity ? " — S garanti au prochain tirage" : ""}
          {" · "}
          clique une rareté
        </p>
        <div className="gacha-rates__list">
          {(["S", "A", "B", "C", "D", "E"] as Rarity[]).map((r) => (
            <RatesRow
              key={r}
              rarity={r}
              spirits={pool.filter((e) => e.rarity === r)}
              rateLabel={rateLabelFor(r)}
              ownedIds={ownedIds}
              onOpen={setModalRarity}
            />
          ))}
        </div>
        <details className="gacha-rates__pity-table">
          <summary>Paliers pity (S)</summary>
          <ul>
            <li>0–49 : 1%</li>
            <li>50+ : soft pity (2% → 25%)</li>
            <li>100 : hard pity (100%)</li>
          </ul>
        </details>
      </aside>
      {modalRarity ? (
        <RarityPoolModal
          rarity={modalRarity}
          spirits={modalSpirits}
          ownedIds={ownedIds}
          rateLabel={modalRateLabel(modalRarity)}
          onClose={() => setModalRarity(null)}
        />
      ) : null}
    </>
  );
}
