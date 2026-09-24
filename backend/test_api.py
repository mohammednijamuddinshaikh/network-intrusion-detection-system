import requests
import json

API = 'http://localhost:5000'

print("🔄 Logging in...")
try:
    res = requests.post(f"{API}/login", json={"username": "admin", "password": "admin123"})
    res.raise_for_status()
    token = res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
except Exception as e:
    print(f"❌ Login failed: {e}")
    print("Is the Flask server (app.py) running?")
    exit(1)

print("✅ Logged in successfully. Running tests...\n")

scenarios = {
  "Normal": [0,2,10,10,491,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,1,0,0,150,25,0.17,0.03,0.17,0,0,0,0.05,0],
  "DoS":    [0,2,10,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,511,511,1,1,0,0,0,0.01,0,255,255,1,0,1,0,1,0,0,0],
  "Probe":  [0,2,8,10,232,8153,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,5,6,0,0,0,0,1,0.17,0.5,5,6,1,0.2,1,0.4,0,0,0,0],
  "R2L":    [0,2,4,10,105,146,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,0,0,1,1,1,0,1,0,0,0,0,0],
  "U2R":    [0,2,10,10,1408,2898,0,0,0,4,0,1,1,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,0,0,1,1,1,0,1,0,0,0,0,0],
}

icons = {"Normal":"✅", "DoS":"💥", "Probe":"🔍", "R2L":"🔓", "U2R":"⚠️"}

for name, features in scenarios.items():
    r = requests.post(f"{API}/predict", json={"features": features}, headers=headers).json()
    pred = r.get("prediction", "Unknown")
    conf = r.get("confidence", 0)
    
    icon = icons.get(pred, "❓")
    match = "✓ PASS" if pred == name else f"✗ FAIL (Got: {pred})"
    
    print(f"{icon} {name:<8} → {pred:<8} ({conf}%)  [{match}]")
