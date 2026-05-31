# Phantoria — Développement

Habitudes de travail sur le dépôt (à suivre pour chaque feature).

## Prérequis

- Node.js 20+
- pnpm 10 (`corepack enable`)
- Navigateur desktop récent (Chrome, Firefox, Edge)

## Commandes

```bash
pnpm install          # après clone ou pull avec lockfile changé
pnpm dev              # Next.js → http://localhost:3000
pnpm build            # vérif prod locale
pnpm lint             # ESLint (apps/web)
pnpm test:core        # tests game-core (34 tests : tribus, formules, combat, récompenses, vagues)
```

Ouvre le jeu en **plein écran navigateur** (F11 si besoin) pour juger le rendu desktop.

## Avant de coder

1. Lire / mettre à jour [`GAME_DESIGN.md`](GAME_DESIGN.md) si le système change.
2. Noter les formules & décisions dans [`DATA.md`](DATA.md).
3. Vérifier [`TECH.md`](TECH.md) — **client web navigateur**, pas app mobile.

## Workflow Git

1. **Petits commits** — une intention claire par commit.
2. **Messages en français**, impératif ou descriptif court :  
   `feat(web): hub desktop roue et panneau sanctuaire`
3. **Pas de** `Co-authored-by: Cursor` (hook + règle [`.cursor/rules/git-commits.mdc`](../.cursor/rules/git-commits.mdc)).
4. **Ne pas committer** `.env`, secrets, `node_modules`, `.next/`.
5. **Push** sur `main` seulement quand le build passe : `pnpm build`.

### Hooks (une fois par clone)

```powershell
.\scripts\setup-git-hooks.ps1
```

```bash
./scripts/setup-git-hooks.sh
```

## Structure actuelle

| Chemin | Rôle |
|--------|------|
| `apps/web` | Client Next.js — hub sanctuaire (`/`), routes secondaires |
| `apps/web/components/layout/` | Shell desktop (sidebar, topbar, game-shell) |
| `apps/web/components/hub/` | Hub : roue, portraits, panneau fiche + actions |
| `apps/web/components/run/` | Run roguelite : combat, capture, récompenses, reliques |
| `packages/game-core/` | Moteur TS pur : tribus, formules, `CombatEngine`, vagues, récompenses |
| `docs/` | GDD, data, tech, ce fichier |

### Routes web

| Route | Écran |
|-------|--------|
| `/` | Sanctuaire (hub) |
| `/spirits` | Collection (stub) |
| `/quests` | Quêtes (stub) |
| `/gacha` | Gacha (stub) |
| `/more` | Boutique, inventaire, événements… |
| `/run` | **Run roguelite** — combat jouable (starter, vagues, capture, reliques) |
| `/story` | Mode Histoire (stub) |

### Composants run (`apps/web/components/run/`)

| Fichier | Rôle |
|---------|------|
| `run-screen.tsx` | Écran principal, branche `CombatEngine` |
| `battle-wheel.tsx` | Roue ×6 + reliques sidebar |
| `run-relics-tray.tsx` | Reliques persistantes + tooltips |
| `wave-reward-picker.tsx` | Choix objet entre vagues |
| `run-starter-picker.tsx` | Choix starter |
| `capture-sequence.tsx` | Animation capture |
| `foe-inspect.tsx` | Inspect ennemi (tribu, matchups) |
| `tribe-chart.tsx` | Table faiblesses 11×11 |
| `combat-spirit.tsx` | Sprites combat |
| `run.css` | Styles run |

### game-core — où modifier quoi

| Besoin | Fichier |
|--------|---------|
| Nouvel esprit | `characters.ts` |
| Formule dégâts / capture / âmes | `formulas.ts` + tests |
| Logique combat | `combat-engine.ts` |
| Ennemis par vague | `run-waves.ts` |
| Objets / reliques | `run-rewards.ts` |
| Types & constantes | `types.ts` |

`packages/game-core` — détails dans [`TECH.md`](TECH.md).

## Ordre d’implémentation

Voir [TECH.md — Ordre d’implémentation](TECH.md#ordre-dimplémentation).
