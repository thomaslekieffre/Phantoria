# Phantoria — Stack technique

Décisions pour l’implémentation (complète le [GDD — Client web](GAME_DESIGN.md#support-technique--client-web)).

## Choix validé

| Couche | Stack | Notes |
|--------|--------|--------|
| **App** | **Next.js** (App Router) + **React** + **TypeScript** | Hub SSR, routes combat, déploiement Vercel / Node |
| **UI** | **CSS** (+ Tailwind dispo) | **Desktop-first** — layout navigateur plein écran, style « cartes lanterne » |
| **Logique jeu** | **`packages/game-core`** (TS pur) | Combat, Âmes, capture, vagues, récompenses — testable sans React |
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
├── apps/web/              # Next.js — client web
├── packages/game-core/    # Moteur combat & formules (TS pur)
├── docs/
└── package.json
```

## UI actuelle (`apps/web`)

| Zone | Composant | Rôle |
|------|-----------|------|
| Shell | `components/layout/` | Grille desktop : sidebar, topbar, main |
| Hub | `components/hub/` | Sanctuaire `/` — roue ×6, fiche esprit, quêtes, CTA |
| Run | `components/run/` | Combat roguelite `/run` — terrain 3vN, log, Phantoball, reliques |
| Routes | `app/*/page.tsx` | Esprits, quêtes, gacha, plus, run, histoire |

### Hub sanctuaire (`/`)

- **Roue d'esprits** : 6 emplacements, 3 max sur le terrain (GDD).
- **Portraits SVG** par esprit ; slots vides = trous « Libre ».
- **Sélection** : clic sur un esprit → fiche dans le panneau droit (PV, tribu, terrain/réserve).
- **Toggle terrain** : bouton « Mettre sur le terrain » / « Retirer du terrain » (état local mock).
- **Panneau droit** : quête active, stats, événement, CTA Run / Histoire.
- **Navigation** : sidebar unique (plus de double nav mobile).

Fichiers clés : `hub-screen.tsx`, `spirit-wheel.tsx`, `hub-panel.tsx`, `roster.ts`, `spirit-portrait.tsx`.

### Run roguelite (`/run`)

Écran combat jouable branché sur `CombatEngine` (`@phantoria/game-core`).

#### Boucle de jeu

1. **Picker starter** — choix du premier esprit (Bram, Nyx, Luma, Kiro).
2. **Combat auto** — file VIT, attaques de base résolues par le moteur ; le joueur agit sur rotation, ciblage, capture, spés.
3. **Fin de vague** — phase `reward_pick` : 3 objets au choix (`rollRewardChoices` → `selectReward`).
4. **Vague suivante** — ennemis tirés aléatoirement (`getRunWaveSetup`), stats/alliés conservés.
5. **Défaite** — phase `lost` si plus aucun allié vivant sur la roue (réserve incluse).

#### Terrain & roue

- **6 slots** roue, indices `0–5`.
- **Terrain** = arc du haut : slots **`[5, 0, 1]`** (`FIELD_WHEEL_INDICES`).
- **Rotation** manuelle (↺ / ↻) ou **auto-fill** quand un slot terrain est vide et qu’un vivant est en réserve.
- **Défaite** uniquement si **0 allié vivant** sur toute la roue (un KO sur le terrain ≠ fin de run).

#### Capture

- Ennemi affaibli → tentative Phantoball (chance selon rareté, PV, bonus reliques).
- **Snapshot complet** (`PendingRecruit`) : mêmes stats qu’en combat.
- **Placement obligatoire** : le joueur choisit le slot roue (`completeCapturePlacement`).
- Slot occupé → l’esprit présent est **éjecté** (perdu pour le run).
- Séquence visuelle : `capture-sequence.tsx`.

#### Récompenses entre vagues

Pool dans `run-rewards.ts` (`RUN_REWARD_POOL`). Deux catégories :

| Catégorie | `kind` | Barre reliques | Exemples |
|-----------|--------|----------------|----------|
| **Persistant** (tout le run) | `stat_all`, `combo_atk_def`, `soul_mult`, `capture_bonus` | ✅ affiché | Griffe ardente, Écho d’âmes, Phantoball renforcée |
| **Usage unique** | `heal_all`, `soul_fill` | ❌ masqué | Lanterne de soin, Offrande du sanctuaire |

- Reliques persistantes stockées dans `CombatState.runRelics` ; modificateurs dans `runModifiers` (`soulGainMult`, `captureBonus`).
- Objets non stackables exclus du tirage une fois possédés ; stackables (Écho d’âmes, Phantoball) cumulables.
- Tooltip au survol : nom + description (`run-relics-tray.tsx`).

#### Ennemis & vagues

- Pool = **tous les esprits** du catalogue (`ALL_SPIRIT_KEYS`), tirage pondéré par rareté et vague.
- **Vague 1 solo** (1 allié) : toujours **Ombre errante** (tuto capture).
- Nombre d’ennemis et niveau montent avec la vague (`run-waves.ts`).

#### UI combat — composants

| Fichier | Rôle |
|---------|------|
| `run-screen.tsx` | Orchestration : moteur, auto-tick, overlays capture / récompense / défaite |
| `battle-wheel.tsx` | Roue ×6, arc terrain, contrôles rotation, tray reliques |
| `combat-spirit.tsx` | Sprite combat (hue par esprit) |
| `foe-inspect.tsx` | Clic ennemi → tribu, matchups, mult terrain |
| `tribe-chart.tsx` | Table faiblesses 11×11 (overlay « Tribus ») |
| `wave-reward-picker.tsx` | Choix entre vagues (3 cartes) |
| `run-relics-tray.tsx` | Liste reliques persistantes + tooltips |
| `run-starter-picker.tsx` | Choix du starter |
| `capture-sequence.tsx` | Animation lancer / shake / succès-échec |
| `run.css` | Styles combat (bandeau HUD, cartes lanterne, grain, lucioires) |

#### Identité visuelle run

- Aplats sombres, ombres dures, grain léger, filaments / lucioires (pas de grille de points).
- HUD en bandeau 3 colonnes ; tribus ennemies en pastille sombre.
- Reliques dans la colonne roue (liste verticale).

## `packages/game-core`

Moteur TypeScript pur, importé par `apps/web` via workspace `@phantoria/game-core`.

### Fichiers

| Fichier | Rôle |
|---------|------|
| `types.ts` | Tribus, stats, `Combatant`, `CombatState`, phases, reliques |
| `tribes.ts` | Table 11×11, `getTypeMultiplier`, `TRIBE_INFO` |
| `characters.ts` | Catalogue esprits + `ALL_SPIRIT_KEYS` |
| `formulas.ts` | Dégâts, Âmes, capture (clamp 5–85 %) |
| `combat-engine.ts` | `CombatEngine`, `createRunBattle`, rotation, capture, vagues |
| `run-waves.ts` | Composition ennemis par vague |
| `run-rewards.ts` | Pool objets, application, affichage reliques |
| `formulas.test.ts` | 26 tests (tribus, formules, combat, récompenses) |

### API principale

```ts
createRunBattle({ allySetup?, wave? })  // run 1 perso par défaut
CombatEngine
  .attack(targetId?)
  .useSpecial1 / .useSpecial2
  .rotateWheel("cw" | "ccw")
  .attemptCapture(ballType, targetId)
  .completeCapturePlacement(wheelIndex)
  .selectReward(rewardId)               // reward_pick → vague suivante
  .getState() / .getCurrentActor() / .getRecentEvents()
```

### Phases (`CombatPhase`)

| Phase | Déclencheur |
|-------|-------------|
| `fighting` | Combat en cours |
| `reward_pick` | Tous les ennemis KO → choix objet |
| `lost` | 0 allié vivant sur la roue |
| `won` | Legacy — préférer `reward_pick` |

### Tests

```bash
pnpm test:core   # tsx --test packages/game-core/src/formulas.test.ts
```

## Ordre d’implémentation

1. ✅ **Hub desktop** (`/`) — roue ×6, fiche esprit, toggle terrain, CTA run / histoire
2. ✅ **`game-core`** — tribus, formules, combat (VIT, Âmes 0→1, capture)
3. ✅ **Écran `/run`** — run roguelite jouable (starter, vagues, capture, récompenses, reliques)
4. Collection, gacha, mode histoire complet
5. Supabase + auth

## Hors scope infra v0

- App native / store mobile
- PWA installable (optionnel plus tard)
- Godot / moteur 2D dédié pour l’UI hub
- Shop entre vagues (GDD) — remplacé provisoirement par le picker 3 objets
