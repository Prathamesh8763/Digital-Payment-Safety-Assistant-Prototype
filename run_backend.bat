@echo off
echo ===================================================
echo Starting Digital Payment Safety Assistant Backend...
echo ===================================================
cd /d "%~dp0backend"
if not exist ".venv\Scripts\python.exe" (
    echo Python virtual environment not found in backend\.venv
    echo Please create it with: python -m venv .venv
    pause
    exit /b 1
)
".venv\Scripts\python.exe" -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause
