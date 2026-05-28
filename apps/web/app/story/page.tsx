import Link from "next/link";
import { GameShell } from "@/components/layout/game-shell";

export default function StoryPage() {
  return (
    <GameShell activeTab="camp">
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-4xl">📜</p>
        <h1 className="text-xl font-black">Histoire</h1>
        <p className="text-sm font-semibold text-text-muted">Bientôt — carte des zones</p>
        <Link
          href="/"
          className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-black"
        >
          ← Camp
        </Link>
      </div>
    </GameShell>
  );
}
