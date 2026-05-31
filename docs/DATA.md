# Phantoria — Données & formules (v0)

Complète [`GAME_DESIGN.md`](GAME_DESIGN.md). Source de vérité implémentée dans `packages/game-core`.

## Personnages (catalogue proto)

| Clé | Nom | Tribu | Rareté | Rôle proto |
|-----|-----|-------|--------|------------|
| `bram_vaillant` | Bram | Vaillants | E | Tank débutant / starter run |
| `nyx_mysterieux` | Nyx | Mystérieux | C | Rapide |
| `luma_mignon` | Luma | Mignons | B | Support léger |
| `kiro_perfide` | Kiro | Perfides | D | Rapide |
| `ombre_faible` | Ombre errante | Sombres | E | Ennemi tuto vague 1 |
| `neant_scout` | Éclaireur néant | Néants | D | Ennemi mid |
| `boss_gardien` | Gardien des brumes | Sombres | B | Boss ×10 |
| `boss_colosse` | Colosse du néant | Néants | A | Méga boss ×50 |
| `boss_solmaar` | Solmaar corrompu | Néants | S | Boss final vague 200 |

Catalogue complet : `packages/game-core/src/characters.ts` — `ALL_SPIRIT_KEYS` alimente le pool ennemi des vagues.

## Formules v0

### Stats au niveau

`mult = 1 + (level - 1) × 0.04` — appliqué à PV, ATK, DEF (pas VIT).

### Dégâts

```
dégâts = max(1, floor(ATK × power × typeMult - DEF × 0.35))
```

`typeMult` : tableau 11×11 dans `tribes.ts` (×2 super efficace, ×0,5 peu efficace, ×0 immunité).

### Âmes

- Jauge `0 → 1` par perso **sur le terrain** (float normalisé).
- Remplissage proportionnel aux dégâts infligés / subis :

```
gain = min(0.5, (dégâts / PV_max) × 0.35) × runModifiers.soulGainMult
```

- Spéciale 1 ou 2 : utilisable si jauge **≥ 1** → reset à `0`.
- Pas de charge sur la réserve (hors terrain).

### Capture

```
chance = taux_rareté × mult_ball × (1 + 0.55 × (1 - PV%)) + captureBonus
chance -= getPassiveCaptureResist(templateKey)   // passif ennemi
chance = clamp(chance, 5 %, 85 %)
```

- Taux base par rareté : `CAPTURE_RATE_BY_RARITY` (E 70 % → S 1 %).
- **Plafond 85 %** — jamais garantie à 100 %.
- **Plancher 5 %**.
- Bonus relique Phantoball renforcée : `+12 %` cumulable (`runModifiers.captureBonus`).

Types de ball v0 : `standard` (×1), `tribal` (×1,5).

### XP (run)

```
xpToNext(level, rarity) = floor(16 + level × 9 × tier_rareté)   // cap = MAX_LEVEL_BY_RARITY
xpFromDefeated(enemy, wave) = floor((10 + lvl×5) × tier × (1 + wave×0.012))
```

- Level up → recalc stats (`refreshStatsForLevel`) en conservant le ratio PV.
- Sources : KO ennemi (alliés vivants), objets `xp_all` (shop / gratuit).

### Passifs (`passives.ts`)

Appliqués au spawn (`applyPassiveToStats`) + hooks combat (`getPassiveDamageMult`, `getPassiveSoulMult`, `getPassiveCaptureResist`, `getPassiveTurnRegenPct`).

| Clé | Passif | Effet principal |
|-----|--------|-----------------|
| `bram_vaillant` | Carapace vaillante | +8 % dmg · +5 DEF |
| `nyx_mysterieux` | Brume intérieure | +25 % âmes · +1 VIT |
| `luma_mignon` | Douceur réconfortante | Regen 4 % PV/tour |
| `kiro_perfide` | Lame perfide | +12 % dmg · +3 ATK |
| `ombre_faible` | Ombre fugace | −8 % capture |
| `neant_scout` | Éclat corrompu | +10 % dmg · −5 % capture |
| `boss_*` | (boss) | dmg + capture resist + bonus stats |

Texte compétence : `describeSkill(skill)` — cible, % ATK, bonus tribu éventuel.

## Terrain & roue

| Concept | Valeur |
|---------|--------|
| Slots roue | 6 (indices `0–5`) |
| Terrain (arc haut) | slots **`5`, `0`, `1`** |
| Max alliés terrain | 3 |
| Rotation | permute tous les alliés ; auto-fill si trou terrain + réserve |

## Vagues roguelite (`run-waves.ts`)

**Run complet : 200 vagues** (`RUN_MAX_WAVES`). Victoire après le boss final + choix de la dernière récompense.

### Paliers

| Type | Condition | Boss | Adds |
|------|-----------|------|------|
| `normal` | défaut | — | 1–3 esprits pool |
| `boss` | vague % 10 === 0 | `boss_gardien` (Gardien des brumes) | 1–2 sbires |
| `mega_boss` | vague % 50 === 0 (sauf 200) | `boss_colosse` (Colosse du néant) | 2 sbires |
| `final_boss` | vague === 200 | `boss_solmaar` (Solmaar corrompu) | 2 sbires |

