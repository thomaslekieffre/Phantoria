"use client";

import { useState } from "react";
import Link from "next/link";
import { IconCoin, IconCube, IconGem } from "@/components/ui/icons";
import { usePlayer } from "@/components/providers/player-provider";
import { MobileMenu } from "./mobile-menu";

export function Topbar() {
  const { currencies, profile, supabaseEnabled, user, signOut } = usePlayer();
  const [menuOpen, setMenuOpen] = useState(false);

  const gold = currencies?.gold ?? 1200;
  const gems = currencies?.gems ?? 35;
  const tickets = currencies?.tickets ?? 2;

  return (
    <>
      <header className="topbar">
        <button
          type="button"
          className="topbar__menu"
          aria-label="Ouvrir le menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <span className="topbar__menu-bar" />
          <span className="topbar__menu-bar" />
          <span className="topbar__menu-bar" />
        </button>

        <Link href="/" className="topbar__brand" aria-label="Phantoria — Sanctuaire">
          <span className="topbar__mark">P</span>
          <span className="topbar__brand-name">Phantoria</span>
        </Link>

        <div className="topbar__spacer" aria-hidden />

        <div className="topbar__right">
          {supabaseEnabled && !user ? (
            <Link href="/login" className="topbar__auth">
              Connexion
            </Link>
          ) : null}
          {supabaseEnabled && user ? (
            <>
              <Link href="/profile" className="topbar__profile" title="Mon profil">
                {profile?.display_name ?? "Profil"}
              </Link>
              <button type="button" className="topbar__auth" onClick={() => void signOut()}>
                Déconnexion
              </button>
            </>
          ) : null}

          <div className="topbar__wallet">
            <span className="topbar__cur">
              <IconCoin className="topbar__cur-ico" />
              {gold.toLocaleString("fr-FR")}
            </span>
            <span className="topbar__cur">
              <IconGem className="topbar__cur-ico" />
              {gems}
            </span>
            <span className="topbar__cur">
              <IconCube className="topbar__cur-ico" />
              {tickets}
            </span>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
