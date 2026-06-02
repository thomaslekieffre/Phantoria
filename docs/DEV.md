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
pnpm test:core        # tests game-core (77 tests)
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
| `apps/web/components/hub/` | Hub : roue ×6, réserve, fiche, bench picker |
| `apps/web/components/spirits/` | Codex collection `/spirits` |
| `apps/web/components/run/` | Run roguelite : combat, capture, récompenses, reliques |
| `packages/game-core/` | Moteur TS pur : tribus, formules, `CombatEngine`, vagues, récompenses |
| `docs/` | GDD, data, tech, ce fichier |

### Routes web

| Route | Écran |
|-------|--------|
| `/` | Sanctuaire (hub) |
| `/spirits` | **Collection** — grille filtrée, fiche, ajouter/retirer de la roue |
| `/quests` | **Quêtes** — journal principal, quotidiennes, secondaires |
| `/gacha` | **Invocations** — bannières packs, autel central, taux à droite, multi ×10 |
| `/more` | Boutique, inventaire, événements… |
| `/events` | **Événements** — bannière active (ex. Lune des captures) |
| `/profile` | **Profil** — nom, stats, monnaies, compte |
| `/run` | **Run roguelite** — combat jouable (starter, vagues, capture, reliques) |
| `/login` | Connexion Supabase (si env configuré) |
| `/story` | **Mode Histoire** — zone 1 complète (15 niveaux), bosses 5/10/15 |
| `/story/[zone]/[level]` | Combat histoire (équipe roue, niveaux collection) |

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
| Nouveau esprit | `characters.ts` |
| Niveaux histoire | `story-levels.ts` |
| Formule dégâts / capture / âmes | `formulas.ts` + tests |
| Gacha (poids, pity) | `gacha.ts` + `gacha.test.ts` |
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
2. Copier `apps/web/.env.example` → `apps/web/.env.local` et remplir URL, anon key, **service_role** (gacha).
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
- Doublon au gacha : gemmes selon rareté (pack standard) ; bienvenue privilégie les esprits non possédés.
- Pack général : **1 ticket** ou **50 gemmes** par tirage · **multi ×10** : 10 tickets ou 500 gemmes · pity `gacha_pity_standard` (hard pity S à 100, compteur avance à chaque tir du multi).
- Pool bienvenue : 6 esprits (Bram, Nyx, Luma, Kiro, Roche, Halo). Pack standard : + Murmure, Brise, Aurore (S).

### Écran gacha (`apps/web/components/gacha/`)

| Zone | Rôle |
|------|------|
| Colonne gauche (`gacha-banners`) | Sélection du pack : **Premiers esprits** (gratuit, badge restants / Terminé) · **Pack standard** |
| Centre (`gacha-altar`) | Bannière du pack actif, esprits mis en avant, machine, pity (standard), boutons d’invocation |
| Droite (`gacha-rates`) | Taux par rareté — **clic sur une ligne** → popup portraits + statut possédé |

**Invocations** — Bienvenue : ×1 ou **tout invoquer** (restants en un clic). Standard : grille 2×2 ticket/gemmes ×1/×10. Wallet sous le titre. Panneau droit : taux + pity dynamique (S), doublons → gemmes, esprits possédés (✓) ; modal détail par rareté (portrait, tribu, pastille « Possédé »). CTA sanctuaire/run quand bienvenue terminée. Overlays tirage : révélation multi progressive, Échap.

| Fichier | Rôle |
|---------|------|
| `gacha-screen.tsx` | UI, état pack, appels `gacha-client` |
| `gacha-rates-panel.tsx` | Taux, pity, collection ✓, modal détail au clic rareté |
| `gacha.css` | Layout 3 colonnes, bannières, taux, reveal |
| `apps/web/lib/player/gacha-pool.ts` | Pools bienvenue / standard, coûts, `STANDARD_MULTI_PULL_COUNT` (10) |
| `apps/web/lib/player/gacha-service.ts` | Logique tirage (appelée par l’API, service role) |
| `apps/web/lib/player/gacha-client.ts` | `fetch` → `/api/gacha/welcome` et `/api/gacha/standard` |
| `apps/web/app/api/gacha/*/route.ts` | Auth session + `SUPABASE_SERVICE_ROLE_KEY` + RNG serveur |
| `packages/game-core/src/gacha.ts` | Poids raretés, pity dynamique S, `rollGachaRarity`, tests |

**Env serveur** : `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local` (jamais `NEXT_PUBLIC_`). Sans cette clé, les invocations renvoient 503.

**Migrations** : `20260531200000_gacha_pity.sql` · `20260601120000_gacha_secure_rls.sql` · `20260602100000_claim_run_meta_reward.sql` · `20260602110000_roster_field_front_slots.sql` · `20260602120000_profile_runs_completed.sql` · `20260602130000_quests_story_persistence.sql`.

**Hub — stats panneau** : `runs_completed` (DB ou `localStorage` hors ligne) · `spiritCount` (collection) · événement actif → `lib/hub/hub-events.ts` · `/events`.

### Profil (`/profile`)

| Fichier | Rôle |
|---------|------|
| `profile-screen.tsx` | Fiche joueur : identité, progression, monnaies, compte |
| `profile.css` | Layout cartes profil |
| `profile-service.ts` | `persistDisplayName` (2–24 car.) |

Accès : topbar (nom du joueur) · **Plus** → Profil · `/profile`.

### Événements (`/events`)

Config v0 dans `lib/hub/hub-events.ts` (pas encore en DB). Bandeau sanctuaire → page détail + CTA run.

### Quêtes (`/quests`)

| Fichier | Rôle |
|---------|------|
| `quests-screen.tsx` | Journal : quête principale, quotidiennes, secondaires |
| `quests.css` | Layout journal |
| `lib/quests/quests.ts` | Définitions & récompenses (config v0) |
| `lib/quests/quest-progress.ts` | Claims + flags quotidiens (local + sync API) |
| `lib/quests/quest-client.ts` | `fetch` → `/api/quests/*`, `/api/story/victory` |
| `lib/player/quest-service.ts` | Évaluation serveur + RPC Supabase |
| `lib/quests/use-quests.ts` | Hook client + claim (crédite monnaies en DB) |

**Quête principale** « Premiers pas dans le néant » (5 objectifs) : gacha → roue terrain → 1-1 → 2★ sur 1-1 → 1 run.

**Quotidiennes** : connexion (visite camp/quêtes), victoire histoire, run terminée — reset à minuit UTC en DB.

**Hub** : panneau droit affiche progression réelle · badge sidebar si récompense à réclamer.

**Persistance** : tables `player_story_levels`, `player_quest_claims`, `player_quest_daily` · RPC `record_story_victory`, `record_quest_daily_flag`, `claim_quest_reward` · sync local→cloud au login.

**API** : `POST /api/quests/claim` · `POST /api/quests/daily` · `POST /api/story/victory` (session Supabase + validation serveur avant crédit monnaies).

**Hydratation** : `useQuests` (`hydrated`) et `player-provider` (`clientMounted`) — pas de lecture `localStorage` avant mount (badge sidebar / progression quêtes).

### Sanctuaire — roue & roster (`apps/web/components/hub/`)

| Fichier | Rôle |
|---------|------|
| `spirit-wheel.tsx` | Roue ×6, compteur terrain, sélection / échange · props `readOnly` / `compact` (brief histoire) |
| `hub-screen.tsx` | Orchestration clic 2 slots, bench, fiche |
| `hub-panel.tsx` | Fiche esprit sélectionné + actions |
| `hub-bench-picker.tsx` | Liste **hors roue** → placer sur un emplacement libre |
| `roster.ts` | `FIELD_SLOT_INDICES` [0, 1, 5], `rosterFieldReady`, swap / place / remove local |
| `roster-service.ts` | Persistance Supabase : swap, place, remove |

**Règles UX**

- **Terrain** : les 3 emplacements **devant** sur la roue (indices visuels `0`, `1`, `5` — arc du haut). Pas de bouton déployer : `on_field` dérivé de la position.
- **Réorganiser** : 1er clic sur un slot, 2e clic sur un autre → échange (esprit ↔ esprit ou esprit ↔ vide).
- **Retirer de la roue** : fiche latérale ou codex — l’esprit reste en collection.
- **Ajouter à la roue** : panneau **Réserve** au sanctuaire (esprits possédés hors roue) ou bouton dans `/spirits` ; cible = slot libre sélectionné ou premier libre.
- Gacha : nouvel esprit → premier slot vide ; `on_field` si index ∈ {0, 1, 5}.

### Mode histoire (`/story`)

| Fichier | Rôle |
|---------|------|
| `story-map-screen.tsx` | Carte zone scrollable (chemin SVG, nœuds lanternes, boss 5/10/15) |
| `story-battle-screen.tsx` | Briefing (`SpiritWheel` readOnly) → combat (`AllyFieldSprite` + `battle__allies`) → étoiles |
| `story.css` | Carte monde, nœuds, brief avec roue, résultat |
| `lib/story/story-map-layout.ts` | Positions % des 15 nœuds + courbe SVG du sentier |
| `lib/story/use-story-progress.ts` | Hook client : save vide au SSR, sync `localStorage` au mount (évite mismatch hydration étoiles) |
| `lib/story/story-progress.ts` | Étoiles / déblocage — **localStorage** hors ligne · **Supabase** (`record_story_victory`) si connecté |
| `lib/story/story-roster.ts` | Équipe depuis roue sanctuaire + niveaux `player_spirits` |
| `lib/story/story-result-service.ts` | Persist XP/PV histoire après victoire |

**Carte** : une zone à la fois (flèches), filaments de fond, nœuds numérotés le long d’un sentier en pointillés ; étoiles au-dessus des niveaux terminés ; niveau courant pulsé.