Les clés boss sont **exclues** du pool des vagues normales.

### Scaling

| Règle | Détail |
|-------|--------|
| Vague 1 solo | 1 ennemi fixe : `ombre_faible` lvl 3 |
| Niveau ennemi | `wave === 1 ? 3 : 2 + wave` (+ bonus boss) |
| Stats boss | multiplicateurs par index (`enemyStatMults`) |
| Nombre ennemis (normal) | 1–3 selon vague et taille équipe alliée |

Poids rareté (approx.) : E dès v1, D v2+, C v3+, B v5+, A v8+, S v12+.

## Récompenses entre vagues (`run-rewards.ts`)

Après chaque vague cleared : **3 choix uniques** (`rollRewardChoices`).

### Pool actuel

| ID | Nom | Kind | Persistant | Effet |
|----|-----|------|------------|-------|
| `lanterne_soin` | Lanterne de soin | `heal_all` | ❌ | +35 % PV max toute la roue |
| `lanterne_ember` | Lanterne braise | `heal_all` | ❌ | +55 % PV max toute la roue |
| `offrande` | Offrande du sanctuaire | `soul_fill` | ❌ | +50 % jauge âmes (1 esprit terrain) |
| `griffe_ardente` | Griffe ardente | `stat_all` atk | ✅ | +8 ATK run |
| `coquille_verte` | Coquille verte | `stat_all` def | ✅ | +6 DEF run |
| `veine_vita` | Veine vitale | `stat_all` maxHp | ✅ | +20 PV max run |
| `vent_vif` | Vent vif | `stat_all` vit | ✅ | +2 VIT run |
| `filament` | Filament mycélien | `combo_atk_def` | ✅ | +5 ATK et +5 DEF run |
| `echo_ames` | Écho d'âmes | `soul_mult` | ✅ stackable | +30 % remplissage âmes |
| `ball_acier` | Phantoball renforcée | `capture_bonus` | ✅ stackable | +12 % capture |
| `ball_pack` | Lot Phantoballs | `ball_standard` | ❌ | +2 standard |
| `ball_tribal_pack` | Lot tribales | `ball_tribal` | ❌ | +1 tribale |
| `eclat_xp` | Éclat d'expérience | `xp_all` | ❌ stackable | +35 XP roue |
| `grande_eclat_xp` | Grande étincelle | `xp_all` | ❌ stackable | +75 XP roue |
| `offrande_vit` | Offrande du vent | `stat_all` vit | ✅ | +3 VIT run |
| `relique_ame` | Fragment d'âme | `soul_fill` | ❌ | +80 % jauge (1 terrain) |

**Barre reliques UI** : uniquement les persistants (`isPersistentRunRelic`).

### Règles de tirage

- Objets non stackables retirés du pool une fois possédés.
- Vagues 1–2 : pool légèrement biaisé vers les soins (`heal_all` en tête).

## Persistance

| Scope | État | Implémentation |
|-------|------|----------------|
| **Run en cours** | ✅ proto | `localStorage` clé `phantoria_run_v1` — phases `fighting` / `reward_pick` |
| Profil joueur, roster, gacha | ❌ à faire | Supabase |
| Métaprogression hub | ❌ à faire | — |

## Décisions validées (proto)

| Sujet | Choix |
|-------|--------|
| Fill Âmes | `(dmg/maxHp)×0.35`, cap 0.5 par hit, mult relique |
| Or run | 100 € départ · `waveClearGold` (vague 1 ≈ 16 €, scale + bonus boss) |
| Phantoballs run | 5 standard au départ · consommées à chaque tentative · tribale ×1,5 capture |
| Rotation roue | Manuelle + auto-fill trou terrain |
| Phantoball | En plein combat, placement slot obligatoire |
| Cible attaque de base | Auto (premier ennemi) — **clic droit** pour marquer un focus (`attackFocusId`) |
| Défaite run | 0 allié vivant sur la roue entière |
| Victoire run | Boss final vague 200 + dernière récompense → phase `won` |
| Capture max | 85 % |
| Récompenses vagues | Gratuit (3 choix) + boutique € + reroll · balls + XP achetables |
| Save run | `phantoria_run_v1` localStorage · Continuer au picker |
| Passifs | Starters + ennemis clés · affichés inspect + HUD |
| Game over UI | Fullscreen bloque capture / combat ; tick auto off |
| Reliques affichées | Persistantes uniquement |
| Stack UI | Next.js + React (voir [`TECH.md`](TECH.md)) |

## Prochaines étapes data

- [ ] `data/characters.json` généré depuis Excalidraw / sheet
- [ ] Formule pity gacha (state par pack)
- [ ] Passifs sur tout le pool ennemi vague (pas seulement clés listées)
- [ ] Critères 3★ mode histoire
- [ ] Passives modifiant la charge d’Âmes
