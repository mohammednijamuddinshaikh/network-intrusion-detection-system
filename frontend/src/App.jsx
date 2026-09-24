import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import "./App.css";

const API = "http://localhost:5000";

/* ── Category meta ─────────────────────────────────────── */
const CAT = {
  Normal: { color: "var(--normal-clr)", bg: "rgba(34,197,94,0.10)",  border: "rgba(34,197,94,0.28)",  fill: "#22c55e", icon: "✅", label: "Normal Traffic" },
  DoS:    { color: "var(--dos-clr)",    bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.28)",fill: "#f87171", icon: "💥", label: "DoS Attack"      },
  Probe:  { color: "var(--probe-clr)",  bg: "rgba(251,146,60,0.10)",  border: "rgba(251,146,60,0.28)", fill: "#fb923c", icon: "🔍", label: "Probe Attack"    },
  R2L:    { color: "var(--r2l-clr)",    bg: "rgba(192,132,252,0.10)", border: "rgba(192,132,252,0.28)",fill: "#c084fc", icon: "🔓", label: "R2L Attack"      },
  U2R:    { color: "var(--u2r-clr)",    bg: "rgba(250,204,21,0.10)",  border: "rgba(250,204,21,0.28)", fill: "#facc15", icon: "⚠️", label: "U2R Attack"      },
};
const CATEGORIES = ["Normal", "DoS", "Probe", "R2L", "U2R"];

/* ── Preset attack scenarios ───────────────────────────── */
const PRESETS = [
  {
    name: "Normal",
    icon: "✅",
    hint: "Typical benign HTTP session",
    features: "0,2,10,10,491,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,1,0,0,150,25,0.17,0.03,0.17,0,0,0,0.05,0",
  },
  {
    name: "DoS",
    icon: "💥",
    hint: "Neptune SYN-flood pattern",
    features: "0,2,10,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,511,511,1,1,0,0,0,0.01,0,255,255,1,0,1,0,1,0,0,0",
  },
  {
    name: "Probe",
    icon: "🔍",
    hint: "Port-scan reconnaissance",
    features: "0,2,8,10,232,8153,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,5,6,0,0,0,0,1,0.17,0.5,5,6,1,0.2,1,0.4,0,0,0,0",
  },
  {
    name: "R2L",
    icon: "🔓",
    hint: "FTP brute-force guess",
    features: "0,2,4,10,105,146,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,0,0,1,1,1,0,1,0,0,0,0,0",
  },
  {
    name: "U2R",
    icon: "⚠️",
    hint: "Buffer overflow escalation",
    features: "0,2,10,10,1408,2898,0,0,0,4,0,1,1,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,0,0,1,1,1,0,1,0,0,0,0,0",
  },
];

/* ── Small UI helpers ──────────────────────────────────── */
function AttackBadge({ cat }) {
  if (!CAT[cat]) return null;
  const { color, bg, border, icon } = CAT[cat];
  return (
    <span className="attack-badge" style={{ color, background: bg, borderColor: border }}>
      {icon} {cat}
    </span>
  );
}

function ConfidenceBar({ value, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div className="conf-bar-track">
        <div className="conf-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", minWidth: 38 }}>
        {value}%
      </span>
    </div>
  );
}

