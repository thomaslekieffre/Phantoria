# Phantoria — Game Design

> Spec dérivée de la mind map Excalidraw `Phantoria-mindmap-v13.excalidraw` (v13).

Jeu **gacha + roguelite** dans un monde fantastique d’esprits : hub, collection, runs à mort permanente, mode histoire linéaire, économie croisée entre les deux boucles.

---

## Vision & univers

- **Univers** : monde fantastique d’esprits — coloré en surface, sombre en profondeur.
- **Joueur** : son propre avatar (pas un simple commandant abstrait).
- **But** : découvrir un mystère / une menace ; les **Néants** sont les vrais antagonistes (liés à la menace dès le lore).
- **Ton narratif** : antagoniste apparent (Solmaar), saboteur (Kael), révélation progressive des Néants.

### Personnages clés


| Personnage     | Rôle                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| **Solmaar**    | Esprit ancien vénéré, corrompu — antagoniste apparent, folie de pouvoir ; boss final des Néants (zone 11). |
| **Kael**       | Humain mystérieux qui sabote le joueur ; contrôlé par les Néants (révélé zone 10) ; libéré ou détruit.     |
| **Les Néants** | Tribu entière, vrais antagonistes ; manipulent Kael & Solmaar dans l’ombre.                                |
| **Le joueur**  | Avatar propre, progresse dans les zones et les runs.                                                       |


### Arc narratif (zones 1–11)


| Phase  | Zones | Contenu                                                        |
| ------ | ----- | -------------------------------------------------------------- |
| Acte 1 | 1–3   | Solmaar sème le chaos — introduction, monde en danger.         |
| Acte 2 | 4–6   | Kael apparaît, sabote le joueur — mystère sur ses motivations. |
| Acte 3 | 7–9   | Lien Kael → Néants découvert — les Néants sortent de l’ombre.  |
| Acte 4 | 10    | Affrontement Kael, révélation.                                 |
| Acte 5 | 11    | Vide des Néants — vérité finale, Solmaar boss final.           |


---

## Piliers du jeu


| Pilier              | Description                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| **Gacha**           | Collection long terme — packs, pity, doublons, monnaies.                   |
| **Roguelite**       | Runs reset — roue de 6, capture, shop entre vagues, mort définitive.       |
| **Combat**          | Tour par tour (VIT), roue de 6, **3 sur le terrain**, style Yo-kai.        |
| **Mode Histoire**   | 11 zones × 15 niveaux, carte type Wibble Wobble, étoiles.                  |
| **Métaprogression** | Ressources persistantes, arbre de passives, persos de départ débloquables. |


### Lien Gacha ↔ Roguelite

- **Gacha → Roguelite** : un perso obtenu au gacha peut devenir **perso de départ** d’un run (une fois débloqué en métaprogression).
- **Roguelite → Gacha** : les **ressources gagnées en run** alimentent les **jetons gacha**.
- Les deux modes partagent la même collection de personnages ; le roguelite est aussi une forme de « pull » (capture en combat).

---

## Personnages — stats & capacités

### Stats de base (4)


| Stat    | Rôle                                                           |
| ------- | -------------------------------------------------------------- |
| **PV**  | Survie en combat.                                              |
| **ATK** | Dégâts physiques de base.                                      |
| **DEF** | Réduction des dégâts reçus.                                    |
| **VIT** | Vitesse — détermine l’**ordre d’action** dans la file de tour. |


> **Rareté** fixe le **plafond de niveau** ; le **perso** fixe la **répartition** des stats.

### Niveau max par rareté


| Rareté   | Niveau max              |
| -------- | ----------------------- |
| E        | 20                      |
| D        | 30                      |
| C        | 40                      |
| B        | 60                      |
| A        | 80                      |
| S        | 100                     |
| SS → UZ+ | À venir (selon le lore) |


**Montée de niveau** : XP en combat + objets XP (shop roguelite, récompenses).

### Capacités par personnage


| Type                | Comportement                                    |
| ------------------- | ----------------------------------------------- |
| **Attaque de base** | Au tour VIT du perso ; **cible au choix du joueur**. |
| **Spéciale 1**      | Déclenchée par le joueur **quand il veut** (hors file VIT) — coûte **1 Âme**. |
| **Spéciale 2**      | Idem — coûte **1 Âme** (même jauge que la spéciale 1). |
| **Passive unique**  | Toujours active.                                |


