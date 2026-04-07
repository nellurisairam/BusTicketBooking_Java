@echo off
setlocal enabledelayedexpansion

:: ##################################################
:: #      BusTick Pro: Senior Edition (Stable)      #
:: ##################################################
:: # Version: 4.2.0 (Auto-Port Clearing)            #
:: ##################################################

title BusTick Pro - Management Terminal
color 0B

:: Inject Local Maven into PATH
set "MAVEN_HOME=%~dp0bin\apache-maven-3.9.6"
set "PATH=%MAVEN_HOME%\bin;%PATH%"

:MENU
cls
echo ##################################################
echo #      BusTick Pro: Management Terminal        #
echo ##################################################
echo # [1] Launch Global System (Full Stack)          #
echo # [2] Full Clean Rebuild (Maven + NPM)           #
echo # [3] Health Check (Dependencies ^& Ports)       #
echo # [4] Database Console (H2)                      #
echo # [5] API Documentation (Swagger)                #
echo # [6] Exit                                       #
echo ##################################################
echo.
set /p choice="Selection [1-6]: "

if "%choice%"=="1" goto PRE_LAUNCH
if "%choice%"=="2" goto REBUILD
if "%choice%"=="3" goto HEALTH
if "%choice%"=="4" goto DATABASE
if "%choice%"=="5" goto DOCS
if "%choice%"=="6" exit
goto MENU

:PRE_LAUNCH
cls
echo [SYSTEM] Resolving Port Conflicts (8080 ^& 5173)...

:: Use PowerShell for bulletproof process killing
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

timeout /t 2 > nul
goto LAUNCH

:LAUNCH
cls
echo [INFO] Launching Backend (Port 8080)...
start "BusTick_Backend" /D "%~dp0backend" cmd /k "set PATH=%MAVEN_HOME%\bin;%PATH% && mvn.cmd spring-boot:run"
echo [INFO] Waiting for Backend to initialize...
timeout /t 8 > nul
echo [INFO] Launching Frontend (Port 5173)...
start "BusTick_Frontend" /D "%~dp0frontend" cmd /k "npm.cmd run dev"
echo.
echo Dashboard: http://localhost:5173
echo API Docs:  http://localhost:8080/swagger-ui/index.html
echo.
pause
goto MENU

:REBUILD
cls
echo [SYSTEM] Starting Deep Clean Cycle...
cd backend && call mvn.cmd clean install -DskipTests
cd ..
cd frontend && call npm.cmd install
cd ..
echo [SUCCESS] Rebuild Complete.
pause
goto MENU

:HEALTH
cls
echo Checking Java...
java -version
echo.
echo Checking Maven...
call mvn -version
echo.
echo Checking Node...
node -v
echo.
echo Checking Ports...
netstat -ano | findstr :8080 && echo [ALERT] Port 8080 is BUSY || echo [OK] Port 8080 Available
netstat -ano | findstr :5173 && echo [ALERT] Port 5173 is BUSY || echo [OK] Port 5173 Available
pause
goto MENU

:DATABASE
start http://localhost:8080/h2-console
goto MENU

:DOCS
start http://localhost:8080/swagger-ui/index.html
goto MENU
