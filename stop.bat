@echo off
cd /d "%~dp0"
if exist ".\backend\.venv\Scripts\python.exe" (
    .\backend\.venv\Scripts\python.exe run.py --stop
) else (
    python run.py --stop
)
