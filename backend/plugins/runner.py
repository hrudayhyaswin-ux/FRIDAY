import datetime
import logging
import os
import subprocess

import psutil

logger = logging.getLogger(__name__)


def execute_plugin(action: str, params: dict) -> dict:
    """Executes a system control action and returns the output status."""
    try:
        if action == "volume":
            value = params.get("value", "50")
            # Enforce bounds
            vol = max(0, min(100, int(value)))
            subprocess.run(["osascript", "-e", f"set volume output volume {vol}"], check=True)
            return {"status": "success", "message": f"System volume set to {vol}%"}

        elif action == "mute":
            subprocess.run(["osascript", "-e", "set volume with output muted"], check=True)
            return {"status": "success", "message": "System audio muted"}

        elif action == "unmute":
            subprocess.run(["osascript", "-e", "set volume without output muted"], check=True)
            return {"status": "success", "message": "System audio unmuted"}

        elif action == "open_app":
            app_name = params.get("app", "")
            if not app_name:
                return {"status": "error", "message": "Application name not provided"}
            # Open app using macOS native open command
            subprocess.run(["open", "-a", app_name], check=True)
            return {"status": "success", "message": f"Successfully opened {app_name}"}

        elif action == "screenshot":
            desktop_path = os.path.expanduser("~/Desktop")
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d_at_%H.%M.%S")
            filename = f"FRIDAY_Screenshot_{timestamp}.png"
            filepath = os.path.join(desktop_path, filename)

            subprocess.run(["screencapture", filepath], check=True)
            return {
                "status": "success",
                "message": f"Screenshot taken successfully and saved to Desktop as '{filename}'",
                "path": filepath,
            }

        elif action == "system_stats":
            cpu_usage = psutil.cpu_percent(interval=0.1)
            mem_usage = psutil.virtual_memory().percent
            disk_usage = psutil.disk_usage("/").percent

            return {
                "status": "success",
                "message": (
                    f"System Load Details:\n"
                    f"- CPU Utilization: {cpu_usage}%\n"
                    f"- Virtual Memory: {mem_usage}%\n"
                    f"- Disk Storage: {disk_usage}%"
                ),
                "stats": {"cpu": cpu_usage, "memory": mem_usage, "disk": disk_usage},
            }

        else:
            return {"status": "error", "message": f"Unknown plugin action: '{action}'"}

    except subprocess.CalledProcessError as e:
        logger.error(f"Plugin command execution failed: {e}")
        return {"status": "error", "message": f"OS execution failed: {e!s}"}
    except Exception as e:
        logger.error(f"Plugin unexpected error: {e}")
        return {"status": "error", "message": str(e)}
