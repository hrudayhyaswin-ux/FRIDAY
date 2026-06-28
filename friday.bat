@echo off
:: Find the directory where this batch file is located
set SCRIPT_DIR=%~dp0

:: Run cli.py using the Windows virtual environment python interpreter
"%SCRIPT_DIR%backend\venv\Scripts\python.exe" "%SCRIPT_DIR%cli.py" %*
