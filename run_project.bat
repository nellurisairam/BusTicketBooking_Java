@echo off
setlocal enabledelayedexpansion

:: ##################################################
:: #      BusTick Pro: Presentation Command         #
:: ##################################################
:: # Version: 2.8.0 Elite                           #
:: # Goal: Zero-Config Deployment for Presentations #
:: ##################################################

title BusTick Pro - Administrative Terminal
color 0B

:MENU
cls
echo.
echo  ##################################################
echo  #      BusTick Pro: Management Terminal        #
echo  ##################################################
echo  # [1] Launch Full Stack System (Elite Mode)     #
echo  # [2] Update Dependencies (NPM + Maven)        #
echo  # [3] Run Health Check (Neural Diagnostic)     #
echo  # [4] Check System Versions (Environment)      #
echo  # [5] Database Console (H2 Dashboard)          #
echo  # [6] Prepare Presentation (Pro Build)         #
echo  # [7] Exit                                     #
echo  ##################################################
echo.
set /p selection="Enter Selection [1-7]: "

if "%selection%"=="1" goto LAUNCH
if "%selection%"=="2" goto UPDATE
if "%selection%"=="3" goto HEALTH
if "%selection%"=="4" goto VERSIONS
if "%selection%"=="5" goto DATABASE
if "%selection%"=="6" goto BUILD
if "%selection%"=="7" exit
goto MENU

:LAUNCH
cls
echo Launching Neural Handshake...
:: Local Maven Injection
set MAVEN_HOME=%~dp0bin\apache-maven-3.9.6
set PATH=%MAVEN_HOME%\bin;%PATH%

start /b cmd /c "cd backend && mvn spring-boot:run"
start /b cmd /c "cd frontend && npm run dev"
echo.
echo Terminal Activated! 
echo Frontend: http://localhost:5173
echo Backend: http://localhost:8080
echo.
pause
goto MENU

:UPDATE
cls
echo Re-initializing Fleet Dependencies...
cd frontend && call npm install
cd ..
set MAVEN_HOME=%~dp0bin\apache-maven-3.9.6
set PATH=%MAVEN_HOME%\bin;%PATH%
cd backend && call mvn clean install
cd ..
echo Done.
pause
goto MENU

:HEALTH
cls
echo Running Neural Diagnostic...
set MAVEN_HOME=%~dp0bin\apache-maven-3.9.6
set PATH=%MAVEN_HOME%\bin;%PATH%
mvn -version > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Maven not detected in local /bin folder!
) else (
    echo [SUCCESS] Maven Runtime: OK
)
netstat -ano | findstr :8080 > nul
if %errorlevel% equ 0 (
    echo [WARNING] Port 8080 occupied! Potential conflict.
) else (
    echo [SUCCESS] Backend Port 8080: VACANT
)
pause
goto MENU

:VERSIONS
cls
echo Scanning Environment...
node -v
npm -v
mvn -v
pause
goto MENU

:DATABASE
cls
echo Launching H2 Management Console...
echo URL: jdbc:h2:mem:bustickdb
echo User: sa | Password: [empty]
start http://localhost:8080/h2-console
pause
goto MENU

:BUILD
cls
echo Compiling High-Resolution Production Binary...
cd frontend && call npm run build
cd ..
echo.
echo [SUCCESS] Frontend Build artifacts generated.
pause
goto MENU
