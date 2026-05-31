import { Suspense } from "react";
import { GameShell } from "@/components/layout/game-shell";
import { RunScreen } from "@/components/run/run-screen";

export default function RunPage() {
  return (
    <GameShell active="camp">
      <Suspense fallback={null}>
        <RunScreen />
      </Suspense>
    </GameShell>
  );
}
