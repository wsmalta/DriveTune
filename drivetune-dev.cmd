@echo off
setlocal

cd /d "%~dp0"

echo.
echo ========================================
echo           DriveTune - DEV
echo ========================================
echo.
echo Pasta: %CD%
echo.
echo Iniciando servidor de desenvolvimento...
echo.

npm run dev

endlocal