**Âmes** (par perso **sur le terrain**) :

- Jauge continue de **0 à 1** (affichée comme une charge unique pleine à 1).
- **Départ** : 0 en entrant sur le terrain / en début de combat.
- **Charge progressive** : la jauge **monte petit à petit** quand le perso **inflige des dégâts** ou **en subit** — on ne passe **pas** de 0 à 1 en un seul coup.
- **Formule de remplissage** : à **équilibrer en playtest** (proportionnel aux dégâts donnés/reçus).
- À **1** (jauge pleine) : le joueur peut lancer une spéciale ; cela **vide** la jauge (retour vers **0**).
- Sur la **réserve** (roue uniquement) : pas de jauge d’Âmes active.

**Ciblage des spéciales** (3 comportements) :

- Mono-cible (joueur choisit).
- Aléatoire (cible random parmi les ennemis).
- AoE (tous les ennemis).

### Doublons — attaque spéciale

Fusionner des doublons améliore l’**attaque spéciale** (niveaux 1 → 5).


| Niveau    | Coût (doublons) | Total cumulé | Note              |
| --------- | --------------- | ------------ | ----------------- |
| ⭐ (1)     | 0               | 0            | Base              |
| ⭐⭐ (2)    | 1               | 1            | +1 doublon        |
| ⭐⭐⭐ (3)   | 2               | 3            | +2 doublons       |
| ⭐⭐⭐⭐ (4)  | 4               | 7            | +4 doublons       |
| ⭐⭐⭐⭐⭐ (5) | 8               | 15           | MAX — +8 doublons |


---

## Raretés & paliers

### Paliers v1 — taux gacha / capture


| Rareté | Gacha | Capture |
| ------ | ----- | ------- |
| **S**  | ~1 %  | 1 %     |
| **A**  | ~4 %  | 5 %     |
| **B**  | ~9 %  | 15 %    |
| **C**  | ~18 % | 35 %    |
| **D**  | ~28 % | 50 %    |
| **E**  | ~40 % | 70 %    |


Extensions futures : **SS → UZ+** (lore).

---

## Gacha

### Packs / bannières


| Type de pack       | Contenu                           |
| ------------------ | --------------------------------- |
| **Pack général**   | Tous les persos.                  |
| **Pack rareté**    | 1 pack par rareté.                |
| **Pack catégorie** | Tribu, affinités, etc.            |
| **Pack Perso**     | Personnages.                      |
| **Pack Objet**     | Attaques / capacités, ressources. |


- **Pity** : **un compteur par pack** — tirer dans le pack A ne remplit pas le pack B (encourage la spécialisation).
- Bannières événement exclusives (jeton événement).

### Système de pity (rareté S)


| Pulls  | Taux S | Note                      |
| ------ | ------ | ------------------------- |
| 0 – 49 | 1 %    | Taux fixe                 |
| 50     | 2 %    | Début soft pity           |
| 60     | 3 %    |                           |
| 70     | 4 %    |                           |
| 80     | 6 %    |                           |
| 90     | 10 %   |                           |
| 95     | 15 %   |                           |
| 99     | 25 %   |                           |
| 100    | 100 %  | **Hard pity — S garanti** |


Principe : **soft pity** (taux croissant) puis **hard pity** (garantie à 100 pulls).

### Monnaies du gacha


| Jeton               | Type          | Obtention typique                                                                     |
| ------------------- | ------------- | ------------------------------------------------------------------------------------- |
| **Jeton Commun**    | Gratuit       | Quêtes quotidiennes, combats & exploration, connexion journalière — facile à obtenir. |
| **Jeton Premium**   | Payant / rare | Achat argent réel, succès difficiles, events rares — difficile gratis.                |
| **Jeton Événement** | Limité        | Events uniquement — gratuit ou achetable pendant l’événement ; bannières event.       |


---

## Roguelite

### Structure d’un run

