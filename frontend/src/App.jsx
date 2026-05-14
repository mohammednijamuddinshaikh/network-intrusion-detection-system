import { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const API = "http://localhost:5000";

const CATEGORY_STYLES = {
  Normal: { bg: "bg-green-900",  text: "text-green-300",  border: "border-green-600",  fill: "#22c55e" },
  DoS:    { bg: "bg-red-900",    text: "text-red-300",    border: "border-red-600",    fill: "#ef4444" },
  Probe:  { bg: "bg-orange-900", text: "text-orange-300", border: "border-orange-600", fill: "#f97316" },
  R2L:    { bg: "bg-purple-900", text: "text-purple-300", border: "border-purple-600", fill: "#a855f7" },
  U2R:    { bg: "bg-yellow-900", text: "text-yellow-300", border: "border-yellow-600", fill: "#eab308" },
};

const CATEGORIES = ["Normal", "DoS", "Probe", "R2L", "U2R"];
const defaultFeatures = Array(41).fill(0).join(",");
function LiveFeed() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const es = new EventSource("http://localhost:5000/stream");
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (!data.prediction) return;
        setEvents(prev => [{ ...data, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 14)]);
      } catch {}
    };
    return () => es.close();
  }, []);

  if (events.length === 0) return <p className="text-gray-500 text-sm">Waiting for live traffic...</p>;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-gray-400 border-b border-gray-700">
          <th className="text-left py-1">Time</th>
          <th className="text-left py-1">Category</th>
          <th className="text-left py-1">Confidence</th>
        </tr>
      </thead>
      <tbody>
        {events.map((e, i) => (
          <tr key={i} className="border-b border-gray-800">
            <td className="py-1 text-gray-400">{e.time}</td>
            <td className={`py-1 font-semibold ${CATEGORY_STYLES[e.prediction]?.text}`}>
              {e.meta?.icon} {e.prediction}
            </td>
            <td className="py-1 text-gray-300">{e.confidence}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
export default function App() {
  const [features, setFeatures]   = useState(defaultFeatures);
  const [result, setResult]       = useState(null);
  const [log, setLog]             = useState([]);
  const [stats, setStats]         = useState({ Normal:0, DoS:0, Probe:0, R2L:0, U2R:0 });
  const [loading, setLoading]     = useState(false);
  const [health, setHealth]       = useState("checking...");

  useEffect(() => {
    axios.get(`${API}/health`)
      .then(() => setHealth("🟢 Online"))
      .catch(() => setHealth("🔴 Offline"));
  }, []);

  const predict = async () => {
    try {
      setLoading(true);
      const parsed = features.split(",").map(Number);
      const res = await axios.post(`${API}/predict`, { features: parsed });
      const { prediction, confidence, probabilities, meta } = res.data;
      const entry = { prediction, confidence, probabilities, meta, time: new Date().toLocaleTimeString() };
      setResult(entry);
      setLog(prev => [entry, ...prev.slice(0, 9)]);
      setStats(prev => ({ ...prev, [prediction]: prev[prediction] + 1 }));
    } catch {
      setResult({ prediction: "Error", confidence: 0 });
    } finally {
      setLoading(false);
    }
  };

  const chartData = CATEGORIES.map(c => ({ name: c, count: stats[c] }));

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 font-mono">
      <h1 className="text-2xl font-bold text-cyan-400 mb-1">🛡️ Network Intrusion Detection System</h1>
      <p className="text-gray-400 text-sm mb-6">ML-powered threat classifier | Backend: <span className="text-cyan-300">{health}</span></p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Input Panel */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <h2 className="text-cyan-300 font-semibold mb-2">Input Features (comma-separated, 41 values)</h2>
          <textarea
            className="w-full bg-gray-800 text-green-300 text-xs rounded p-2 h-32 resize-none outline-none"
            value={features}
            onChange={e => setFeatures(e.target.value)}
          />
          <button
            onClick={predict}
            disabled={loading}
            className="mt-3 w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-lg font-semibold transition"
          >
            {loading ? "Analyzing..." : "Analyze Traffic"}
          </button>

          {result && result.prediction !== "Error" && (
            <div className={`mt-4 p-3 rounded-lg border ${CATEGORY_STYLES[result.prediction]?.bg} ${CATEGORY_STYLES[result.prediction]?.border}`}>
              <p className={`text-center text-lg font-bold ${CATEGORY_STYLES[result.prediction]?.text}`}>
                {result.meta?.icon} {result.prediction === "Normal" ? "NORMAL TRAFFIC" : `ATTACK: ${result.prediction}`}
              </p>
              <p className="text-center text-sm text-gray-300 mt-1">Confidence: {result.confidence}%</p>
              <div className="mt-3 grid grid-cols-5 gap-1 text-xs text-center">
                {CATEGORIES.map(c => (
                  <div key={c} className={`rounded p-1 ${CATEGORY_STYLES[c]?.bg}`}>
                    <p className={CATEGORY_STYLES[c]?.text}>{c}</p>
                    <p className="text-white font-bold">{result.probabilities?.[c] ?? 0}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chart Panel */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <h2 className="text-cyan-300 font-semibold mb-4">Detection Summary</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none" }} />
              <Bar dataKey="count" radius={[6,6,0,0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={CATEGORY_STYLES[entry.name]?.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Log Panel */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700 md:col-span-2">
          <h2 className="text-cyan-300 font-semibold mb-3">Detection Log</h2>
          {log.length === 0 ? (
            <p className="text-gray-500 text-sm">No detections yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-1">Time</th>
                  <th className="text-left py-1">Category</th>
                  <th className="text-left py-1">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {log.map((l, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td className="py-1 text-gray-400">{l.time}</td>
                    <td className={`py-1 font-semibold ${CATEGORY_STYLES[l.prediction]?.text}`}>
                      {l.meta?.icon} {l.prediction}
                    </td>
                    <td className="py-1 text-gray-300">{l.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Live Capture Feed */}
        <div className="bg-gray-900 rounded-xl p-4 border border-cyan-800 md:col-span-2">
          <h2 className="text-cyan-300 font-semibold mb-3">⚡ Live Capture Feed</h2>
          <p className="text-gray-500 text-xs mb-3">Auto-updates when <code>capture.py</code> is running.</p>
          <LiveFeed />
        </div>
      </div>
    </div>
  );
}