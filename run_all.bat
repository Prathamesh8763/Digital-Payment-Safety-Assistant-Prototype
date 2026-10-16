@echo off
echo =======================================================
echo Launching Digital Payment Safety Assistant (Full Stack)
echo =======================================================
start "Safety Assistant Backend (FastAPI)" cmd /k "%~dp0run_backend.bat"
start "Safety Assistant Frontend (Vite/React)" cmd /k "%~dp0run_frontend.bat"
echo.
echo Both servers are launching in separate windows!
echo Backend:  http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)
echo Frontend: http://localhost:5173
echo =======================================================
