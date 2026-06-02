# Phantoria — Stack technique

Décisions pour l’implémentation (complète le [GDD — Client web](GAME_DESIGN.md#support-technique--client-web)).

## Choix validé

| Couche | Stack | Notes |
|--------|--------|--------|
| **App** | **Next.js** (App Router) + **React** + **TypeScript** | Hub SSR, routes combat, déploiement Vercel / Node |
| **UI** | **CSS** (+ Tailwind dispo) | Desktop-first + **layout mobile ≤768px** (hub, esprits, gacha, combat) |
| **Logique jeu** | **`packages/game-core`** (TS pur) | Combat, Âmes, capture, vagues, récompenses — testable sans React |
| **Backend** | **Supabase** (recommandé) ou Route Handlers Next | Auth, sauvegardes, **gacha côté serveur** |
| **DB** | Postgres (Supabase) | Profils, roster, pulls, métaprogression |

## Client : jeu web navigateur

- **Cible principale** : PC / écran large, souris + clavier.
- **Mobile (≤768px)** : navigation bottom bar, pages stack vertical, combat immersif (sans topbar app ni bottom nav).
- **Layout desktop** : sidebar fixe + topbar + zone de jeu (hub sanctuaire, combat, gacha…).
- **Safe areas** : `viewport-fit: cover` + `env(safe-area-inset-*)` sur shell et deck combat.

## Layout mobile (≤768px)

Règle d’empilement CSS : les media queries **spécifiques à un écran** vivent en **fin de fichier composant** (`hub.css`, `spirits.css`, `gacha.css`, `run.css`) pour écraser `responsive.css` (importé avant dans `globals.css`).

| Route | Fichiers | Comportement |
|-------|----------|--------------|
| **Global** | `responsive.css`, `layout/mobile-menu.tsx`, `topbar.tsx` | Bottom nav · menu hamburger · wallet compact |
| **Hub `/`** | `hub.css`, `hub-screen.tsx` | Stack stats → quête → event → run · fiche esprit bottom sheet |
| **Esprits `/spirits`** | `spirits.css` | Grille scrollable · fiche fixe ~36vh bas · bouton × |
| **Gacha `/gacha`** | `gacha.css` | Tabs packs · autel · CTA pleine largeur |
| **Run `/run`** | `run.css`, `run-screen.tsx` | Arène · hints · **deck** (fiche \| arc+reliques / roue) |
| **Histoire combat** | `story-battle-screen.tsx` + `run.css` | Même deck que run · badge niveau · bouton Objets dans footer |

### Combat immersif (`/run`, histoire)

- `.shell:has(.battle)` : masque **topbar app** + **sidebar/bottom nav**.
- **Header combat** (dans l’arène) : meta roue · tour · € / balls · vitesse · Tribus / Quitter (ligne dédiée mobile).
- **Deck bas** (`.battle__deck`) :
  - **Gauche haut** : fiche allié (portrait, PV orange, Âmes teal, passif) ou inspect détaillé (×).
  - **Gauche bas** : roue circulaire + arc vert terrain (conic-gradient).
  - **Droite** : badge « Arc vert = terrain » · spins ↺↻ · reliques (run only).
- **Desktop** : inchangé — roue colonne gauche, jauges dans le HUD/footer.
- Jauges dupliquées en DOM (`battle__slots--hud` / `--deck`) ; une seule visible selon breakpoint.

### Contrôles mobile vs desktop

| Action desktop | Mobile |
|----------------|--------|
| Clic droit ennemi (focus) | 🎯 Cibler dans fiche ennemi |
| Clic gauche tribus | Toucher esprit / bouton Tribus |
| Inspect allié (slot vide) | Tap fiche deck |
| Hints barre bas | Texte `battle__tip--mobile` |

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
- **Navigation** : sidebar desktop · **bottom nav** ≤768px (`responsive.css`, labels courts).
- **Mobile** : ordre vertical sanctuaire · menu hamburger (profil, boutique, inventaire, histoire) · fiche esprit en bottom sheet avec ×.

Fichiers clés : `hub-screen.tsx`, `spirit-wheel.tsx`, `hub-panel.tsx`, `mobile-menu.tsx`, `hub.css`.

### Run roguelite (`/run`)

Écran combat jouable branché sur `CombatEngine` (`@phantoria/game-core`).

#### Boucle de jeu

1. **Picker starter** — choix du premier esprit (Bram, Nyx, Luma, Kiro) ou **Continuer** si une run est sauvegardée (`localStorage`, clé `phantoria_run_v1`).
2. **Combat auto** — file VIT, `tickTurn()` résout les attaques de base ; le joueur agit sur rotation, focus cible, capture, spés.
3. **Fin de vague** — phase `reward_pick` : **1 objet gratuit** (3 choix) + **boutique** (5 offres payantes en €). Or de départ **100 €**, + gain à chaque vague cleared (`waveClearGold`). **Continuer** lance la vague suivante.
4. **Vague suivante** — ennemis tirés aléatoirement (`getRunWaveSetup`), stats/alliés conservés.
5. **Victoire** — phase `won` après la récompense de la **vague 200** (boss final vaincu).
6. **Défaite** — phase `lost` si plus aucun allié vivant sur la roue (réserve incluse).

#### Contrôles combat (proto `/run`)

| Entrée | Effet |
|--------|--------|
| **Auto** | `tickTurn()` en boucle (~600 ms) — alliés et ennemis attaquent sans pause |
| **Attaque de base alliée** | Premier ennemi vivant par défaut ; si `attackFocusId` est défini et valide → cette cible |
| **Clic droit ennemi** | `setAttackFocus(id)` — marque / dé-marque la cible (outline doré, ×2/×½ vs perso actif) |
| **Clic gauche ennemi** | Inspect tribus / matchups / compétences / passif (`foe-inspect`) |
| **Clic allié terrain ou slot (jauge vide)** | Inspect allié (`ally-inspect`) — passif, compétences, barre XP |
| **Jauge Âmes pleine → slot** | Menu amultime : nom + **effet textuel** (`describeSkill`) + tag Mono / Zone / Aléatoire |
| **Phantoball** | Ennemi ≤ 40 % PV → standard ou tribales par groupe (bonus/malus tribu) |
| **Vitesse combat** | ⏸ / ×1 / ×2 (UI bandeau) |
| **Dev** | Panel bas-droite en dev ou `?dev=1` — skip vague, +50 €, boss suiv. |
| **Roue ↺ / ↻** | Rotation manuelle (pause auto si overlay capture / récompense / amultime) |

État moteur : `CombatState.attackFocusId` (reset à chaque nouvelle vague).

#### XP & niveau (run)

- Chaque `Combatant` porte `level`, `xp` (montée **pendant la run** uniquement).
- **KO ennemi** : `grantXp()` sur chaque allié vivant (`xpFromDefeated`, scale vague + rareté).
- **Shop / gratuit** : kind `xp_all` (Éclat d'expérience, Grande étincelle).
- Level up → `refreshStatsForLevel()` + event `level_up` dans le log combat.
- UI : barre XP dans inspect allié / ennemi (`CombatantXpBar`).

#### Passifs (run)

Définis dans `passives.ts` (`PASSIVE_BY_KEY`) — appliqués au spawn et affichés en inspect / HUD :

| Effet moteur | Exemple |
|--------------|---------|
| `damageMult` | Bram +8 % dégâts |
| `soulGainMult` | Nyx +25 % remplissage âmes |
| `turnRegenPct` | Luma 4 % PV/tour |
| `captureResist` | Boss −12 à −20 % capture |
| bonus stats | `bonusAtk` / `bonusDef` / … au spawn |

Capture : `getPassiveCaptureResist()` soustrait après `computeCaptureChance`.

#### Sauvegarde run

| Couche | Fichier | Rôle |
|--------|---------|------|
| Core | `run-save.ts` | `serializeRun`, `parseRun`, `hydrateCombatState`, `RUN_SAVE_KEY` |
| Web | `lib/run-persistence.ts` | `saveRun` / `loadSavedRun` — **localStorage** si pas d’env Supabase, sinon **`active_runs`** (+ cache local) |
| UI | `run-screen.tsx` | Auto-save à chaque tick ; effacée si `won` / `lost` |
| Reprise | `CombatEngine.restore(state)` | Recharge l'état complet |

Phases reprises : `fighting`, `reward_pick` uniquement (`isResumablePhase`).

#### Joueur (Supabase, optionnel)

| Table / module | Rôle |
|----------------|------|
| `profiles` | Nom, niveau, `welcome_pulls_remaining` |
| `player_currencies` | Or, gemmes, tickets hub |
| `player_spirits` + `roster_slots` | Collection + roue hub |
| `apps/web/lib/player/*` | `fetchPlayerSnapshot`, gacha bienvenue, roster |
| `PlayerProvider` | Context React hub / gacha / run |
| `/login`, middleware | Auth email + refresh session |

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

#### Récompenses & boutique entre vagues

Pool dans `run-rewards.ts` (`RUN_REWARD_POOL`). Deux catégories :

| Catégorie | `kind` | Barre reliques | Exemples |
|-----------|--------|----------------|----------|
| **Persistant** (tout le run) | `stat_all`, `combo_atk_def`, `soul_mult`, `special_mult`, `capture_bonus` | ✅ affiché | Griffe ardente, Prisme d'amultime, Écho d’âmes, Phantoball renforcée |
| **Usage unique** | `heal_all`, `soul_fill`, `ball_standard`, `ball_tribal`, `xp_all` | ❌ masqué | Lanterne, Offrande, lots Phantoballs, Éclats XP |

**Économie run** — `RUN_START_GOLD` = 100 € · vague 1 ≈ 16 € (`waveClearGold`) · prix shop via `getShopPrice` · reroll `getShopRerollPrice(wave, count)`.

**Phase `reward_pick`** : 3 gratuits (`selectReward`) + boutique 5 offres (`buyShopOffer`) + **reroll** payant (`rerollShop`, prix `getShopRerollPrice`) → **`continueAfterReward()`** pour la vague suivante.

Stock Phantoballs : `RUN_START_BALLS` (5 standard) · tribales par type (`phantoballs.ts`) · achat shop (`ball_lumi`, `ball_flam`, … ou aléatoire).

- Reliques persistantes stockées dans `CombatState.runRelics` ; modificateurs dans `runModifiers` (`soulGainMult`, `specialPowerMult`, `captureBonus`).
- Objets non stackables exclus du tirage une fois possédés ; stackables (Écho d’âmes, Phantoball) cumulables.
- Tooltip au survol : nom + description (`run-relics-tray.tsx`).

#### Ennemis & vagues

- **200 vagues max** (`RUN_MAX_WAVES`) — run fini à la victoire sur le boss final.
- Pool normal = esprits du catalogue (`ALL_SPIRIT_KEYS`, hors `boss_gardien` / `boss_colosse` / `boss_solmaar`), tirage pondéré par rareté.
- **Ennemis = esprits classiques** : capturables, même roster que gacha/codex (errants inclus).
- **Vague 1 solo** (1 allié) : toujours **Ombre errante** (tuto capture).

| Palier | Vagues | Type | Boss principal |
|--------|--------|------|----------------|
| Normal | autres | `normal` | — |
| Boss | ×10 (10, 20, 30…) | `boss` | Esprit roster **B+** (stat ×1,25) + sbires |
| Méga boss | ×50 (50, 100, 150) | `mega_boss` | Esprit roster **A/S** (stat ×1,35) + sbires |
| Boss final | **200** | `final_boss` | **Solmaar corrompu** (`boss_solmaar`) + sbires |

Priorité : vague 200 = final (pas méga boss). API : `getRunWaveKind`, `getRunWaveSetup`.

- Nombre d’ennemis et niveau montent avec la vague ; bosses ont des multiplicateurs de stats dédiés.

#### UI combat — composants

| Fichier | Rôle |
|---------|------|
| `run-screen.tsx` | Orchestration : moteur, auto-tick, VFX hit/KO, vitesse, overlays |
| `battle-speed-controls.tsx` | Contrôles ⏸ / ×1 / ×2 |
| `run-dev-panel.tsx` | Cheats dev (skip, +€, boss) — `?dev=1` |
| `battle-wheel.tsx` | Roue ×6, arc terrain, contrôles rotation, tray reliques |
| `combat-spirit.tsx` | Sprite combat (hue par esprit) |
| `foe-inspect.tsx` | Clic ennemi → tribu, matchups, passif, compétences, XP |
| `ally-inspect.tsx` | Clic allié → passif, compétences, barre XP |
| `combatant-skills.tsx` | Bloc passif + 3 compétences (`describeSkill`) |
| `tribe-chart.tsx` | Table faiblesses 11×11 (overlay « Tribus ») |
| `wave-reward-picker.tsx` | Entre vagues : gratuit + boutique € + reroll + Continuer |
| `run-relics-tray.tsx` | Liste reliques persistantes + tooltips |
| `run-starter-picker.tsx` | Choix du starter + bouton Continuer (save) |
| `capture-sequence.tsx` | Animation lancer / shake / succès-échec |
| `run-end-recap.tsx` | Fin de run : stats, reliques, tickets/gemmes hub, CTA gacha |
| `run.css` | Styles combat (bandeau HUD, cartes lanterne, grain, lucioires, récap fin run) |

#### Fin de run (défaite / victoire)

- Phases `lost` / `won` → **auto-tick stoppé**, overlays combat fermés (inspect, capture, amultime).
- **`RunEndRecap`** fullscreen (z-index 60) : vague atteinte, or run, reliques persistantes, crédit tickets/gemmes (RPC `claim_run_meta_reward`), erreur visible si échec.
- CTA **Tirer au gacha** si ≥1 ticket crédité · **Recommencer** / **Nouveau run** réactive l’UI.
- Formule hub : `computeRunMetaReward` (`run-meta-rewards.ts`) — objectif ~**1 tirage standard / 2–3 runs** (voir [`DATA.md`](DATA.md)).

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
| `phantoballs.ts` | Stock balls, mult capture tribu, migration save |
| `characters.ts` | Catalogue + descriptions compétences + errants pool vague |
| `formulas.ts` | Dégâts, Âmes, capture (clamp 5–85 %) |
| `combat-engine.ts` | `CombatEngine`, `createRunBattle`, rotation, capture, vagues |
| `run-waves.ts` | Composition ennemis par vague |
| `run-rewards.ts` | Pool objets, boutique, balls, XP, `waveClearGold`, reroll |
| `run-save.ts` | Sérialisation run (`phantoria_run_v1`) |
| `xp.ts` | `grantXp`, `xpToNextLevel`, `xpFromDefeated` |
| `passives.ts` | Passifs esprits / ennemis + hooks combat |
| `skill-text.ts` | `describeSkill()` — texte lisible attaque / amultime |
| `run-dev.ts` | Helpers dev (`devJumpToBoss`, `nextBossWave`) |
| `formulas.test.ts` | 61 tests (tribus, formules, combat, XP, save, passifs, balls…) |

### API principale

```ts
createRunBattle({ allySetup?, wave? })  // run 1 perso par défaut
CombatEngine.restore(state)             // reprise depuis save
CombatEngine
  .tickTurn()                          // tour auto (attaque de base)
  .setAttackFocus(targetId)            // focus clic droit — toggle
  .playerSpecial(actorId, slot, targetId?)
  .rotateWheel("cw" | "ccw")
  .tryCapture(targetId, ball?, rng?)
  .completeCapturePlacement(wheelIndex)
  .selectReward(rewardId)              // gratuit entre vagues
  .buyShopOffer(rewardId)              // achat boutique (€)
  .rerollShop()                         // rafraîchir le stock boutique
  .continueAfterReward()               // vague suivante
  // Dev (proto)
  .devSkipWave() / .devAddGold(n) / .devForceWave(wave)
  devJumpToBoss(engine)                 // run-dev.ts
  .getState() / .getCurrentActor() / .getRecentEvents() / .getWheelSlots()
```

### Phases (`CombatPhase`)

| Phase | Déclencheur |
|-------|-------------|
| `fighting` | Combat en cours |
| `reward_pick` | Tous les ennemis KO → choix objet |
| `won` | Récompense choisie après vague **200** — run terminé |
| `lost` | 0 allié vivant sur la roue |

### Tests

```bash
pnpm test:core   # tsx --test packages/game-core/src/formulas.test.ts (61 tests)
```

## Ordre d’implémentation

1. ✅ **Hub desktop** (`/`) — roue ×6, échange 2 clics, 3 devant = terrain (slots 0/1/5), réserve bench, retrait
2. ✅ **`game-core`** — tribus, formules, combat (VIT, Âmes 0→1, capture)
3. ✅ **Écran `/run`** — run roguelite : **1 starter** choisi parmi les esprits possédés, puis capture en run
4. ✅ **Supabase** — auth, profil, roster, gacha (welcome + standard, pity), meta-récompenses fin de run
5. ✅ **Collection `/spirits`** — codex, filtres, niveau/XP/PV histoire
6. ✅ **Profil `/profile`** — identité, stats hub, monnaies, compte
7. ✅ **Histoire `/story`** — zone 1 complète (15 niveaux, bosses 5/10/15), étoiles, persist XP collection
8. ✅ **Inventaire & boutique hub** — `/inventory`, `/shop`, Phantoballs + soins en combat histoire
9. ✅ **Or victoire histoire** — `computeStoryGoldReward` · RPC `record_story_victory` crédite `player_currencies.gold`
10. ✅ **Layout mobile** — `responsive.css`, bottom nav, combat touch-friendly
11. **À faire** — zone 2+, événements

## Hors scope infra v0

- App native / store mobile
- PWA installable (optionnel plus tard)
- Godot / moteur 2D dédié pour l’UI hub
- Shop entre vagues (GDD) — remplacé provisoirement par le picker 3 objets
