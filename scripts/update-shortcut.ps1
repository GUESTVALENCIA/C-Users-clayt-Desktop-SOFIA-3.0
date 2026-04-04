$desktopPath = [Environment]::GetFolderPath('Desktop')
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$releaseDir = Join-Path $repoRoot 'release-ui7\win-unpacked'
$targetPath = (Get-ChildItem -LiteralPath $releaseDir -Filter '*.exe' | Select-Object -First 1).FullName
$iconPath = Join-Path $repoRoot 'resources\icon.ico'

if (-not $targetPath) {
  throw "No se encontró ejecutable en $releaseDir"
}

$shell = New-Object -ComObject WScript.Shell
$links = Get-ChildItem -LiteralPath $desktopPath -Filter '*.lnk' |
  Where-Object { $_.Name -match '(?i)sof|sandra' }

foreach ($link in $links) {
  $shortcut = $shell.CreateShortcut($link.FullName)
  $shortcut.TargetPath = $targetPath
  $shortcut.WorkingDirectory = $releaseDir
  if (Test-Path -LiteralPath $iconPath) {
    $shortcut.IconLocation = $iconPath
  }
  $shortcut.Save()
}

[PSCustomObject]@{
  UpdatedLinks = $links.Count
  TargetPath = $targetPath
  WorkingDirectory = $releaseDir
}
