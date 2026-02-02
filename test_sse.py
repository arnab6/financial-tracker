import requests
import json

url = "http://127.0.0.1:8000/api/chat"
# Asking for a chart to verify both text and chart streaming
payload = {"messages": [{"role": "user", "content": "Show me a pie chart of my expenses"}]}
headers = {"Content-Type": "application/json"}

print(f"Connecting to {url}...")
try:
    with requests.post(url, json=payload, headers=headers, stream=True) as response:
        response.raise_for_status()
        print("Connected! Listening for events...")
        for line in response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                print(f"RECEIVED: {decoded_line}")
except Exception as e:
    print(f"Error: {e}")
