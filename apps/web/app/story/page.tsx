import Link from "next/link";
import { GameShell } from "@/components/layout/game-shell";

export default function StoryPage() {
  return (
    <GameShell active="camp">
      <div className="page-stub">
        <h1>Mode Histoire</h1>
        <p>11 zones · 165 niveaux — bientôt.</p>
        <Link href="/" className="play play--story" style={{ marginTop: "1rem", padding: "0.75rem 1.5rem" }}>
          Retour au sanctuaire
        </Link>
      </div>
    </GameShell>
  );
}
