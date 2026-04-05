$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$LaunchCmdPath = Join-Path $RepoRoot 'launch-julie.cmd'
$LaunchSilentPath = Join-Path $RepoRoot 'launch-julie.vbs'
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$LogDir = Join-Path $env:APPDATA 'julie\logs'
$LogPath = Join-Path $LogDir 'launcher.log'
$MutexName = 'Local\SOFIA-3-Workspace-Launcher'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-LauncherLog {
  param(
    [string]$Level,
    [string]$Message
  )

  $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  Add-Content -Path $LogPath -Value "[$timestamp] [$Level] $Message"
}

function Show-LauncherError {
  param(
    [string]$Message
  )

  try {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show(
      $Message,
      'SOFÍA 3.0 - Launcher',
      [System.Windows.Forms.MessageBoxButtons]::OK,
      [System.Windows.Forms.MessageBoxIcon]::Error
    ) | Out-Null
  } catch {
    Write-Host $Message
  }
}

function Get-NewestTimestamp {
  param(
    [string[]]$Paths
  )

  $items = foreach ($path in $Paths) {
    if (Test-Path -LiteralPath $path) {
      Get-Item -LiteralPath $path -Force
    }
  }

  if (-not $items) {
    return $null
  }

  return ($items | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1).LastWriteTimeUtc
}

function Repair-DesktopShortcuts {
  if (-not (Test-Path -LiteralPath $LaunchSilentPath)) {
    Write-LauncherLog 'WARN' "Launcher silencioso ausente, no se reparan accesos: $LaunchSilentPath"
    return
  }

  $iconPath = Join-Path $RepoRoot 'release\win-unpacked\SOFÍA.exe'
  $iconLocation = if (Test-Path -LiteralPath $iconPath) { "$iconPath,0" } else { '' }

  $shell = New-Object -ComObject WScript.Shell
  $fixed = 0

  Get-ChildItem -LiteralPath $DesktopPath -Filter '*.lnk' -ErrorAction SilentlyContinue | ForEach-Object {
    $shortcut = $shell.CreateShortcut($_.FullName)
    $target = $shortcut.TargetPath

    $looksLikeJulieShortcut =
      $_.Name -like '*SOF*' -or
      $target -like '*SOFÍA*' -or
      $target -like '*julie*' -or
      $target -like '*release-ui*'

    if (-not $looksLikeJulieShortcut) {
      return
    }

    if ($shortcut.TargetPath -ne $LaunchSilentPath -or $shortcut.WorkingDirectory -ne $RepoRoot) {
      $shortcut.TargetPath = $LaunchSilentPath
      $shortcut.Arguments = ''
      $shortcut.WorkingDirectory = $RepoRoot
      if ($iconLocation) {
        $shortcut.IconLocation = $iconLocation
      }
      $shortcut.Description = 'SOFÍA 3.0 (workspace launcher)'
      $shortcut.Save()
      $fixed += 1
    }
  }

  if ($fixed -gt 0) {
    Write-LauncherLog 'INFO' "Accesos directos reparados: $fixed"
  }
}

function Resolve-WorkspaceCandidate {
  $electronExe = Join-Path $RepoRoot 'node_modules\electron\dist\electron.exe'
  $distIndex = Join-Path $RepoRoot 'dist\index.html'
  $distMain = Join-Path $RepoRoot 'dist-electron\main.js'
  $distPreload = Join-Path $RepoRoot 'dist-electron\preload.mjs'

  foreach ($requiredPath in @($electronExe, $distIndex, $distMain, $distPreload)) {
    if (-not (Test-Path -LiteralPath $requiredPath)) {
      Write-LauncherLog 'WARN' "Workspace incompleto, falta: $requiredPath"
      return $null
    }
  }

  [pscustomobject]@{
    Label = 'workspace-dist'
    Kind = 'workspace'
    LaunchPath = $electronExe
    ProcessPath = $electronExe
    Arguments = @('.')
    WorkingDir = $RepoRoot
    BuildTimestamp = Get-NewestTimestamp @($distIndex, $distMain, $distPreload)
  }
}

function Resolve-PackagedCandidate {
  param(
    [string]$RelativeDir
  )

  $workingDir = Join-Path $RepoRoot $RelativeDir
  if (-not (Test-Path -LiteralPath $workingDir)) {
    return $null
  }

  $exe = Get-ChildItem -LiteralPath $workingDir -File -Filter 'SOF*.exe' -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $exe) {
    Write-LauncherLog 'WARN' "Ejecutable no encontrado en: $workingDir"
    return $null
  }

  $asarPath = Join-Path $workingDir 'resources\app.asar'
  if (-not (Test-Path -LiteralPath $asarPath)) {
    Write-LauncherLog 'WARN' "app.asar ausente para: $($exe.FullName)"
    return $null
  }

  [pscustomobject]@{
    Label = $RelativeDir
    Kind = 'packaged'
    LaunchPath = $exe.FullName
    ProcessPath = $exe.FullName
    Arguments = @()
    WorkingDir = $workingDir
    BuildTimestamp = (Get-Item -LiteralPath $asarPath -Force).LastWriteTimeUtc
  }
}

