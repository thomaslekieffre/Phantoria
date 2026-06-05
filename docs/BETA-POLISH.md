# Bêta — polish pré-invitation

Checklist après déploiement technique (sécu, smoke neuf).

## 1. Sons (Kenney)

Assets dans `apps/web/public/assets/audio/` — noms = IDs du registry (`lib/audio/sounds.ts`).

| ID | Fichier Kenney (Interface Sounds) |
|----|-----------------------------------|
| `ui_click` | `click_001.ogg` |
| `ui_confirm` | `confirmation_001.ogg` |
| `ui_error` | `error_004.ogg` |
| `gacha_tick` | `tick_001.ogg` |
| `gacha_reveal_common` | `select_001.ogg` |
| `gacha_reveal_rare` | `confirmation_002.ogg` |
| `gacha_reveal_s` | `confirmation_004.ogg` |
| `battle_hit` | `scratch_004.ogg` |
| `capture_throw` | `drop_002.ogg` |
| `capture_shake` | `switch_005.ogg` |
| `capture_success` | `confirmation_003.ogg` |
| `capture_fail` | `error_002.ogg` |
| `quest_claim` | `confirmation_001.ogg` |
| `gold_gain` | `select_003.ogg` |

Source : [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds) (CC0).

```powershell
.\scripts\fetch-kenney-sfx.ps1
```

Les `.ogg` sont versionnés dans `public/assets/audio/`. Sans fichier → synth Web Audio (fallback).

## 2. Studio contenu (livré)

État **OK pour édition bêta** — contenu live 100 % DB au runtime.

| Zone | Capacités |
|------|-----------|
| **Esprits** | Stats/skills, portrait PNG, 9 jouables en `catalog` |
| **Gacha** | `+ Pool`, picker catalogue, poids drop, bannière PNG, coûts |
| **Events** | `gacha_banner` + pool custom |
| **Seed** | `characters.json` + `seed-baseline.ts` → DB (une fois) |

**Setup neuf** : `supabase db push` → `/studio` admin → **Importer le contenu** → refresh jeu.

Sans seed : bandeau `source: empty` (pas de fallback code).

## 3. Event gacha (`QA-004`)

### Setup Studio (admin)

1. `/studio` → Gacha : pool `event-demo` (ou id custom) + entrées esprits.
2. Events → kind **`gacha_banner`**, `config.poolId` = même id, `ticketCost` / `gemCost` / `multiCount` optionnels.
3. Activer l’event (`active`, dates `starts_at` / `ends_at`).

### Test manuel

- [ ] `/events` liste l’event
- [ ] `/gacha` onglet **Event** visible
- [ ] Pull ticket ×1 et ×multi
- [ ] `POST /api/gacha/event` 200, monnaies débitées, esprit en collection

Migration : `20260605120000_event_gacha_demo.sql` — pool `event-demo`, event `banniere-gacha-demo` **inactive** → Studio → activer + vérifier dates.

## 4. Mobile ≤768px

- [ ] Hub : bottom nav, fiche esprit bottom sheet
- [ ] `/spirits` : grille + fiche bas
- [ ] `/gacha` : tabs packs, CTA pleine largeur
- [ ] `/run` + histoire : combat sans topbar/sidebar, deck bas
- [ ] Toggle son topbar accessible

## 5. Contenu

- **Zones histoire** : 1–2 jouables (30 niv.). Zone 3 = Costauds définie, niveaux à écrire.
- **Esprits** : 9 jouables seed · pool standard 9 entrées · portraits PNG via Studio (fallback blob générique).

## 6. Infra bêta

- [ ] Vercel deploy + env (`SUPABASE_*`, `SERVICE_ROLE`, PostHog)
- [ ] Migrations Supabase à jour
- [ ] Studio → Importer le contenu
- [ ] `GET /api/content/game` → `source: "db"`
- [ ] Canal feedback testeurs

---

*Mis à jour : juin 2026*
