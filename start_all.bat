@echo off
echo ========================================================
echo Starting Enterprise RAG Assistant (Frontend & Backend)
echo ========================================================
echo.

echo Starting Backend API (Port 8000)...
start "Backend API" cmd /k "cd backend && python main.py"

echo Starting Frontend Server (Port 3000)...
start "Frontend Server" cmd /k "cd frontend && python -m http.server 3000"

echo.
echo Both servers are starting up!
echo - Frontend is available at: http://localhost:3000
echo - Backend API is available at: http://localhost:8000
echo - API Docs are available at: http://localhost:8000/docs
echo.
echo Note: This opened two new command prompt windows for the servers.
echo To stop them, simply close those windows.
pause
