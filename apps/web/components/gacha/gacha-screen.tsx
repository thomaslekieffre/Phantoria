"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { GACHA_HARD_PITY, type Rarity } from "@phantoria/game-core";
import { GameShell } from "@/components/layout/game-shell";
import { SpiritPortrait } from "@/components/hub/spirit-portrait";
import { IconCube, IconGem } from "@/components/ui/icons";
import { usePlayer } from "@/components/providers/player-provider";
import { pullStandardGacha, pullWelcomeGacha } from "@/lib/player/gacha-client";
import { isSupabaseEnabled } from "@/lib/supabase/config";
import {
  STANDARD_GACHA_POOL,
  STANDARD_MULTI_PULL_COUNT,
  STANDARD_PULL_GEM_COST,
  STANDARD_PULL_TICKET_COST,
  WELCOME_GACHA_POOL,
} from "@/lib/player/gacha-pool";
import {
  WELCOME_PULLS_START,
  type GachaPullResult,
  type StandardPullPayment,
} from "@/lib/player/gacha-service";
import type { SpiritId } from "@/components/hub/roster";
import { GachaRatesPanel } from "./gacha-rates-panel";
import "./gacha.css";

const RARITY_CLASS: Record<Rarity, string> = {
  S: "gacha-rarity--s",
  A: "gacha-rarity--a",
  B: "gacha-rarity--b",
  C: "gacha-rarity--c",
  D: "gacha-rarity--d",
  E: "gacha-rarity--e",
};

const FEATURED_STANDARD: SpiritId[] = ["aurore", "luma", "nyx", "bram"];

type PackTab = "welcome" | "standard";

function FeaturedSpirit({
  id,
  rarity,
  delay,
}: {
  id: SpiritId;
  rarity: Rarity;
  delay: number;
}) {
  return (
    <div
      className={`gacha-featured__orb ${RARITY_CLASS[rarity]}`}
      style={{ "--delay": `${delay}ms` } as CSSProperties}
    >
      <span className="gacha-featured__badge">{rarity}</span>
      <SpiritPortrait id={id} className="gacha-featured__art" />
    </div>
  );
}

function GachaMachine({ pulling, pack }: { pulling: boolean; pack: PackTab }) {
  return (
    <div
      className={`gacha-machine ${pulling ? "gacha-machine--shake gacha-machine--active" : ""}`}
      data-pack={pack}
    >
      <div className="gacha-machine__halo" aria-hidden />
      <div className="gacha-machine__frame">
        <div className="gacha-machine__horn gacha-machine__horn--l" />
        <div className="gacha-machine__horn gacha-machine__horn--r" />
        <p className="gacha-machine__label">Autel mycélien</p>
        <div className="gacha-machine__window">
          <div className="gacha-machine__orbs" aria-hidden>
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="gacha-machine__capsule" style={{ "--i": i } as CSSProperties} />
            ))}
          </div>
        </div>
        <div className="gacha-machine__mouth" />
      </div>
      <div className="gacha-machine__embers" aria-hidden />
    </div>
  );
}

function RevealOverlay({
  pull,
  onClose,
}: {
  pull: GachaPullResult;
  onClose: () => void;
}) {
  const rarity = pull.rarity;
  const hue = pull.kind === "spirit" ? pull.hue : "#94a3b8";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="gacha-reveal-overlay" role="dialog" aria-modal>
      <div className="gacha-reveal-overlay__burst" aria-hidden />
      <div
        className={`gacha-reveal-card ${RARITY_CLASS[rarity]} ${pull.kind === "duplicate" ? "gacha-reveal-card--dup" : ""}`}
        style={{ "--hue": hue } as CSSProperties}
      >
        <span className="gacha-reveal-card__tag">
          {pull.kind === "spirit" ? "Nouvel esprit" : "Doublon"}
        </span>
        <span className={`gacha-reveal-card__rarity ${RARITY_CLASS[rarity]}`}>{rarity}</span>
        <SpiritPortrait id={pull.hubId} className="gacha-reveal-card__art" />
        <h2 className="gacha-reveal-card__name">{pull.name}</h2>
        {pull.kind === "spirit" ? (
          <p className="gacha-reveal-card__sub">{pull.tribe}</p>
        ) : (
          <p className="gacha-reveal-card__sub">+{pull.gems} gemmes</p>
        )}
        <button type="button" className="gacha-reveal-card__btn" onClick={onClose}>
          Continuer
        </button>
      </div>
    </div>
  );
}

