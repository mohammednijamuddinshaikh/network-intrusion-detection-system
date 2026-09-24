import time
import argparse
import requests
from scapy.all import sniff, IP, TCP, UDP, ICMP

# ── CLI args ──────────────────────────────────────────────
parser = argparse.ArgumentParser(description="IDS Live Packet Capture")
parser.add_argument(
    "--api",
    default="http://localhost:5000",
    help="Backend API URL (default: http://localhost:5000)"
)
parser.add_argument("--username", default="admin")
parser.add_argument("--password", default="admin123")
args = parser.parse_args()

API = args.api
print(f"🌐 Connecting to backend: {API}")

# Login to get token
try:
    res = requests.post(f"{API}/login", json={"username": args.username, "password": args.password}, timeout=10)
    TOKEN = res.json()["token"]
except Exception as e:
    print(f"❌ Could not connect to backend at {API}: {e}")
    print("   Make sure the Flask server is running (python app.py)")
    exit(1)

HEADERS = {"Authorization": f"Bearer {TOKEN}"}
print("✅ Authenticated with backend.")

def get_service(port):
    services = {80:10, 443:10, 21:4, 22:5, 23:6, 25:7, 53:8, 110:12}
    return services.get(port, 0)

def get_protocol(pkt):
    if TCP in pkt: return 2
    if UDP in pkt: return 1
    if ICMP in pkt: return 0
    return 0

def get_flag(pkt):
    if TCP not in pkt: return 10
    flags = pkt[TCP].flags
    if flags == 0x02: return 5
    if flags == 0x11: return 8
    if flags == 0x04: return 1
    if flags == 0x18: return 10
    return 10

def extract_features(pkt):
    if IP not in pkt:
        return None
    src_bytes = len(pkt)
    protocol  = get_protocol(pkt)
    flag      = get_flag(pkt)
    port = pkt[TCP].dport if TCP in pkt else (pkt[UDP].dport if UDP in pkt else 0)
    service   = get_service(port)
    features  = [
        0, protocol, service, flag, src_bytes, 0,
        0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,
        1,1,0,0,0,0,1,0,0,
        1,1,1,0,1,0,0,0,0,0
    ]
    return features[:41]

def process_packet(pkt):
    features = extract_features(pkt)
    if not features:
        return
    try:
        res = requests.post(f"{API}/predict", json={"features": features}, headers=HEADERS, timeout=2)
        data = res.json()
        print(f"[{time.strftime('%H:%M:%S')}] {pkt[IP].src} → {pkt[IP].dst} | {data['prediction']} ({data['confidence']}%)")
    except Exception as e:
        print(f"Error: {e}")

print("🔍 Starting live capture... Press Ctrl+C to stop.")
sniff(filter="ip", prn=process_packet, store=False)