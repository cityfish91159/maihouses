param(
  [Parameter(Mandatory = $true, ValueFromRemainingArguments = $true)]
  [string[]]$Prompt
)

$ErrorActionPreference = 'Stop'

$promptText = ($Prompt -join ' ').Trim()
if ([string]::IsNullOrWhiteSpace($promptText)) {
  throw 'Prompt is required.'
}

$outDir = Join-Path (Get-Location) '.codex-runs'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$jsonPath = Join-Path $outDir ("run-" + $timestamp + ".jsonl")

cmd /c "codex exec --json ""$promptText"" > ""$jsonPath"""
if ($LASTEXITCODE -ne 0) {
  throw "codex exec failed with exit code $LASTEXITCODE"
}

Write-Output "Saved: $jsonPath"
