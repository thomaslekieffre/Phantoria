import Link from "next/link";
import { GameShell } from "@/components/layout/game-shell";

export default function RunPage() {
  return (
    <GameShell active="camp">
      <div className="page-stub">
        <h1>Run roguelite</h1>
        <p>Carte de run et combat — bientôt.</p>
        <Link href="/" className="play play--run" style={{ marginTop: "1rem", padding: "0.75rem 1.5rem" }}>
          Retour au sanctuaire
        </Link>
      </div>
    </GameShell>
  );
}
