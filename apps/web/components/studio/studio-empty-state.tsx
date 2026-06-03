"use client";

import { useState } from "react";
import { useGameContent } from "@/components/providers/game-content-provider";

type Props = {
  title: string;
  hint?: string;
  onSeeded?: () => void | Promise<void>;
};

export function StudioEmptyState({ title, hint, onSeeded }: Props) {
  const { reload } = useGameContent();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function seed() {
    if (!confirm("Importer tout le contenu depuis le code (esprits, gacha, histoire, reliques) ?")) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/studio/seed", { method: "POST" });
    const json = (await res.json()) as { error?: string; report?: Record<string, number> };
    setBusy(false);
    if (!res.ok) {
      setMsg(json.error ?? "Erreur import");
      return;
    }
    const count = json.report ? Object.values(json.report).reduce((a, b) => a + b, 0) : 0;
    setMsg(count > 0 ? `${count} entrées importées` : "Import terminé");
    await reload();
    await onSeeded?.();
  }

  return (
    <div className="studio-empty">
      <p className="studio-empty__title">{title}</p>
      {hint ? <p className="studio-empty__hint">{hint}</p> : null}
      <button type="button" className="studio-btn studio-btn--primary" disabled={busy} onClick={() => void seed()}>
        {busy ? "Import en cours…" : "Importer depuis le code"}
      </button>
      {msg ? <p className="studio-empty__msg">{msg}</p> : null}
    </div>
  );
}