1. **Départ** : 1 perso (choisi parmi les débloqués).
2. **Recrutement** : vaincre un ennemi + lancer une **Phantoball** — capture selon **rareté + PV restants**.
3. **Roue** : max **6 persos** (style Yo-kai) ; **3 sur le terrain** en même temps ; rotation pour remplacer / combler les trous ; si pleine → **éjecter** un perso pour en accueillir un nouveau.
4. **Combat** : tour par tour (**VIT**), **vagues d’ennemis** ; seuls les **3 sur le terrain** jouent ; **KO = mort définitive** pour le run (trou sur le terrain jusqu’à rotation).
5. **Fin** : mort ou abandon → **tout reset** (roue, buffs temporaires, reliques du run) ; la **métaprogression** reste.

### Zones du run

- **11 zones** disponibles (1 par tribu) ; **5+ zones tirées aléatoirement** par run.
- Chaque zone a son **pool de boss** (tribu dominante).
- **Boss de vague** : aléatoire dans le pool, lié à la zone.
- Dans un run : **chaque zone est plus dure** que la précédente.
- Entre les runs : **difficulté globale** monte avec les victoires (ennemis plus forts).


| Zone | Nom                          | Ambiance                          |
| ---- | ---------------------------- | --------------------------------- |
| ⚔️   | Terre des Vaillants          | Champs de bataille, citadelles    |
| 🔮   | Labyrinthe des Mystérieux    | Brume, illusions, temples         |
| 💪   | Forteresse des Costauds      | Montagnes, grottes, arènes        |
| 🌸   | Jardin des Mignons           | Prairies colorées, villages       |
| 💚   | Sanctuaire des Bienveillants | Forêts lumineuses, refuges        |
| 🌑   | Marais des Sombres           | Marécages, ombres, nuit éternelle |
| 💀   | Nécropole des Sinistres      | Ruines maudites, ossements        |
| 💨   | Ciel des Insaisissables      | Nuages, îles flottantes           |
| 🐍   | Repaire des Perfides         | Catacombes, pièges, venin         |
| 👑   | Palais des Enma              | Dimension divine, dorée           |
| ❓    | Vide des Néants              | Néant absolu, zone corrompue      |


### Améliorations entre vagues

Après une vague, choix entre **3 options aléatoires** :

- Buff de stats (ATK, DEF, VIT…)
- Nouvelles capacités pour tes persos
- Effets passifs (régén PV, bouclier…)

### Shop entre les vagues

Dépenser les **ressources droppées** en run :


| Catégorie                  | Effet                           |
| -------------------------- | ------------------------------- |
| Phantoballs (types variés) | Capture                         |
| Objets de soin             | Perso ciblé ou toute la roue    |
| Buffs temporaires          | Durée du run en cours           |
| Objets XP                  | Monter un perso en niveau (run) |
| Équipements                | À équiper sur un perso          |
| Reliques passives          | Durent tout le run              |


---

## Phantoballs

Objets de capture du roguelite — **bonus tribu = malus contre le reste** (sauf exceptions).

### Deux modes d’usage


| Mode               | Comportement                                                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Sac permanent**  | Stock séparé — capture → perso rejoint la **collection** (hub) ; réapprovisionné via shop / récompenses ; comme un pull gacha alternatif. |
| **Mode Roguelite** | Balls trouvées **en cours de run** ; capture → perso rejoint la **roue du run** ; stocks séparés du sac permanent.                        |


### Types & modificateurs de taux


| Ball               | Rareté d’obtention | Multiplicateur | Bonus / malus                                |
| ------------------ | ------------------ | -------------- | -------------------------------------------- |
| 🔵 **Phantoball**  | Commune            | ×1 (base)      | Aucun effet spécial                          |
| 🟢 **Verdeball**   | Peu commune        | ×1,5           | ✅ si ennemi > 50 % PV — ❌ si < 25 % PV       |
| 🟡 **Lumiball**    | Peu commune        | ×1,5           | ✅ Mignons & Bienveillants — ❌ autres tribus  |
| 🔴 **Flamball**    | Rare               | ×2             | ✅ Vaillants & Costauds — ❌ autres tribus     |
| 🟣 **Ombraball**   | Rare               | ×2             | ✅ Sombres & Sinistres — ❌ autres tribus      |
| 🩵 **Glaceball**   | Rare               | ×2             | ✅ Mystérieux & Perfides — ❌ autres tribus    |
| 🟤 **Terraball**   | Rare               | ×2             | ✅ Insaisissables & Enma — ❌ autres tribus    |
| ⚫ **Néantball**    | Très rare (boss)   | ×2,5           | ✅ Néants uniquement — ❌ toutes autres tribus |
| 🌟 **Spectraball** | Légendaire         | ×3             | Meilleur taux brut, **aucun malus**          |


