# Phantoria ? Donn?es & formules (v0)

Compl?te [`GAME_DESIGN.md`](GAME_DESIGN.md). Source de v?rit? impl?ment?e dans `packages/game-core`.

## Personnages (catalogue proto)

| Cl? | Nom | Tribu | Raret? | R?le proto |
|-----|-----|-------|--------|------------|
| `bram_vaillant` | Bram | Vaillants | E | Tank d?butant / starter run |
| `nyx_mysterieux` | Nyx | Myst?rieux | C | Rapide |
| `luma_mignon` | Luma | Mignons | B | Support l?ger |
| `kiro_perfide` | Kiro | Perfides | D | Rapide |
| `ombre_faible` | Ombre errante | Sombres | E | Ennemi tuto vague 1 |
| `neant_scout` | ?claireur n?ant | N?ants | D | Ennemi mid |
| `boss_gardien` | Gardien des brumes | Sombres | B | Legacy (plus utilisé en vagues) |
| `boss_colosse` | Colosse du néant | Néants | A | Legacy (plus utilisé en vagues) |
| `boss_solmaar` | Solmaar corrompu | N?ants | S | Boss final vague 200 |
| `roche_costaud` | Roche errante | Costauds | E | Errant pool vague |
| `halo_bienveillant` | Halo errant | Bienveillants | E | Errant pool vague |
| `murmure_sinistre` | Murmure sinistre | Sinistres | D | Errant pool vague |
| `brise_insaisissable` | Brise fugace | Insaisissables | D | Errant pool vague |
| `sigille_enma` | Sigille enma | Enma | C | Errant pool vague |

Catalogue complet : `packages/game-core/src/characters.ts` ? `ALL_SPIRIT_KEYS` alimente le pool ennemi des vagues.

## Persistance des niveaux

| Donn?e | Mode | Notes |
|--------|------|-------|
| `profiles.level` | Histoire / hub | Affich? au sanctuaire ? **pas** le niveau run |
| `player_spirits.level`, `xp`, `hp_pct` | Histoire / codex | Progression campagne ; **pas** mis ? jour par la fin d'un run roguelite |
| `CombatState` alli?s (`level`, `xp`) | Run seul | D?part **1** ; monte en combat ; stock? dans `active_runs` ou localStorage ; **reset** ? la mort |

## Formules v0

### Stats au niveau

`mult = 1 + (level - 1) ? 0.04` ? appliqu? ? PV, ATK, DEF (pas VIT).

### D?g?ts

```
d?g?ts = max(1, floor(ATK ? power ? typeMult - DEF ? 0.35))
```

`typeMult` : tableau 11?11 dans `tribes.ts` (?2 super efficace, ?0,5 peu efficace, ?0 immunit?).

### ?mes

- Jauge `0 ? 1` par perso **sur le terrain** (float normalis?).
- Remplissage proportionnel aux d?g?ts inflig?s / subis :

```
gain = min(0.5, (d?g?ts / PV_max) ? 0.35) ? runModifiers.soulGainMult
```

- Sp?ciale 1 ou 2 : utilisable si jauge **? 1** ? reset ? `0`.
- Pas de charge sur la r?serve (hors terrain).

### Capture

```
chance = taux_raret? ? mult_ball ? (1 + 0.55 ? (1 - PV%)) + captureBonus
chance -= getPassiveCaptureResist(templateKey)   // passif ennemi
chance = clamp(chance, 5 %, 85 %)
```

- Taux base par raret? : `CAPTURE_RATE_BY_RARITY` (E 70 % ? S 1 %).
- **Plafond 85 %** ? jamais garantie ? 100 %.
- **Plancher 5 %**.
- Bonus relique Phantoball renforc?e : `+12 %` cumulable (`runModifiers.captureBonus`).

Types de ball run (`phantoballs.ts`) :
- `standard` ?1
- Tribales par groupe GDD : Lumi ?? ? Flam ?? ? Ombra ?? ? Glace ?? ? Terra ?? ? N?ant ?
- Match tribu cible ? ?1,5?2,5 ? hors tribu ? ?0,5

### XP (run)

```
xpToNext(level, rarity) = floor(16 + level ? 9 ? tier_raret?)   // cap = MAX_LEVEL_BY_RARITY
xpFromDefeated(enemy, wave) = floor((10 + lvl?5) ? tier ? (1 + wave?0.012))
```

- Level up ? recalc stats (`refreshStatsForLevel`) en conservant le ratio PV.

### Or victoire histoire (hub)

```
base = 12 + index?6 + (zoneId-1)?30
boss (index 5/10/15) : base ? 1.5
total = base + stars?10
first clear : total
replay     : max(8, floor(total ? 0.3))
```

