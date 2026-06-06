# Phantoria — Plan visuel, UI/UX, animations & sons

> Roadmap pour passer de « proto stylé » à « bêta premium ».  
> **Phase 1** = fondations (en cours / livrée en code). Phases 2–4 = art + juice + audio design.

---

## État de départ (audit)

| Domaine | État |
|---------|------|
| Design system CSS | ✅ Puni Puni — fond clair, accent corail, ombres douces (`globals.css`) |
| Animations CSS | ✅ Hub, combat (dmg-pop, capture), gacha reveal |
| Portraits | ⚠️ SVG procéduraux (4 custom, reste générique) |
| Sons / musique | ❌ Aucun asset — **Phase 1 ajoute synth + pipeline fichiers** |
| Toasts / feedback erreur | ❌ → **Phase 1** |
| Transitions de page | ❌ → **Phase 1** |
| `prefers-reduced-motion` | ❌ → **Phase 1** |
| Framer Motion / GSAP | ❌ Volontairement absent (CSS pur d'abord) |

---

## Phase 1 — Fondations ✅ (livré)

**Statut** : implémenté et commité (juin 2026). Sons : synth par défaut, fichiers Kenney via `scripts/fetch-kenney-sfx.ps1` → `public/assets/audio/`.

**Codex** : fonds par tribu (`tribe-colors.ts`) — pas de refonte cards 3D (reporté).

## Phase 1 — détail technique

**Objectif** : infra réutilisable avant d'investir dans l'art.

| Livrable | Chemin |
|----------|--------|
| Plan (ce fichier) | `docs/VISUAL-UX-PLAN.md` |
| Sound manager (synth + fichiers optionnels) | `apps/web/lib/audio/` |
| Provider audio (mute, volumes, unlock) | `components/providers/audio-provider.tsx` |
| Toasts | `components/providers/toast-provider.tsx` + `components/ui/toast.css` |
| Transition page | `components/ui/page-enter.tsx` |
| Bouton avec feedback | `components/ui/pressable.tsx` |
| Toggle son topbar | `components/ui/sound-toggle.tsx` |
| Assets audio (drop zone) | `apps/web/public/assets/audio/README.md` |
| Reduced motion | `app/globals.css` |
| Branchements | gacha reveal, capture, quêtes claim, erreurs gacha |

### Sons MVP (registry)

| ID | Usage | Fichier optionnel |
|----|-------|-------------------|
| `ui_click` | Boutons, navigation | `ui_click.webm` |
| `ui_confirm` | Valider, continuer | `ui_confirm.webm` |
| `ui_error` | Erreur API | `ui_error.webm` |
| `gacha_tick` | Machine qui tire | `gacha_tick.webm` |
| `gacha_reveal_common` | Révélation C–E | `gacha_reveal_common.webm` |
| `gacha_reveal_rare` | Révélation A–B | `gacha_reveal_rare.webm` |
| `gacha_reveal_s` | Révélation S | `gacha_reveal_s.webm` |
| `battle_hit` | Dégâts reçus/infligés | `battle_hit.webm` |
| `capture_throw` | Lancer Phantoball | `capture_throw.webm` |
| `capture_shake` | Shake capture | `capture_shake.webm` |
| `capture_success` | Capturé | `capture_success.webm` |
| `capture_fail` | Échappé | `capture_fail.webm` |
| `quest_claim` | Récompense quête | `quest_claim.webm` |
| `gold_gain` | Or / monnaies | `gold_gain.webm` |

Sans fichier → **synth Web Audio** (tones procédurales, remplaçables sans changer le code).

### Volumes (localStorage)

- `phantoria_audio_muted`
- `phantoria_audio_ui` / `phantoria_audio_sfx` / `phantoria_audio_music` (0–1)

---

## Phase 2 — Art & identité visuelle

**Objectif** : le plus gros saut qualité perçue.

1. **Style guide** Figma (1 page) : perso chibi, bouton, carte rareté, frame combat.
2. **Pipeline assets** :
   ```
   public/assets/spirits/{hubId}/portrait.webp
   public/assets/spirits/{hubId}/battle.webp
   ```
3. Refactor `SpiritPortrait` → `<img>` + fallback SVG actuel.
4. **10 esprits ref** minimum pour la bêta (welcome pool + 4 starters).
5. Studio : champ `portrait_url` optionnel (futur).

**Référence style** : Yo-kai Watch Puni Puni / Wibble Wobble (lumineux, arrondi, coloré) + tokens Phantoria ci-dessous.

---

## Refonte UI Puni Puni ✅ (juin 2026)

**Objectif** : passer du thème sombre « nuit + lanternes » à une UI mobile-game lumineuse, sans dégradés décoratifs partout.

### Palette (tokens `:root`)

| Token | Rôle | Valeur |
|-------|------|--------|
| `--void` | Fond page | `#f0f5fa` |
| `--surface` | Cartes / panneaux | `#ffffff` |
| `--accent` | CTA, nav active, liens | `#ff6161` (corail) |
| `--accent-deep` | Hover / machine gacha | `#e84848` |
| `--ember` | Roguelite, accents chauds | `#ff8c42` |
| `--gold` | Monnaies, achats | `#ffb800` |
| `--ink` / `--text` | Titres | `#2b2b3d` |
| `--gradient-sky` | Seul dégradé conservé (fond ciel) | bleu → pêche |

**Principes** : boutons et badges en **couleur unie** + `box-shadow` colorée ; `border-radius-pill` pour les CTA ; pas de `border: solid var(--ink)` sur les cartes gacha.

### Fichiers touchés

| Zone | CSS / TSX |
|------|-----------|
| Tokens + shell | `app/globals.css`, `app/responsive.css`, `app/layout.tsx` (`themeColor`) |
| Hub | `components/hub/hub.css` |
| Gacha | `components/gacha/gacha.css`, `gacha-screen.tsx` (barre pity sous machine **retirée** ; badge `PITY n/100` sur bannière conservé) |
| Esprits, quêtes, shop, profile, story | `components/*/…css` |
| Primitives | `components/ui/rarity-badge.css`, `toast.css` |

### Gacha — pity

- **Retiré** : barre horizontale « Pity légendaire (S) » sous l'autel (collision visuelle avec la machine).
- **Conservé** : stamp `PITY {n}/{hard}` sur la bannière du pack standard + texte « S garanti à 100 invocations ».

---

## Phase 3 — Juice par écran

| Écran | Anim + son |
|-------|------------|
| Hub | Bounce swap roue, glow slot, `ui_click` |
| Gacha | Machine pulse, flash S, skip multi |
| Run | Screen shake gros hit, floaters colorés crit/heal |
| Histoire | Parallax carte, transition brief→combat |
| Quêtes | Confetti claim, barre animée |
| Global | Skeleton chargement contenu, toasts API |

---

## Phase 4 — Audio design

| Contexte | Piste |
|----------|-------|
| Hub sanctuaire | Loop ambient 30–60 s, crossfade |
| Combat run/histoire | Loop tension + SFX par-dessus |
| Gacha | Stinger 2–3 s, couper ambient |
| Victoire | Jingle court |

Canaux séparés : **Musique / SFX / UI** (déjà prévus en Phase 1).

Sources CC0 : [Kenney](https://kenney.nl/assets), [OpenGameArt](https://opengameart.org).

---

## Ordre d'exécution recommandé

```
✅ 1. Phase 1 — infra (sons, toasts, transitions)
□  2. Style guide + 10 portraits
□  3. Brancher portraits hub/gacha/codex/run
□  4. Juice combat (shake, flash)
□  5. Polish gacha + transitions
□  6. Musique ambient (optionnel bêta)
```

**Estimation** : ~5 jours code + art en parallèle après Phase 1.

---

## Hors scope (ne pas faire avant bêta stable)

- Refonte shadcn / Tailwind-only
- WebGL / particules 3D
- Live2D / Spine
- Framer Motion (sauf timeline gacha complexe plus tard)

---

## Fichiers clés existants (animations déjà là)

| Zone | CSS |
|------|-----|
| Hub | `components/hub/hub.css` — filaments, mote-rise, event-pulse |
| Run | `components/run/run.css` — dmg-pop, ally-lunge, capture, slot-ready |
| Gacha | `components/gacha/gacha.css` — reveal overlay, machine shake |
| Story | `components/story/story.css` — node-pulse |

Phase 3 **étend** ces fichiers, ne les remplace pas.

---

*Dernière mise à jour : juin 2026 — Phase 1 + refonte UI Puni Puni (palette corail).*