const RARITY_ORDER: Rarity[] = ["S", "A", "B", "C", "D", "E"];

function MultiRevealOverlay({
  pulls,
  onClose,
}: {
  pulls: GachaPullResult[];
  onClose: () => void;
}) {
  const [revealed, setRevealed] = useState(0);
  const allRevealed = revealed >= pulls.length;

  const newSpirits = pulls.filter((p) => p.kind === "spirit").length;
  const dupes = pulls.filter((p) => p.kind === "duplicate").length;
  const gemsGained = pulls.reduce((sum, p) => (p.kind === "duplicate" ? sum + p.gems : sum), 0);

  const bestIndex = useMemo(() => {
    let best = 0;
    for (let i = 1; i < pulls.length; i++) {
      if (RARITY_ORDER.indexOf(pulls[i]!.rarity) < RARITY_ORDER.indexOf(pulls[best]!.rarity)) {
        best = i;
      }
    }
    return best;
  }, [pulls]);

  const bestRarity = pulls[bestIndex]!.rarity;

  useEffect(() => {
    setRevealed(0);
  }, [pulls]);

  useEffect(() => {
    if (allRevealed) return;
    const timer = window.setTimeout(() => setRevealed((n) => n + 1), 110);
    return () => window.clearTimeout(timer);
  }, [revealed, allRevealed]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (allRevealed) onClose();
        else setRevealed(pulls.length);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [allRevealed, onClose, pulls.length]);

  return (
    <div className="gacha-reveal-overlay" role="dialog" aria-modal>
      <div className="gacha-reveal-overlay__burst" aria-hidden />
      <div className={`gacha-reveal-multi ${RARITY_CLASS[bestRarity]}`}>
        <h2 className="gacha-reveal-multi__title">×{pulls.length} invocations</h2>
        <p className="gacha-reveal-multi__summary">
          {newSpirits} nouvel{newSpirits > 1 ? "s" : ""}
          {dupes > 0 ? ` · ${dupes} doublon${dupes > 1 ? "s" : ""}` : ""}
          {gemsGained > 0 ? ` · +${gemsGained} gemmes` : ""}
        </p>
        {!allRevealed ? (
          <button type="button" className="gacha-reveal-multi__skip" onClick={() => setRevealed(pulls.length)}>
            Tout afficher
          </button>
        ) : null}
        <ul className="gacha-reveal-multi__grid">
          {pulls.map((pull, i) => (
            <li
              key={`${pull.hubId}-${i}`}
              className={`gacha-reveal-multi__item ${RARITY_CLASS[pull.rarity]} ${pull.kind === "duplicate" ? "gacha-reveal-multi__item--dup" : ""} ${i < revealed ? "gacha-reveal-multi__item--in" : ""} ${i === bestIndex && i < revealed ? "gacha-reveal-multi__item--best" : ""}`}
              style={{ "--reveal-i": i } as CSSProperties}
            >
              <span className="gacha-reveal-multi__badge">{pull.rarity}</span>
              <SpiritPortrait id={pull.hubId} className="gacha-reveal-multi__art" />
              <span className="gacha-reveal-multi__name">{pull.name}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="gacha-reveal-card__btn" disabled={!allRevealed} onClick={onClose}>
          {allRevealed ? "Continuer" : `${revealed} / ${pulls.length}`}
        </button>
      </div>
    </div>
  );
}

export function GachaScreen() {
  const {
    welcomePullsRemaining,
    gachaPityStandard,
    hasSpirits,
    spiritCount,
    unlockedHubIds,
    currencies,
    ready,
    refresh,
    supabaseEnabled,
    user,
  } = usePlayer();

  const [pack, setPack] = useState<PackTab>("standard");
  const [packTouched, setPackTouched] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [lastResults, setLastResults] = useState<GachaPullResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tickets = currencies?.tickets ?? 0;
  const gems = currencies?.gems ?? 0;
  const hasWelcome = welcomePullsRemaining > 0;
  const pityPct = Math.min(100, Math.round((gachaPityStandard / GACHA_HARD_PITY) * 100));

  const canWelcome = supabaseEnabled && user && welcomePullsRemaining > 0;
  const canTicket = tickets >= STANDARD_PULL_TICKET_COST;
  const canGems = gems >= STANDARD_PULL_GEM_COST;
  const canTicketMulti = tickets >= STANDARD_PULL_TICKET_COST * STANDARD_MULTI_PULL_COUNT;
  const canGemsMulti = gems >= STANDARD_PULL_GEM_COST * STANDARD_MULTI_PULL_COUNT;
  const ownedIds = useMemo(() => new Set(unlockedHubIds), [unlockedHubIds]);
  const onboardingDone = hasSpirits && !hasWelcome;

  useEffect(() => {
    if (!ready || packTouched) return;
    if (hasWelcome) setPack("welcome");
    else setPack("standard");
  }, [ready, hasWelcome, packTouched]);

  useEffect(() => {
    if (!hasWelcome && pack === "welcome") setPack("standard");
  }, [hasWelcome, pack]);

  function selectPack(next: PackTab) {
    setPackTouched(true);
    setPack(next);
  }

  const featured =
    pack === "welcome"
      ? WELCOME_GACHA_POOL.map((e, i) => ({ id: e.hubId as SpiritId, rarity: e.rarity, delay: i * 80 }))
      : FEATURED_STANDARD.map((id, i) => {
          const e = STANDARD_GACHA_POOL.find((p) => p.hubId === id)!;
          return { id, rarity: e.rarity, delay: i * 100 };
        });

  async function invokeWelcome(all = false) {
    if (!canWelcome || pulling) return;
    if (!all && !hasWelcome) return;

    setPulling(true);
    setError(null);
    const { results, error: pullError } = await pullWelcomeGacha(all);
    const multi = results.length > 1;
    await new Promise((r) => setTimeout(r, multi ? 1400 : 900));
    setPulling(false);
    if (pullError) setError(pullError);
    else if (results.length > 0) setLastResults(results);
    await refresh();
  }

  async function invokeStandard(payment: StandardPullPayment, count: 1 | typeof STANDARD_MULTI_PULL_COUNT) {
    if (pulling) return;
    const multi = count === STANDARD_MULTI_PULL_COUNT;
    if (payment === "ticket" && !(multi ? canTicketMulti : canTicket)) return;
    if (payment === "gems" && !(multi ? canGemsMulti : canGems)) return;

    setPulling(true);
    setError(null);
    const { results, error: pullError } = await pullStandardGacha(payment, count);
    await new Promise((r) => setTimeout(r, multi ? 1400 : 900));
    setPulling(false);
    if (pullError) setError(pullError);
    else if (results.length > 0) setLastResults(results);
    await refresh();
  }

  if (!isSupabaseEnabled()) {
    return (
      <GameShell active="gacha">
        <div className="page-stub">
          <h1>Gacha</h1>
          <p>Configure Supabase pour les invocations.</p>
          <Link href="/">Retour</Link>
        </div>
      </GameShell>
    );
  }

  if (!user) {
    return (
      <GameShell active="gacha">
        <div className="gacha-scene gacha-scene--login">
          <div className="gacha-login-card">
            <h1>Autel des invocations</h1>
            <p>Connecte-toi pour réveiller les esprits.</p>
            <Link href="/login" className="gacha-pull gacha-pull--free">
              Connexion
            </Link>
          </div>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell active="gacha">
      <div className={`gacha-scene ${pulling ? "gacha-scene--pulling" : ""}`}>
        <div className="gacha-scene__rays" aria-hidden />
        <div className="gacha-scene__vignette" aria-hidden />
        <div className="gacha-scene__motes" aria-hidden />

        <header className="gacha-top">
          <p className="gacha-top__eyebrow">Sanctuaire</p>
          <h1 className="gacha-top__title">Autel des invocations</h1>
          <div className="gacha-top__wallet">
            <span className="gacha-top__wallet-item">
              <IconCube className="gacha-top__wallet-ico" aria-hidden />
              {tickets} ticket{tickets !== 1 ? "s" : ""}
            </span>
            <span className="gacha-top__wallet-item">
              <IconGem className="gacha-top__wallet-ico" aria-hidden />
              {gems} gemme{gems !== 1 ? "s" : ""}
            </span>
          </div>
          {spiritCount > 0 ? (
            <Link href="/" className="gacha-top__link">
              {spiritCount} esprit{spiritCount > 1 ? "s" : ""} — retour hub
            </Link>
          ) : null}
        </header>

        <div className="gacha-content">
          <aside className="gacha-banners">
            <button
              type="button"
              className={`gacha-banner-btn ${pack === "welcome" ? "gacha-banner-btn--on" : ""}`}
              onClick={() => selectPack("welcome")}
            >
              <div className="gacha-banner-btn__bg gacha-banner-btn__bg--welcome" />
              <span className="gacha-banner-btn__tag">Gratuit</span>
              <span className="gacha-banner-btn__title">Premiers esprits</span>
              <span className="gacha-banner-btn__pill">
                {hasWelcome ? `${welcomePullsRemaining} restants` : "Terminé"}
              </span>
            </button>
            <button
              type="button"
              className={`gacha-banner-btn ${pack === "standard" ? "gacha-banner-btn--on" : ""}`}
              onClick={() => selectPack("standard")}
            >
              <div className="gacha-banner-btn__bg" />
              <span className="gacha-banner-btn__tag">Général</span>
              <span className="gacha-banner-btn__title">Pack standard</span>
            </button>
          </aside>

          <div className="gacha-altar-wrap">
            <article className="gacha-altar">
              <div className={`gacha-hero__banner ${pack === "welcome" ? "gacha-hero__banner--welcome" : ""}`}>
                {pack === "welcome" ? (
                  <>
                    <span className="gacha-hero__stamp">GRATUIT</span>
                    <h2 className="gacha-hero__headline">
                      Premiers
                      <em>esprits</em>
                    </h2>
                    <p className="gacha-hero__pitch">
                      {WELCOME_PULLS_START} invocations pour remplir ta roue
                    </p>
                  </>
                ) : (
                  <>
                    <span className="gacha-hero__stamp gacha-hero__stamp--pity">
                      PITY {gachaPityStandard}/{GACHA_HARD_PITY}
                    </span>
                    <h2 className="gacha-hero__headline">
                      Pack
                      <em>général</em>
                    </h2>
                    <p className="gacha-hero__pitch">
                      S garanti à {GACHA_HARD_PITY} invocations
                    </p>
                  </>
                )}
              </div>

              <div className="gacha-altar__featured">
                {featured.map((f) => (
                  <FeaturedSpirit key={f.id} id={f.id} rarity={f.rarity} delay={f.delay} />
                ))}
              </div>

              <div className="gacha-altar__machine">
                <GachaMachine pulling={pulling} pack={pack} />
              </div>

              {pack === "standard" ? (
                <div className="gacha-pity">
                  <div className="gacha-pity__labels">
                    <span>Pity légendaire (S)</span>
                    <span>
                      {gachaPityStandard} / {GACHA_HARD_PITY}
                    </span>
                  </div>
                  <div className="gacha-pity__track">
                    <div className="gacha-pity__fill" style={{ width: `${pityPct}%` }} />
                  </div>
                </div>
              ) : (
                <p className="gacha-welcome-left">
                  <strong>{welcomePullsRemaining}</strong> invocation
                  {welcomePullsRemaining > 1 ? "s" : ""} offerte
                  {welcomePullsRemaining > 1 ? "s" : ""}
                </p>
              )}

              <div className="gacha-altar__actions">
                {pack === "welcome" ? (
                  <div className="gacha-altar__actions-grid gacha-altar__actions-grid--welcome">
                    <button
                      type="button"
                      className={`gacha-pull gacha-pull--free ${pulling ? "gacha-pull--loading" : ""}`}
                      disabled={!hasWelcome || !canWelcome || pulling}
                      onClick={() => void invokeWelcome(false)}
                    >
                      <span className="gacha-pull__tag">Offre bienvenue</span>
                      <span className="gacha-pull__main">
                        <span className="gacha-pull__times">×1</span>
                        <span className="gacha-pull__label">
                          {hasWelcome ? "Invocation gratuite" : "Pack terminé"}
                        </span>
                      </span>
                      <span className="gacha-pull__cost">0</span>
                    </button>
                    {welcomePullsRemaining > 1 ? (
                      <button
                        type="button"
                        className={`gacha-pull gacha-pull--free ${pulling ? "gacha-pull--loading" : ""}`}
                        disabled={!canWelcome || pulling}
                        onClick={() => void invokeWelcome(true)}
                      >
                        <span className="gacha-pull__tag">Offre bienvenue</span>
                        <span className="gacha-pull__main">
                          <span className="gacha-pull__times">×{welcomePullsRemaining}</span>
                          <span className="gacha-pull__label">Tout invoquer</span>
                        </span>
                        <span className="gacha-pull__cost">0</span>
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {pack === "standard" ? (
                  <div className="gacha-altar__actions-grid">
                    <button
                      type="button"
                      className={`gacha-pull gacha-pull--ticket ${pulling ? "gacha-pull--loading" : ""}`}
                      disabled={pulling || !canTicket}
                      onClick={() => void invokeStandard("ticket", 1)}
                    >
                      <span className="gacha-pull__tag">Ticket commun</span>
                      <span className="gacha-pull__main">
                        <span className="gacha-pull__times">×1</span>
                        <span className="gacha-pull__label">Invocation</span>
                      </span>
                      <span className="gacha-pull__cost">
                        <IconCube className="gacha-pull__ico" />
                        {STANDARD_PULL_TICKET_COST}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`gacha-pull gacha-pull--ticket ${pulling ? "gacha-pull--loading" : ""}`}
                      disabled={pulling || !canTicketMulti}
                      onClick={() => void invokeStandard("ticket", STANDARD_MULTI_PULL_COUNT)}
                    >
                      <span className="gacha-pull__tag">Ticket commun</span>
                      <span className="gacha-pull__main">
                        <span className="gacha-pull__times">×{STANDARD_MULTI_PULL_COUNT}</span>
                        <span className="gacha-pull__label">Multi</span>
                      </span>
                      <span className="gacha-pull__cost">
                        <IconCube className="gacha-pull__ico" />
                        {STANDARD_PULL_TICKET_COST * STANDARD_MULTI_PULL_COUNT}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`gacha-pull gacha-pull--gem ${pulling ? "gacha-pull--loading" : ""}`}
                      disabled={pulling || !canGems}
                      onClick={() => void invokeStandard("gems", 1)}
                    >
                      <span className="gacha-pull__tag">Gemmes premium</span>
                      <span className="gacha-pull__main">
                        <span className="gacha-pull__times">×1</span>
                        <span className="gacha-pull__label">Invocation</span>
                      </span>
                      <span className="gacha-pull__cost">
                        <IconGem className="gacha-pull__ico" />
                        {STANDARD_PULL_GEM_COST}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`gacha-pull gacha-pull--gem ${pulling ? "gacha-pull--loading" : ""}`}
                      disabled={pulling || !canGemsMulti}
                      onClick={() => void invokeStandard("gems", STANDARD_MULTI_PULL_COUNT)}
                    >
                      <span className="gacha-pull__tag">Gemmes premium</span>
                      <span className="gacha-pull__main">
                        <span className="gacha-pull__times">×{STANDARD_MULTI_PULL_COUNT}</span>
                        <span className="gacha-pull__label">Multi</span>
                      </span>
                      <span className="gacha-pull__cost">
                        <IconGem className="gacha-pull__ico" />
                        {STANDARD_PULL_GEM_COST * STANDARD_MULTI_PULL_COUNT}
                      </span>
                    </button>
                  </div>
                ) : null}

                {error ? <p className="gacha-error">{error}</p> : null}

                {!hasSpirits && !hasWelcome ? (
                  <p className="gacha-hint">Gagne des gemmes (doublons) ou des tickets pour invoquer.</p>
                ) : null}

                {onboardingDone ? (
                  <div className="gacha-done-cta">
                    <p className="gacha-done-cta__text">Roue complète — tu peux partir à l&apos;aventure.</p>
                    <div className="gacha-done-cta__links">
                      <Link href="/" className="gacha-done-cta__btn">
                        Sanctuaire
                      </Link>
                      <Link href="/run" className="gacha-done-cta__btn gacha-done-cta__btn--run">
                        Lancer un run
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          </div>

          <GachaRatesPanel pack={pack} gachaPityStandard={gachaPityStandard} ownedIds={ownedIds} />
        </div>

        {lastResults?.length === 1 ? (
          <RevealOverlay pull={lastResults[0]!} onClose={() => setLastResults(null)} />
        ) : null}
        {lastResults && lastResults.length > 1 ? (
          <MultiRevealOverlay pulls={lastResults} onClose={() => setLastResults(null)} />
        ) : null}
      </div>
    </GameShell>
  );
}
