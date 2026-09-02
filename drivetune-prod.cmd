@echo off
setlocal

cd /d "%~dp0"

echo.
echo ========================================
echo          DriveTune - PROD
echo ========================================
echo.
echo Abrindo versao de producao no Vercel...
echo.

start "" "https://SUA-URL.vercel.app"

endlocal