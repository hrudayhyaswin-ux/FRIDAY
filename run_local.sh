#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "============================================="
echo "      Starting FRIDAY Natively on macOS      "
echo "============================================="

# Ensure Docker containers are stopped first to free ports 8000 and 3000
echo "Stopping any active Docker containers..."
docker compose down 2>/dev/null

# Clean up background jobs on exit
cleanup() {
    echo -e "\n\nStopping local services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start backend natively
echo "Starting Backend API natively..."
cd "$SCRIPT_DIR/backend"
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
else
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
fi

python main.py &
BACKEND_PID=$!

# Start frontend natively
echo "Starting Frontend Dev Server..."
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Clear Next.js build cache to avoid 404 page caching
echo "Clearing Next.js build cache..."
rm -rf .next

npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait
