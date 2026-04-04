@echo off
setlocal
set "ROOT=%~dp0"

echo ================================================
echo    SOFIA 3.0 - Launcher con Diagnostico
echo ================================================
echo.

echo [1/3] Verificando servicios criticos...
echo.

curl -s http://localhost:8098/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] OpenClaw Gateway online en :8098
) else (
    echo [WARN] OpenClaw Gateway no responde en :8098
)

curl -s http://localhost:8080/v1/models >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] G4F Server online en :8080
) else (
    echo [WARN] G4F Server no responde en :8080
)

echo.
echo [2/3] Verificando build del workspace...
dir /T:W "%ROOT%dist\assets\index-*.js" | findstr "index-"
echo.

echo [3/3] Iniciando SOFIA 3.0 con launcher blindado...
echo.
call "%ROOT%launch-sofia.cmd"

echo.
echo SOFIA 3.0 iniciada correctamente.
echo.
echo PRUEBA RAPIDA:
echo 1. Abre DevTools con Ctrl+Shift+I
echo 2. Confirma que el bundle cargado sea index-81L_uFMT.js o uno mas nuevo
echo 3. Prueba un turno con OpenClaw Pro
echo.
pause
