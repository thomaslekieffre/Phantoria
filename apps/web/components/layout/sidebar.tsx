"use client";

import type { FC, SVGProps } from "react";
import Link from "next/link";
import {
  IconCamp,
  IconGacha,
  IconMore,
  IconQuest,
  IconSpirits,
} from "@/components/ui/icons";

export type NavId = "camp" | "spirits" | "quests" | "gacha" | "more";

const LINKS: {
  id: NavId;
  href: string;
  label: string;
  badge?: boolean;
  Icon: FC<SVGProps<SVGSVGElement>>;
}[] = [
  { id: "camp", href: "/", label: "Sanctuaire", Icon: IconCamp },
  { id: "spirits", href: "/spirits", label: "Esprits", Icon: IconSpirits },
  { id: "quests", href: "/quests", label: "Quêtes", badge: true, Icon: IconQuest },
  { id: "gacha", href: "/gacha", label: "Gacha", Icon: IconGacha },
  { id: "more", href: "/more", label: "Plus", Icon: IconMore },
];

export function Sidebar({ active }: { active: NavId }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__mark">P</span>
        <span className="sidebar__title">Phantoria</span>
      </div>

      <nav className="sidebar__nav" aria-label="Navigation">
        {LINKS.map(({ id, href, label, badge, Icon }) => (
          <Link
            key={id}
            href={href}
            className={`sidebar__link ${active === id ? "sidebar__link--on" : ""}`}
            aria-current={active === id ? "page" : undefined}
          >
            <span className="sidebar__icon-wrap">
              <Icon className="sidebar__icon" />
              {badge ? <span className="sidebar__badge" /> : null}
            </span>
            {label}
          </Link>
        ))}
      </nav>

      <p className="sidebar__footer">Jeu web · navigateur</p>
    </aside>
  );
}
