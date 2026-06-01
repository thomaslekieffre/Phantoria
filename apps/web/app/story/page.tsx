"use client";

import Link from "next/link";
import { GameShell } from "@/components/layout/game-shell";
import { usePlayer } from "@/components/providers/player-provider";

export default function StoryPage() {
  const { hasSpirits, spiritCount } = usePlayer();

  return (
    <GameShell active="camp">
      <div className="page-stub">
        <h1>Mode Histoire</h1>
        {!hasSpirits ? (
          <>
            <p>Tu n&apos;as pas encore d&apos;esprit. Invoque-les au gacha pour commencer la campagne.</p>
            <Link href="/gacha" className="play play--story" style={{ marginTop: "1rem", padding: "0.75rem 1.5rem" }}>
              Aller au gacha
            </Link>
          </>
        ) : (
          <>
            <p>
              11 zones · 165 niveaux — bientôt. ({spiritCount} esprit{spiritCount > 1 ? "s" : ""} prêt
              {spiritCount > 1 ? "s" : ""})
            </p>
            <Link href="/" className="play play--story" style={{ marginTop: "1rem", padding: "0.75rem 1.5rem" }}>
              Retour au sanctuaire
            </Link>
          </>
        )}
      </div>
    </GameShell>
  );
}
