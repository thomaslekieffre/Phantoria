"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import "./page-enter.css";

/** Transition légère à chaque changement de route (sauf combat). */
export function PageEnter({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const isCombat =
    pathname === "/run" ||
    /^\/story\/\d+\/\d+/.test(pathname);

  return (
    <div
      key={pathname}
      className={`page-enter${isCombat ? " page-enter--instant" : ""}`}
    >
      {children}
    </div>
  );
}
