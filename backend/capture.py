import time
import argparse
import requests
from scapy.all import sniff, IP, TCP, UDP, ICMP

# ── CLI args ────────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser(description="IDS Live Packet Capture")
parser.add_argument(
    "--api",
    default="http://localhost:5000",
    help="Backend API URL (default: http://localhost:5000)"
)
parser.add_argument("--username", default="admin")
parser.add_argument("--password", default="admin123")
parser.add_argument(
    "--interval",
    type=float,
    default=1.0,
    help="Min seconds between predictions (default: 1.0)"
)
args = parser.parse_args()

API = args.api
print(f"🌐 Connecting to backend: {API}")

# ── Login ────────────────────────────────────────────────────────────────────
try:
    res = requests.post(
        f"{API}/login",
        json={"username": args.username, "password": args.password},
        timeout=10
    )
    res.raise_for_status()
    TOKEN = res.json()["token"]
except Exception as e:
    print(f"❌ Could not connect to backend at {API}")
    print(f"   Error: {e}")
    print("   → Make sure Flask is running: python app.py")
    exit(1)

HEADERS = {"Authorization": f"Bearer {TOKEN}"}
print("✅ Authenticated with backend.")

# ── Feature helpers ──────────────────────────────────────────────────────────
def get_service(port):
    return {80: 10, 443: 10, 21: 4, 22: 5, 23: 6, 25: 7, 53: 8, 110: 12}.get(port, 0)

def get_protocol(pkt):
    if TCP in pkt:  return 2
    if UDP in pkt:  return 1
    if ICMP in pkt: return 0
    return 0

def get_flag(pkt):
    if TCP not in pkt: return 10
    f = pkt[TCP].flags
    if f == 0x02: return 5
    if f == 0x11: return 8
    if f == 0x04: return 1
    if f == 0x18: return 10
    return 10

def extract_features(pkt):
    if IP not in pkt:
        return None
    src_bytes = len(pkt)
    protocol  = get_protocol(pkt)
    flag      = get_flag(pkt)
    port      = pkt[TCP].dport if TCP in pkt else (pkt[UDP].dport if UDP in pkt else 0)
    service   = get_service(port)
    features  = [
        0, protocol, service, flag, src_bytes, 0,
        0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,
        1,1,0,0,0,0,1,0,0,
        1,1,1,0,1,0,0,0,0,0
    ]
    return features[:41]

# ── Packet processor with throttle ──────────────────────────────────────────
_last_sent = 0.0

def process_packet(pkt):
    global _last_sent

    features = extract_features(pkt)
    if not features:
        return

    # Throttle: only send once per --interval seconds
    now = time.time()
    if now - _last_sent < args.interval:
        return
    _last_sent = now

    try:
        res  = requests.post(
            f"{API}/predict",
            json={"features": features},
            headers=HEADERS,
            timeout=3
        )
        res.raise_for_status()
        data = res.json()
        pred = data.get("prediction", "?")
        conf = data.get("confidence", 0)
        src  = pkt[IP].src
        dst  = pkt[IP].dst
        print(f"[{time.strftime('%H:%M:%S')}] {src} → {dst} | {pred} ({conf}%)")
    except requests.exceptions.ConnectionError:
        print("⚠️  Lost connection to backend — is Flask still running?")
    except requests.exceptions.Timeout:
        pass  # silently skip slow responses
    except Exception as e:
        print(f"⚠️  {e}")

# ── Start sniffing ────────────────────────────────────────────────────────────
print(f"🔍 Starting live capture (throttle: 1 packet/{args.interval}s)... Press Ctrl+C to stop.")
print()
sniff(filter="ip", prn=process_packet, store=False)