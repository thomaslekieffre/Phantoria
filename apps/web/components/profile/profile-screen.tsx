"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GameShell } from "@/components/layout/game-shell";
import { IconCoin, IconCube, IconGem } from "@/components/ui/icons";
import { usePlayer } from "@/components/providers/player-provider";
import { createClient } from "@/lib/supabase/client";
import { persistDisplayName } from "@/lib/player/profile-service";
import { GACHA_HARD_PITY } from "@phantoria/game-core";
import "./profile.css";

function formatDate(iso: string | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export function ProfileScreen() {
  const {
    ready,
    user,
    profile,
    currencies,
    supabaseEnabled,
    spiritCount,
    runsCompleted,
    welcomePullsRemaining,
    gachaPityStandard,
    signOut,
    refresh,
  } = usePlayer();

  const [nameDraft, setNameDraft] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMessage, setNameMessage] = useState<string | null>(null);

  useEffect(() => {
    setNameDraft(profile?.display_name ?? "");
  }, [profile?.display_name]);

  const displayName = profile?.display_name ?? "Voyageur";
  const memberSince = formatDate(profile?.created_at);
  const gold = currencies?.gold ?? 0;
  const gems = currencies?.gems ?? 0;
  const tickets = currencies?.tickets ?? 0;
  const storyLevel = profile?.level ?? 1;
  const pityLeft = Math.max(0, GACHA_HARD_PITY - gachaPityStandard);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseEnabled || !user) return;

    setNameSaving(true);
    setNameMessage(null);
    const supabase = createClient();
    const result = await persistDisplayName(supabase, nameDraft);
    setNameSaving(false);

    if (!result.ok) {
      setNameMessage(result.error ?? "Erreur");
      return;
    }

    setNameMessage("Nom mis à jour.");
    await refresh();
  }

  if (!ready) {
    return (
      <GameShell active="more">
        <div className="profile-scene">
          <p className="profile-scene__loading">Chargement…</p>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell active="more">
      <div className="profile-scene">
        <header className="profile-hero">
          <div className="profile-hero__avatar" aria-hidden>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="profile-hero__kicker">Profil</p>
            <h1 className="profile-hero__name">{displayName}</h1>
            {supabaseEnabled && user?.email ? (
              <p className="profile-hero__email">{user.email}</p>
            ) : (
              <p className="profile-hero__email">Mode local — connecte-toi pour sauvegarder</p>
            )}
            {memberSince ? <p className="profile-hero__since">Membre depuis {memberSince}</p> : null}
          </div>
        </header>

        <div className="profile-grid">
          <section className="profile-card profile-card--wide">
            <h2 className="profile-card__title">Identité</h2>
            {supabaseEnabled && user ? (
              <form className="profile-form" onSubmit={(e) => void handleSaveName(e)}>
                <label className="profile-form__field">
                  <span>Nom affiché (sanctuaire)</span>
                  <input
                    type="text"
                    value={nameDraft}
                    maxLength={24}
                    onChange={(e) => setNameDraft(e.target.value)}
                    autoComplete="nickname"
                  />
                </label>
                <div className="profile-form__actions">
                  <button type="submit" className="profile-btn profile-btn--primary" disabled={nameSaving}>
                    {nameSaving ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </div>
                {nameMessage ? (
                  <p
                    className={`profile-form__msg ${nameMessage.includes("Erreur") || nameMessage.includes("Au moins") ? "profile-form__msg--err" : ""}`}
                  >
                    {nameMessage}
                  </p>
                ) : null}
              </form>
            ) : (
              <p className="profile-card__hint">
                <Link href="/login">Connecte-toi</Link> pour personnaliser ton nom et synchroniser la
                progression.
              </p>
            )}
          </section>

          <section className="profile-card">
            <h2 className="profile-card__title">Progression</h2>
            <dl className="profile-stats">
              <div>
                <dt>Histoire</dt>
                <dd>niv. {storyLevel}</dd>
              </div>
              <div>
                <dt>Runs terminées</dt>
                <dd>{runsCompleted}</dd>
              </div>
              <div>
                <dt>Esprits possédés</dt>
                <dd>{spiritCount}</dd>
              </div>
              <div>
                <dt>Pity gacha standard</dt>
                <dd>
                  {gachaPityStandard} / {GACHA_HARD_PITY}
                  <span className="profile-stats__sub"> ({pityLeft} avant garantie S)</span>
                </dd>
              </div>
              {welcomePullsRemaining > 0 ? (
                <div>
                  <dt>Bienvenue restants</dt>
                  <dd>{welcomePullsRemaining} invocation(s)</dd>
                </div>
              ) : null}
            </dl>
            <p className="profile-card__hint">
              Le niveau affiché ici sert la <strong>campagne</strong>. En roguelite, tes esprits repartent à 1
              par run.
            </p>
          </section>

          <section className="profile-card">
            <h2 className="profile-card__title">Monnaies</h2>
            <ul className="profile-wallet">
              <li>
                <IconCoin className="profile-wallet__ico" aria-hidden />
                <span className="profile-wallet__val">{gold.toLocaleString("fr-FR")}</span>
                <span className="profile-wallet__lbl">Or</span>
              </li>
              <li>
                <IconGem className="profile-wallet__ico" aria-hidden />
                <span className="profile-wallet__val">{gems}</span>
                <span className="profile-wallet__lbl">Gemmes</span>
              </li>
              <li>
                <IconCube className="profile-wallet__ico" aria-hidden />
                <span className="profile-wallet__val">{tickets}</span>
                <span className="profile-wallet__lbl">Tickets</span>
              </li>
            </ul>
            <Link href="/gacha" className="profile-link">
              Ouvrir le gacha →
            </Link>
          </section>

          <section className="profile-card">
            <h2 className="profile-card__title">Compte</h2>
            {supabaseEnabled && user ? (
              <div className="profile-account">
                <p className="profile-card__hint">Session active · cloud Supabase</p>
                <button
                  type="button"
                  className="profile-btn profile-btn--ghost"
                  onClick={() => void signOut()}
                >
                  Se déconnecter
                </button>
              </div>
            ) : supabaseEnabled ? (
              <Link href="/login" className="profile-btn profile-btn--primary profile-btn--block">
                Se connecter
              </Link>
            ) : (
              <p className="profile-card__hint">Supabase non configuré — jeu en mode démo local.</p>
            )}
          </section>
        </div>

        <nav className="profile-shortcuts" aria-label="Raccourcis">
          <Link href="/">Sanctuaire</Link>
          <Link href="/spirits">Collection</Link>
          <Link href="/run">Roguelite</Link>
          <Link href="/more">Plus</Link>
        </nav>
      </div>
    </GameShell>
  );
}
