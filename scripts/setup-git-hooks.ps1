$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
git -C $root config core.hooksPath .githooks
Write-Host "Git hooks: .githooks (prepare-commit-msg actif)"
