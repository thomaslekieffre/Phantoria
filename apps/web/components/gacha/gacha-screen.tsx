"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { GACHA_HARD_PITY, type Rarity } from "@phantoria/game-core";
import { GameShell } from "@/components/layout/game-shell";
import { SpiritPortrait } from "@/components/hub/spirit-portrait";
import { IconCube, IconGem } from "@/components/ui/icons";
import { useGameContent } from "@/components/providers/game-content-provider";
import { usePlayer } from "@/components/providers/player-provider";
import { pullStandardGacha, pullWelcomeGacha, pullEventGacha } from "@/lib/player/gacha-client";
import { trackGachaPull } from "@/lib/analytics/events";
import { isSupabaseEnabled } from "@/lib/supabase/config";
import {
  STANDARD_GACHA_POOL,
  STANDARD_MULTI_PULL_COUNT,
  STANDARD_PULL_GEM_COST,
  STANDARD_PULL_TICKET_COST,
  WELCOME_GACHA_POOL,
  getGachaPool,
  getGachaPoolBanner,
  entryByHubId,
} from "@/lib/player/gacha-pool";
import {
  WELCOME_PULLS_START,
  type GachaPullResult,
  type StandardPullPayment,
} from "@/lib/player/gacha-service";
import type { SpiritId } from "@/components/hub/roster";
import { useToast } from "@/components/providers/toast-provider";
import { gachaRevealSoundForRarity } from "@/lib/audio/sounds";
import { useSound } from "@/lib/audio/use-sound";
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

const RARITY_RANK: Record<Rarity, number> = { S: 0, A: 1, B: 2, C: 3, D: 4, E: 5 };

function featuredFromPool(pool: typeof STANDARD_GACHA_POOL, staggerMs: number) {
  return [...pool]
    .sort((a, b) => RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity])
    .slice(0, 4)
    .map((e, i) => ({ id: e.hubId as SpiritId, rarity: e.rarity, delay: i * staggerMs }));
}

