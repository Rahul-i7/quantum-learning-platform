@echo off
setlocal
title QMentor - Quantum App Stack

REM Always run from the folder this file lives in, so it works from any launch location.
cd /d "%~dp0"

REM ---------- Prerequisites ----------
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not on PATH. Install it from https://nodejs.org
    pause
    exit /b 1
)
where python >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not on PATH. Install Python 3.12 from https://python.org
    pause
    exit /b 1
)

REM ---------- Frontend dependencies ----------
REM npm writes node_modules\.package-lock.json only after a successful install,
REM so a half-finished install will be retried on the next run.
if not exist "apps\web\node_modules\.package-lock.json" (
    echo Installing frontend dependencies...
    pushd apps\web
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed. Fix the error above and run this file again.
        popd
        pause
        exit /b 1
    )
    popd
)

REM ---------- Python services: one isolated venv per service ----------
call :setup_service simulation
if errorlevel 1 ( pause & exit /b 1 )
call :setup_service ai-tutor
if errorlevel 1 ( pause & exit /b 1 )
call :setup_service content-progress
if errorlevel 1 ( pause & exit /b 1 )

REM ---------- Config files ----------
if not exist "services\ai-tutor\.env" (
    copy "services\ai-tutor\.env.example" "services\ai-tutor\.env" >nul
    echo NOTE: created services\ai-tutor\.env - open it and add your GEMINI_API_KEY.
)
findstr /c:"your_gemini_api_key_here" "services\ai-tutor\.env" >nul 2>&1
if not errorlevel 1 (
    echo WARNING: GEMINI_API_KEY in services\ai-tutor\.env is still the placeholder. AI explanations will not work until you set it.
)
if not exist "apps\web\.env.local" (
    echo WARNING: apps\web\.env.local not found. Login needs NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY there.
)

REM The web app's simulate route falls back to port 8001 if this is unset,
REM but the Simulation Service runs on 8000. Set it here so it always matches.
if not defined SIMULATION_SERVICE_URL set "SIMULATION_SERVICE_URL=http://localhost:8000"

REM ---------- Launch everything ----------
echo.
echo Starting all services...
echo.

start "Simulation Service (Port 8000)" cmd /k "cd /d services\simulation && .venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"
start "AI Tutor Service (Port 8001)" cmd /k "cd /d services\ai-tutor && .venv\Scripts\python.exe -m uvicorn main:app --reload --port 8001"
start "Content-Progress Service (Port 8002)" cmd /k "cd /d services\content-progress && .venv\Scripts\python.exe -m uvicorn main:app --reload --port 8002"
start "Next.js Frontend (Port 3000)" cmd /k "cd /d apps\web && npm run dev"

echo All services launched in separate windows!
echo - Web App:              http://localhost:3000
echo - Simulation API:       http://localhost:8000
echo - AI Tutor API:         http://localhost:8001
echo - Content-Progress API: http://localhost:8002
echo.
echo To reinstall a service's packages, delete services\^<name^>\.venv\.deps_ok and run this file again.
pause
endlocal
exit /b 0

REM ---------- Subroutine: create venv + install requirements for one service ----------
:setup_service
if exist "services\%~1\.venv\.deps_ok" exit /b 0
echo Setting up %~1 service - this can take a few minutes the first time...
pushd "services\%~1"
if not exist ".venv\Scripts\python.exe" python -m venv .venv
if errorlevel 1 (
    echo ERROR: could not create a virtual environment for %~1.
    popd
    exit /b 1
)
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: pip install failed for %~1. Fix the error above and run this file again.
    popd
    exit /b 1
)
echo ok> ".venv\.deps_ok"
popd
exit /b 0