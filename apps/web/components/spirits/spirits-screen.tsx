"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import type { Rarity } from "@phantoria/game-core";
import { GameShell } from "@/components/layout/game-shell";
import { isFieldSlotIndex, isSpiritId, rosterIndexForHubId, type SpiritId } from "@/components/hub/roster";
import { SpiritPortrait } from "@/components/hub/spirit-portrait";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { usePlayer } from "@/components/providers/player-provider";
import { useGameContent } from "@/components/providers/game-content-provider";
import type { GachaPoolEntry } from "@/lib/player/gacha-pool";
import { getDisplayPoolEntries } from "@/lib/player/spirit-catalog";
import { SpiritOwnedStats } from "./spirit-owned-stats";
import "../hub/hub.css";
import "./spirits.css";

const RARITIES: Rarity[] = ["S", "A", "B", "C", "D", "E"];
const RARITY_RANK: Record<Rarity, number> = { S: 0, A: 1, B: 2, C: 3, D: 4, E: 5 };

type OwnedFilter = "all" | "owned" | "missing";

function sortPool(entries: GachaPoolEntry[]) {
  return [...entries].sort((a, b) => {
    const dr = RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity];
    if (dr !== 0) return dr;
    return a.name.localeCompare(b.name, "fr");
  });
}

