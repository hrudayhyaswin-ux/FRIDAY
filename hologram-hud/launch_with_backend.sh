#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "================================================="
echo "   Launching FRIDAY HUD & Backend Services       "
echo "================================================="

# Clean up background jobs on exit
cleanup() {
    echo -e "\n\nStopping all services..."
    kill $BACKEND_PID $HUD_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# 1. Start FastAPI Backend natively
echo "Starting FastAPI Backend on port 8000..."
cd "/Users/ksvhrudayhyaswin/Desktop/FRIDAY-AI/backend"
"/Users/ksvhrudayhyaswin/Desktop/FRIDAY-AI/backend/venv/bin/python3" main.py &
BACKEND_PID=$!

# Wait 2 seconds for backend to warm up
sleep 2

# 2. Start HUD web server on port 8080
echo "Starting Hologram HUD Web Server on port 8080..."
cd "$SCRIPT_DIR"
python3 -m http.server 8080 &
HUD_PID=$!

echo "================================================="
echo "All services running!"
echo "- Web HUD Console: http://localhost:8080"
echo "- Backend API: http://localhost:8000"
echo "- Press Ctrl+C to stop all services"
echo "================================================="

wait
