#!/bin/bash

# WSL2 and Docker Setup Verification Script
# Run this script from within WSL2 to verify your dev container setup

set -e

echo "=================================="
echo "WSL2 Dev Container Setup Verifier"
echo "=================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SUCCESS="${GREEN}✓${NC}"
FAILURE="${RED}✗${NC}"
WARNING="${YELLOW}⚠${NC}"

passed=0
failed=0
warnings=0

# Function to check a condition
check() {
    local description="$1"
    local command="$2"

    echo -n "Checking: $description... "

    if eval "$command" &> /dev/null; then
        echo -e "$SUCCESS"
        ((passed++))
        return 0
    else
        echo -e "$FAILURE"
        ((failed++))
        return 1
    fi
}

# Function for warnings
warn() {
    local description="$1"
    local command="$2"

    echo -n "Checking: $description... "

    if eval "$command" &> /dev/null; then
        echo -e "$SUCCESS"
        ((passed++))
        return 0
    else
        echo -e "$WARNING"
        ((warnings++))
        return 1
    fi
}

echo "1. WSL Environment Checks"
echo "-------------------------"

# Check if running in WSL2
if grep -qi microsoft /proc/version; then
    echo -e "$SUCCESS Running in WSL"
    ((passed++))

    # Check if it's WSL2 specifically
    if grep -qi "WSL2" /proc/version 2>/dev/null || [ -f /proc/sys/fs/binfmt_misc/WSLInterop ]; then
        echo -e "$SUCCESS Running WSL2 (not WSL1)"
        ((passed++))
    else
        echo -e "$WARNING Might be WSL1 - WSL2 is recommended"
        ((warnings++))
    fi
else
    echo -e "$FAILURE Not running in WSL"
    ((failed++))
fi

# Check filesystem location
current_path=$(pwd)
if [[ $current_path == /mnt/* ]]; then
    echo -e "$WARNING Project is in Windows filesystem (/mnt/c/...)"
    echo "         For best performance, move to WSL2 filesystem (~/ or /home/)"
    ((warnings++))
else
    echo -e "$SUCCESS Project is in WSL2 filesystem"
    ((passed++))
fi

echo ""
echo "2. Docker Availability"
echo "---------------------"

check "Docker command available" "command -v docker"
check "Docker daemon accessible" "docker info"
check "Docker can run containers" "docker run --rm hello-world"

# Check Docker version
if command -v docker &> /dev/null; then
    docker_version=$(docker --version | grep -oP '\d+\.\d+\.\d+' | head -n1)
    echo "  Docker version: $docker_version"
fi

echo ""
echo "3. Required Tools"
echo "----------------"

check "Git installed" "command -v git"
check "Node.js installed in container image" "docker run --rm mcr.microsoft.com/devcontainers/javascript-node:20 node --version"
check "NPM available in container image" "docker run --rm mcr.microsoft.com/devcontainers/javascript-node:20 npm --version"

echo ""
echo "4. Dev Container Configuration"
echo "------------------------------"

check ".devcontainer/devcontainer.json exists" "[ -f .devcontainer/devcontainer.json ]"
check "devcontainer.json is valid JSON" "cat .devcontainer/devcontainer.json | jq empty"

if [ -f .devcontainer/devcontainer.json ]; then
    # Check for recommended settings
    if grep -q '"--tty=false"' .devcontainer/devcontainer.json; then
        echo -e "$SUCCESS devcontainer.json has --tty=false configured"
        ((passed++))
    else
        echo -e "$WARNING devcontainer.json missing --tty=false (may cause TTY errors)"
        ((warnings++))
    fi

    if grep -q 'consistency=cached' .devcontainer/devcontainer.json; then
        echo -e "$SUCCESS Volume mounts use consistency=cached for performance"
        ((passed++))
    else
        echo -e "$WARNING Volume mounts don't use consistency=cached (performance may suffer)"
        ((warnings++))
    fi
fi

echo ""
echo "5. Claude Configuration"
echo "----------------------"

warn "Claude config directory exists" "[ -d ~/.claude ]"

if [ ! -d ~/.claude ]; then
    echo "  Note: Create with: mkdir -p ~/.claude"
fi

# Check if Windows Claude config exists
if [ -d /mnt/c/Users/*/. claude ]; then
    windows_claude_path=$(find /mnt/c/Users/*/. claude -type d 2>/dev/null | head -n1)
    if [ -n "$windows_claude_path" ]; then
        echo "  Windows Claude config found at: $windows_claude_path"
        echo "  You can copy it with: cp -r $windows_claude_path/* ~/.claude/"
    fi
fi

echo ""
echo "6. Network Configuration"
echo "-----------------------"

check "Can reach Docker Hub" "timeout 5 curl -s https://hub.docker.com > /dev/null"
check "Can reach GitHub" "timeout 5 curl -s https://github.com > /dev/null"

echo ""
echo "=================================="
echo "Summary"
echo "=================================="
echo -e "Passed:   ${GREEN}$passed${NC}"
echo -e "Failed:   ${RED}$failed${NC}"
echo -e "Warnings: ${YELLOW}$warnings${NC}"
echo ""

if [ $failed -eq 0 ] && [ $warnings -eq 0 ]; then
    echo -e "${GREEN}All checks passed! Your dev container setup is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Open this project in Zed"
    echo "2. Accept the 'Open in Container' prompt"
    echo "3. Wait for container to build and npm install to complete"
    exit 0
elif [ $failed -eq 0 ]; then
    echo -e "${YELLOW}Setup is functional but has warnings.${NC}"
    echo "Review warnings above for optimization opportunities."
    echo ""
    echo "You can still proceed with dev container usage."
    exit 0
else
    echo -e "${RED}Setup has issues that need to be resolved.${NC}"
    echo ""
    echo "Common fixes:"
    echo "1. Make sure Docker Desktop is running"
    echo "2. Enable WSL2 integration in Docker Desktop settings"
    echo "3. Restart Docker Desktop"
    echo "4. Run: wsl --set-default-version 2"
    echo ""
    echo "See WSL2_SETUP.md for detailed instructions."
    exit 1
fi
