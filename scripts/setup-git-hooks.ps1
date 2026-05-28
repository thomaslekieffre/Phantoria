# Active les hooks Git du projet (strip Co-authored-by Cursor).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

if (-not (Test-Path .git)) {
    git init
    Write-Host "Dépôt Git initialisé."
}

git config core.hooksPath .githooks
Write-Host "core.hooksPath = .githooks (local au repo)"
Write-Host "Hook prepare-commit-msg actif."
