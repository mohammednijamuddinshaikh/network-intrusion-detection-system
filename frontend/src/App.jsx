import { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const API = "http://localhost:5000";

const defaultFeatures = Array(41).fill(0);

export default function App() {
  const [features, setFeatures] = useState(defaultFeatures.join(","));
  const [result, setResult] = useState(null);
  const [log, setLog] = useState([]);
  const [stats, setStats] = useState({ Normal: 0, Attack: 0 });
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState("checking...");

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
      const { prediction, confidence } = res.data;
      const entry = { prediction, confidence, time: new Date().toLocaleTimeString() };
      setResult(entry);
      setLog(prev => [entry, ...prev.slice(0, 9)]);
      setStats(prev => ({ ...prev, [prediction]: prev[prediction] + 1 }));
    } catch (e) {
      setResult({ prediction: "Error", confidence: 0, time: "" });
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: "Normal", count: stats.Normal },
    { name: "Attack", count: stats.Attack },
  ];

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

          {result && (
            <div className={`mt-4 p-3 rounded-lg text-center text-lg font-bold ${result.prediction === "Attack" ? "bg-red-900 text-red-300" : "bg-green-900 text-green-300"}`}>
              {result.prediction === "Attack" ? "⚠️ ATTACK DETECTED" : "✅ NORMAL TRAFFIC"}
              <p className="text-sm font-normal mt-1">Confidence: {result.confidence}%</p>
            </div>
          )}
        </div>

        {/* Chart Panel */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <h2 className="text-cyan-300 font-semibold mb-4">Detection Summary</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none" }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                <Cell fill="#22c55e" />
                <Cell fill="#ef4444" />
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
                  <th className="text-left py-1">Result</th>
                  <th className="text-left py-1">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {log.map((l, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td className="py-1 text-gray-400">{l.time}</td>
                    <td className={`py-1 font-semibold ${l.prediction === "Attack" ? "text-red-400" : "text-green-400"}`}>{l.prediction}</td>
                    <td className="py-1 text-gray-300">{l.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}