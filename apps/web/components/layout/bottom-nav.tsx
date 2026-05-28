"use client";

import type { FC, SVGProps } from "react";
import Link from "next/link";
import {
  IconCamp,
  IconMenu,
  IconShop,
  IconSoul,
  IconSpark,
  IconSword,
} from "@/components/ui/icons";

export type NavTab = "camp" | "run" | "shop" | "gacha" | "menu";

const TABS: {
  id: NavTab;
  href: string;
  label: string;
  badge?: boolean;
  Icon: FC<SVGProps<SVGSVGElement>>;
}[] = [
  { id: "camp", href: "/", label: "Camp", Icon: IconCamp },
  { id: "run", href: "/run", label: "Run", Icon: IconSword },
  { id: "shop", href: "/shop", label: "Shop", badge: true, Icon: IconShop },
  { id: "gacha", href: "/gacha", label: "Gacha", badge: true, Icon: IconSpark },
  { id: "menu", href: "/menu", label: "Menu", Icon: IconMenu },
];

export function BottomNav({ active }: { active: NavTab }) {
  return (
    <nav className="dock safe-bottom" aria-label="Navigation">
      {TABS.map(({ id, href, label, badge, Icon }) => {
        const on = id === active;
        return (
          <Link
            key={id}
            href={href}
            className={`dock__item ${on ? "dock__item--on" : ""}`}
            aria-current={on ? "page" : undefined}
          >
            <span className="dock__btn">
              <Icon className="dock__svg" />
              {badge ? <span className="dock__dot" /> : null}
            </span>
            <span className="dock__label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
