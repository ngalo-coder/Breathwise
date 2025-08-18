@echo off
echo Starting UNEP Frontend...
echo.
cd frontend
echo Current directory: %CD%
echo.
echo Installing dependencies (if needed)...
call npm install
echo.
echo Starting development server...
call npm run dev
echo.
pause