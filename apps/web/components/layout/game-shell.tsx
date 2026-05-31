import type { ReactNode } from "react";
import { Sidebar, type NavId } from "./sidebar";
import { Topbar } from "./topbar";

type GameShellProps = {
  children: ReactNode;
  active: NavId;
};

export function GameShell({ children, active }: GameShellProps) {
  return (
    <div className="shell">
      <div className="shell__sidebar">
        <Sidebar active={active} />
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