type PackTab = "welcome" | "standard" | "event";

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
  const { play, confirm } = useSound();
  const rarity = pull.rarity;
  const hue = pull.kind === "spirit" ? pull.hue : "#94a3b8";

  useEffect(() => {
    void play(gachaRevealSoundForRarity(rarity));
  }, [play, rarity]);

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
        <button
          type="button"
          className="gacha-reveal-card__btn"
          onClick={() => {
            confirm();
            onClose();
          }}
        >
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
  const { play, confirm } = useSound();
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
    if (revealed < 1 || revealed > pulls.length) return;
    const pull = pulls[revealed - 1];
    if (pull) void play(gachaRevealSoundForRarity(pull.rarity), { volume: 0.85 });
  }, [revealed, pulls, play]);

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
        <button
          type="button"
          className="gacha-reveal-card__btn"
          disabled={!allRevealed}
          onClick={() => {
            if (allRevealed) confirm();
            onClose();
          }}
        >
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
    gameEventEffects,
  } = usePlayer();
  const { version: contentVersion } = useGameContent();

  const eventBanner = gameEventEffects.gachaBanner;
  const eventPoolId = eventBanner?.config.poolId;
  const eventPool = eventPoolId ? getGachaPool(eventPoolId) : undefined;
  const eventBannerImage = eventPoolId ? getGachaPoolBanner(eventPoolId) : undefined;
  const eventTicketCost = eventBanner?.config.ticketCost ?? STANDARD_PULL_TICKET_COST;
  const eventGemCost = eventBanner?.config.gemCost ?? STANDARD_PULL_GEM_COST;
  const eventMultiCount = eventBanner?.config.multiCount ?? STANDARD_MULTI_PULL_COUNT;

  const [pack, setPack] = useState<PackTab>("standard");
  const [packTouched, setPackTouched] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [lastResults, setLastResults] = useState<GachaPullResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { play } = useSound();

  const tickets = currencies?.tickets ?? 0;
  const gems = currencies?.gems ?? 0;
  const hasWelcome = welcomePullsRemaining > 0;
  const pityPct = Math.min(100, Math.round((gachaPityStandard / GACHA_HARD_PITY) * 100));

  const canWelcome = supabaseEnabled && user && welcomePullsRemaining > 0;
  const canTicket = tickets >= STANDARD_PULL_TICKET_COST;
  const canGems = gems >= STANDARD_PULL_GEM_COST;
  const canTicketMulti = tickets >= STANDARD_PULL_TICKET_COST * STANDARD_MULTI_PULL_COUNT;
  const canGemsMulti = gems >= STANDARD_PULL_GEM_COST * STANDARD_MULTI_PULL_COUNT;
  const canEventTicket = tickets >= eventTicketCost;
  const canEventGems = gems >= eventGemCost;
  const canEventTicketMulti = tickets >= eventTicketCost * eventMultiCount;
  const canEventGemsMulti = gems >= eventGemCost * eventMultiCount;
  const ownedIds = useMemo(() => new Set(unlockedHubIds), [unlockedHubIds]);
  const onboardingDone = hasSpirits && !hasWelcome;

  useEffect(() => {
    if (!ready || packTouched) return;
    if (hasWelcome) setPack("welcome");
    else if (eventBanner && eventPool?.length) setPack("event");
    else setPack("standard");
  }, [ready, hasWelcome, packTouched, eventBanner, eventPool?.length]);

  // Redirection auto seulement si l'utilisateur n'a pas choisi un onglet (évite le bounce welcome « Terminé »)
  useEffect(() => {
    if (packTouched) return;
    if (!hasWelcome && pack === "welcome") {
      setPack(eventBanner && eventPool?.length ? "event" : "standard");
    }
    if (pack === "event" && (!eventBanner || !eventPool?.length)) {
      setPack("standard");
    }
  }, [hasWelcome, pack, eventBanner, eventPool?.length, packTouched]);

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    void play("ui_error");
  }, [error, toast, play]);

  useEffect(() => {
    if (!pulling) return;
    void play("gacha_tick");
    const id = window.setInterval(() => void play("gacha_tick", { volume: 0.6 }), 280);
    return () => window.clearInterval(id);
  }, [pulling, play]);

  function selectPack(next: PackTab) {
    setPackTouched(true);
    setPack(next);
  }

  const featured = useMemo(
    () =>
      pack === "welcome"
        ? WELCOME_GACHA_POOL.map((e, i) => ({ id: e.hubId as SpiritId, rarity: e.rarity, delay: i * 80 }))
        : pack === "event" && eventPool?.length
          ? eventPool.slice(0, 4).map((e, i) => ({ id: e.hubId as SpiritId, rarity: e.rarity, delay: i * 90 }))
          : featuredFromPool(STANDARD_GACHA_POOL, 100),
    [contentVersion, pack, eventPool],
  );

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
    else if (results.length > 0) {
      setLastResults(results);
      trackGachaPull({
        pool: "welcome",
        payment: "free",
        count: results.length,
        results: results.map((r) => ({
          hubId: r.hubId,
          rarity: r.rarity,
          templateKey: entryByHubId(r.hubId)?.templateKey ?? r.hubId,
        })),
      });
    }
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
    else if (results.length > 0) {
      setLastResults(results);
      trackGachaPull({
        pool: "standard",
        payment,
        count: results.length,
        results: results.map((r) => ({
          hubId: r.hubId,
          rarity: r.rarity,
          templateKey: entryByHubId(r.hubId)?.templateKey ?? r.hubId,
        })),
      });
    }
    await refresh();
  }

  async function invokeEvent(payment: StandardPullPayment, count: 1 | typeof STANDARD_MULTI_PULL_COUNT) {
    if (!eventBanner || pulling) return;
    const multi = count === eventMultiCount;
    if (payment === "ticket" && !(multi ? canEventTicketMulti : canEventTicket)) return;
    if (payment === "gems" && !(multi ? canEventGemsMulti : canEventGems)) return;

    setPulling(true);
    setError(null);
    const { results, error: pullError } = await pullEventGacha(eventBanner.id, payment, count);
    await new Promise((r) => setTimeout(r, multi ? 1400 : 900));
    setPulling(false);
    if (pullError) setError(pullError);
    else if (results.length > 0) {
      setLastResults(results);
      trackGachaPull({
        pool: eventBanner.config.poolId,
        payment,
        count: results.length,
        results: results.map((r) => ({
          hubId: r.hubId,
          rarity: r.rarity,
          templateKey: entryByHubId(r.hubId)?.templateKey ?? r.hubId,
        })),
      });
    }
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
            {eventBanner && eventPool?.length ? (
              <button
                type="button"
                className={`gacha-banner-btn ${pack === "event" ? "gacha-banner-btn--on" : ""}`}
                onClick={() => selectPack("event")}
              >
                <div
                  className={`gacha-banner-btn__bg ${eventBannerImage ? "gacha-banner-btn__bg--image" : "gacha-banner-btn__bg--welcome"}`}
                  style={
                    eventBannerImage
                      ? ({ backgroundImage: `url(${eventBannerImage})` } as CSSProperties)
                      : undefined
                  }
                />
                <span className="gacha-banner-btn__tag">Event</span>
                <span className="gacha-banner-btn__title">{eventBanner.title}</span>
              </button>
            ) : null}
          </aside>

          <div className="gacha-altar-wrap">
            <article className="gacha-altar">
              <div
                className={`gacha-hero__banner ${pack === "welcome" ? "gacha-hero__banner--welcome" : ""} ${pack === "event" && eventBannerImage ? "gacha-hero__banner--image" : ""}`}
              >
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
                ) : pack === "event" && eventBanner ? (
                  eventBannerImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={eventBannerImage} alt="" className="gacha-hero__banner-img" />
                      <div className="gacha-hero__banner-overlay">
                        <span className="gacha-hero__stamp">EVENT</span>
                        <h2 className="gacha-hero__headline">{eventBanner.title}</h2>
                        <p className="gacha-hero__pitch">{eventBanner.subtitle}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="gacha-hero__stamp">EVENT</span>
                      <h2 className="gacha-hero__headline">{eventBanner.title}</h2>
                      <p className="gacha-hero__pitch">{eventBanner.subtitle}</p>
                    </>
                  )
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
              ) : pack === "welcome" ? (
                <p className="gacha-welcome-left">
                  {hasWelcome ? (
                    <>
                      <strong>{welcomePullsRemaining}</strong> invocation
                      {welcomePullsRemaining > 1 ? "s" : ""} offerte
                      {welcomePullsRemaining > 1 ? "s" : ""}
                    </>
                  ) : (
                    <>
                      Pack <strong>terminé</strong> — consulte le pool ci-dessus
                    </>
                  )}
                </p>
              ) : null}

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

                {pack === "standard" || pack === "event" ? (
                  <div className="gacha-altar__actions-grid">
                    <button
                      type="button"
                      className={`gacha-pull gacha-pull--ticket ${pulling ? "gacha-pull--loading" : ""}`}
                      disabled={
                        pulling ||
                        (pack === "event" ? !canEventTicket : !canTicket)
                      }
                      onClick={() =>
                        void (pack === "event"
                          ? invokeEvent("ticket", 1)
                          : invokeStandard("ticket", 1))
                      }
                    >
                      <span className="gacha-pull__tag">Ticket commun</span>
                      <span className="gacha-pull__main">
                        <span className="gacha-pull__times">×1</span>
                        <span className="gacha-pull__label">Invocation</span>
                      </span>
                      <span className="gacha-pull__cost">
                        <IconCube className="gacha-pull__ico" />
                        {pack === "event" ? eventTicketCost : STANDARD_PULL_TICKET_COST}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`gacha-pull gacha-pull--ticket ${pulling ? "gacha-pull--loading" : ""}`}
                      disabled={
                        pulling ||
                        (pack === "event" ? !canEventTicketMulti : !canTicketMulti)
                      }
                      onClick={() =>
                        void (pack === "event"
                          ? invokeEvent("ticket", eventMultiCount as typeof STANDARD_MULTI_PULL_COUNT)
                          : invokeStandard("ticket", STANDARD_MULTI_PULL_COUNT))
                      }
                    >
                      <span className="gacha-pull__tag">Ticket commun</span>
                      <span className="gacha-pull__main">
                        <span className="gacha-pull__times">
                          ×{pack === "event" ? eventMultiCount : STANDARD_MULTI_PULL_COUNT}
                        </span>
                        <span className="gacha-pull__label">Multi</span>
                      </span>
                      <span className="gacha-pull__cost">
                        <IconCube className="gacha-pull__ico" />
                        {pack === "event"
                          ? eventTicketCost * eventMultiCount
                          : STANDARD_PULL_TICKET_COST * STANDARD_MULTI_PULL_COUNT}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`gacha-pull gacha-pull--gem ${pulling ? "gacha-pull--loading" : ""}`}
                      disabled={pulling || (pack === "event" ? !canEventGems : !canGems)}
                      onClick={() =>
                        void (pack === "event" ? invokeEvent("gems", 1) : invokeStandard("gems", 1))
                      }
                    >
                      <span className="gacha-pull__tag">Gemmes premium</span>
                      <span className="gacha-pull__main">
                        <span className="gacha-pull__times">×1</span>
                        <span className="gacha-pull__label">Invocation</span>
                      </span>
                      <span className="gacha-pull__cost">
                        <IconGem className="gacha-pull__ico" />
                        {pack === "event" ? eventGemCost : STANDARD_PULL_GEM_COST}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`gacha-pull gacha-pull--gem ${pulling ? "gacha-pull--loading" : ""}`}
                      disabled={pulling || (pack === "event" ? !canEventGemsMulti : !canGemsMulti)}
                      onClick={() =>
                        void (pack === "event"
                          ? invokeEvent("gems", eventMultiCount as typeof STANDARD_MULTI_PULL_COUNT)
                          : invokeStandard("gems", STANDARD_MULTI_PULL_COUNT))
                      }
                    >
                      <span className="gacha-pull__tag">Gemmes premium</span>
                      <span className="gacha-pull__main">
                        <span className="gacha-pull__times">
                          ×{pack === "event" ? eventMultiCount : STANDARD_MULTI_PULL_COUNT}
                        </span>
                        <span className="gacha-pull__label">Multi</span>
                      </span>
                      <span className="gacha-pull__cost">
                        <IconGem className="gacha-pull__ico" />
                        {pack === "event"
                          ? eventGemCost * eventMultiCount
                          : STANDARD_PULL_GEM_COST * STANDARD_MULTI_PULL_COUNT}
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

          <GachaRatesPanel
            pack={pack}
            gachaPityStandard={gachaPityStandard}
            ownedIds={ownedIds}
            eventPoolId={pack === "event" ? eventPoolId : undefined}
          />
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
