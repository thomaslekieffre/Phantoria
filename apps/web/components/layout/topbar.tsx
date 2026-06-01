"use client";

import Link from "next/link";
import { IconCoin, IconCube, IconGem } from "@/components/ui/icons";
import { usePlayer } from "@/components/providers/player-provider";

export function Topbar() {
  const { currencies, supabaseEnabled, user, signOut } = usePlayer();

  const gold = currencies?.gold ?? 1200;
  const gems = currencies?.gems ?? 35;
  const tickets = currencies?.tickets ?? 2;

  return (
    <header className="topbar">
      <div className="topbar__spacer" aria-hidden />

      <div className="topbar__right">
        {supabaseEnabled && !user ? (
          <Link href="/login" className="topbar__auth">
            Connexion
          </Link>
        ) : null}
        {supabaseEnabled && user ? (
          <button type="button" className="topbar__auth" onClick={() => void signOut()}>
            Déconnexion
          </button>
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
  );
}
