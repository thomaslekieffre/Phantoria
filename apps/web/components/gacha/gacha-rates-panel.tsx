"use client";

import { useEffect, useMemo, useState } from "react";
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
import { formatRatePct, spiritPullProbability } from "@/lib/player/gacha-rates";

const RARITY_CLASS: Record<Rarity, string> = {
  S: "gacha-rarity--s",
  A: "gacha-rarity--a",
  B: "gacha-rarity--b",
  C: "gacha-rarity--c",
  D: "gacha-rarity--d",
  E: "gacha-rarity--e",
};

function SpiritList({
  spirits,
  owned,
  pool,
  mode,
  pity,
}: {
  spirits: GachaPoolEntry[];
  owned: Set<SpiritId>;
  pool: GachaPoolEntry[];
  mode: "welcome" | "gacha";
  pity: number;
}) {
  return (
    <span className="gacha-rates__spirits">
      {spirits.map((s, i) => {
        const pct = formatRatePct(
          spiritPullProbability(s, pool, {
            mode,
            pity,
            owned,
          }),
        );
        return (
          <span key={s.hubId}>
            {i > 0 ? ", " : ""}
            <span className={owned.has(s.hubId) ? "gacha-rates__spirit--owned" : undefined}>
              {s.name} {mode === "gacha" ? `(${pct})` : ""}
            </span>
            {owned.has(s.hubId) ? " ✓" : ""}
          </span>
        );
      })}
    </span>
  );
}

function RarityPoolModal({
  rarity,
  spirits,
  pool,
  ownedIds,
  rateLabel,
  mode,
  pity,
  onClose,
}: {
  rarity: Rarity;
  spirits: GachaPoolEntry[];
  pool: GachaPoolEntry[];
  ownedIds: Set<SpiritId>;
  rateLabel: string;
  mode: "welcome" | "gacha";
  pity: number;
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
              const pct = formatRatePct(
                spiritPullProbability(spirit, pool, {
                  mode,
                  pity,
                  owned: ownedIds,
                }),
              );
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
                  <span className="gacha-pool-modal__spirit-rate">{pct}</span>
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
  pool,
  rateLabel,
  ownedIds,
  mode,
  pity,
  onOpen,
}: {
  rarity: Rarity;
  spirits: GachaPoolEntry[];
  pool: GachaPoolEntry[];
  rateLabel: string;
  ownedIds: Set<SpiritId>;
  mode: "welcome" | "gacha";
  pity: number;
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
          <SpiritList spirits={spirits} owned={ownedIds} pool={pool} mode={mode} pity={pity} />
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

  const mode = pack === "welcome" ? "welcome" : "gacha";
  const pity = pack === "standard" ? gachaPityStandard : 0;

  const sRatePct = Math.round(getSRateAtPity(gachaPityStandard) * 1000) / 10;
  const atHardPity = gachaPityStandard >= GACHA_HARD_PITY;

  const hasVariableWeights = useMemo(() => {
    for (const r of ["S", "A", "B", "C", "D", "E"] as Rarity[]) {
      const group = pool.filter((e) => e.rarity === r);
      if (group.length < 2) continue;
      const weights = new Set(group.map((e) => e.weight ?? 100));
      if (weights.size > 1) return true;
    }
    return false;
  }, [pool]);

  function rateLabelFor(r: Rarity): string {
    if (pack === "welcome") return "Pool fixe (poids)";
    if (r === "S") return atHardPity ? "100%" : `${sRatePct}%`;
    const pct = Math.round(GACHA_BASE_WEIGHTS[r] * 100);
    const intra = hasVariableWeights && pool.filter((e) => e.rarity === r).length > 1 ? " · taux/esprit variable" : "";
    return `${pct}%${intra} · doublon +${GACHA_DUPLICATE_GEMS[r]}💎`;
  }

  function modalRateLabel(r: Rarity): string {
    if (pack === "welcome") {
      return "Chaque esprit : probabilité selon son poids (priorité aux non possédés).";
    }
    if (r === "S") return atHardPity ? "100% — hard pity actif" : `${sRatePct}% (pity actuel)`;
    const base = `${Math.round(GACHA_BASE_WEIGHTS[r] * 100)}% pour la rareté`;
    const group = pool.filter((e) => e.rarity === r);
    if (group.length > 1) {
      return `${base} — réparti entre ${group.length} esprits selon leurs poids`;
    }
    return `${base} · doublon +${GACHA_DUPLICATE_GEMS[r]} gemmes`;
  }

  const modalSpirits = modalRarity ? pool.filter((e) => e.rarity === modalRarity) : [];

  if (pack === "welcome") {
    return (
      <>
        <aside className="gacha-rates">
          <h3 className="gacha-rates__title">Contenu du pack</h3>
          <p className="gacha-rates__lead">6 esprits — poids configurables · clique une rareté.</p>
          <div className="gacha-rates__list">
            {(["B", "C", "D", "E"] as Rarity[]).map((r) => {
              const spirits = pool.filter((e) => e.rarity === r);
              if (spirits.length === 0) return null;
              return (
                <RatesRow
                  key={r}
                  rarity={r}
                  spirits={spirits}
                  pool={pool}
                  rateLabel={rateLabelFor(r)}
                  ownedIds={ownedIds}
                  mode={mode}
                  pity={pity}
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
            pool={pool}
            ownedIds={ownedIds}
            rateLabel={modalRateLabel(modalRarity)}
            mode={mode}
            pity={pity}
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
          {hasVariableWeights ? " · taux par esprit selon poids" : ""}
          {" · "}
          clique une rareté
        </p>
        <div className="gacha-rates__list">
          {(["S", "A", "B", "C", "D", "E"] as Rarity[]).map((r) => (
            <RatesRow
              key={r}
              rarity={r}
              spirits={pool.filter((e) => e.rarity === r)}
              pool={pool}
              rateLabel={rateLabelFor(r)}
              ownedIds={ownedIds}
              mode={mode}
              pity={pity}
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
          pool={pool}
          ownedIds={ownedIds}
          rateLabel={modalRateLabel(modalRarity)}
          mode={mode}
          pity={pity}
          onClose={() => setModalRarity(null)}
        />
      ) : null}
    </>
  );
}
