import time
import requests
from scapy.all import sniff, IP, TCP, UDP, ICMP

API = "http://localhost:5000/predict"

# Map port to NSL-KDD service encoding (simplified)
def get_service(port):
    services = {80:10, 443:10, 21:4, 22:5, 23:6, 25:7, 53:8, 110:12}
    return services.get(port, 0)

# Map protocol to encoding
def get_protocol(pkt):
    if TCP in pkt: return 2
    if UDP in pkt: return 1
    if ICMP in pkt: return 0
    return 0

# Map TCP flags to encoding
def get_flag(pkt):
    if TCP not in pkt: return 10
    flags = pkt[TCP].flags
    if flags == 0x02: return 5   # SYN
    if flags == 0x11: return 8   # FIN+ACK
    if flags == 0x04: return 1   # RST
    if flags == 0x18: return 10  # PSH+ACK
    return 10

def extract_features(pkt):
    if IP not in pkt:
        return None

    src_bytes = len(pkt)
    dst_bytes = 0
    protocol  = get_protocol(pkt)
    flag      = get_flag(pkt)

    if TCP in pkt:
        port = pkt[TCP].dport
    elif UDP in pkt:
        port = pkt[UDP].dport
    else:
        port = 0

    service = get_service(port)

    # Build 41-feature vector (approximate, zeros for derived features)
    features = [
        0,           # duration
        protocol,    # protocol_type
        service,     # service
        flag,        # flag
        src_bytes,   # src_bytes
        dst_bytes,   # dst_bytes
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
        res = requests.post(API, json={"features": features}, timeout=2)
        data = res.json()
        print(f"[{time.strftime('%H:%M:%S')}] {pkt[IP].src} → {pkt[IP].dst} | {data['prediction']} ({data['confidence']}%)")
    except Exception as e:
        print(f"Error: {e}")

print("🔍 Starting live capture... Press Ctrl+C to stop.")
sniff(filter="ip", prn=process_packet, store=False)