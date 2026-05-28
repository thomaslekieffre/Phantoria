#!/usr/bin/env sh
set -e
cd "$(dirname "$0")/.."

if [ ! -d .git ]; then
  git init
  echo "Dépôt Git initialisé."
fi

git config core.hooksPath .githooks
echo "core.hooksPath = .githooks (local au repo)"
echo "Hook prepare-commit-msg actif."
