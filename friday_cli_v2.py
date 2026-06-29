#!/usr/bin/env python3
import os
import sys
import time
import sqlite3
import psutil
import subprocess
import threading
import shutil
from ollama import Client

# Add backend directory to path to make import paths resolve if run from root
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

# Colors for terminal styling
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
PURPLE = "\033[95m"
BLUE = "\033[94m"
BOLD = "\033[1m"
RESET = "\033[0m"

DB_PATH = os.path.join(os.path.dirname(__file__), "backend", "friday_memory.db")
OLLAMA_HOST = "http://localhost:11434"

# Global state
voice_enabled = True

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def print_typewriter(text, delay=0.005, color=CYAN, bold=False):
    """Simulate a holographic typewriter print effect."""
    style = BOLD if bold else ""
    sys.stdout.write(color + style)
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    sys.stdout.write(RESET)

def speak_out_loud(text):
    """Call macOS native 'say' command to speak responses asynchronously."""
    global voice_enabled
    if not voice_enabled:
        return
    
    # Strip basic markdown or symbols that might sound weird
    clean_text = text.replace("*", "").replace("`", "").replace("#", "")
    
    def _speak():
        try:
            # Using 'Daniel' or 'Alex' voice (Alex is standard high-quality, Daniel is British/Jarvis-like if installed, defaults to standard)
            subprocess.run(["say", "-v", "Daniel", clean_text], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            try:
                subprocess.run(["say", clean_text], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except Exception:
                pass

    threading.Thread(target=_speak, daemon=True).start()

def draw_progress_bar(label, percent, color=CYAN):
    """Draw a futuristic text-based progress bar."""
    width = 30
    filled = int(width * percent / 100)
    bar = "█" * filled + "░" * (width - filled)
    print(f"  {color}{label:<12}{RESET} ▕{color}{bar}{RESET}▏ {percent:>3}%")

def print_jarvis_logo():
    """Print a massive futuristic ASCII logo."""
    logo = f"""
{CYAN}{BOLD} ______  ______  _____ ______   ___  __   __
|  ____||  ___ \|_   _|      \\ / _ \\ \\ \\ / /
| |__   | |_/ /   | | | |  | |/ /_\\ \\ \\ V / 
|  __|  |  _  /   | | | |  | ||  _  |  \\ /  
| |     | | \\ \\  _| |_| |__| || | | |  | |  
|_|     \\_|  \\_\\|_____|______/\\_| |_/  \\_/  
                                                
         [ SYSTEM INTEGRITY: SECURE-STANDBY ]
{RESET}"""
    print(logo)

def run_telemetry_check():
    """Simulate a futuristic boot-up diagnostic checks sequence."""
    checks = [
        ("LINKING SQLITE DATABASE", "CONNECTING FACT DATABASE"),
        ("BOOTING TEXT-TO-SPEECH CORE", "LINKING macOS SYNTHESIS"),
        ("MAPPING PLUGINS SCHEMAS", "MAPPING VOLUME/SCREEN CONTROL"),
        ("RESOLVING HOST CPU CORES", "SYSTEM STATUS CHECKS"),
    ]
    
    print(f"{BLUE}--- BOOT DIAGNOSTICS ACTIVE ---{RESET}")
    for title, desc in checks:
        print(f"  [ {YELLOW}WAIT{RESET} ] {title:<30} ... ", end="", flush=True)
        time.sleep(0.4)
        print(f"[{GREEN} OK {RESET}] ({desc})")
    print()

def print_memory():
    """Display SQLite memories."""
    print(f"\n{PURPLE}{BOLD}--- FRIDAY CORE KNOWLEDGE FACT REGISTERS ---{RESET}")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM user_memory")
        rows = cursor.fetchall()
        conn.close()
        
        if rows:
            for row in rows:
                print(f"  » {CYAN}{row['key']:<15}{RESET} : {row['value']}")
        else:
            print(f"  {YELLOW}Register cache index is empty.{RESET}")
    except Exception as e:
        print(f"  {RED}Database index read failure: {e}{RESET}")
    print()

def get_system_stats():
    """Fetch system statistics with progress bars."""
    cpu_usage = psutil.cpu_percent(interval=0.1)
    mem_usage = psutil.virtual_memory().percent
    disk_usage = psutil.disk_usage("/").percent
    
    print(f"\n{YELLOW}{BOLD}--- FRIDAY SYSTEM LOAD MATRIX ---{RESET}")
    draw_progress_bar("CPU LOAD", cpu_usage, CYAN)
    draw_progress_bar("RAM USAGE", mem_usage, PURPLE)
    draw_progress_bar("DISK STORAGE", disk_usage, BLUE)
    print()

def take_screenshot():
    """Captures macOS screen."""
    import datetime
    desktop_path = os.path.expanduser("~/Desktop")
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_at_%H.%M.%S")
    filepath = os.path.join(desktop_path, f"FRIDAY_Screenshot_{timestamp}.png")
    try:
        subprocess.run(["screencapture", filepath], check=True)
        print_typewriter(f"\n✔ Display output mapped. Captured frame saved to: {filepath}\n", color=GREEN)
    except Exception as e:
        print_typewriter(f"\n✘ Screen capture service failure: {e}\n", color=RED)

def set_volume(val: str):
    """Sets macOS volume."""
    try:
        vol = max(0, min(100, int(val)))
        subprocess.run(["osascript", "-e", f"set volume output volume {vol}"], check=True)
        print_typewriter(f"\n✔ Audio amplifier set to: {vol}%\n", color=GREEN)
        speak_out_loud(f"System volume adjusted to {vol} percent.")
    except Exception as e:
        print_typewriter(f"\n✘ Volume command rejected: {e}\n", color=RED)

def list_running_apps():
    """List host user processes."""
    print(f"\n{CYAN}{BOLD}--- ACTIVE HOST USER PROCESSES ---{RESET}")
    apps = set()
    for proc in psutil.process_iter(['name']):
        try:
            name = proc.info['name']
            if name and ".app" in name or name in ["Safari", "Chrome", "Finder", "Terminal", "Xcode", "Ollama"]:
                apps.add(name)
        except Exception:
            pass
    if apps:
        for app in sorted(list(apps))[:15]:
            print(f"  • {app}")
    else:
        print("  No major active gui processes detected.")
    print()

def spinner_sequence(stop_event):
    """Futuristic spinner to run while waiting for Ollama."""
    spinners = ["◢", "◣", "◤", "◥"]
    idx = 0
    while not stop_event.is_set():
        sys.stdout.write(f"\r{YELLOW}{BOLD}[THINKING] {spinners[idx % 4]}{RESET} Running neural pipeline inference...")
        sys.stdout.flush()
        idx += 1
        time.sleep(0.1)
    # Clear line when done
    sys.stdout.write("\r" + " " * 60 + "\r")
    sys.stdout.flush()

def run_jarvis_repl():
    """Core REPL Chat loop."""
    global voice_enabled
    
    print_jarvis_logo()
    run_telemetry_check()
    
    # Check Ollama connection
    client = Client(host=OLLAMA_HOST)
    try:
        models = client.list()
        available_models = [m.model for m in models.models]
        if not available_models:
            print(f"{YELLOW}⚠️  No local Ollama models found. Defaulting to 'phi3'.{RESET}")
            model = "phi3"
        else:
            model = available_models[0]
            print(f"{GREEN}✔ Core connection established. Primary model: {BOLD}{model}{RESET}")
    except Exception:
        print(f"{RED}✘ Local Ollama server offline. Please start Ollama client app.{RESET}")
        sys.exit(1)

    print(f"\nType {BOLD}/help{RESET} for futuristic telemetry tools.")
    print(f"Type {BOLD}/exit{RESET} to shut down core mainframe.\n")
    
    speak_out_loud("Friday mainframe successfully online, sir.")
    
    messages = []
    
    # Populate memory context rules
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM user_memory")
        rows = cursor.fetchall()
        conn.close()
        if rows:
            memory_rules = "\n".join([f"- {r['key']}: {r['value']}" for r in rows])
            system_prompt = (
                f"You are F.R.I.D.A.Y., a witty, helpful AI modeled after the assistant from Iron Man. "
                f"You speak to your creator who you refer to as 'sir'. "
                f"Here are details you know about the user:\n{memory_rules}\n"
                f"Provide concise, highly intelligent, and futuristic answers."
            )
            messages.append({"role": "system", "content": system_prompt})
    except Exception:
        messages.append({"role": "system", "content": "You are F.R.I.D.A.Y., a witty AI assistant modeled after the assistant from Iron Man. Call the user 'sir'."})

    while True:
        try:
            # Dynamic futuristic CLI Prompt showing telemetry
            cpu = psutil.cpu_percent()
            mem = psutil.virtual_memory().percent
            prompt_str = f"{BLUE}[CPU:{cpu}%|RAM:{mem}%] {CYAN}{BOLD}FRIDAY-V2 ❯{RESET} "
            
            user_input = input(prompt_str).strip()
            if not user_input:
                continue

            # Command Router
            if user_input.startswith("/"):
                cmd_parts = user_input.split()
                cmd = cmd_parts[0].lower()
                
                if cmd == "/exit":
                    print_typewriter("purging neural buffers... F.R.I.D.A.Y. core offline. Goodbye, sir.\n", color=BLUE)
                    speak_out_loud("Goodbye, sir. Purging registers.")
                    time.sleep(1.0)
                    break
                elif cmd == "/help":
                    print(f"""
{BOLD}FRIDAY Command Directory:{RESET}
  {BOLD}/stats{RESET}      - View CPU, Memory and Disk telemetry meters
  {BOLD}/memory{RESET}     - Print offline SQLite associations
  {BOLD}/screenshot{RESET} - Snaps active displays
  {BOLD}/volume <v>{RESET} - Adjust audio gain levels (0-100)
  {BOLD}/apps{RESET}       - Inspect running host GUI processes
  {BOLD}/voice{RESET}      - Toggle vocal response feedback (on/off)
  {BOLD}/exit{RESET}       - Purges session buffers and exits
""")
                elif cmd == "/stats":
                    get_system_stats()
                elif cmd == "/memory":
                    print_memory()
                elif cmd == "/screenshot":
                    take_screenshot()
                elif cmd == "/apps":
                    list_running_apps()
                elif cmd == "/volume":
                    if len(cmd_parts) < 2:
                        print(f"{RED}Usage: /volume <0-100>{RESET}")
                    else:
                        set_volume(cmd_parts[1])
                elif cmd == "/voice":
                    voice_enabled = not voice_enabled
                    state = "ENABLED" if voice_enabled else "MUTED"
                    print_typewriter(f"Vocal response feedback set to: {state}\n", color=YELLOW)
                    if voice_enabled:
                        speak_out_loud("Voice output active.")
                else:
                    print(f"{RED}Unrecognized command. Type /help for assistance.{RESET}")
                continue

            # LLM Chat pipeline
            messages.append({"role": "user", "content": user_input})
            
            # Start asynchronous thinking spinner
            stop_spinner = threading.Event()
            spinner_thread = threading.Thread(target=spinner_sequence, args=(stop_spinner,))
            spinner_thread.start()
            
            try:
                # Query Ollama
                response = client.chat(model=model, messages=messages)
                response_content = response["message"]["content"]
            finally:
                # Always kill spinner
                stop_spinner.set()
                spinner_thread.join()

            # Print results with animated typewriter
            print(f"\n{BLUE}{BOLD}F.R.I.D.A.Y.:{RESET} ", end="")
            print_typewriter(response_content, delay=0.006, color=CYAN)
            print()
            
            # Asynchronously speak response
            speak_out_loud(response_content)
            
            messages.append({"role": "assistant", "content": response_content})
            
        except KeyboardInterrupt:
            print_typewriter("\nMainframe interrupted. F.R.I.D.A.Y. core offline.\n", color=BLUE)
            break
        except Exception as e:
            print(f"\n{RED}Mainframe Pipeline Error: {e}{RESET}")

def run_friday_repl():
    """Core REPL Chat loop."""
    global voice_enabled
    
    print_jarvis_logo()
    run_telemetry_check()
    
    # Check Ollama connection
    client = Client(host=OLLAMA_HOST)
    try:
        models = client.list()
        available_models = [m.model for m in models.models]
        if not available_models:
            print(f"{YELLOW}⚠️  No local Ollama models found. Defaulting to 'phi3'.{RESET}")
            model = "phi3"
        else:
            model = available_models[0]
            print(f"{GREEN}✔ Core connection established. Primary model: {BOLD}{model}{RESET}")
    except Exception:
        print(f"{RED}✘ Local Ollama server offline. Please start Ollama client app.{RESET}")
        sys.exit(1)

    print(f"\nType {BOLD}/help{RESET} for futuristic telemetry tools.")
    print(f"Type {BOLD}/exit{RESET} to shut down core mainframe.\n")
    
    speak_out_loud("Friday mainframe successfully online, sir.")
    
    messages = []
    
    # Populate memory context rules
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM user_memory")
        rows = cursor.fetchall()
        conn.close()
        if rows:
            memory_rules = "\n".join([f"- {r['key']}: {r['value']}" for r in rows])
            system_prompt = (
                f"You are F.R.I.D.A.Y., a witty, helpful AI modeled after the assistant from Iron Man. "
                f"You speak to your creator who you refer to as 'sir'. "
                f"Here are details you know about the user:\n{memory_rules}\n"
                f"Provide concise, highly intelligent, and futuristic answers."
            )
            messages.append({"role": "system", "content": system_prompt})
    except Exception:
        messages.append({"role": "system", "content": "You are F.R.I.D.A.Y., a witty AI assistant modeled after the assistant from Iron Man. Call the user 'sir'."})

    while True:
        try:
            # Dynamic futuristic CLI Prompt showing telemetry
            cpu = psutil.cpu_percent()
            mem = psutil.virtual_memory().percent
            prompt_str = f"{BLUE}[CPU:{cpu}%|RAM:{mem}%] {CYAN}{BOLD}FRIDAY-V2 ❯{RESET} "
            
            user_input = input(prompt_str).strip()
            if not user_input:
                continue

            # Command Router
            if user_input.startswith("/"):
                cmd_parts = user_input.split()
                cmd = cmd_parts[0].lower()
                
                if cmd == "/exit":
                    print_typewriter("purging neural buffers... F.R.I.D.A.Y. core offline. Goodbye, sir.\n", color=BLUE)
                    speak_out_loud("Goodbye, sir. Purging registers.")
                    time.sleep(1.0)
                    break
                elif cmd == "/help":
                    print(f"""
{BOLD}FRIDAY Command Directory:{RESET}
  {BOLD}/stats{RESET}      - View CPU, Memory and Disk telemetry meters
  {BOLD}/memory{RESET}     - Print offline SQLite associations
  {BOLD}/screenshot{RESET} - Snaps active displays
  {BOLD}/volume <v>{RESET} - Adjust audio gain levels (0-100)
  {BOLD}/apps{RESET}       - Inspect running host GUI processes
  {BOLD}/voice{RESET}      - Toggle vocal response feedback (on/off)
  {BOLD}/exit{RESET}       - Purges session buffers and exits
""")
                elif cmd == "/stats":
                    get_system_stats()
                elif cmd == "/memory":
                    print_memory()
                elif cmd == "/screenshot":
                    take_screenshot()
                elif cmd == "/apps":
                    list_running_apps()
                elif cmd == "/volume":
                    if len(cmd_parts) < 2:
                        print(f"{RED}Usage: /volume <0-100>{RESET}")
                    else:
                        set_volume(cmd_parts[1])
                elif cmd == "/voice":
                    voice_enabled = not voice_enabled
                    state = "ENABLED" if voice_enabled else "MUTED"
                    print_typewriter(f"Vocal response feedback set to: {state}\n", color=YELLOW)
                    if voice_enabled:
                        speak_out_loud("Voice output active.")
                else:
                    print(f"{RED}Unrecognized command. Type /help for assistance.{RESET}")
                continue

            # LLM Chat pipeline
            messages.append({"role": "user", "content": user_input})
            
            # Start asynchronous thinking spinner
            stop_spinner = threading.Event()
            spinner_thread = threading.Thread(target=spinner_sequence, args=(stop_spinner,))
            spinner_thread.start()
            
            try:
                # Query Ollama
                response = client.chat(model=model, messages=messages)
                response_content = response["message"]["content"]
            finally:
                # Always kill spinner
                stop_spinner.set()
                spinner_thread.join()

            # Print results with animated typewriter
            print(f"\n{BLUE}{BOLD}F.R.I.D.A.Y.:{RESET} ", end="")
            print_typewriter(response_content, delay=0.006, color=CYAN)
            print()
            
            # Asynchronously speak response
            speak_out_loud(response_content)
            
            messages.append({"role": "assistant", "content": response_content})
            
        except KeyboardInterrupt:
            print_typewriter("\nMainframe interrupted. F.R.I.D.A.Y. core offline.\n", color=BLUE)
            break
        except Exception as e:
            print(f"\n{RED}Mainframe Pipeline Error: {e}{RESET}")

if __name__ == "__main__":
    run_friday_repl()
