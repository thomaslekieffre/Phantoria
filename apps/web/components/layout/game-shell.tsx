import type { ReactNode } from "react";
import { BottomNav, type NavTab } from "./bottom-nav";
import { TopHud } from "./top-hud";

type GameShellProps = {
  children: ReactNode;
  activeTab: NavTab;
  showHud?: boolean;
};

export function GameShell({
  children,
  activeTab,
  showHud = true,
}: GameShellProps) {
  return (
    <div className="game-frame">
      {showHud ? <TopHud /> : null}
      <div className="game-frame__body">{children}</div>
      <BottomNav active={activeTab} />
    </div>
  );
}
