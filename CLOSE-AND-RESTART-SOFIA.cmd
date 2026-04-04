@echo off
setlocal
set "ROOT=%~dp0"

echo ================================================
echo   Cerrando SOFIA completamente
echo ================================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$repo = 'C:\Users\clayt\Desktop\SOFÍA 3.0';" ^
  "Get-Process -ErrorAction SilentlyContinue | Where-Object { ($_.Path -like 'C:\Users\clayt\AppData\Local\Programs\sofia*') -or ($_.Path -eq (Join-Path $repo 'node_modules\electron\dist\electron.exe')) } | Stop-Process -Force"

timeout /t 2 /nobreak >nul

echo.
echo ================================================
echo   Reiniciando SOFIA con launcher blindado
echo ================================================
echo.

call "%ROOT%launch-sofia.cmd"

echo.
echo SOFIA reiniciada.
echo.
pause
