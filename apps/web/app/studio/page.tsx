import Link from "next/link";

const SECTIONS = [
  {
    href: "/studio/events",
    title: "Events hub",
    desc: "Bandeau sanctuaire — actif, dates, CTA",
    status: "live",
  },
  {
    href: "#",
    title: "Esprits (yokai)",
    desc: "Catalogue characters.json → DB",
    status: "bientôt",
  },
  {
    href: "#",
    title: "Niveaux histoire",
    desc: "Zones, ennemis, étoiles",
    status: "bientôt",
  },
  {
    href: "#",
    title: "Gacha pools",
    desc: "Bannières, rates, esprits",
    status: "bientôt",
  },
  {
    href: "#",
    title: "Reliques run",
    desc: "Pool récompenses roguelite",
    status: "bientôt",
  },
] as const;

export default function StudioHomePage() {
  return (
    <div className="studio-home">
      <p className="studio-home__lead">
        Édite le live game sans redeploy. PostHog couvre le reste (comportement joueurs, bugs).
      </p>
      <ul className="studio-home__grid">
        {SECTIONS.map((s) => (
          <li key={s.title}>
            {s.status === "live" ? (
              <Link href={s.href} className="studio-card studio-card--live">
                <span className="studio-card__badge">Live</span>
                <h2>{s.title}</h2>
                <p>{s.desc}</p>
              </Link>
            ) : (
              <div className="studio-card studio-card--soon" aria-disabled>
                <span className="studio-card__badge studio-card__badge--muted">Bientôt</span>
                <h2>{s.title}</h2>
                <p>{s.desc}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
