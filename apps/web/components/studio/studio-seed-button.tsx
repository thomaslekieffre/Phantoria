"use client";

import { useState } from "react";
import { useGameContent } from "@/components/providers/game-content-provider";

export function StudioSeedButton() {
  const { reload } = useGameContent();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function seed() {
    if (!confirm("Importer tout le contenu depuis le code (characters.json, gacha, histoire, reliques) ?")) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/studio/seed", { method: "POST" });
    const json = (await res.json()) as { error?: string; report?: Record<string, number> };
    setBusy(false);
    if (!res.ok) {
      setMsg(json.error ?? "Erreur seed");
      return;
    }
    setMsg(`OK — ${JSON.stringify(json.report)}`);
    await reload();
  }

  return (
    <div className="studio-seed">
      <button type="button" className="studio-btn studio-btn--primary" disabled={busy} onClick={() => void seed()}>
        {busy ? "Import…" : "Importer contenu depuis le code"}
      </button>
      {msg ? <p className="studio-seed__msg">{msg}</p> : null}
    </div>
  );
}
