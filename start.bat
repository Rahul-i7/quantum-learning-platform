@echo off
title Starting Quantum App Stack...

echo Starting Frontend (Next.js)...
start "Next.js Frontend (Port 3000)" cmd /k "cd apps\web && npm run dev"

echo Starting Simulation Service (FastAPI - Port 8000)...
start "Simulation Service (Port 8000)" cmd /k "cd services\simulation && uvicorn main:app --reload --port 8000"

echo Starting AI Tutor Service (FastAPI - Port 8001)...
start "AI Tutor Service (Port 8001)" cmd /k "cd services\ai-tutor && uvicorn main:app --reload --port 8001"

echo.
echo All services launched in separate windows!
echo - Web App: http://localhost:3000
echo - Simulation API: http://localhost:8000
echo - AI Tutor API: http://localhost:8001
pause