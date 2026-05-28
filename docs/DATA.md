# Phantoria — Données & formules (v0)

Complète [`GAME_DESIGN.md`](GAME_DESIGN.md). Notes pour une future implémentation (pas de code dans ce dépôt).

## Personnages mock (proto)

| Clé | Nom | Tribu | Rareté | Rôle proto |
|-----|-----|-------|--------|------------|
| `bram_vaillant` | Bram | Vaillants | E | Tank débutant |
| `nyx_mysterieux` | Nyx | Mystérieux | C | Rapide |
| `luma_mignon` | Luma | Mignons | B | Support léger |
| `ombre_faible` | Ombre errante | Sombres | E | Ennemi facile |
| `neant_scout` | Éclaireur néant | Néants | D | Ennemi mid |

## Formules v0

### Stats au niveau

`mult = 1 + (level - 1) × 0.04` — appliqué à PV, ATK, DEF (pas VIT).

### Dégâts

```
dégâts = max(1, floor(ATK × power × typeMult - DEF × 0.35))
```

`typeMult` : tableau des faiblesses dans le GDD (section Tribus).

### Âmes

- Jauge `0 → 1` par perso sur le terrain (float normalisé)
- Remplissage **progressif** quand le perso **inflige** ou **subit** des dégâts — **formule à playtest**
- Pas de saut instantané 0 → 1 sur un seul hit
- Spéciale 1 ou 2 : utilisable si jauge **≥ 1** (pleine) → reset à `0`
- Pas de charge sur la réserve (hors terrain)

### Capture

```
chance = taux_rareté × mult_ball × (1 + (1 - PV%))
chance = clamp(chance, 1 %, 100 %)
```

Taux de base par rareté : voir GDD (section Phantoballs / paliers).

## Persistance (à définir plus tard)

- Profil joueur, roster, jetons gacha
- Sauvegarde hub + métaprogression

## Décisions validées (proto)

| Sujet | Choix |
|-------|--------|
| Fill Âmes | À playtest |
| Rotation roue | À tout moment en combat |
| Phantoball | En plein combat |
| Cible attaque de base | Choix joueur |
| Histoire vs Roguelite (combat) | Pareil |
| Stack UI | Next.js + React (voir [`TECH.md`](TECH.md)) |

## Prochaines étapes data

- [ ] `data/characters.json` généré depuis Excalidraw / sheet
- [ ] Formule pity gacha (state par pack)
- [ ] Reliques & buffs entre vagues (IDs + effets)
- [ ] Critères 3★ mode histoire
- [ ] Passives modifiant la charge d’Âmes (ex. double charge, charge allié proche…)
