"use client";

import Link from "next/link";
import { usePlayer } from "@/components/providers/player-provider";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const { supabaseEnabled, user, profile, signOut } = usePlayer();

  if (!open) return null;

  return (
    <div className="mobile-menu" role="dialog" aria-modal aria-label="Menu">
      <button type="button" className="mobile-menu__backdrop" aria-label="Fermer" onClick={onClose} />
      <nav className="mobile-menu__panel">
        <header className="mobile-menu__head">
          <span className="mobile-menu__mark">P</span>
          <span className="mobile-menu__title">Phantoria</span>
          <button type="button" className="mobile-menu__close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </header>

        <ul className="mobile-menu__links">
          <li>
            <Link href="/profile" className="mobile-menu__link" onClick={onClose}>
              Profil{profile?.display_name ? ` · ${profile.display_name}` : ""}
            </Link>
          </li>
          <li>
            <Link href="/shop" className="mobile-menu__link" onClick={onClose}>
              Boutique
            </Link>
          </li>
          <li>
            <Link href="/inventory" className="mobile-menu__link" onClick={onClose}>
              Inventaire
            </Link>
          </li>
          <li>
            <Link href="/story" className="mobile-menu__link" onClick={onClose}>
              Mode Histoire
            </Link>
          </li>
        </ul>

        <footer className="mobile-menu__foot">
          {supabaseEnabled && !user ? (
            <Link href="/login" className="mobile-menu__cta" onClick={onClose}>
              Connexion
            </Link>
          ) : null}
          {supabaseEnabled && user ? (
            <button type="button" className="mobile-menu__cta mobile-menu__cta--ghost" onClick={() => void signOut()}>
              Déconnexion
            </button>
          ) : null}
        </footer>
      </nav>
    </div>
  );
}