/* ── Login page ────────────────────────────────────────── */
function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!username || !password) { setError("Please enter username and password."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/login`, { username, password });
      localStorage.setItem("token",    res.data.token);
      localStorage.setItem("username", res.data.username);
      onLogin(res.data.username, res.data.token);
    } catch {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      {/* Shield hero */}
      <div style={{ textAlign: "center", width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72,
            borderRadius: "20px",
            background: "linear-gradient(135deg, rgba(14,165,233,0.2), rgba(99,102,241,0.15))",
            border: "1px solid rgba(56,189,248,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32,
            margin: "0 auto 16px",
            boxShadow: "0 0 40px rgba(56,189,248,0.12)",
          }}>
            🛡️
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#e2e8f0", marginBottom: 4 }}>
            IDS Console
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Network Intrusion Detection System
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: "32px 28px", textAlign: "left" }}>
          <p className="section-label">Authentication</p>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, marginBottom: 6, display: "block" }}>
              Username
            </label>
            <input
              id="login-username"
              className="ids-input"
              placeholder="Enter username"
              value={username}
              autoComplete="username"
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, marginBottom: 6, display: "block" }}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className="ids-input"
              placeholder="Enter password"
              value={password}
              autoComplete="current-password"
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
          </div>

          {error && (
            <div style={{
              background: "rgba(248,113,113,0.10)",
              border: "1px solid rgba(248,113,113,0.28)",
              borderRadius: 8, padding: "9px 12px",
              color: "#fca5a5", fontSize: "0.8rem", marginBottom: 14,
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            id="login-submit"
            className="btn-primary"
            style={{ width: "100%", marginBottom: 20 }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading
              ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span className="spinner" /> Authenticating...
                </span>
              : "Sign In →"
            }
          </button>

          {/* Demo credentials */}
          <div style={{
            background: "rgba(56,189,248,0.05)",
            border: "1px solid rgba(56,189,248,0.12)",
            borderRadius: 8, padding: "10px 12px",
          }}>
            <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
              Demo Credentials
            </p>
            <p style={{ fontSize: "0.77rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
              admin / admin123
            </p>
            <p style={{ fontSize: "0.77rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
              mohammed / password123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Stat card ─────────────────────────────────────────── */
function StatCard({ label, value, color, icon }) {
  return (
    <div className="glass-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: color ? `${color}18` : "rgba(56,189,248,0.10)",
        border: `1px solid ${color ? `${color}30` : "rgba(56,189,248,0.20)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {label}
        </p>
        <p style={{ fontSize: "1.25rem", fontWeight: 800, color: color || "var(--cyan-glow)", lineHeight: 1.2 }}>
          {value}
        </p>
      </div>
    </div>
  );
}

/* ── Live Feed ─────────────────────────────────────────── */
function LiveFeed({ token }) {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const retryRef = useRef(null);
  const esRef    = useRef(null);

  useEffect(() => {
    let retryDelay = 2000; // start at 2 s, cap at 30 s

    function connect() {
      if (esRef.current) esRef.current.close();

      const es = new EventSource(`${API}/stream?token=${token}`);
      esRef.current = es;

      es.onopen = () => {
        setConnected(true);
        retryDelay = 2000; // reset backoff on success
      };

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (!data.prediction) return;
          setEvents(prev => [{ ...data, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 19)]);
        } catch { /* ignore parse errors */ }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        // Auto-reconnect with exponential backoff
        retryRef.current = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 1.5, 30000);
          connect();
        }, retryDelay);
      };
    }

    connect();

    return () => {
      clearTimeout(retryRef.current);
      esRef.current?.close();
    };
  }, [token]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span className="section-label" style={{ marginBottom: 0, flex: 1 }}>⚡ Live Capture Feed</span>
        <span className={`status-badge ${connected ? "status-online" : "status-offline"}`}>
          <span className="dot-pulse" />
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>
      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 12 }}>
        Auto-updates when <code style={{ fontFamily: "var(--font-mono)", color: "var(--cyan-glow)" }}>capture.py</code> is running.
      </p>

      {events.length === 0 ? (
        <div style={{
          padding: "32px 16px", textAlign: "center",
          color: "var(--text-muted)", fontSize: "0.85rem",
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📡</div>
          Waiting for live traffic data…
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="ids-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Category</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev, i) => (
                <tr key={i} className="fade-row" style={{ animationDelay: `${i * 20}ms` }}>
                  <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                    {ev.time}
                  </td>
                  <td><AttackBadge cat={ev.prediction} /></td>
                  <td>
                    <ConfidenceBar value={ev.confidence} color={CAT[ev.prediction]?.fill || "#38bdf8"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Custom bar tooltip ────────────────────────────────── */
function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(6,18,40,0.97)",
      border: "1px solid rgba(56,189,248,0.25)",
      borderRadius: 8, padding: "8px 14px",
      fontFamily: "var(--font-sans)", fontSize: "0.8rem",
      color: "var(--text-primary)",
    }}>
      <p style={{ color: CAT[label]?.fill || "#38bdf8", fontWeight: 700, marginBottom: 2 }}>{label}</p>
      <p style={{ color: "var(--text-secondary)" }}>Detections: <strong>{payload[0].value}</strong></p>
    </div>
  );
}

/* ── Custom radar tooltip ──────────────────────────────── */
function CustomRadarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div style={{
      background: "rgba(6,18,40,0.97)",
      border: "1px solid rgba(56,189,248,0.25)",
      borderRadius: 8, padding: "8px 14px",
      fontFamily: "var(--font-sans)", fontSize: "0.8rem",
    }}>
      <p style={{ color: CAT[name]?.fill || "#38bdf8", fontWeight: 700 }}>{name}</p>
      <p style={{ color: "var(--text-secondary)" }}>{value}%</p>
    </div>
  );
}

