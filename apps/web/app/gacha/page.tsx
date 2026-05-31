import { GameShell } from "@/components/layout/game-shell";

export default function GachaPage() {
  return (
    <GameShell active="gacha">
      <div className="page-stub">
        <h1>Gacha</h1>
        <p>Invocations et pity — bientôt.</p>
      </div>
    </GameShell>
  );
}
