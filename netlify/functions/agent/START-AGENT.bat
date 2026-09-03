@echo off
cd /d "%~dp0"
if not exist config.json (echo ERROR: Copy config.example.json to config.json and edit it first.&pause&exit /b 1)
node agent.mjs
pause