Impl?ment? : `computeStoryGoldReward` ? cr?dit via RPC `record_story_victory`.
- Sources : KO ennemi (alli?s vivants), objets `xp_all` (shop / gratuit).

### Passifs (`passives.ts`)

Appliqu?s au spawn (`applyPassiveToStats`) + hooks combat (`getPassiveDamageMult`, `getPassiveSoulMult`, `getPassiveCaptureResist`, `getPassiveTurnRegenPct`).

| Cl? | Passif | Effet principal |
|-----|--------|-----------------|
| `bram_vaillant` | Carapace vaillante | +8 % dmg ? +5 DEF |
| `nyx_mysterieux` | Brume int?rieure | +25 % ?mes ? +1 VIT |
| `luma_mignon` | Douceur r?confortante | Regen 4 % PV/tour |
| `kiro_perfide` | Lame perfide | +12 % dmg ? +3 ATK |
| `ombre_faible` | Ombre fugace | ?8 % capture |
| `neant_scout` | ?clat corrompu | +10 % dmg ? ?5 % capture |
| `boss_*` | (boss) | dmg + capture resist + bonus stats |
| errants + starters | explicite ou `TRIBE_DEFAULT_PASSIVES` | fallback par tribu |

Texte comp?tence : `description` sur chaque skill dans `characters.ts` ? fallback `describeSkill()`.

## Terrain & roue

| Concept | Valeur |
|---------|--------|
| Slots roue | 6 (indices `0?5`) |
| Terrain (arc haut) | slots **`5`, `0`, `1`** |
| Max alli?s terrain | 3 |
| Rotation | permute tous les alli?s ; auto-fill si trou terrain + r?serve |

## Vagues roguelite (`run-waves.ts`)

**Run complet : 200 vagues** (`RUN_MAX_WAVES`). Victoire apr?s le boss final + choix de la derni?re r?compense.

### Paliers

| Type | Condition | Boss | Adds |
|------|-----------|------|------|
| `normal` | d?faut | ? | 1?3 esprits pool |
| `boss` | vague % 10 === 0 | Esprit roster B+ (capturable) | 1–2 sbires pool |
| `mega_boss` | vague % 50 === 0 (sauf 200) | Esprit roster A/S (capturable) | 2 sbires |
| `final_boss` | vague === 200 | `boss_solmaar` (Solmaar corrompu) | 2 sbires |

Les templates `boss_gardien` / `boss_colosse` restent dans le catalogue mais ne sont plus tirés en vagues. Tous les autres ennemis = esprits classiques du pool (`ALL_SPIRIT_KEYS` hors legacy bosses).

### Scaling

| R?gle | D?tail |
|-------|--------|
| Vague 1 solo | 1 ennemi fixe : `ombre_faible` lvl 3 |
| Niveau ennemi | `wave === 1 ? 3 : 2 + wave` (+ bonus boss) |
| Stats boss | multiplicateurs par index (`enemyStatMults`) |
| Nombre ennemis (normal) | 1?3 selon vague et taille ?quipe alli?e |

Poids raret? (approx.) : E d?s v1, D v2+, C v3+, B v5+, A v8+, S v12+.

## R?compenses entre vagues (`run-rewards.ts`)

Apr?s chaque vague cleared : **3 choix uniques** (`rollRewardChoices`).

### Pool actuel

