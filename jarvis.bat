@echo off
:: Find the directory where this batch file is located
set SCRIPT_DIR=%~dp0

:: Run jarvis_cli.py using the Windows virtual environment python interpreter
"%SCRIPT_DIR%backend\venv\Scripts\python.exe" "%SCRIPT_DIR%jarvis_cli.py" %*
