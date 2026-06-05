# Assets audio Phantoria

Dépose ici des fichiers nommés **`{soundId}.webm`** (ou `.mp3` / `.ogg`).

Le sound manager les charge automatiquement ; sinon il utilise la **synthèse procédurale** (dev).

## IDs attendus

Voir `docs/VISUAL-UX-PLAN.md` — section « Sons MVP ».

Exemples :

- `ui_click.webm`
- `gacha_reveal_s.webm`
- `capture_success.webm`

## Sources recommandées (CC0)

- [Kenney — Interface Sounds](https://kenney.nl/assets/interface-sounds)
- [Kenney — Casino Audio](https://kenney.nl/assets/casino-audio) (gacha)
- [OpenGameArt](https://opengameart.org)

Renomme les fichiers selon les IDs du registry (`apps/web/lib/audio/sounds.ts`).
