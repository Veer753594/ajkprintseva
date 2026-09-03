@echo off
cd /d "%~dp0"
npm install
npm run build-exe
echo.
echo EXE created in this folder. Keep config.json beside it.
pause