### Règles de capture

- Utilisable **en plein combat** (Roguelite et Histoire) : le joueur choisit un ennemi et lance une ball (consomme le stock du mode en cours).
- **Taux de base** selon la **rareté** de l’esprit (voir paliers).
- Modifié par **PV restants** + **type de ball**.
- **Taux plancher garanti** : minimum **1 %**.

---

## Combat

Même système en **Roguelite** et en **Histoire** : roue 6, 3 sur le terrain, rotation **à tout moment**, tours **VIT**, spés **à tout moment**, **Phantoball en combat**, cibles **au choix**. Seules la source d’équipe / balls et les conséquences du KO diffèrent (voir [Roguelite](#roguelite) et [Mode Histoire](#mode-histoire)).

### Roue (6) et terrain (3)

| Zone | Capacité | Rôle |
| ---- | -------- | ---- |
| **Roue** | Jusqu’à **6** esprits | Réserve + rotation (style Yo-kai Watch) |
| **Terrain** | **3** emplacements fixes | Seuls ces esprits combattent |

- Au combat, **3 esprits de la roue sont sur le terrain** ; les autres restent sur la roue en réserve.
- **Tourner la roue** : **à tout moment** pendant le combat — faire entrer un esprit de réserve sur le terrain, réorganiser les 3 slots, ou **combler un trou** après un KO.
- **KO sur le terrain** : l’emplacement devient un **trou vide** (le perso est hors combat). Il ne revient pas pendant ce combat. Tant qu’il reste un trou et qu’il y a des vivants en réserve sur la roue, le joueur doit **tourner la roue** pour retrouver **3 combattants** sur le terrain (si possible).
- Si la roue a moins de 3 vivants au total → moins de 3 sur le terrain (combat en infériorité numérique).

### Tours et vitesse (VIT)

- **Vagues d’ennemis** : 1 à 3 ennemis simultanés à l’écran.
- **File d’action** : tous les combattants **sur le terrain** (tes 3 + les ennemis visibles), triés par **VIT** (plus rapide joue avant).
- Quand c’est le **tour d’un de tes 3 sur le terrain** (selon **VIT**) : **attaque de base** — le joueur **choisit la cible** ennemie, puis l’attaque se résout.
- **Spéciales 1 / 2** : le joueur les lance **à tout moment** pendant le combat (même pendant le tour d’un ennemi ou d’un autre allié), tant que le perso est **sur le terrain**, sa jauge d’**Âmes est pleine (1)** et qu’il n’est pas KO.
- Les esprits **uniquement sur la roue** (réserve) **ne sont pas** dans la file de tour : pas d’attaque de base, **pas de spéciales**, tant qu’ils ne sont pas sur le terrain.

### Actions du joueur


| Action | Détail |
| ------ | ------ |
| **Tourner la roue** | **À tout moment** — placer / remplacer sur le terrain, combler un trou |
| **Attaque de base** | Au tour VIT du perso ; **cible choisie par le joueur** |
| **Spéciale 1 / 2** | **À tout moment** ; perso sur le terrain + **jauge d’Âmes pleine** |
| **Cibler** | Choisir un ennemi (attaque de base, spés mono-cible, capture) |
| **Phantoball** | **Pendant le combat** — tentative de capture sur la cible choisie (voir [Phantoballs](#phantoballs)) |

### KO et fin de combat

| Mode | Conséquence d’un KO sur le terrain |
| ---- | ----------------------------------- |
| **Roguelite** | Mort **définitive pour le run** ; trou sur le terrain ; pas de revive |
| **Histoire** | Même moteur de combat ; échec du niveau si l’équipe ne peut plus combattre (tous KO ou impossible d’avoir 3 sur le terrain) — pas de perte de perso de la collection |


---

## Tribus (11)


| Tribu             | Thème                    |
| ----------------- | ------------------------ |
| ⚔️ Vaillants      | Guerriers, honneur       |
| 🔮 Mystérieux     | Illusions, énigmes       |
| 💪 Costauds       | Force brute, endurance   |
| 🌸 Mignons        | Douceur, nature          |
| 💚 Bienveillants  | Soins, protection        |
| 🌑 Sombres        | Ombre, peur              |
| 💀 Sinistres      | Mort, malédiction        |
| 💨 Insaisissables | Vitesse, air             |
| 🐍 Perfides       | Ruse, poison             |
| 👑 Enma           | Divinité, autorité       |
| ❓ Néants          | Antagonistes, corruption |


### Tableau des faiblesses (ligne = attaque, colonne = défense)


|        | ⚔️    | 🔮    | 💪    | 🌸    | 💚    | 🌑    | 💀    | 💨    | 🐍    | 👑  | ❓     |
| ------ | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | --- | ----- |
| **⚔️** | —     | ½     | ½     | —     | —     | **2** | **2** | —     | —     | —   | —     |
| **🔮** | **2** | —     | —     | **2** | —     | ½     | ½     | —     | —     | —   | —     |
| **💪** | **2** | —     | —     | —     | —     | —     | —     | **2** | ½     | ½   | —     |
| **🌸** | —     | ½     | **2** | —     | **2** | —     | —     | —     | —     | ½   | —     |
| **💚** | —     | —     | —     | **2** | —     | —     | **2** | —     | ½     | —   | ½     |
| **🌑** | **2** | —     | —     | —     | ½     | —     | —     | —     | **2** | ½   | —     |
| **💀** | ½     | —     | **2** | —     | **2** | —     | —     | —     | —     | —   | ½     |
| **💨** | —     | **2** | ½     | —     | —     | **2** | —     | —     | —     | —   | ½     |
| **🐍** | ½     | —     | —     | **2** | —     | —     | **2** | ½     | —     | —   | —     |
| **👑** | —     | —     | —     | —     | **2** | —     | —     | **2** | —     | —   | **2** |
| **❓**  | —     | **2** | —     | —     | **2** | —     | —     | **2** | **0** | —   | —     |


**Légende** : vide = neutre (×1) · **2** = super efficace (×2) · **½** = peu efficace (×0,5) · **0** = immunité

---

## Mode Histoire

- **11 zones** (1 par tribu) × **15 niveaux** = **165 niveaux** total.
- **3 boss par zone** (niveaux 5, 10, 15) → **33 boss** au total.
- **3 étoiles par niveau** → **495 étoiles** max.
- **Carte** : visuelle style **Wibble Wobble**.
- **Dialogue** intro + fin de chaque niveau.
- Progression narrative alignée sur l’arc des zones 1–11 (voir [Arc narratif](#arc-narratif-zones-111)).
- **Combat** : **identique au Roguelite** ([système de combat](#combat) — roue, terrain, rotation, Phantoball en combat, ciblage). Équipe issue du **roster** du joueur. Pas de permadeath des persos de la collection ; échec = niveau raté.

---

## Métaprogression

Persiste entre les runs :

- **Ressources** gardées entre runs (jetons gacha, etc.).
- **Arbre de passives** persistant.
- **Persos de départ** débloquables (persos obtenus au gacha éligibles).

Tout ce qui est **run-only** (roue, buffs temporaires, reliques, balls trouvées en run) est **reset** à la mort ou fin de run.

---

## Support technique — PWA

- **Navigateur** desktop + mobile.
- **Installable** comme une app (PWA) — pas besoin de l’App Store.
- Cible : hub, combats, gacha accessibles web-first.
- **Stack** : voir [`docs/TECH.md`](TECH.md) — **Next.js + React**, logique dans `game-core`, backend **Supabase** (gacha serveur).

---

## Hors scope v1 (mentionné mind map)

- Raretés **SS → UZ+**
- Détails équipements / pack objet (attaques, ressources) à préciser en implémentation
- Équilibrage fin des taux pity / capture en playtest

---

*Source : `Phantoria-mindmap-v13.excalidraw` — régénérer ce doc si la mind map change.*