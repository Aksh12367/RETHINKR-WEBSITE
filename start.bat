@echo off
title ReThinkr - Circular Economy Platform
echo ========================================================
echo       Starting ReThinkr Local Web Application
echo        "Don't dump it. Reimagine it."
echo ========================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Node.js detected. Launching ReThinkr server...
    start http://localhost:3000
    node server.js
    goto end
)

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Python detected. Launching HTTP server on port 3000...
    start http://localhost:3000
    python -m http.server 3000
    goto end
)

echo [INFO] Opening index.html directly in your default browser...
start index.html

:end
pause
