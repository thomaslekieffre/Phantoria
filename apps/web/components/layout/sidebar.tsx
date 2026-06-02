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
  shortLabel: string;
  badge?: boolean;
  Icon: FC<SVGProps<SVGSVGElement>>;
}[] = [
  { id: "camp", href: "/", label: "Sanctuaire", shortLabel: "Sanctuaire", Icon: IconCamp },
  { id: "spirits", href: "/spirits", label: "Esprits", shortLabel: "Esprits", Icon: IconSpirits },
  { id: "quests", href: "/quests", label: "Quêtes", shortLabel: "Quêtes", badge: true, Icon: IconQuest },
  { id: "gacha", href: "/gacha", label: "Gacha", shortLabel: "Gacha", Icon: IconGacha },
  { id: "more", href: "/more", label: "Plus", shortLabel: "Plus", Icon: IconMore },
];

export function Sidebar({ active, questBadge = false }: { active: NavId; questBadge?: boolean }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__mark">P</span>
        <span className="sidebar__title">Phantoria</span>
      </div>

      <nav className="sidebar__nav" aria-label="Navigation">
        {LINKS.map(({ id, href, label, shortLabel, badge, Icon }) => (
          <Link
            key={id}
            href={href}
            className={`sidebar__link ${active === id ? "sidebar__link--on" : ""}`}
            aria-current={active === id ? "page" : undefined}
          >
            <span className="sidebar__icon-wrap">
              <Icon className="sidebar__icon" />
              {badge && questBadge ? <span className="sidebar__badge" /> : null}
            </span>
            <span className="sidebar__label sidebar__label--desktop">{label}</span>
            <span className="sidebar__label sidebar__label--mobile">{shortLabel}</span>
          </Link>
        ))}
      </nav>

      <p className="sidebar__footer">Jeu web · navigateur</p>
    </aside>
  );
}
