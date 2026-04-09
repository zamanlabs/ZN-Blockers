param(
  [string]$VersionOverride = "",
  [string]$KeyPath = ""
)

$ErrorActionPreference = "Stop"

function New-StagePackage {
  param(
    [string]$RepoRoot,
    [string]$StageDir
  )

  New-Item -Path $StageDir -ItemType Directory | Out-Null

  Copy-Item (Join-Path $RepoRoot "manifest.json") $StageDir
  Copy-Item (Join-Path $RepoRoot "LICENSE") $StageDir
  Copy-Item (Join-Path $RepoRoot "README.md") $StageDir
  Copy-Item (Join-Path $RepoRoot "assets") (Join-Path $StageDir "assets") -Recurse
  Copy-Item (Join-Path $RepoRoot "src") (Join-Path $StageDir "src") -Recurse

  $stageRulesDir = Join-Path $StageDir "rules"
  New-Item -Path $stageRulesDir -ItemType Directory | Out-Null
  Copy-Item (Join-Path $RepoRoot "rules\youtube-core.json") $stageRulesDir
  Copy-Item (Join-Path $RepoRoot "rules\easyprivacy-global.json") $stageRulesDir
  Copy-Item (Join-Path $RepoRoot "rules\easyprivacy-global.meta.json") $stageRulesDir
  Copy-Item (Join-Path $RepoRoot "rules\easylist-global.json") $stageRulesDir
  Copy-Item (Join-Path $RepoRoot "rules\easylist-global.meta.json") $stageRulesDir
  Copy-Item (Join-Path $RepoRoot "rules\adguard-base-global.json") $stageRulesDir
  Copy-Item (Join-Path $RepoRoot "rules\adguard-base-global.meta.json") $stageRulesDir
  Copy-Item (Join-Path $RepoRoot "rules\popup-redirect-shield.json") $stageRulesDir
}

function Invoke-Crx3Pack {
  param(
    [string]$StageDir,
    [string]$CrxPath,
    [string]$SigningKeyPath
  )

  $keyDir = Split-Path $SigningKeyPath -Parent
  if (-not (Test-Path $keyDir)) {
    New-Item -Path $keyDir -ItemType Directory | Out-Null
  }

  if (Test-Path $CrxPath) {
    Remove-Item $CrxPath -Force
  }

  $args = @("--yes", "crx3", "-p", $SigningKeyPath, "-o", $CrxPath, "--", $StageDir)
  & npx @args

  if ($LASTEXITCODE -ne 0) {
    throw "Failed to generate CRX package via crx3 for stage: $StageDir"
  }

  if (-not (Test-Path $CrxPath)) {
    throw "CRX package not created: $CrxPath"
  }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

$manifestPath = Join-Path $repoRoot "manifest.json"
if (-not (Test-Path $manifestPath)) {
  throw "manifest.json not found"
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$version = if ([string]::IsNullOrWhiteSpace($VersionOverride)) { $manifest.version } else { $VersionOverride }

$releaseBase = "ZN-blocker-v$version"
$distDir = Join-Path $repoRoot "dist"
if (-not (Test-Path $distDir)) {
  New-Item -Path $distDir -ItemType Directory | Out-Null
}

$resolvedKeyPath = if ([string]::IsNullOrWhiteSpace($KeyPath)) {
  Join-Path $repoRoot "keys\zn-blocker-release.pem"
} else {
  if ([System.IO.Path]::IsPathRooted($KeyPath)) {
    $KeyPath
  } else {
    Join-Path $repoRoot $KeyPath
  }
}

$targets = @("chrome", "edge", "chromium")
$releaseFiles = @()

foreach ($target in $targets) {
  $stageDir = Join-Path $env:TEMP ("zn-blocker-stage-" + [guid]::NewGuid().ToString("N"))
  New-StagePackage -RepoRoot $repoRoot -StageDir $stageDir

  $zipName = "$releaseBase-$target.zip"
  $zipPath = Join-Path $distDir $zipName
  if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
  }

  Compress-Archive -Path (Join-Path $stageDir "*") -DestinationPath $zipPath -CompressionLevel Optimal
  $releaseFiles += $zipPath
  Write-Output "Packed $zipName"

  $crxName = "$releaseBase-$target.crx"
  $crxPath = Join-Path $distDir $crxName
  Invoke-Crx3Pack -StageDir $stageDir -CrxPath $crxPath -SigningKeyPath $resolvedKeyPath
  $releaseFiles += $crxPath
  Write-Output "Packed $crxName"

  Remove-Item $stageDir -Recurse -Force
}

$hashFile = Join-Path $distDir "$releaseBase-SHA256SUMS.txt"
$hashLines = @()

foreach ($file in $releaseFiles) {
  $hash = (Get-FileHash -Path $file -Algorithm SHA256).Hash.ToLowerInvariant()
  $name = Split-Path $file -Leaf
  $hashLines += "$hash  $name"
}

Set-Content -Path $hashFile -Value $hashLines -Encoding UTF8
Write-Output "Wrote $(Split-Path $hashFile -Leaf)"
