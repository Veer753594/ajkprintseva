@echo off
cd /d "%~dp0"
call npm install
npx netlify dev
pause
