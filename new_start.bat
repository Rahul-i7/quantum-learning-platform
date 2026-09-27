@echo off
title QMentor - Quantum App Stack

REM Frontend deps (only if not already installed)
if not exist apps\web\node_modules (
    echo Installing frontend dependencies...
    cd apps\web
    call npm install
    cd ..\..
)

REM Simulation Service venv (only if not already created)
if not exist services\simulation\.venv (
    echo Setting up Simulation Service venv...
    cd services\simulation
    python -m venv .venv
    call .venv\Scripts\activate.bat
    pip install -r requirements.txt
    call deactivate
    cd ..\..
)

REM AI Tutor Service venv (only if not already created)
if not exist services\ai-tutor\.venv (
    echo Setting up AI Tutor Service venv...
    cd services\ai-tutor
    python -m venv .venv
    call .venv\Scripts\activate.bat
    pip install -r requirements.txt
    call deactivate
    cd ..\..
    if not exist services\ai-tutor\.env (
        copy services\ai-tutor\.env.example services\ai-tutor\.env >nul
        echo NOTE: created services\ai-tutor\.env - add your GEMINI_API_KEY there.
    )
)

REM Content/Progress Service venv (only if not already created)
if not exist services\content-progress\.venv (
    echo Setting up Content/Progress Service venv...
    cd services\content-progress
    python -m venv .venv
    call .venv\Scripts\activate.bat
    pip install -r requirements.txt
    call deactivate
    cd ..\..
)

echo.
echo Starting all services...
echo.

start "Next.js Frontend (Port 3000)" cmd /k "cd apps\web && npm run dev"
start "Simulation Service (Port 8000)" cmd /k "cd services\simulation && call .venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000"
start "AI Tutor Service (Port 8001)" cmd /k "cd services\ai-tutor && call .venv\Scripts\activate.bat && uvicorn main:app --reload --port 8001"
start "Content/Progress Service (Port 8002)" cmd /k "cd services\content-progress && call .venv\Scripts\activate.bat && uvicorn main:app --reload --port 8002"

echo.
echo All services launched in separate windows!
echo - Web App: http://localhost:3000
echo - Simulation API: http://localhost:8000
echo - AI Tutor API: http://localhost:8001
echo - Content/Progress API: http://localhost:8002
pause
