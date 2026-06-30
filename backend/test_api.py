import json
import sys
import urllib.request

url = "http://localhost:8000/api/v1/chat"
payload = {
    "model": "phi3:latest",
    "messages": [{"role": "user", "content": "Hello! Introduce yourself in one short sentence as FRIDAY."}],
}

data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")

print("Initiating connection to local FRIDAY API server (http://localhost:8000)...")
try:
    with urllib.request.urlopen(req) as response:
        print(f"Connected. Status Code: {response.status}")
        print("Streaming response: ", end="")
        while True:
            chunk = response.read(16)
            if not chunk:
                break
            sys.stdout.write(chunk.decode("utf-8"))
            sys.stdout.flush()
        print()
except Exception as e:
    print(f"Failed to communicate with FRIDAY backend: {e}")
    print("Ensure that your backend server is running on port 8000 and Ollama is active.")
