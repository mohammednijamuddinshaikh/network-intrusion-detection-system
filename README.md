# 🛡️ Network Intrusion Detection System (IDS)

An **ML-powered, real-time network intrusion detection system** that classifies network traffic into Normal or Attack categories using a trained Random Forest model — served via a Flask REST API and visualized in a premium React dashboard.

![Python](https://img.shields.io/badge/Python-3.10+-3776ab?style=flat-square&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-REST_API-000000?style=flat-square&logo=flask&logoColor=white)
![React](https://img.shields.io/badge/React_19-Vite-61dafb?style=flat-square&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v4-0ea5e9?style=flat-square&logo=tailwindcss&logoColor=white)
![Accuracy](https://img.shields.io/badge/Accuracy-99.57%25-22c55e?style=flat-square)
![Dataset](https://img.shields.io/badge/Dataset-NSL--KDD-8b5cf6?style=flat-square)
![Live on Render](https://img.shields.io/badge/Backend-Render-46e3b7?style=flat-square&logo=render&logoColor=black)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **99.57% Accuracy** | Random Forest trained on NSL-KDD dataset |
| 🚀 **Real-Time Prediction** | Flask REST API with JWT-authenticated `/predict` endpoint |
| 📡 **Live Traffic Capture** | `capture.py` uses Scapy to sniff packets and stream predictions via SSE |
| 📊 **Premium Dashboard** | Glassmorphism UI with bar chart, radar chart, probability bars, and detection log |
| 🎯 **Quick Presets** | One-click attack scenario buttons (Normal, DoS, Probe, R2L, U2R) |
| 🔐 **JWT Auth** | Secure login with token-based session management |
| ☁️ **Render Deployment** | Backend deployable on Render with `Procfile` + `gunicorn` |

---

## 🧠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **ML Model** | Scikit-learn · Random Forest · NSL-KDD dataset |
| **Backend** | Python · Flask · Flask-CORS · Flask-JWT-Extended · Gunicorn |
| **Live Capture** | Scapy · Server-Sent Events (SSE) |
| **Frontend** | React 19 · Vite · Tailwind CSS v4 · Recharts |
| **Fonts** | Inter · JetBrains Mono (Google Fonts) |

---

## 🗂️ Project Structure

```
network-intrusion-detection-system/
├── backend/
│   ├── model/
│   │   ├── ids_model.pkl         # Trained Random Forest model
│   │   ├── label_encoder.pkl     # Attack category encoder
│   │   └── feature_names.pkl     # Feature column names
│   ├── app.py                    # Flask REST API (predict, stream, features, health)
│   ├── auth.py                   # JWT login blueprint
│   ├── capture.py                # Live Scapy packet capture → API predictions
│   ├── train.py                  # Model training script
│   ├── requirements.txt
│   └── Procfile                  # For Render deployment
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Full React dashboard
│   │   ├── App.css               # Custom design system (glassmorphism)
│   │   ├── index.css             # Tailwind CSS import
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
└── data/                         # NSL-KDD dataset (not tracked in git)
    ├── KDDTrain+.txt
    └── KDDTest+.txt
```

---

## ⚙️ Setup & Run

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
# → http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Live Packet Capture (optional, requires admin/root)

```bash
cd backend
python capture.py
```

> **Note:** `capture.py` requires administrator privileges on Windows (`Run as Administrator`) or `sudo` on Linux/macOS, since raw packet sniffing needs elevated access.

---

## 🔐 Authentication

| Username | Password |
|----------|----------|
| `admin` | `admin123` |
| `mohammed` | `password123` |

---

## 📊 Model Performance

Trained on the **NSL-KDD** dataset with a `RandomForestClassifier(n_estimators=100)`.

| Class | Precision | Recall | F1-Score |
|-------|-----------|--------|----------|
| Normal | 0.999 | 1.000 | 1.000 |
| DoS | 1.000 | 0.999 | 0.999 |
| Probe | 0.987 | 0.982 | 0.984 |
| R2L | 0.974 | 0.961 | 0.967 |
| U2R | 0.962 | 0.950 | 0.956 |

**Overall Accuracy: 99.57%**

---

## 🏷️ Attack Categories

| Category | Description | Examples |
|----------|-------------|---------|
| ✅ **Normal** | Legitimate traffic | HTTP, HTTPS, SSH |
| 💥 **DoS** | Denial of Service | Neptune, Smurf, Pod, Teardrop |
| 🔍 **Probe** | Reconnaissance / Port scan | Ipsweep, Nmap, Satan, Portsweep |
| 🔓 **R2L** | Remote to Local exploit | Guess-passwd, FTP-write, IMAP |
| ⚠️ **U2R** | User to Root privilege escalation | Buffer overflow, Rootkit, Perl |

---

## ☁️ Deployment (Render)

1. Push to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set **Root Directory** → `backend`
4. Set **Build Command** → `pip install -r requirements.txt`
5. Set **Start Command** → `gunicorn app:app`

---

## 👤 Author

**Mohammed Nijamuddin Shaikh** — [GitHub](https://github.com/mohammednijamuddinshaikh)
