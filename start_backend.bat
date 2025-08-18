@echo off
echo Starting UNEP Backend Server...
echo.
cd backend
echo Current directory: %CD%
echo.
echo Installing dependencies (if needed)...
call npm install
echo.
echo Starting development server...
call npm run dev
echo.
pause