"use client";

import { useState } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { GameShell } from "@/components/layout/game-shell";
import { SpiritPortrait } from "@/components/hub/spirit-portrait";
import { usePlayer } from "@/components/providers/player-provider";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseEnabled } from "@/lib/supabase/config";
import { performWelcomePull, WELCOME_PULLS_START, type GachaPullResult } from "@/lib/player/gacha-service";
import type { SpiritId } from "@/components/hub/roster";
import "./gacha.css";

export function GachaScreen() {
  const { welcomePullsRemaining, hasSpirits, spiritCount, refresh, supabaseEnabled, user } =
    usePlayer();
  const [pulling, setPulling] = useState(false);
  const [lastPull, setLastPull] = useState<GachaPullResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canPull = supabaseEnabled && user && welcomePullsRemaining > 0;

  async function invoke() {
    if (!canPull || pulling) return;
    setPulling(true);
    setError(null);
    setLastPull(null);

    const supabase = createClient();
    const { result, error: pullError } = await performWelcomePull(supabase);

    setPulling(false);
    if (pullError) {
      setError(pullError);
      return;
    }
    if (result) setLastPull(result);
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
        <div className="gacha">
          <div className="gacha__panel">
            <h1 className="gacha__title">Invocations</h1>
            <p className="gacha__sub">Connecte-toi pour invoquer tes premiers esprits.</p>
            <Link href="/login" className="gacha__cta">
              Connexion
            </Link>
          </div>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell active="gacha">
      <div className="gacha">
        <div className="gacha__panel">
          <p className="gacha__eyebrow">Bienvenue, voyageur</p>
          <h1 className="gacha__title">Premières invocations</h1>
          <p className="gacha__sub">
            Tu n&apos;as pas encore d&apos;esprit. {WELCOME_PULLS_START} invocations pour remplir la
            roue — puis run ou histoire.
          </p>

          <div className="gacha__counter">
            <span className="gacha__counter-val">{welcomePullsRemaining}</span>
            <span className="gacha__counter-lbl">invocations gratuites</span>
          </div>

          {spiritCount > 0 ? (
            <p className="gacha__owned">
              Collection : <strong>{spiritCount}</strong> esprit{spiritCount > 1 ? "s" : ""}
              {hasSpirits ? (
                <>
                  {" "}
                  — <Link href="/">sanctuaire</Link> · <Link href="/run">run</Link>
                </>
              ) : null}
            </p>
          ) : null}

          {error ? <p className="gacha__error">{error}</p> : null}

          {lastPull ? (
            <div
              className={`gacha__reveal gacha__reveal--${lastPull.kind}`}
              style={
                lastPull.kind === "spirit"
                  ? ({ "--hue": lastPull.hue } as CSSProperties)
                  : undefined
              }
            >
              {lastPull.kind === "spirit" ? (
                <>
                  <SpiritPortrait id={lastPull.hubId as SpiritId} className="gacha__reveal-art" />
                  <p className="gacha__reveal-name">{lastPull.name}</p>
                  <p className="gacha__reveal-tribe">{lastPull.tribe}</p>
                  <p className="gacha__reveal-kicker">Nouvel esprit !</p>
                </>
              ) : (
                <>
                  <p className="gacha__reveal-name">{lastPull.name}</p>
                  <p className="gacha__reveal-kicker">Doublon — +{lastPull.gems} gemmes</p>
                </>
              )}
            </div>
          ) : null}

          <button
            type="button"
            className="gacha__cta"
            disabled={!canPull || pulling}
            onClick={() => void invoke()}
          >
            {pulling
              ? "Invocation…"
              : welcomePullsRemaining > 0
                ? "Invoquer"
                : "Plus d'invocations gratuites"}
          </button>

          {welcomePullsRemaining <= 0 && !hasSpirits ? (
            <p className="gacha__warn">
              Il te faut au moins un esprit pour jouer. Les packs payants arrivent bientôt.
            </p>
          ) : null}

          {welcomePullsRemaining <= 0 && hasSpirits ? (
            <Link href="/" className="gacha__back">
              Aller au sanctuaire
            </Link>
          ) : null}
        </div>
      </div>
    </GameShell>
  );
}
