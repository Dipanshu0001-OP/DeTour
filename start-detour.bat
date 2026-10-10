@echo off
setlocal
cd /d "%~dp0frontend"
if not exist node_modules\vite\bin\vite.js (
  echo Frontend dependencies are missing. Installing them now...
  call npm.cmd install
  if errorlevel 1 exit /b 1
)
call npm.cmd run dev
