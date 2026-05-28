import Link from "next/link";
import { GameShell } from "@/components/layout/game-shell";
import { CampBackdrop } from "./camp-backdrop";
import { TeamStrip } from "./team-strip";
import "./camp.css";

export function CampScreen() {
  return (
    <GameShell activeTab="camp">
      <div className="camp">
        <CampBackdrop />

        <div className="camp__content">
          <div className="camp__hero">
            <p className="camp__eyebrow">Sanctuaire des esprits</p>
            <h1 className="camp__title">Phantoria</h1>
            <p className="camp__tagline">
              Collectionne. Combats. Découvre le néant.
            </p>
          </div>

          <TeamStrip />

          <div className="camp__modes">
            <Link href="/run" className="mode-cta mode-cta--run">
              <span className="mode-cta__shine" />
              <span className="mode-cta__inner">
                <span className="mode-cta__kicker">Roguelite</span>
                <span className="mode-cta__title">Lancer un run</span>
                <span className="mode-cta__desc">
                  Vagues · capture · roue de 6
                </span>
              </span>
              <span className="mode-cta__arrow" aria-hidden>
                →
              </span>
            </Link>

            <Link href="/story" className="mode-cta mode-cta--story">
              <span className="mode-cta__inner">
                <span className="mode-cta__kicker">Campagne</span>
                <span className="mode-cta__title">Histoire</span>
                <span className="mode-cta__desc">11 zones · 165 niveaux</span>
              </span>
              <span className="mode-cta__arrow" aria-hidden>
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </GameShell>
  );
}
