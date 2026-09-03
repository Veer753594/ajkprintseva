@echo off
cd /d "%~dp0"
echo Starting Ayush Janseva AutoPrint Agent...
where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not in PATH.
  echo Install Node.js LTS, then open a NEW terminal and run this file again.
  pause
  exit /b 1
)
if not exist "config.json" (
  echo ERROR: config.json not found in %CD%
  echo Copy config.example.json to config.json and set your Netlify Agent Key.
  pause
  exit /b 1
)
node agent.mjs
pause
