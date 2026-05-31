# Phantoria — Stack technique

Décisions pour l’implémentation (complète le [GDD — Client web](GAME_DESIGN.md#support-technique--client-web)).

## Choix validé

| Couche | Stack | Notes |
|--------|--------|--------|
| **App** | **Next.js** (App Router) + **React** + **TypeScript** | Hub SSR, routes combat, déploiement Vercel / Node |
| **UI** | **CSS** (+ Tailwind dispo) | **Desktop-first** — layout navigateur plein écran |
| **Logique jeu** | **`packages/game-core`** (TS pur) | Combat, Âmes, capture, pity — testable sans React |
| **Backend** | **Supabase** (recommandé) ou Route Handlers Next | Auth, sauvegardes, **gacha côté serveur** |
| **DB** | Postgres (Supabase) | Profils, roster, pulls, métaprogression |

## Client : jeu web navigateur

- **Cible principale** : PC / écran large, souris + clavier.
- **Pas de contrainte PWA** en v0 : le jeu se joue dans l’onglet (`http://localhost:3000` en dev).
- **Layout** : sidebar fixe + topbar + zone de jeu (hub sanctuaire, combat, gacha…).
- **Responsive** : secondaire ; le combat pourra adapter la largeur plus tard.

## Monorepo

```
Phantoria/
├── apps/web/          # Next.js — client web
├── packages/game-core/  # Moteur & règles (à venir)
├── docs/
└── package.json
```

## UI actuelle (`apps/web`)

| Zone | Composant | Rôle |
|------|-----------|------|
| Shell | `components/layout/` | Grille desktop : sidebar, topbar, main |
| Hub | `components/hub/` | Sanctuaire `/` — roue ×6, fiche esprit, quêtes, CTA |
| Routes | `app/*/page.tsx` | Esprits, quêtes, gacha, plus, run, histoire |

### Hub sanctuaire (`/`)

- **Roue d'esprits** : 6 emplacements, 3 max sur le terrain (GDD).
- **Portraits SVG** par esprit ; slots vides = trous « Libre ».
- **Sélection** : clic sur un esprit → fiche dans le panneau droit (PV, tribu, terrain/réserve).
- **Toggle terrain** : bouton « Mettre sur le terrain » / « Retirer du terrain » (état local mock).
- **Panneau droit** : quête active, stats, événement, CTA Run / Histoire.
- **Navigation** : sidebar unique (plus de double nav mobile).

Fichiers clés : `hub-screen.tsx`, `spirit-wheel.tsx`, `hub-panel.tsx`, `roster.ts`, `spirit-portrait.tsx`.

## Ordre d’implémentation

1. ✅ **Hub desktop** (`/`) — roue ×6, fiche esprit, toggle terrain, CTA run / histoire
2. `game-core` — combat (roue 6 / terrain 3, VIT, Âmes, capture)
3. Écrans `/run`, `/story`, collection, gacha
4. Supabase + auth

## Hors scope infra v0

- App native / store mobile
- PWA installable (optionnel plus tard)
- Godot / moteur 2D dédié pour l’UI hub
