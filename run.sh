#!/bin/bash
# Find project directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "============================================="
echo "      Starting FRIDAY inside Docker          "
echo "============================================="

# Cleanup handler to spin down containers when Ctrl+C is pressed
cleanup() {
    echo -e "\n\nStopping FRIDAY Docker Containers..."
    docker compose down
    echo "Containers stopped. Ports cleared. Goodbye!"
    exit 0
}

# Trap exit signals
trap cleanup SIGINT SIGTERM

# Build and start docker services
cd "$SCRIPT_DIR"
docker compose up --build

