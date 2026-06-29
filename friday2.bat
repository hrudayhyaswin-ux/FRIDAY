@echo off
:: Find the directory where this batch file is located
set SCRIPT_DIR=%~dp0

:: Run friday_cli_v2.py using the Windows virtual environment python interpreter
"%SCRIPT_DIR%backend\venv\Scripts\python.exe" "%SCRIPT_DIR%friday_cli_v2.py" %*
