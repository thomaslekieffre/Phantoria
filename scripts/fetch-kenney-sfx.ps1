# Télécharge Kenney Interface Sounds (CC0) et mappe vers public/assets/audio/
# Usage: .\scripts\fetch-kenney-sfx.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$zip = Join-Path $env:TEMP "kenney_interfaceSounds.zip"
$extract = Join-Path $env:TEMP "kenney_interfaceSounds"
$out = Join-Path $root "apps\web\public\assets\audio"
$url = "https://opengameart.org/sites/default/files/kenney_interfaceSounds.zip"

$map = @{
  "ui_click.ogg"              = "click_001.ogg"
  "ui_confirm.ogg"            = "confirmation_001.ogg"
  "ui_error.ogg"              = "error_004.ogg"
  "gacha_tick.ogg"            = "tick_001.ogg"
  "gacha_reveal_common.ogg"   = "select_001.ogg"
  "gacha_reveal_rare.ogg"     = "confirmation_002.ogg"
  "gacha_reveal_s.ogg"        = "confirmation_004.ogg"
  "battle_hit.ogg"            = "scratch_004.ogg"
  "capture_throw.ogg"         = "drop_002.ogg"
  "capture_shake.ogg"         = "switch_005.ogg"
  "capture_success.ogg"       = "confirmation_003.ogg"
  "capture_fail.ogg"          = "error_002.ogg"
  "quest_claim.ogg"           = "confirmation_001.ogg"
  "gold_gain.ogg"             = "select_003.ogg"
}

Write-Host "Download Kenney Interface Sounds..."
Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing

if (Test-Path $extract) { Remove-Item $extract -Recurse -Force }
Expand-Archive -Path $zip -DestinationPath $extract -Force

$oggFiles = Get-ChildItem -Path $extract -Filter "*.ogg" -Recurse
if ($oggFiles.Count -eq 0) { throw "Aucun .ogg dans l'archive" }

New-Item -ItemType Directory -Force -Path $out | Out-Null

foreach ($entry in $map.GetEnumerator()) {
  $destName = $entry.Key
  $srcPattern = $entry.Value -replace "_", " "
  $src = $oggFiles | Where-Object { $_.Name -ieq $entry.Value -or $_.Name -ieq ($entry.Value -replace "_", " ") } | Select-Object -First 1
  if (-not $src) {
    $base = [System.IO.Path]::GetFileNameWithoutExtension($entry.Value) -replace "_", ""
    $src = $oggFiles | Where-Object { ($_.BaseName -replace " ", "" -replace "_", "") -ieq $base } | Select-Object -First 1
  }
  if (-not $src) {
    Write-Warning "Introuvable: $($entry.Value)"
    continue
  }
  Copy-Item $src.FullName (Join-Path $out $destName) -Force
  Write-Host "OK $destName <- $($src.Name)"
}

Write-Host "Termine -> $out"
