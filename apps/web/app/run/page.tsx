import Link from "next/link";
import { GameShell } from "@/components/layout/game-shell";

export default function RunPage() {
  return (
    <GameShell activeTab="run">
      <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
        <p className="font-[family-name:var(--font-outfit)] text-2xl font-extrabold">
          Run roguelite
        </p>
        <p className="text-sm text-slate-400">Prochain écran — carte de run</p>
        <Link
          href="/"
          className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white"
        >
          Retour au camp
        </Link>
      </div>
    </GameShell>
  );
}
