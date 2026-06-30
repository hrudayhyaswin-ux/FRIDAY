#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "================================================="
echo "     Launching FRIDAY Holographic HUD Server     "
echo "================================================="
echo "- URL: http://localhost:8080"
echo "- Press Ctrl+C to terminate the server"
echo "================================================="

python3 -m http.server 8080
