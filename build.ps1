# build.ps1 — Build the FX Emotes Stream Deck plugin
# Usage:  .\build.ps1          (one-shot build)
#         .\build.ps1 -Watch   (watch mode, rebuilds on file change)
param(
    [switch]$Watch
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RootDir   = $PSScriptRoot
$PluginId  = "com.turnpoint.fxemotes"
$PluginDir = Join-Path $RootDir "dist\$PluginId.sdPlugin"
$RollupCmd = Join-Path $RootDir "node_modules\.bin\rollup.cmd"
$NodeDir   = Join-Path ${env:ProgramFiles} "nodejs"

if (-not (Test-Path $RollupCmd)) {
    throw "Missing local Rollup binary at '$RollupCmd'. Run 'npm install' first."
}

if (Test-Path (Join-Path $NodeDir "node.exe")) {
    $env:Path = "$NodeDir;$env:Path"
}

$requiredIcons = @(
    "plugin\imgs\action.png",
    "plugin\imgs\icon.png",
    "plugin\imgs\plugin-icon.png",
    "plugin\imgs\category-icon.png"
)

foreach ($icon in $requiredIcons) {
    $iconPath = Join-Path $RootDir $icon
    if (-not (Test-Path $iconPath)) {
        throw "Missing required icon asset: '$iconPath'"
    }
}

# ── Clean & scaffold dist layout ──────────────────────────────────────────────
if (Test-Path (Join-Path $RootDir "dist")) { Remove-Item -Recurse -Force (Join-Path $RootDir "dist") }
New-Item -ItemType Directory -Force -Path "$PluginDir\bin" | Out-Null

# Copy static plugin assets
Copy-Item -Force  (Join-Path $RootDir "plugin\manifest.json") $PluginDir\
Copy-Item -Recurse -Force (Join-Path $RootDir "plugin\imgs") $PluginDir\
Copy-Item -Recurse -Force (Join-Path $RootDir "plugin\ui") $PluginDir\

# Stamp an always-increasing version in the packaged manifest so install acts as update.
$manifestPath = Join-Path $PluginDir "manifest.json"
$manifest = Get-Content -Raw -Path $manifestPath | ConvertFrom-Json
$now = Get-Date
$buildRevision = ($now.Hour * 60) + $now.Minute
$manifest.Version = "{0}.{1}.{2}.{3}" -f $now.Year, $now.Month, $now.Day, $buildRevision
$manifest | ConvertTo-Json -Depth 20 | Set-Content -Path $manifestPath -Encoding UTF8
Write-Host "Stamped plugin version: $($manifest.Version)" -ForegroundColor DarkGray

# ── Run rollup ────────────────────────────────────────────────────────────────
if ($Watch) {
    Write-Host "Starting watch mode..." -ForegroundColor Cyan
    & $RollupCmd -c --watch
} else {
    Write-Host "Building..." -ForegroundColor Cyan
    & $RollupCmd -c

    # ── Package into installable .streamDeckPlugin ─────────────────────────
    $zip = Join-Path $RootDir "dist\$PluginId.zip"
    $pluginPackage = Join-Path $RootDir "dist\$PluginId.streamDeckPlugin"
    if (Test-Path $zip) { Remove-Item $zip }
    if (Test-Path $pluginPackage) { Remove-Item $pluginPackage }
    Compress-Archive -Path "$PluginDir" -DestinationPath $zip
    Move-Item -Path $zip -Destination $pluginPackage
    Write-Host "Done!  ->  $pluginPackage" -ForegroundColor Green
    Write-Host "Double-click the .streamDeckPlugin file to install." -ForegroundColor Yellow
}
