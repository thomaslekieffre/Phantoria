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
pnpm test:core        # tests game-core (47 tests)
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
| `/gacha` | **Invocations** — 6 tirages bienvenue, pool starters |
| `/more` | Boutique, inventaire, événements… |
| `/run` | **Run roguelite** — combat jouable (starter, vagues, capture, reliques) |
| `/login` | Connexion Supabase (si env configuré) |
| `/story` | Mode Histoire (stub, gate si 0 esprit) |

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

## Supabase (persistance cloud)

Mode **dual** :

- **Sans** `NEXT_PUBLIC_SUPABASE_*` → hub mock (`INITIAL_ROSTER`), run en `localStorage` (comportement actuel).
- **Avec** env → auth email/mot de passe, profil + monnaies + roster en DB, run dans `active_runs`.

### Setup

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Copier `apps/web/.env.example` → `apps/web/.env.local` et remplir URL + anon key.
3. Appliquer la migration :

```bash
# CLI Supabase (si installée)
supabase db push
# ou coller supabase/migrations/20260531120000_initial.sql dans SQL Editor
```

4. Auth → désactiver confirmation e-mail en dev si besoin (Settings → Auth).
5. `pnpm dev` → `/login` → créer un compte → **redirigé vers `/gacha`** (6 invocations gratuites, roster vide).

### Onboarding

- Nouveau compte : **0 esprit**, or/gemmes/tickets à 0, `welcome_pulls_remaining = 6` (roue complète si 6 esprits distincts).
- Hub roue vide → gacha obligatoire avant run / histoire.
- Doublon au gacha : +25 gemmes (pas de 2ᵉ ligne `player_spirits`).

### Tables

| Table | Rôle |
|-------|------|
| `profiles` | Nom affiché, niveau hub |
| `player_currencies` | Or, gemmes, tickets |
| `player_spirits` | Collection (hub_id → template_key) |
| `roster_slots` | Roue ×6 + `on_field` |
| `active_runs` | `state_json` = `CombatState` sérialisé |

RLS : chaque joueur ne voit que ses lignes (`auth.uid()`).

### Hub vs run (comportement actuel)

| Hub (`/`) | Run (`/run`) |
|-----------|----------------|
| Roue ×6 : esprits **possédés** placés sur les slots | Au **début** d’un run : tu **choisis 1 esprit** parmi tous ceux que tu possèdes |
| Toggle **sur le terrain** (max 3) = préparation sanctuaire, **cosmétique / futur** | Ce choix **ne lit pas** `on_field` : tous les esprits de la collection sont proposés |
| Gacha remplit les slots vides | En run tu pars **seul** ; les autres arrivent par **capture** |

Pas besoin de « lier hub↔run » tant que cette règle te convient. Une évolution possible plus tard : limiter le picker aux 3 `on_field`, ou démarrer avec l’équipe déployée au hub.

## Ordre d’implémentation

Voir [TECH.md — Ordre d’implémentation](TECH.md#ordre-dimplémentation).
