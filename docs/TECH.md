# Phantoria — Stack technique

Décisions pour l’implémentation (complète le [GDD — PWA](GAME_DESIGN.md#support-technique--pwa)).

## Choix validé

| Couche | Stack | Notes |
|--------|--------|--------|
| **App** | **Next.js** (App Router) + **React** + **TypeScript** | SSR/SSG pour hub, routes combat ; PWA via config Next |
| **UI** | **Tailwind CSS** | Écrans mobile-first (combat portrait) |
| **Logique jeu** | **`packages/game-core`** (TS pur) | Combat, Âmes, capture, pity — testable sans React |
| **Backend** | **Supabase** (recommandé) ou API Next Route Handlers | Auth, sauvegardes, **gacha côté serveur** |
| **DB** | Postgres (Supabase) | Profils, roster, pulls, métaprogression |

Next.js seulement **si nécessaire** (SEO hub, API routes, déploiement Vercel). Un **Vite + React** suffit pour un proto combat-only ; pour Phantoria complet, **Next** est le bon défaut.

## Monorepo

```
Phantoria/
├── apps/web/          # Next.js (UI, PWA) — ✅ écran d’accueil
├── packages/game-core/  # Moteur & règles (à venir)
├── docs/
└── package.json
```

## Ordre d’implémentation

1. ✅ **Camp** (`/`) — hub nuit, équipe, CTA run/histoire
2. `game-core` — combat (roue 6 / terrain 3, VIT, Âmes, capture)
3. Routes `/run`, `/story`, `/collection`, `/gacha`
4. Supabase + auth

## PWA

- `next-pwa` ou manifest + service worker manuel
- Viewport mobile, `theme-color`, icônes
- Cible : installable desktop + mobile sans store

## Hors scope infra v0

- App native (Capacitor) — possible plus tard depuis la PWA
- Godot / moteur 2D dédié — non retenu pour l’UI gacha/hub
