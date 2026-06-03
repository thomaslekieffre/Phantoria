"use client";

import Link from "next/link";
import { usePlayer } from "@/components/providers/player-provider";

export function StudioMoreLink() {
  const { isStudioAdmin } = usePlayer();
  if (!isStudioAdmin) return null;

  return (
    <li>
      <Link href="/studio" className="page-more__card page-more__card--studio">
        <span className="page-more__card-icon" aria-hidden>
          🛠
        </span>
        <span>
          <span className="page-more__card-title">Studio dev</span>
          <span className="page-more__card-sub">Events, esprits, gacha…</span>
        </span>
      </Link>
    </li>
  );
}
