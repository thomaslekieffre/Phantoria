"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { applyGameContent, emptyGameContent, type GameContentSnapshot } from "@/lib/content/game-content";
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
      } else {
        applyGameContent(emptyGameContent());
        setSource("empty");
      }
    } catch {
      applyGameContent(emptyGameContent());
      setSource("empty");
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
      <div className="content-boot" role="status" aria-live="polite">
        <div className="content-boot__logo" aria-hidden>
          P
        </div>
        <p>Chargement du contenu…</p>
        <div className="content-boot__bar" aria-hidden>
          <span />
        </div>
      </div>
    );
  }

  return (
    <ContentContext.Provider value={{ ready, source, version, reload }}>
      {source === "empty" ? (
        <div className="content-boot content-boot--empty" role="status">
          <p>Contenu jeu absent en base.</p>
          <p>
            Ouvre le <Link href="/studio">Studio</Link> → importe le seed, puis recharge.
          </p>
        </div>
      ) : null}
      {children}
    </ContentContext.Provider>
  );
}