/* ── Main App ──────────────────────────────────────────── */
export default function App() {
  const [token,    setToken]    = useState(localStorage.getItem("token")    || "");
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [features, setFeatures] = useState(PRESETS[0].features);
  const [result,   setResult]   = useState(null);
  const [log,      setLog]      = useState([]);
  const [stats,    setStats]    = useState({ Normal:0, DoS:0, Probe:0, R2L:0, U2R:0 });
  const [loading,  setLoading]  = useState(false);
  const [health,   setHealth]   = useState("checking");
  const [activePreset, setActivePreset] = useState(0);
  const resultRef = useRef(null);

  /* Health check */
  useEffect(() => {
    axios.get(`${API}/health`)
      .then(() => setHealth("online"))
      .catch(() => setHealth("offline"));
  }, []);

  const handleLogin = (user, tok) => { setUsername(user); setToken(tok); };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setToken(""); setUsername("");
  };

  const applyPreset = (index) => {
    setActivePreset(index);
    setFeatures(PRESETS[index].features);
    setResult(null);
  };

  const predict = async () => {
    try {
      setLoading(true);
      const parsed = features.split(",").map(v => Number(v.trim()));
      const res = await axios.post(`${API}/predict`, { features: parsed }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { prediction, confidence, probabilities, meta } = res.data;
      const entry = { prediction, confidence, probabilities, meta, time: new Date().toLocaleTimeString() };
      setResult(entry);
      setLog(prev => [entry, ...prev.slice(0, 49)]);
      setStats(prev => ({ ...prev, [prediction]: prev[prediction] + 1 }));
      // Scroll to result
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 80);
    } catch (e) {
      if (e.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  if (!token) return <Login onLogin={handleLogin} />;

  /* Derived data */
  const chartData    = CATEGORIES.map(c => ({ name: c, count: stats[c] }));
  const radarData    = result
    ? CATEGORIES.map(c => ({ name: c, value: result.probabilities?.[c] ?? 0 }))
    : [];
  const totalScans   = log.length;
  const attackCount  = log.filter(l => l.prediction !== "Normal").length;
  const topThreat    = CATEGORIES.slice(1).reduce((a, b) => stats[a] > stats[b] ? a : b);

  return (
    <div style={{ minHeight: "100vh", padding: "0 0 60px" }}>

      {/* ── Top nav ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(3,7,18,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border-subtle)",
        padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🛡️</span>
          <div>
            <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--cyan-glow)" }}>
              IDS Console
            </span>
            <span style={{
              marginLeft: 8, fontSize: "0.65rem", color: "var(--text-muted)",
              fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              v2.0
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Backend status */}
          <span className={`status-badge ${
            health === "online"    ? "status-online" :
            health === "offline"   ? "status-offline" :
                                     "status-checking"
          }`}>
            <span className="dot-pulse" />
            Backend {health === "checking" ? "…" : health}
          </span>

          {/* User */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#fff",
            }}>
              {username[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{username}</span>
          </div>

          <button
            id="logout-btn"
            onClick={handleLogout}
            style={{
              fontSize: "0.75rem", fontWeight: 600, color: "#f87171",
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.25)",
              borderRadius: 8, padding: "5px 12px",
              cursor: "pointer", transition: "background 0.15s",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 24px" }}>

        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>
            Network Intrusion Detection
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            ML-powered real-time traffic analysis using NSL-KDD Random Forest (99.57% accuracy)
          </p>
        </div>

        {/* ── Stat cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
          <StatCard icon="🔬" label="Total Scans"   value={totalScans}   />
          <StatCard icon="🚨" label="Attacks Found" value={attackCount}  color="#f87171" />
          <StatCard icon="✅" label="Normal Traffic" value={stats.Normal} color="#22c55e" />
          <StatCard icon="⚡" label="Top Threat"    value={totalScans > 0 ? topThreat : "—"} color={CAT[topThreat]?.fill} />
          <StatCard icon="🎯" label="Accuracy"      value="99.57%"       color="var(--cyan-glow)" />
        </div>

        {/* ── Grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

          {/* LEFT: Input panel */}
          <div className="glass-card" style={{ padding: "22px 24px" }}>
            <p className="section-label">Traffic Analysis</p>

            {/* Preset chips */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                Quick Presets
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {PRESETS.map((p, i) => {
                  const { color, bg, border } = CAT[p.name];
                  const isActive = activePreset === i;
                  return (
                    <button
                      key={p.name}
                      className="preset-chip"
                      style={{
                        color,
                        background: isActive ? bg : "transparent",
                        borderColor: isActive ? border : "var(--border-card)",
                        boxShadow: isActive ? `0 0 12px ${color}25` : "none",
                      }}
                      onClick={() => applyPreset(i)}
                      title={p.hint}
                    >
                      {p.icon} {p.name}
                    </button>
                  );
                })}
              </div>
              {PRESETS[activePreset] && (
                <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 6, fontStyle: "italic" }}>
                  {PRESETS[activePreset].hint}
                </p>
              )}
            </div>

            {/* Feature textarea */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Feature Vector <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(41 comma-separated values)</span>
              </label>
              <textarea
                id="feature-input"
                className="ids-textarea"
                style={{ height: 100 }}
                value={features}
                onChange={e => { setFeatures(e.target.value); setActivePreset(-1); }}
                spellCheck={false}
              />
            </div>

            <button
              id="analyze-btn"
              className="btn-primary"
              style={{ width: "100%" }}
              onClick={predict}
              disabled={loading}
            >
              {loading
                ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <span className="spinner" /> Analyzing Traffic…
                  </span>
                : "⚡ Analyze Traffic"
              }
            </button>

            {/* Result panel */}
            {result && (
              <div
                ref={resultRef}
                className="slide-up"
                style={{
                  marginTop: 16,
                  background: CAT[result.prediction]?.bg,
                  border: `1px solid ${CAT[result.prediction]?.border}`,
                  borderRadius: 12, padding: "16px 18px",
                }}
              >
                {/* Verdict */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
                      Detection Result
                    </p>
                    <p style={{ fontSize: "1.3rem", fontWeight: 800, color: CAT[result.prediction]?.fill, lineHeight: 1 }}>
                      {CAT[result.prediction]?.icon} {CAT[result.prediction]?.label}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
                      Confidence
                    </p>
                    <p style={{ fontSize: "1.5rem", fontWeight: 900, color: CAT[result.prediction]?.fill }}>
                      {result.confidence}%
                    </p>
                  </div>
                </div>

                {/* Probability bars */}
                <div style={{ marginTop: 8 }}>
                  {CATEGORIES.map(c => (
                    <div key={c} className="prob-row">
                      <span className="prob-label" style={{ color: CAT[c]?.fill }}>{c}</span>
                      <div className="prob-track">
                        <div
                          className="prob-fill"
                          style={{
                            width: `${result.probabilities?.[c] ?? 0}%`,
                            background: CAT[c]?.fill,
                          }}
                        />
                      </div>
                      <span className="prob-pct">{result.probabilities?.[c] ?? 0}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Charts panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Bar chart */}
            <div className="glass-card" style={{ padding: "22px 24px", flex: "1 1 0" }}>
              <p className="section-label">Detection Summary</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} barSize={28}>
                  <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(56,189,248,0.05)" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map(entry => (
                      <Cell key={entry.name} fill={CAT[entry.name]?.fill} opacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar chart (last result probabilities) */}
            <div className="glass-card" style={{ padding: "22px 24px", flex: "1 1 0" }}>
              <p className="section-label">Probability Radar</p>
              {radarData.length === 0 ? (
                <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                  Run an analysis to see radar chart
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={60}>
                    <PolarGrid stroke="rgba(56,189,248,0.12)" />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <Radar
                      dataKey="value"
                      stroke={CAT[result?.prediction]?.fill || "#38bdf8"}
                      fill={CAT[result?.prediction]?.fill || "#38bdf8"}
                      fillOpacity={0.18}
                      strokeWidth={2}
                    />
                    <Tooltip content={<CustomRadarTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* BOTTOM: Detection log (full width) */}
          <div className="glass-card" style={{ padding: "22px 24px", gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <p className="section-label" style={{ marginBottom: 0 }}>Detection Log</p>
              {log.length > 0 && (
                <button
                  id="clear-log-btn"
                  onClick={() => { setLog([]); setStats({ Normal:0, DoS:0, Probe:0, R2L:0, U2R:0 }); }}
                  style={{
                    fontSize: "0.7rem", color: "var(--text-muted)",
                    background: "transparent", border: "1px solid var(--border-subtle)",
                    borderRadius: 6, padding: "3px 10px", cursor: "pointer", transition: "color 0.15s",
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {log.length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                No detections yet — run an analysis to see results here.
              </div>
            ) : (
              <div style={{ overflowX: "auto", maxHeight: 280, overflowY: "auto" }}>
                <table className="ids-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Time</th>
                      <th>Category</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.map((l, i) => (
                      <tr key={i} className="fade-row" style={{ animationDelay: `${Math.min(i * 15, 200)}ms` }}>
                        <td style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}>
                          {log.length - i}
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                          {l.time}
                        </td>
                        <td><AttackBadge cat={l.prediction} /></td>
                        <td>
                          <ConfidenceBar value={l.confidence} color={CAT[l.prediction]?.fill || "#38bdf8"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* BOTTOM: Live feed (full width) */}
          <div className="glass-card" style={{ padding: "22px 24px", gridColumn: "1 / -1" }}>
            <LiveFeed token={token} />
          </div>
        </div>
      </main>
    </div>
  );
}