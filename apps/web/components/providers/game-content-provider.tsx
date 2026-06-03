"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { applyGameContent, type GameContentSnapshot } from "@/lib/content/game-content";
import { getSpiritCatalogVersion } from "@/lib/player/spirit-catalog";

type ContentContextValue = {
  ready: boolean;
  source: GameContentSnapshot["source"] | null;
  version: number;
  reload: () => Promise<void>;
};

const ContentContext = createContext<ContentContextValue>({
  ready: false,
  source: null,
  version: 0,
  reload: async () => {},
});

export function useGameContent() {
  return useContext(ContentContext);
}

export function GameContentProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [source, setSource] = useState<GameContentSnapshot["source"] | null>(null);
  const [version, setVersion] = useState(0);

  async function reload() {
    try {
      const res = await fetch("/api/content/game");
      if (res.ok) {
        const content = (await res.json()) as GameContentSnapshot;
        applyGameContent(content);
        setSource(content.source);
      }
    } catch {
      /* fallback game-core defaults */
    } finally {
      setVersion(getSpiritCatalogVersion());
      setReady(true);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#0a1210] text-[#9cb8ad]">
        Chargement du contenu…
      </div>
    );
  }

  return (
    <ContentContext.Provider value={{ ready, source, version, reload }}>{children}</ContentContext.Provider>
  );
}
