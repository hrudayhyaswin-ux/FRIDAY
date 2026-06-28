#!/usr/bin/env python3
import os
import sys
import sqlite3
import argparse
from ollama import Client
import psutil

# Add backend directory to path to make import paths resolve if run from root
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

# Colors for terminal styling
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
MAGENTA = "\033[95m"
BOLD = "\033[1m"
RESET = "\033[0m"

DB_PATH = os.path.join(os.path.dirname(__file__), "backend", "friday_memory.db")
OLLAMA_HOST = "http://localhost:11434"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def print_memory():
    """Reads memories from SQLite database."""
    print(f"\n{MAGENTA}{BOLD}--- PERSISTENT SQLITE MEMORIES ---{RESET}")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM user_memory")
        rows = cursor.fetchall()
        conn.close()
        
        if rows:
            for row in rows:
                print(f"  {CYAN}{row['key']}{RESET} -> {row['value']}")
        else:
            print("  No memory facts recorded yet.")
    except Exception as e:
        print(f"  {RED}Error reading SQLite database: {e}{RESET}")
    print()

def get_system_stats():
    """Fetch system statistics."""
    cpu_usage = psutil.cpu_percent(interval=0.1)
    mem_usage = psutil.virtual_memory().percent
    disk_usage = psutil.disk_usage("/").percent
    print(f"\n{YELLOW}{BOLD}--- HOST SYSTEM METRICS ---{RESET}")
    print(f"  CPU Load: {cpu_usage}%")
    print(f"  Memory Load: {mem_usage}%")
    print(f"  Disk Storage: {disk_usage}%")
    print()

def take_screenshot():
    """Takes a macOS screenshot."""
    import datetime
    desktop_path = os.path.expanduser("~/Desktop")
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_at_%H.%M.%S")
    filepath = os.path.join(desktop_path, f"FRIDAY_CLI_Screenshot_{timestamp}.png")
    try:
        import subprocess
        subprocess.run(["screencapture", filepath], check=True)
        print(f"\n{GREEN}✔ Screenshot captured and saved to Desktop.{RESET}\n")
    except Exception as e:
        print(f"\n{RED}✘ Screenshot failed: {e}{RESET}\n")

def set_volume(val: str):
    """Sets macOS volume."""
    try:
        vol = max(0, min(100, int(val)))
        import subprocess
        subprocess.run(["osascript", "-e", f"set volume output volume {vol}"], check=True)
        print(f"\n{GREEN}✔ macOS Volume set to {vol}%{RESET}\n")
    except Exception as e:
        print(f"\n{RED}✘ Failed to set volume: {e}{RESET}\n")

def run_cli_chat():
    """Main REPL chat loop."""
    print(f"""
{CYAN}{BOLD}====================================================
           FRIDAY OFFLINE CLI TERMINAL
===================================================={RESET}
Type {BOLD}/help{RESET} for system automation commands.
Type {BOLD}/exit{RESET} to exit.
""")

    # Check Ollama connection
    client = Client(host=OLLAMA_HOST)
    try:
        models = client.list()
        available_models = [m.model for m in models.models]
        if not available_models:
            print(f"{YELLOW}⚠️ No local Ollama models found. Please run 'ollama pull phi3'.{RESET}")
            model = "phi3"
        else:
            model = available_models[0]
            print(f"{GREEN}✔ Connected to Ollama. Using active model: {BOLD}{model}{RESET}")
    except Exception:
        print(f"{RED}✘ Ollama is offline. Make sure the Ollama application is running locally.{RESET}")
        sys.exit(1)

    messages = []
    
    # Load initial system prompt with database context
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM user_memory")
        rows = cursor.fetchall()
        conn.close()
        if rows:
            memory_rules = "\n".join([f"- {r['key']}: {r['value']}" for r in rows])
            system_prompt = f"You are FRIDAY, a local command line AI assistant. Here is facts you know about the user:\n{memory_rules}\nAnswer concisely."
            messages.append({"role": "system", "content": system_prompt})
    except Exception:
        messages.append({"role": "system", "content": "You are FRIDAY, a local command line AI assistant."})

    while True:
        try:
            user_input = input(f"\n{CYAN}{BOLD}FRIDAY ❯{RESET} ").strip()
            if not user_input:
                continue

            # Command Routing
            if user_input.startswith("/"):
                cmd_parts = user_input.split()
                cmd = cmd_parts[0].lower()
                
                if cmd == "/exit":
                    print(f"{CYAN}Shutting down FRIDAY CLI. Goodbye!{RESET}")
                    break
                elif cmd == "/help":
                    print(f"""
{BOLD}Available Commands:{RESET}
  {BOLD}/memory{RESET}     - Display SQLite stored user facts
  {BOLD}/stats{RESET}      - Read CPU, memory, and disk load metrics
  {BOLD}/screenshot{RESET} - Take a macOS screenshot
  {BOLD}/volume <v>{RESET} - Adjust system volume level (0-100)
  {BOLD}/exit{RESET}       - Exit the program
""")
                elif cmd == "/memory":
                    print_memory()
                elif cmd == "/stats":
                    get_system_stats()
                elif cmd == "/screenshot":
                    take_screenshot()
                elif cmd == "/volume":
                    if len(cmd_parts) < 2:
                        print(f"{RED}Usage: /volume <0-100>{RESET}")
                    else:
                        set_volume(cmd_parts[1])
                else:
                    print(f"{RED}Unknown command. Type /help to see options.{RESET}")
                continue

            # Regular LLM chat
            messages.append({"role": "user", "content": user_input})
            
            print(f"\n{GREEN}{BOLD}FRIDAY:{RESET} ", end="", flush=True)
            
            # Stream response
            stream = client.chat(model=model, messages=messages, stream=True)
            response_content = ""
            for chunk in stream:
                text = chunk["message"]["content"]
                print(text, end="", flush=True)
                response_content += text
            print()
            
            messages.append({"role": "assistant", "content": response_content})
            
        except KeyboardInterrupt:
            print(f"\n{CYAN}Goodbye!{RESET}")
            break
        except Exception as e:
            print(f"\n{RED}Error: {e}{RESET}")

if __name__ == "__main__":
    run_cli_chat()
