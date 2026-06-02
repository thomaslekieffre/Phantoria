"use client";

import type { ReactNode } from "react";
import { Sidebar, type NavId } from "./sidebar";
import { Topbar } from "./topbar";
import { useQuests } from "@/lib/quests/use-quests";

type GameShellProps = {
  children: ReactNode;
  active: NavId;
};

export function GameShell({ children, active }: GameShellProps) {
  const { pendingRewards, hydrated } = useQuests({
    trackLogin: active === "camp" || active === "quests",
  });
  const showQuestBadge = hydrated && pendingRewards > 0;

  return (
    <div className="shell">
      <div className="shell__sidebar">
        <Sidebar active={active} questBadge={showQuestBadge} />
      </div>
      <div className="shell__topbar">
        <Topbar />
      </div>
      <main className="shell__main">{children}</main>
    </div>
  );
}

/** @deprecated Utiliser `active` */
export type NavTab = NavId;