export function SpiritsScreen() {
  const {
    roster,
    unlockedHubIds,
    spiritCount,
    hasSpirits,
    placeSpiritFirstFree,
    removeSpiritFromWheel,
    spiritsByHubId,
    profile,
  } = usePlayer();
  const { version: contentVersion } = useGameContent();
  const catalogPool = useMemo(() => getDisplayPoolEntries(), [contentVersion]);
  const ownedSet = useMemo(() => new Set(unlockedHubIds), [unlockedHubIds]);
  const rosterById = useMemo(
    () => new Map(roster.filter((s) => !s.empty && isSpiritId(s.id)).map((s) => [s.id, s])),
    [roster],
  );

  const tribes = useMemo(
    () => [...new Set(catalogPool.map((e) => e.tribe))].sort((a, b) => a.localeCompare(b, "fr")),
    [catalogPool],
  );

  const [rarityFilter, setRarityFilter] = useState<Rarity | "all">("all");
  const [tribeFilter, setTribeFilter] = useState<string>("all");
  const [ownedFilter, setOwnedFilter] = useState<OwnedFilter>("all");
  const [selectedId, setSelectedId] = useState<SpiritId | null>(null);
  const [detailOpen, setDetailOpen] = useState(true);

  const filtered = useMemo(() => {
    let list = catalogPool;
    if (rarityFilter !== "all") list = list.filter((e) => e.rarity === rarityFilter);
    if (tribeFilter !== "all") list = list.filter((e) => e.tribe === tribeFilter);
    if (ownedFilter === "owned") list = list.filter((e) => ownedSet.has(e.hubId));
    if (ownedFilter === "missing") list = list.filter((e) => !ownedSet.has(e.hubId));
    return sortPool(list);
  }, [rarityFilter, tribeFilter, ownedFilter, ownedSet, catalogPool]);

  const activeId = useMemo(() => {
    if (selectedId && filtered.some((e) => e.hubId === selectedId)) return selectedId;
    return filtered[0]?.hubId ?? null;
  }, [selectedId, filtered]);

  const activeSpirit = activeId
    ? (catalogPool.find((e) => e.hubId === activeId) ?? null)
    : null;
  const activeOwned = activeId ? ownedSet.has(activeId) : false;
  const activeStats = activeId ? spiritsByHubId[activeId] : undefined;
  const activeSlotIndex = activeId ? rosterIndexForHubId(roster, activeId) : -1;
  const onWheel = activeSlotIndex >= 0;
  const onField = onWheel && isFieldSlotIndex(activeSlotIndex);
  const wheelFull = roster.every((s) => !s.empty);

  function handleSelect(id: SpiritId) {
    setSelectedId(id);
    setDetailOpen(true);
  }

  function handleCloseDetail() {
    setDetailOpen(false);
  }

  async function handlePlaceOnWheel() {
    if (!activeId) return;
    await placeSpiritFirstFree(activeId);
  }

  async function handleRemoveFromWheel() {
    if (!activeId) return;
    await removeSpiritFromWheel(activeId);
  }

  const total = catalogPool.length;
  const displayName = profile?.display_name ?? "Tomy";

  return (
    <GameShell active="spirits">
      <div className="spirits-scene">
        <header className="spirits-top">
          <div className="spirits-top__head">
            <p className="spirits-top__kicker">Codex</p>
            <h1 className="spirits-top__title">Collection d&apos;esprits</h1>
          </div>
          <p className="spirits-top__meta">
            <strong>{displayName}</strong> · {spiritCount}/{total} possédés
          </p>
        </header>

        <div className="spirits-body">
          <aside className="spirits-filters spirits-body__filters" aria-label="Filtres">
            <label className="spirits-filter-group spirits-filter-group--tribe">
              <span className="spirits-filter-group__label">Tribu</span>
              <select
                className="spirits-select"
                value={tribeFilter}
                onChange={(e) => setTribeFilter(e.target.value)}
              >
                <option value="all">Toutes</option>
                {tribes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="spirits-filter-group spirits-filter-group--status">
              <legend>Statut</legend>
              <div className="spirits-filter-pills spirits-filter-pills--status">
                {(
                  [
                    ["all", "Tous"],
                    ["owned", "Possédés"],
                    ["missing", "Manquants"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={`spirits-pill ${ownedFilter === id ? "spirits-pill--on" : ""}`}
                    onClick={() => setOwnedFilter(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="spirits-filter-group spirits-filter-group--rarity">
              <legend>Rareté</legend>
              <div className="spirits-filter-rarity">
                <button
                  type="button"
                  className={`spirits-pill ${rarityFilter === "all" ? "spirits-pill--on" : ""}`}
                  onClick={() => setRarityFilter("all")}
                >
                  Toutes
                </button>
                <div className="spirits-filter-pills spirits-filter-pills--grid">
                  {RARITIES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`spirits-pill spirits-pill--${r.toLowerCase()} ${rarityFilter === r ? "spirits-pill--on" : ""}`}
                      onClick={() => setRarityFilter(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </fieldset>
          </aside>

          <main className="spirits-grid-wrap spirits-body__grid" aria-label="Grille des esprits">
            {filtered.length === 0 ? (
              <p className="spirits-grid-empty">Aucun esprit ne correspond à ces filtres.</p>
            ) : (
              <ul className="spirits-grid">
                {filtered.map((spirit) => {
                  const owned = ownedSet.has(spirit.hubId);
                  const slotIdx = rosterIndexForHubId(roster, spirit.hubId);
                  const onField = slotIdx >= 0 && isFieldSlotIndex(slotIdx);
                  const stats = spiritsByHubId[spirit.hubId];
                  const active = activeId === spirit.hubId;
                  return (
                    <li key={spirit.hubId}>
                      <button
                        type="button"
                        className={`spirits-card spirits-card--${spirit.rarity.toLowerCase()} ${owned ? "" : "spirits-card--locked"} ${active ? "spirits-card--active" : ""}`}
                        style={{ "--hue": spirit.hue } as CSSProperties}
                        onClick={() => handleSelect(spirit.hubId)}
                        aria-pressed={active}
                      >
                        <span className="spirits-card__rarity">{spirit.rarity}</span>
                        <SpiritPortrait id={spirit.hubId} className="spirits-card__art" />
                        <span className="spirits-card__name">{spirit.name}</span>
                        {stats ? (
                          <span className="spirits-card__level" title="Niveau histoire">
                            Niv. {stats.level}
                          </span>
                        ) : null}
                        <span className="spirits-card__status">
                          {!owned ? "Manquant" : spirit.tribe}
                        </span>
                        <span className="spirits-card__tribe">{spirit.tribe}</span>
                        {!owned ? (
                          <span className="spirits-card__lock" aria-hidden>
                            ?
                          </span>
                        ) : onField ? (
                          <span className="spirits-card__field">Terrain</span>
                        ) : (
                          <span className="spirits-card__owned">✓</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </main>

          <aside
            className={`spirits-detail spirits-body__detail ${!detailOpen ? "spirits-body__detail--closed" : ""}`}
            aria-label="Fiche esprit"
          >
            {activeSpirit && detailOpen ? (
              <section className="spirit-sheet">
                <button
                  type="button"
                  className="spirits-detail__close"
                  aria-label="Fermer la fiche"
                  onClick={handleCloseDetail}
                >
                  ×
                </button>
                <div
                  className={`spirit-sheet__hero ${!activeOwned ? "spirits-detail__hero--locked" : ""}`}
                  style={{ "--hue": activeSpirit.hue } as CSSProperties}
                >
                  <SpiritPortrait id={activeSpirit.hubId} className="spirit-sheet__art" />
                  <div className="spirit-sheet__meta">
                    <span className="spirit-sheet__tribe">{activeSpirit.tribe}</span>
                    <h2 className="spirit-sheet__name">
                      {activeSpirit.name}
                      <RarityBadge rarity={activeSpirit.rarity} size="md" />
                    </h2>
                    <span
                      className={`spirit-sheet__status ${onField ? "spirit-sheet__status--on" : ""}`}
                    >
                      {!activeOwned
                        ? "Non possédé"
                        : !onWheel
                          ? "Hors roue"
                          : onField
                            ? "Sur le terrain (devant)"
                            : "Sur la roue (derrière)"}
                    </span>
                  </div>
                </div>

                {activeOwned && activeStats ? (
                  <>
                    <SpiritOwnedStats stats={activeStats} rarity={activeSpirit.rarity} />
                    {onWheel ? (
                      <>
                        <p className="spirits-detail__hint">
                          Réorganise sur la <Link href="/">roue du camp</Link> (2 clics). Les 3
                          devant = équipe affichée au sanctuaire.
                        </p>
                        <button
                          type="button"
                          className="spirit-sheet__action spirit-sheet__action--ghost"
                          onClick={() => void handleRemoveFromWheel()}
                        >
                          Retirer de la roue
                        </button>
                      </>
                    ) : (
                      <p className="spirits-detail__hint">
                        Run : <strong>1</strong> esprit au départ, <strong>niveau 1</strong> — la
                        montée d&apos;XP ne compte que jusqu&apos;à la mort du run.
                      </p>
                    )}
                  </>
                ) : activeOwned ? (
                  <>
                    <p className="spirits-detail__hint">
                      Pas sur la roue — ajoute-le pour qu&apos;il soit disponible au camp et en run.
                    </p>
                    <button
                      type="button"
                      className="spirit-sheet__action"
                      disabled={wheelFull}
                      onClick={() => void handlePlaceOnWheel()}
                    >
                      {wheelFull ? "Roue pleine (6/6)" : "Ajouter à la roue"}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="spirits-detail__hint">
                      Invoque cet esprit au gacha pour l&apos;ajouter à ta collection.
                    </p>
                    <Link href="/gacha" className="spirit-sheet__action spirits-detail__cta">
                      Ouvrir le gacha
                    </Link>
                  </>
                )}

                <p className="spirits-detail__template">
                  Clé · <code>{activeSpirit.templateKey}</code>
                </p>
              </section>
            ) : (
              <section className="spirit-sheet spirit-sheet--empty">
                <p className="spirit-sheet__placeholder">
                  {hasSpirits ? "Sélectionne un esprit" : "Collection vide"}
                </p>
                {!hasSpirits ? (
                  <Link href="/gacha" className="spirit-sheet__action">
                    Invoquer au gacha
                  </Link>
                ) : null}
              </section>
            )}
          </aside>
        </div>
      </div>
    </GameShell>
  );
}
