@echo off
set SCRIPT_DIR=%~dp0
echo ==============================================
echo       Starting FRIDAY inside Docker (Windows)
echo ==============================================

cd /d %SCRIPT_DIR%
docker compose up --build

echo Close this window or press Ctrl+C to shut down.
echo ==============================================
