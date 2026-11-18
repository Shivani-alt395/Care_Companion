@echo off
echo Starting CareCompanion...

:: Start API server in new window
start "CareCompanion API" cmd /k "cd /d D:\OneDrive\Desktop\MEDICAL\carecompanion\server && npx tsx src/index.ts"

:: Wait 4 seconds for API to start
timeout /t 4 /nobreak >nul

:: Start Vite frontend in new window
start "CareCompanion Frontend" cmd /k "cd /d D:\OneDrive\Desktop\MEDICAL\carecompanion\client && npx vite --port 5173"

:: Wait 5 seconds then open browser
timeout /t 5 /nobreak >nul
start chrome http://localhost:5173
