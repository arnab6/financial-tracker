@echo off
echo Starting Financial Tracker Dev Environment...

:: Start Next.js Frontend in a new window
start "Financial Tracker Frontend" cmd /k "npm run dev"

:: Start Python Backend in a new window
start "Financial Tracker Backend (Python)" cmd /k "python -m uvicorn api.index:app --reload --port 8000"

echo Servers started! 
echo Frontend: http://localhost:3000
echo Backend: http://127.0.0.1:8000
pause