| ID | Nom | Kind | Persistant | Effet |
|----|-----|------|------------|-------|
| `lanterne_soin` | Lanterne de soin | `heal_all` | ? | +35 % PV max toute la roue |
| `lanterne_ember` | Lanterne braise | `heal_all` | ? | +55 % PV max toute la roue |
| `offrande` | Offrande du sanctuaire | `soul_fill` | ? | +50 % jauge ?mes (1 esprit terrain) |
| `griffe_ardente` | Griffe ardente | `stat_all` atk | ? | +8 ATK run |
| `coquille_verte` | Coquille verte | `stat_all` def | ? | +6 DEF run |
| `veine_vita` | Veine vitale | `stat_all` maxHp | ? | +20 PV max run |
| `vent_vif` | Vent vif | `stat_all` vit | ? | +2 VIT run |
| `filament` | Filament myc?lien | `combo_atk_def` | ? | +5 ATK et +5 DEF run |
| `echo_ames` | ?cho d'?mes | `soul_mult` | ? stackable | +30 % remplissage ?mes |
| `ball_acier` | Phantoball renforc?e | `capture_bonus` | ? stackable | +12 % capture |
| `ball_pack` | Lot Phantoballs | `ball_standard` | ? | +2 standard |
| `ball_tribal_random` | Ball tribale al?atoire | `ball_tribal` | ? | +1 type al?atoire |
| `ball_lumi` | Lumiball | `ball_tribal` lumi | ? | Mignons & Bienveillants |
| `ball_flam` | Flamball | `ball_tribal` flam | ? | Vaillants & Costauds |
| `ball_ombra` | Ombraball | `ball_tribal` ombra | ? | Sombres & Sinistres |
| `ball_neant` | N?antball | `ball_tribal` neant | ? | N?ants ?2,5 |
| `eclat_xp` | ?clat d'exp?rience | `xp_all` | ? stackable | +35 XP roue |
| `grande_eclat_xp` | Grande ?tincelle | `xp_all` | ? stackable | +75 XP roue |
| `offrande_vit` | Offrande du vent | `stat_all` vit | ? | +3 VIT run |
| `relique_ame` | Fragment d'?me | `soul_fill` | ? | +80 % jauge (1 terrain) |
| `prisme_amultime` | Prisme d'amultime | `special_mult` | ? stackable | +28 % d?g?ts amultime |
| `resonance_ames` | R?sonance d'?mes | `soul_mult` | ? stackable | +45 % remplissage ?mes |
| `forteresse_vivante` | Forteresse vivante | `combo_atk_def` | ? | +10 ATK et +10 DEF run |

**Barre reliques UI** : uniquement les persistants (`isPersistentRunRelic`).

### Meta rewards run ? gacha (`run-meta-rewards.ts`)

Objectif balance : **~1 tirage standard / 2?3 runs** (1 ticket = 1 pull).

| Outcome | Tickets | Gemmes |
|---------|---------|--------|
| D?faite | `floor(wave/30)` | `floor(wave/40)` |
| Victoire | idem + 1 (+1 si wave ? 50, +2 si clear 200) | idem + 5 (+20 si clear 200) |

RPC Supabase `claim_run_meta_reward` align?e (migration `20260601140000_run_meta_reward_balance.sql`).

### R?gles de tirage

- Objets non stackables retir?s du pool une fois poss?d?s.
- Vagues 1?2 : pool l?g?rement biais? vers les soins (`heal_all` en t?te).

## Persistance

| Scope | ?tat | Impl?mentation |
|-------|------|----------------|
| **Run en cours** | ? proto | `localStorage` `phantoria_run_v1` **ou** table `active_runs` si Supabase |
| Profil, roster, monnaies | ? proto | Supabase (`profiles`, `player_currencies`, `player_spirits`, `roster_slots`) |
| Gacha bienvenue | ? proto | 6 pulls gratuits, pool 4 starters ? pas de pity / tickets payants |
| M?taprogression hub | ? partiel | Or histoire ? `player_currencies.gold` (RPC `record_story_victory`) ; local `phantoria_gold_local` hors ligne |

## D?cisions valid?es (proto)

| Sujet | Choix |
|-------|--------|
| Fill ?mes | `(dmg/maxHp)?0.35`, cap 0.5 par hit, mult relique |
| Or run | 100 ? d?part ? `waveClearGold` (vague 1 ? 16 ?, scale + bonus boss) |
| Phantoballs run | 5 standard ? tribales par type (bonus/malus tribu) ? voir `phantoballs.ts` |
| Rotation roue | Manuelle + auto-fill trou terrain |
| Phantoball | En plein combat, placement slot obligatoire |
| Cible attaque de base | Auto (premier ennemi) ? **clic droit** desktop / **🎯 Cibler** mobile (`attackFocusId`) |
| D?faite run | 0 alli? vivant sur la roue enti?re |
| Victoire run | Boss final vague 200 + derni?re r?compense ? phase `won` |
| Capture max | 85 % |
| R?compenses vagues | Gratuit (3 choix) + boutique ? + reroll ? balls + XP achetables |
| Save run | `phantoria_run_v1` local **ou** `active_runs` ? Continuer au picker |
| Passifs | Explicites + fallback tribu ? inspect + HUD |
| Game over UI | Fullscreen bloque capture / combat ; tick auto off |
| Reliques affich?es | Persistantes uniquement |
| Stack UI | Next.js + React (voir [`TECH.md`](TECH.md)) |

## Prochaines ?tapes data

- [ ] `data/characters.json` g?n?r? depuis Excalidraw / sheet
- [ ] Formule pity gacha (state par pack)
- [ ] Phantoballs restantes GDD (Verdeball, Spectraball?)
- [ ] Crit?res 3? mode histoire
- [ ] Sync m?taprogression post-run (monnaies hub OK ; **pas** XP/niveau run ? `player_spirits`)
