@echo off
REM Windows Setup Check for WSL2 Dev Containers
REM Run this from Windows Command Prompt or PowerShell

echo ============================================
echo WSL2 Dev Container Setup Check (Windows)
echo ============================================
echo.

set PASSED=0
set FAILED=0

REM Check WSL installation
echo [1/6] Checking WSL installation...
wsl --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] WSL is installed
    set /a PASSED+=1
) else (
    echo [FAIL] WSL is not installed
    echo       Run: wsl --install
    set /a FAILED+=1
)

REM Check WSL2 is default
echo.
echo [2/6] Checking WSL version...
wsl -l -v | findstr "2" >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] WSL2 is available
    set /a PASSED+=1
) else (
    echo [WARN] WSL2 might not be set as default
    echo       Run: wsl --set-default-version 2
)

REM Check if Linux distribution is installed
echo.
echo [3/6] Checking Linux distribution...
wsl -l >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Linux distribution is installed
    wsl -l
    set /a PASSED+=1
) else (
    echo [FAIL] No Linux distribution found
    echo       Run: wsl --install -d Ubuntu-22.04
    set /a FAILED+=1
)

REM Check Docker Desktop
echo.
echo [4/6] Checking Docker Desktop...
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Docker is installed
    docker --version
    set /a PASSED+=1
) else (
    echo [FAIL] Docker is not installed
    echo       Download from: https://www.docker.com/products/docker-desktop
    set /a FAILED+=1
)

REM Check if Docker daemon is running
echo.
echo [5/6] Checking Docker daemon...
docker ps >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Docker daemon is running
    set /a PASSED+=1
) else (
    echo [FAIL] Docker daemon is not running
    echo       Start Docker Desktop
    set /a FAILED+=1
)

REM Check if Docker works in WSL
echo.
echo [6/6] Checking Docker in WSL...
wsl docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Docker is accessible from WSL
    set /a PASSED+=1
) else (
    echo [FAIL] Docker is not accessible from WSL
    echo       Enable WSL integration in Docker Desktop:
    echo       Settings -^> Resources -^> WSL Integration
    set /a FAILED+=1
)

echo.
echo ============================================
echo Summary
echo ============================================
echo Passed: %PASSED%
echo Failed: %FAILED%
echo.

if %FAILED% equ 0 (
    echo [SUCCESS] Your Windows system is ready for WSL2 dev containers!
    echo.
    echo Next steps:
    echo 1. Open Ubuntu terminal from Start Menu
    echo 2. Run: mkdir -p ~/workspace ^&^& cd ~/workspace
    echo 3. Clone your repository: git clone ^<repo-url^> policy-analyzer
    echo 4. Navigate to project in Windows: \\wsl$\Ubuntu-22.04\home\^<username^>\workspace\policy-analyzer
    echo 5. Open the folder in Zed
    echo.
    echo To verify everything in WSL2, run:
    echo    wsl bash -c "cd ~/workspace/policy-analyzer ^&^& ./.devcontainer/verify-setup.sh"
) else (
    echo [ACTION REQUIRED] Please fix the failed checks above.
    echo.
    echo Quick fixes:
    echo - Install WSL: wsl --install
    echo - Install Docker Desktop: https://www.docker.com/products/docker-desktop
    echo - Enable WSL2 backend in Docker Desktop Settings
    echo - Enable WSL integration for your Linux distribution
    echo.
    echo See .devcontainer\WSL2_SETUP.md for detailed instructions
)

echo.
echo For detailed setup instructions, see:
echo   .devcontainer\QUICK_START.md     - Quick 3-step setup
echo   .devcontainer\WSL2_SETUP.md      - Comprehensive guide
echo   .devcontainer\README.md          - Complete documentation
echo.

pause
