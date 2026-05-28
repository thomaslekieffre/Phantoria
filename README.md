# Phantoria

Jeu (hub, roster, combats, histoire, roguelite) — monorepo **pnpm** avec frontend Vite et API Fastify + MySQL.

## Structure

```
Phantoria/
├── apps/
│   ├── web/          # Frontend (Vite, TypeScript, Tailwind v4)
│   └── api/          # Backend (Fastify, MySQL via mysql2)
├── package.json      # Scripts racine
└── pnpm-workspace.yaml
```

| App | Rôle | Stack |
|-----|------|--------|
| `web` | UI du jeu (menus, hub, combats…) | Vite 8, TS, Tailwind 4 |
| `api` | Persistance, profils, sauvegardes (à venir) | Fastify 5, mysql2 |

## Prérequis

- **Node.js** 20+
- **pnpm** 10 (`corepack enable` puis `corepack prepare pnpm@10.28.0 --activate`)
- **MySQL** accessible (local ou distant)

## Installation

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
# Éditer apps/api/.env avec tes identifiants MySQL
```

## Variables d’environnement (API)

Fichier : `apps/api/.env`

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port HTTP de l’API | `4000` |
| `DB_HOST` | Hôte MySQL | — |
| `DB_PORT` | Port MySQL | `3306` |
| `DB_USER` | Utilisateur | — |
| `DB_PASSWORD` | Mot de passe | — |
| `DB_NAME` | Base de données | — |

Le pool MySQL est créé au démarrage dans `apps/api/src/lib/db.ts`. Si une variable obligatoire manque, l’API plante au boot avec un message explicite.

## Lancer en dev

```bash
# Les deux apps en parallèle
pnpm dev

# Ou séparément
pnpm dev:web   # http://localhost:5173 (port Vite par défaut)
pnpm dev:api   # http://localhost:4000
```

## Build & prod

```bash
pnpm build          # build web + api
pnpm preview        # preview du build web
pnpm start          # API compilée (node dist/server.js)
```

## API — routes actuelles

| Méthode | Route | Description |
|---------|--------|-------------|
| `GET` | `/` | Ping texte |
| `GET` | `/health` | `{ ok: true, service: "api" }` |
| `GET` | `/db-test` | `SELECT 1` via le pool MySQL |

Organisation du code API :

- `src/server.ts` — bootstrap Fastify, CORS, enregistrement des routes
- `src/routes/*.ts` — routes par domaine
- `src/lib/db.ts` — pool MySQL partagé

## Frontend

- Point d’entrée : `apps/web/index.html` + `apps/web/src/main.ts`
- Styles : Tailwind via `@tailwindcss/vite` dans `vite.config.ts`
- Pour l’instant : page starter ; la logique jeu viendra dans `src/`

## Git & GitHub

### Premier push

```bash
# Une fois le dépôt créé sur GitHub (vide, sans README) :
git remote add origin https://github.com/<user>/Phantoria.git
git branch -M main
git push -u origin main
```

### Hooks Git (sans attribution Cursor)

Ce dépôt inclut un hook `prepare-commit-msg` qui **retire** toute ligne `Co-authored-by` mentionnant Cursor avant chaque commit.

Activation (une fois par clone) :

```powershell
# Windows (PowerShell, à la racine du repo)
.\scripts\setup-git-hooks.ps1
```

```bash
# macOS / Linux / Git Bash
./scripts/setup-git-hooks.sh
```

Le réglage Cursor `cursor.composer.coAuthorCommits: false` est aussi versionné dans `.vscode/settings.json` pour éviter l’ajout côté IDE.

**Politique :** les commits sur ce repo ne doivent pas contenir `Co-authored-by: Cursor` (ni variante). Les hooks + le setting IDE couvrent ça ; en dernier recours, amend/rebase si une ligne s’est glissée avant l’activation des hooks.

## Ce qui n’est pas versionné

Voir `.gitignore` : `node_modules`, `dist`, `.env`, logs, caches Vite, etc.

## Roadmap (intention produit)

- Hub & navigation
- Roster / équipes
- Combats & runs roguelite
- Progression, rewards, sauvegardes via l’API
