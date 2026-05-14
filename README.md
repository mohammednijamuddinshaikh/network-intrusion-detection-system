# 🛡️ Network Intrusion Detection System (IDS)

An ML-powered network intrusion detection system that classifies network traffic as **Normal** or **Attack** in real time, with a live React dashboard.

![Python](https://img.shields.io/badge/Python-3.10+-blue) ![Flask](https://img.shields.io/badge/Flask-REST_API-lightgrey) ![React](https://img.shields.io/badge/React-Vite-cyan) ![Accuracy](https://img.shields.io/badge/Accuracy-99.57%25-brightgreen)

---

## 🚀 Features

- **99.57% accuracy** on NSL-KDD dataset using Random Forest
- REST API built with Flask for real-time prediction
- Interactive React dashboard with live detection log and chart
- Detects DoS, Probe, R2L, and U2R attack categories

---

## 🧠 Tech Stack

| Layer | Technology |
|-------|-----------|
| ML Model | Scikit-learn, Random Forest |
| Dataset | NSL-KDD |
| Backend | Python, Flask, Flask-CORS |
| Frontend | React, Vite, Tailwind CSS, Recharts |

---

## 📁 Project Structure
ids-project/
├── backend/
│   ├── model/          # Saved ML model & encoders
│   ├── app.py          # Flask REST API
│   └── train.py        # Model training script
├── frontend/
│   └── src/App.jsx     # React dashboard
└── data/               # NSL-KDD dataset (not tracked)

---

## ⚙️ Setup & Run

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`

---

## 📊 Model Performance

| Metric | Normal | Attack |
|--------|--------|--------|
| Precision | 0.99 | 1.00 |
| Recall | 1.00 | 0.99 |
| F1-Score | 1.00 | 1.00 |

**Overall Accuracy: 99.57%**

---

## 👤 Author

Mohammed Nijamuddin Shaikh — [GitHub](https://github.com/mohammednijamuddinshaikh)