**Briefing** : `SpiritWheel` en `readOnly` + `compact` (bulles seules, sans nom/tribu/PV) · footer : actions à gauche, objectifs ★ à droite · hint « niveaux/PV = progression histoire ».

**Combat** : même rendu terrain que la run (`AllyFieldSprite` dans `battle__allies`) — les 3 devant sur la roue apparaissent sur le fond vert.

**Niveaux** : au combat, `buildStoryAllySetup` injecte `level` / `xp` / `hpPct` depuis `player_spirits` (ou `phantoria_spirits_local` hors ligne). Fin de combat (victoire **ou** défaite) → RPC `persist_story_spirit_stats` (RLS gacha = lecture seule sur `player_spirits`). **Run** : `createRunBattle` force `allyLevel: 1` — XP run reste dans `CombatState`, jamais écrit dans `player_spirits`.

**Règles v0** : équipe = esprits sur la roue · capture si balls en inventaire · 3★ (victoire / sans KO / ≤ N rounds) · défaite = retry sans perte collection.

**Zone 1 (Vaillants)** : 15 niveaux dans `story-levels.ts` — ombres → éclaireurs néant → bosses gardien (5, 10) → colosse (15). Déblocage séquentiel sur la carte.

**Objets histoire** : inventaire persistant (`player_inventory`) — Phantoballs et soins achetés à `/shop`, consommés en combat histoire. Reste resynchronisé en fin de fight.

### Codex esprits (`apps/web/components/spirits/`)

| Fichier | Rôle |
|---------|------|
| `spirits-screen.tsx` | Filtres tribu / statut / rareté (grille 2 cols), grille, fiche |
| `spirit-owned-stats.tsx` | Niveau / XP / PV **histoire** (`spiritsByHubId` ← `player_spirits`) |
| `spirits.css` | Sidebar filtres compacte, layout 3 colonnes |

### Tables

| Table | Rôle |
|-------|------|
| `profiles` | Nom affiché, **`level` = niveau histoire**, **`runs_completed`** (runs roguelite terminées) |
| `player_currencies` | Or, gemmes, tickets |
| `player_story_levels` | Progression histoire (étoiles, clear par niveau) |
| `player_quest_claims` | Quêtes réclamées |
| `player_quest_daily` | Flags quotidiens (date UTC) |
| `player_spirits` | Collection ; **`level` / `xp` / `hp_pct` = histoire** (codex), pas le run |
| `player_inventory` | **Objets hub** — Phantoballs, soins (consommables histoire) |
| `roster_slots` | Roue ×6 (`slot_index` 0–5) + `spirit_id` + `on_field` (sync positions 0, 1, 5) |
| `active_runs` | `state_json` = `CombatState` sérialisé |

RLS : chaque joueur ne voit que ses lignes (`auth.uid()`).

### Niveaux : histoire vs run (à ne pas confondre)

| | Histoire / sanctuaire | Roguelite run |
|--|----------------------|---------------|
| **Joueur** | `profiles.level` (ligne « niv. » au camp) | — |
| **Esprit** | `player_spirits.level`, `xp`, `hp_pct` (codex `/spirits`) | **Toujours 1** au départ ; monte dans `CombatState` jusqu’à la mort |
| **Fin de run** | Inchangé (sauf monnaies via meta-reward) | Niveaux run **jetés** — ne pas persister dans `player_spirits` |

Voir [`GAME_DESIGN.md` — Niveaux](GAME_DESIGN.md#niveaux--progression-deux-pistes).

### Hub vs run (comportement actuel)

| Hub (`/`) | Run (`/run`) |
|-----------|----------------|
| Roue ×6 : jusqu’à 6 esprits placés ; 3 devant = terrain (affichage sanctuaire) | **1 starter** parmi tous les esprits **possédés** ; **lvl 1** en run |
| Hors roue = réserve (ajoutable depuis sanctuaire ou codex) | Capture → roue du **run** ; XP uniquement dans la save run |
| Gacha remplit le premier slot vide | Mort → reset run ; tickets/gemmes hub seulement |

### Run → gacha (monnaies hub)

Fin de run (`phase` `won` ou `lost`) : `computeRunMetaReward` (TS) + crédit DB via `POST /api/run/meta-reward` → RPC Supabase `claim_run_meta_reward` (migration `20260602100000_claim_run_meta_reward.sql`). Fallback service role si RPC absente. Affiché sur l’écran victoire/défaite (erreur visible si échec).

| Résultat | Tickets (indicatif) | Gemmes |
|----------|---------------------|--------|
| Défaite | max(1, vague÷5) | vague÷20 |
| Victoire | vague÷5 + 3 (+5 si 200 vagues) | vague÷20 + 15 (+25 si clear) |

## Ordre d’implémentation

Voir [TECH.md — Ordre d’implémentation](TECH.md#ordre-dimplémentation).
