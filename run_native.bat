@echo off
:: Find project directory
set SCRIPT_DIR=%~dp0

echo =================================================
echo       Starting FRIDAY Core (Windows Native Mode)  
echo =================================================

:: Start backend natively
echo Launching FastAPI Backend (Port 8000)...
cd /d "%SCRIPT_DIR%backend"
start "FRIDAY Backend" "%SCRIPT_DIR%backend\venv\Scripts\python.exe" main.py

:: Start frontend natively
echo Launching Next.js Frontend (Port 3000)...
cd /d "%SCRIPT_DIR%frontend"
start "FRIDAY Frontend" npm run dev

echo Native services launched in background. Use Ctrl+C or close terminal windows to exit.
pause
