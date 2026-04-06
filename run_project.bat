@echo off
setlocal enabledelayedexpansion

:: ##################################################
:: #      BusTick Pro: Enterprise Edition            #
:: ##################################################
:: # Version: 3.0.0 Pro                             #
:: # Goal: Enterprise Stable Architecture            #
:: ##################################################

title BusTick Pro - Administrative Terminal
color 0B

:: Environment Injection
set MAVEN_HOME=%~dp0bin\apache-maven-3.9.6
set PATH=%MAVEN_HOME%\bin;%PATH%

:MENU
cls
echo.
echo  ##################################################
echo  #      BusTick Pro: Management Terminal        #
echo  ##################################################
echo  # [1] Launch System (Spring Boot + React)        #
echo  # [2] Full Clean Rebuild (Clear Cache + Build)   #
echo  # [3] Update Dependencies (NPM + Maven)         #
echo  # [4] Running Diagnostic Neural Check           #
echo  # [5] Database Console (H2 Dashboard)           #
echo  # [6] Prepare Presentation (Pro Build)          #
echo  # [7] Exit                                      #
echo  ##################################################
echo.
set /p selection="Enter Selection [1-7]: "

if "%selection%"=="1" goto LAUNCH
if "%selection%"=="2" goto REBUILD
if "%selection%"=="3" goto UPDATE
if "%selection%"=="4" goto HEALTH
if "%selection%"=="5" goto DATABASE
if "%selection%"=="6" goto BUILD
if "%selection%"=="7" exit
goto MENU

:LAUNCH
cls
echo [INFO] Launching Neural Handshake...
start "BusTick Backend" /D "%~dp0backend" cmd /c "mvn spring-boot:run"
start "BusTick Frontend" /D "%~dp0frontend" cmd /c "npm run dev"
echo.
echo Terminal Activated! 
echo Dashboard: http://localhost:5173
echo API Docs: http://localhost:8080/swagger-ui/index.html
echo.
echo Press any key to return to menu...
pause > nul
goto MENU

:REBUILD
cls
echo [SYSTEM] Initiating Full Clean Rebuild...
echo Step 1: Cleaning Backend Artifacts...
cd backend && call mvn clean install -DskipTests
cd ..
echo Step 2: Refreshing Frontend Nodes...
cd frontend && call npm install
cd ..
echo [SUCCESS] Rebuild complete. 
pause
goto MENU

:UPDATE
cls
echo Re-initializing Fleet Dependencies...
cd frontend && call npm install
cd ..
cd backend && call mvn dependency:resolve
cd ..
echo Done.
pause
goto MENU

:HEALTH
cls
echo Running Neural Diagnostic...
java -version
if %errorlevel% neq 0 (
    echo [CRITICAL ERROR] Java Runtime NOT detected!
) else (
    echo [SUCCESS] Java Runtime: OK
)
call mvn -version > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Maven not detected in local /bin folder!
) else (
    echo [SUCCESS] Maven Runtime: OK
)
echo Checking Ports...
netstat -ano | findstr :8080 > nul
if %errorlevel% equ 0 (
    echo [WARNING] Port 8080 occupied! Potential conflict.
)
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
