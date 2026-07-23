@echo off
echo ===================================================
echo Launching FinPilot AI Project...
echo ===================================================

echo Starting FastAPI Server in a new window...
start "FastAPI AI Engine" cmd /k "cd ai-engine && d:\venv-finai-engine\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting Express Backend in a new window...
start "Express Backend Gateway" cmd /k "cd backend && npm start"

echo Starting React Frontend in a new window...
start "Vite Frontend Dashboard" cmd /k "cd frontend && npm start"

echo ===================================================
echo All services launched!
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:5000
echo - AI Engine: http://127.0.0.1:8000
echo ===================================================
pause
