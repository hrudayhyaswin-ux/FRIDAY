from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from plugins.runner import execute_plugin

router = APIRouter()

class PluginRunRequest(BaseModel):
    action: str
    params: dict = {}

@router.get("/")
def list_plugins():
    """Returns metadata for all available system control modules."""
    return {
        "plugins": [
            {
                "id": "volume",
                "name": "Volume Control",
                "desc": "Adjust macOS output audio level (0-100)",
                "params": {"value": "number (e.g. 50)"},
                "status": "Active"
            },
            {
                "id": "mute",
                "name": "Mute Audio",
                "desc": "Silence native audio channels",
                "params": {},
                "status": "Active"
            },
            {
                "id": "unmute",
                "name": "Unmute Audio",
                "desc": "Enable native audio channels",
                "params": {},
                "status": "Active"
            },
            {
                "id": "open_app",
                "name": "Application Launcher",
                "desc": "Launch macOS apps (e.g. Safari, Calculator, Notes)",
                "params": {"app": "string name"},
                "status": "Active"
            },
            {
                "id": "screenshot",
                "name": "Display Capture",
                "desc": "Save a screenshot directly onto the local Desktop",
                "params": {},
                "status": "Active"
            },
            {
                "id": "system_stats",
                "name": "Performance Stats",
                "desc": "Fetch current local CPU, Memory, and Disk metrics",
                "params": {},
                "status": "Active"
            }
        ]
    }

@router.post("/run")
def run_plugin(request: PluginRunRequest):
    """Executes a system automation plugin."""
    result = execute_plugin(request.action, request.params)
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result
