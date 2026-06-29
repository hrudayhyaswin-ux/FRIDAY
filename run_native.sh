#!/bin/bash
# Find project directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "================================================="
echo "      Starting FRIDAY Core (macOS Native Mode)    "
echo "================================================="

# Cleanup handler to kill background servers on exit
cleanup() {
    echo -e "\n\nStopping FRIDAY native services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "Services stopped. Ports cleared. Goodbye!"
    exit 0
}

# Trap exit signals
trap cleanup SIGINT SIGTERM

# 1. Start FastAPI Backend natively
echo "Launching FastAPI Backend (Port 8000)..."
cd "$SCRIPT_DIR/backend"
"$SCRIPT_DIR/backend/venv/bin/python3" main.py &
BACKEND_PID=$!

# 2. Start Next.js Frontend natively
echo "Launching Next.js Frontend (Port 3000)..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# Keep script running to listen for Ctrl+C
wait
