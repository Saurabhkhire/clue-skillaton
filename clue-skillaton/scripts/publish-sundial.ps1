# Publish Clue skills to Sundial Hub
# Prerequisite: Run "npx sundial-hub auth login" first (one-time, opens browser)

$ErrorActionPreference = "Stop"

# Check auth
$status = (npx sundial-hub auth status 2>&1) -join " "
if ($status -match "Not authenticated") {
    Write-Host "Not authenticated. Run this first:" -ForegroundColor Yellow
    Write-Host "  npx sundial-hub auth login" -ForegroundColor Cyan
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}
$root = Split-Path -Parent $PSScriptRoot  # project root (clue-skillaton)
Set-Location $root

$skills = @("clue-game", "clue-moderator", "clue-player", "clue-assistant")
$version = "1.0.0"
$changelog = "Initial release"
$visibility = "public"

foreach ($skill in $skills) {
    Write-Host "Pushing $skill..." -ForegroundColor Cyan
    npx sundial-hub push "skills/$skill" --skill-version $version --changelog $changelog --visibility $visibility
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Host "  Done." -ForegroundColor Green
}

Write-Host ""
Write-Host "All 4 skills published to Sundial." -ForegroundColor Green
Write-Host "Install: npx sundial-hub add clue-game --agent cursor" -ForegroundColor Yellow
