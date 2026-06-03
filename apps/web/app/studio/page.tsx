import Link from "next/link";
import { StudioSeedButton } from "@/components/studio/studio-seed-button";

const SECTIONS = [
  {
    href: "/studio/events",
    title: "Events hub",
    desc: "Bandeaux sanctuaire, boosts capture, bannières gacha event",
    icon: "🎉",
    status: "live" as const,
  },
  {
    href: "/studio/spirits",
    title: "Esprits",
    desc: "Catalogue complet (invocables + ennemis), stats, skills",
    icon: "👻",
    status: "live" as const,
  },
  {
    href: "/studio/story",
    title: "Niveaux histoire",
    desc: "Zones, niveaux, vagues d'ennemis, textes narratifs",
    icon: "📖",
    status: "live" as const,
  },
  {
    href: "/studio/gacha",
    title: "Gacha pools",
    desc: "Bannières d'invocation, coûts tickets/gemmes, contenu",
    icon: "🎰",
    status: "live" as const,
  },
  {
    href: "/studio/rewards",
    title: "Reliques run",
    desc: "Récompenses roguelite entre les vagues (buff stats, heal, crit)",
    icon: "✨",
    status: "live" as const,
  },
];

export default function StudioHomePage() {
  return (
    <div className="studio-home">
      <p className="studio-home__lead">
        Édite le contenu du jeu en live, sans redeploy. Modifie les esprits, niveaux, gacha et events directement ici.
        Les changements sont appliqués au prochain chargement du jeu.
      </p>
      <StudioSeedButton />
      <ul className="studio-home__grid">
        {SECTIONS.map((s) => (
          <li key={s.title}>
            <Link href={s.href} className="studio-card">
              <span className="studio-card__badge">Live</span>
              <h2>
                {s.icon} {s.title}
              </h2>
              <p>{s.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
