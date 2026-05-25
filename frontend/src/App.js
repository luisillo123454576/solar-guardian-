import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Zap, Battery, Sun, AlertTriangle, MessageSquare, Shield } from "lucide-react";

const API = "http://127.0.0.1:8000";

const generateHistory = () => {
  return Array.from({ length: 12 }, (_, i) => ({
    hour: `${6 + i}:00`,
    solar: parseFloat((7.0 * Math.sin(Math.PI * i / 11) + Math.random() * 0.5).toFixed(2)),
    consumo: parseFloat((4 + Math.random() * 2).toFixed(2)),
  }));
};

export default function App() {
  const [energy, setEnergy] = useState(null);
  const [agentMsg, setAgentMsg] = useState("");
  const [emergencyMsg, setEmergencyMsg] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [history] = useState(generateHistory());
  const [tab, setTab] = useState("dashboard");

  const fetchEnergy = async () => {
    const res = await fetch(`${API}/api/energy`);
    const data = await res.json();
    setEnergy(data);
  };

  const runAgent = async () => {
    setLoading(true);
    const res = await fetch(`${API}/api/agent`, { method: "POST" });
    const data = await res.json();
    setAgentMsg(data.agent_analysis);
    setLoading(false);
  };

  const triggerEmergency = async () => {
    setEmergencyMode(true);
    setLoading(true);
    const res = await fetch(`${API}/api/emergency`, { method: "POST" });
    const data = await res.json();
    setEmergencyMsg(data.emergency_protocol);
    setLoading(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: "user", text: userMsg }]);
    const res = await fetch(`${API}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMsg }),
    });
    const data = await res.json();
    setChatHistory(prev => [...prev, { role: "agent", text: data.response }]);
  };

  useEffect(() => {
    fetchEnergy();
    const interval = setInterval(fetchEnergy, 5000);
    return () => clearInterval(interval);
  }, []);

  const batteryColor = energy?.battery_level > 60 ? "#22c55e" : energy?.battery_level > 30 ? "#f59e0b" : "#ef4444";
  const gridColor = energy?.grid_status === "estable" ? "#22c55e" : "#ef4444";

  return (
    <div style={{ background: "#0a0f1e", minHeight: "100vh", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      
      {/* Header */}
      <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Sun size={28} color="#f59e0b" />
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#f8fafc" }}>Solar Guardian AI</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Riohacha, La Guajira — IPS Rural</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ fontSize: 12, color: "#22c55e" }}>Sistema Activo</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: "12px 24px", background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
        {["dashboard", "agente", "emergencia", "copilot"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
            background: tab === t ? "#3b82f6" : "#1e293b",
            color: tab === t ? "#fff" : "#94a3b8",
            fontSize: 13, fontWeight: 600, textTransform: "capitalize"
          }}>{t === "copilot" ? "AI Copilot" : t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div>
            {/* Metric Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { icon: <Battery size={20} color={batteryColor} />, label: "Batería", value: `${energy?.battery_level ?? "--"}%`, color: batteryColor },
                { icon: <Sun size={20} color="#f59e0b" />, label: "Generación Solar", value: `${energy?.solar_kw ?? "--"} kW`, color: "#f59e0b" },
                { icon: <Zap size={20} color="#a78bfa" />, label: "Consumo", value: `${energy?.consumption_kw ?? "--"} kW`, color: "#a78bfa" },
                { icon: <div style={{ width: 8, height: 8, borderRadius: "50%", background: gridColor }} />, label: "Red Eléctrica", value: energy?.grid_status ?? "--", color: gridColor },
              ].map((card, i) => (
                <div key={i} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>{card.icon}<span style={{ fontSize: 12, color: "#64748b" }}>{card.label}</span></div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: card.color }}>{card.value}</div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#94a3b8" }}>Radiación Solar vs Consumo — Hoy</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="solar" stroke="#f59e0b" fill="#f59e0b22" name="Solar kW" />
                  <Area type="monotone" dataKey="consumo" stroke="#a78bfa" fill="#a78bfa22" name="Consumo kW" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Impact */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {[
                { label: "Horas Protegidas", value: "1,247 h" },
                { label: "Vacunas Preservadas", value: "3,840" },
                { label: "Energía Ahorrada", value: "2.4 MWh" },
                { label: "CO₂ Evitado", value: "1.2 ton" },
              ].map((m, i) => (
                <div key={i} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#22c55e" }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AGENTE */}
        {tab === "agente" && (
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <Shield size={22} color="#3b82f6" />
              <span style={{ fontSize: 16, fontWeight: 700 }}>Agente Autónomo de Energía</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
              {energy && [
                ["Batería", `${energy.battery_level}%`],
                ["Solar", `${energy.solar_kw} kW`],
                ["Consumo", `${energy.consumption_kw} kW`],
                ["Radiación", `${energy.radiation} kWh/m²`],
              ].map(([k, v], i) => (
                <div key={i} style={{ background: "#1e293b", borderRadius: 8, padding: 12, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b", fontSize: 13 }}>{k}</span>
                  <span style={{ color: "#f8fafc", fontWeight: 600, fontSize: 13 }}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={runAgent} disabled={loading} style={{
              background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8,
              padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 20, width: "100%"
            }}>
              {loading ? "Analizando..." : "Ejecutar Análisis del Agente"}
            </button>
            {agentMsg && (
              <div style={{ background: "#0a0f1e", border: "1px solid #3b82f6", borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 11, color: "#3b82f6", marginBottom: 8, fontWeight: 600 }}>ANÁLISIS DEL AGENTE</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "#e2e8f0", whiteSpace: "pre-wrap" }}>{agentMsg}</div>
              </div>
            )}
          </div>
        )}

        {/* EMERGENCIA */}
        {tab === "emergencia" && (
          <div style={{ background: "#0f172a", border: `1px solid ${emergencyMode ? "#ef4444" : "#1e293b"}`, borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <AlertTriangle size={22} color="#ef4444" />
              <span style={{ fontSize: 16, fontWeight: 700 }}>Modo Emergencia</span>
            </div>
            <div style={{ background: "#1a0a0a", border: "1px solid #ef444433", borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: "#ef4444", marginBottom: 4, fontWeight: 600 }}>PRIORIDADES CRÍTICAS</div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>🔴 Refrigeración médica (vacunas)</div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>🔴 Comunicaciones de emergencia</div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>🟡 Bombeo de agua</div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>🟢 Iluminación secundaria</div>
            </div>
            <button onClick={triggerEmergency} disabled={loading} style={{
              background: "#ef4444", color: "#fff", border: "none", borderRadius: 8,
              padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 20, width: "100%"
            }}>
              {loading ? "Activando protocolo..." : "SIMULAR APAGÓN — Activar Protocolo"}
            </button>
            {emergencyMsg && (
              <div style={{ background: "#0a0f1e", border: "1px solid #ef4444", borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 8, fontWeight: 600 }}>PROTOCOLO DE EMERGENCIA ACTIVO</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "#e2e8f0", whiteSpace: "pre-wrap" }}>{emergencyMsg}</div>
              </div>
            )}
          </div>
        )}

        {/* COPILOT */}
        {tab === "copilot" && (
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <MessageSquare size={22} color="#a78bfa" />
              <span style={{ fontSize: 16, fontWeight: 700 }}>AI Energy Copilot</span>
            </div>
            <div style={{ background: "#0a0f1e", borderRadius: 8, padding: 16, minHeight: 280, marginBottom: 16, overflowY: "auto", maxHeight: 340 }}>
              {chatHistory.length === 0 && (
                <div style={{ color: "#334155", fontSize: 13, textAlign: "center", marginTop: 80 }}>
                  Preguntá algo al copiloto energético...<br />
                  <span style={{ fontSize: 12 }}>"¿Cuánto dura la batería?" · "¿Cómo ahorro energía?" · "¿Qué causó el pico de consumo?"</span>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} style={{ marginBottom: 12, display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    background: msg.role === "user" ? "#3b82f6" : "#1e293b",
                    borderRadius: 8, padding: "10px 14px", maxWidth: "80%",
                    fontSize: 13, lineHeight: 1.6, color: "#e2e8f0"
                  }}>{msg.text}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()}
                placeholder="Escribí tu pregunta energética..."
                style={{
                  flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: 8,
                  padding: "10px 14px", color: "#e2e8f0", fontSize: 13, outline: "none"
                }}
              />
              <button onClick={sendChat} style={{
                background: "#a78bfa", color: "#fff", border: "none", borderRadius: 8,
                padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer"
              }}>Enviar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}