function Find-RunningWorkspaceProcess {
  param(
    [string]$ElectronExe
  )

  try {
    $processes = Get-CimInstance Win32_Process -Filter "Name = 'electron.exe'" -ErrorAction Stop | Where-Object {
      $_.ExecutablePath -eq $ElectronExe -and $_.CommandLine -like "*$RepoRoot*"
    }

    foreach ($proc in $processes) {
      $processId = [int]$proc.ProcessId
      $liveProc = Get-Process -Id $processId -ErrorAction SilentlyContinue
      if ($liveProc) {
        return $liveProc
      }
    }
  } catch {
    Write-LauncherLog 'WARN' "No se pudo inspeccionar electron.exe por WMI: $($_.Exception.Message)"
  }

  return $null
}

function Find-RunningCandidate {
  param(
    [object[]]$Candidates
  )

  foreach ($candidate in $Candidates) {
    if ($candidate.Kind -eq 'workspace') {
      $workspaceProc = Find-RunningWorkspaceProcess -ElectronExe $candidate.ProcessPath
      if ($workspaceProc) {
        return $workspaceProc
      }
      continue
    }

    $packagedProc = Get-Process -ErrorAction SilentlyContinue | Where-Object {
      $_.Path -and $_.Path -eq $candidate.ProcessPath
    } | Select-Object -First 1

    if ($packagedProc) {
      return $packagedProc
    }
  }

  return $null
}

function Stop-ConflictingOpenClawProcesses {
  $openClawExe = 'C:\Users\clayt\AppData\Local\Programs\OpenClaw Desktop\OpenClaw Desktop.exe'

  try {
    $openClawProcs = Get-CimInstance Win32_Process -Filter "Name = 'OpenClaw Desktop.exe'" -ErrorAction Stop | Where-Object {
      $_.ExecutablePath -eq $openClawExe
    }

    foreach ($proc in $openClawProcs) {
      $procId = [int]$proc.ProcessId
      try {
        Stop-Process -Id $procId -Force -ErrorAction Stop
        Write-LauncherLog 'INFO' "OpenClaw Desktop cerrado para evitar conflicto visual/ruta (PID $procId)"
      } catch {
        Write-LauncherLog 'WARN' "No se pudo cerrar OpenClaw Desktop PID ${procId}: $($_.Exception.Message)"
      }
    }
  } catch {
    Write-LauncherLog 'WARN' "No se pudo inspeccionar OpenClaw Desktop: $($_.Exception.Message)"
  }
}

$mutex = New-Object System.Threading.Mutex($false, $MutexName)
$hasMutex = $false

try {
  $hasMutex = $mutex.WaitOne(0, $false)
  if (-not $hasMutex) {
    Write-LauncherLog 'INFO' 'Launcher ya en ejecucion; no se inicia otra instancia.'
    exit 0
  }

  Repair-DesktopShortcuts

  $candidates = @()
  $workspaceCandidate = Resolve-WorkspaceCandidate
  if ($workspaceCandidate) {
    $candidates += $workspaceCandidate
  }

  $packagedCandidate = Resolve-PackagedCandidate -RelativeDir 'release\win-unpacked'
  if ($packagedCandidate) {
    if ($workspaceCandidate -and $packagedCandidate.BuildTimestamp -lt $workspaceCandidate.BuildTimestamp) {
      Write-LauncherLog 'INFO' "Se ignora release empaquetado obsoleto: $($packagedCandidate.Label)"
    } else {
      $candidates += $packagedCandidate
    }
  }

  if (-not $candidates) {
    $message = "No se encontro ningun build valido de SOFÍA 3.0. Revisa $LogPath"
    Write-LauncherLog 'ERROR' $message
    Show-LauncherError -Message $message
    exit 1
  }

  Stop-ConflictingOpenClawProcesses

  $running = Find-RunningCandidate -Candidates $candidates
  if ($running) {
    $focused = $false
    try {
      $shell = New-Object -ComObject WScript.Shell
      if ($shell.AppActivate($running.Id)) {
        Write-LauncherLog 'INFO' "Instancia existente enfocada (PID $($running.Id)) -> $($running.Path)"
        $focused = $true
      }
    } catch {}

    if (-not $focused) {
      Write-LauncherLog 'INFO' "Instancia existente detectada; no se abre duplicado. PID $($running.Id)"
    }

    exit 0
  }

  foreach ($candidate in $candidates) {
    try {
      Write-LauncherLog 'INFO' "Intentando abrir $($candidate.Label) -> $($candidate.LaunchPath)"
      $proc = Start-Process -FilePath $candidate.LaunchPath -ArgumentList $candidate.Arguments -WorkingDirectory $candidate.WorkingDir -PassThru
      Start-Sleep -Seconds 3
      try {
        $proc.Refresh()
      } catch {}

      if (-not $proc.HasExited) {
        Write-LauncherLog 'INFO' "Arranque correcto con $($candidate.Label) (PID $($proc.Id))"
        exit 0
      }

      $exitCode = -1
      try {
        $exitCode = $proc.ExitCode
      } catch {}
      Write-LauncherLog 'WARN' "El build se cerro al arrancar: $($candidate.Label) (ExitCode $exitCode)"
    } catch {
      Write-LauncherLog 'ERROR' "Fallo al abrir $($candidate.Label): $($_.Exception.Message)"
    }
  }

  $finalMessage = "SOFÍA 3.0 no pudo abrirse con ninguno de los builds validos. Revisa $LogPath"
  Write-LauncherLog 'ERROR' $finalMessage
  Show-LauncherError -Message $finalMessage
  exit 1
} finally {
  if ($hasMutex) {
    $mutex.ReleaseMutex() | Out-Null
  }
  $mutex.Dispose()
}
