@echo off
REM Start TrueVow Customer Success CORE Service
REM Port: 3012 — Retention, health scoring, playbooks, NPS
echo Starting CSM CORE on port 3012...
cd /d "%~dp0"
npx next dev -p 3012
