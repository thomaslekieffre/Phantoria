# Phantoria

Gacha + roguelite — **jeu web** jouable dans le navigateur (desktop-first).  
Design : [`docs/`](docs/).

## Lancer

```bash
pnpm install
pnpm dev
```

→ [http://localhost:3000](http://localhost:3000) — **Sanctuaire** (hub)  
→ [http://localhost:3000/run](http://localhost:3000/run) — **Run roguelite** (combat proto)

```bash
pnpm test:core   # tests moteur (26)
pnpm build       # build prod
```

## Stack

| Chemin | Rôle |
|--------|------|
| `apps/web` | Next.js 16 · React 19 · UI desktop |
| `packages/game-core` | Moteur TS pur — combat, vagues, capture, récompenses |

## Docs

| Fichier | Contenu |
|---------|---------|
| [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md) | Game design |
| [`docs/DATA.md`](docs/DATA.md) | Formules, reliques, vagues |
| [`docs/TECH.md`](docs/TECH.md) | Stack · run roguelite · game-core |
| [`docs/DEV.md`](docs/DEV.md) | Workflow dev & Git |

## Git

Hooks : `.\scripts\setup-git-hooks.ps1` (une fois). Pas de `Co-authored-by: Cursor` — [`.cursor/rules/git-commits.mdc`](.cursor/rules/git-commits.mdc).
