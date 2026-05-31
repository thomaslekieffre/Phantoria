# Phantoria

Gacha + roguelite — **jeu web** jouable dans le navigateur (desktop-first).  
Design : [`docs/`](docs/).

## Lancer

```bash
pnpm install
pnpm dev
```

→ [http://localhost:3000](http://localhost:3000) — **Sanctuaire** (hub)

## Stack

| Chemin | Rôle |
|--------|------|
| `apps/web` | Next.js 16 · React 19 · UI desktop |

## Docs

| Fichier | Contenu |
|---------|---------|
| [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md) | Game design |
| [`docs/DATA.md`](docs/DATA.md) | Formules & data |
| [`docs/TECH.md`](docs/TECH.md) | Stack · client web |
| [`docs/DEV.md`](docs/DEV.md) | Workflow dev & Git |

## Git

Hooks : `.\scripts\setup-git-hooks.ps1` (une fois). Pas de `Co-authored-by: Cursor` — [`.cursor/rules/git-commits.mdc`](.cursor/rules/git-commits.mdc).
