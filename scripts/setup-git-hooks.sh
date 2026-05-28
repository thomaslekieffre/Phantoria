#!/usr/bin/env sh
set -e
cd "$(dirname "$0")/.."
git config core.hooksPath .githooks
echo "Git hooks: .githooks (prepare-commit-msg actif)"
