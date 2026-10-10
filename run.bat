@echo off
title CampusCare Platform Launcher
color 0B
echo ========================================================
echo   Starting CampusCare Platform (AI Campus Safety)
echo ========================================================
echo.

echo [1/2] Starting Backend Server (Port 5000)...
start "CampusCare Server [Port 5000]" cmd /k "cd /d %~dp0server && npm run dev"

echo Waiting 2 seconds for server to initialize...
timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend Client (Port 5173)...
start "CampusCare Client [Port 5173]" cmd /k "cd /d %~dp0client && npm run dev"

echo Waiting 3 seconds for Vite to launch...
timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ========================================================
echo   CampusCare is now running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo ========================================================
