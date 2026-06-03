import Link from "next/link";
import { GameShell } from "@/components/layout/game-shell";
import { StudioMoreLink } from "@/components/studio/studio-more-link";
import {
  IconBag,
  IconCamp,
  IconEvent,
  IconShop,
  IconStory,
} from "@/components/ui/icons";
import { storyCampaignLabel } from "@/lib/story/story-display";

const LINKS = [
  { href: "/profile", label: "Profil", sub: "Compte & statistiques", Icon: IconCamp },
  { href: "/story", label: "Histoire", sub: storyCampaignLabel(), Icon: IconStory },
  { href: "/shop", label: "Boutique", sub: "Offres & packs", Icon: IconShop },
  { href: "/inventory", label: "Inventaire", sub: "Objets & Phantoballs", Icon: IconBag },
  {
    href: "/events",
    label: "Événements",
    sub: "Calendrier live",
    Icon: IconEvent,
    notify: true,
  },
] as const;

export default function MorePage() {
  return (
    <GameShell active="more">
      <div className="page-more">
        <h1>Plus</h1>
        <ul className="page-more__grid">
          {LINKS.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="page-more__card">
                <span className="page-more__card-icon">
                  <item.Icon />
                </span>
                <span>
                  <span className="page-more__card-title">{item.label}</span>
                  <span className="page-more__card-sub">{item.sub}</span>
                </span>
              </Link>
            </li>
          ))}
          <StudioMoreLink />
        </ul>
      </div>
    </GameShell>
  );
}
