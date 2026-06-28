@echo off
set SCRIPT_DIR=%~dp0
echo ==============================================
echo       Starting FRIDAY Local Services
echo ==============================================

:: Start Backend Server
echo --> Launching local backend on port 8000...
start "FRIDAY Backend (Port 8000)" cmd /k "cd /d %SCRIPT_DIR%backend && call venv\Scripts\activate.bat && python main.py"

:: Start Frontend Server
echo --> Launching local frontend on port 3000...
start "FRIDAY Frontend (Port 3000)" cmd /k "cd /d %SCRIPT_DIR%frontend && npm run dev"

echo.
echo ✔ FRIDAY is booting up!
echo    - Web UI:  http://localhost:3000
echo    - Backend: http://localhost:8000
echo Close the newly opened terminal windows to shut down.
echo ==============================================
