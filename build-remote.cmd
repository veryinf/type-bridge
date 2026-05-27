@echo off
cd /d "%~dp0remote"
call pnpm install
if errorlevel 1 exit /b 1
call pnpm run build
if errorlevel 1 exit /b 1
