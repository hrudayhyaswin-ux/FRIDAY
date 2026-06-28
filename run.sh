#!/bin/bash
# Find project directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "============================================="
echo "      Starting FRIDAY Local Services         "
echo "============================================="

# Cleanup handler to kill background servers when Ctrl+C is pressed
cleanup() {
    echo -e "\n\nStopping FRIDAY servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "Ports 3000 & 8000 cleared. Goodbye!"
    exit 0
}

# Trap exit signals
trap cleanup SIGINT SIGTERM

# 1. Start Backend
echo "--> Launching local backend on port 8000..."
cd "$SCRIPT_DIR/backend"
source venv/bin/activate
python3 main.py > /dev/null 2>&1 &
BACKEND_PID=$!

# 2. Start Frontend
echo "--> Launching local frontend on port 3000..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# Print status links
echo ""
echo "✔ FRIDAY is running!"
echo "   - Web UI:  http://localhost:3000"
echo "   - Backend: http://localhost:8000"
echo "Press CTRL+C in this terminal to shut down both servers cleanly."
echo "============================================="

# Keep script running to listen for Ctrl+C
wait $BACKEND_PID $FRONTEND_PID
