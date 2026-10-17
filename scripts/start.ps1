$ErrorActionPreference = 'Stop'
$toolsRoot = Join-Path $env:LOCALAPPDATA 'CortexaTools'
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
  $portableNode = Get-ChildItem -LiteralPath $toolsRoot -Directory -Filter 'node-*-win-x64' -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
  if ($portableNode) { $env:PATH = $portableNode.FullName + ';' + $env:PATH }
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Instale Node.js 22 LTS e abra um novo terminal.' }
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
& npx.cmd expo start @args
