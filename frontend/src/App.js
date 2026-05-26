import { useState, useEffect, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Zap, Battery, Sun, AlertTriangle, MessageSquare, Shield, Send, Bot, User } from "lucide-react";

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
  const [chatHistory, setChatHistory] = useState([
    { role: "agent", text: "¡Hola! Soy el Copilot de Solar Guardian AI ⚡\n\nEstoy monitoreando el sistema energético en tiempo real. ¿En qué te puedo ayudar hoy?" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [history] = useState(generateHistory());
  const [tab, setTab] = useState("dashboard");
  const [riskAlert, setRiskAlert] = useState(null);
  const bottomRef = useRef(null);

  const fetchEnergy = async () => {
    try {
      const res = await fetch(`${API}/api/energy`);
      const data = await res.json();
      setEnergy(data);
    } catch (e) {
      // backend may not have /api/energy yet
    }
  };

  const runAgent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/agent`, { method: "POST" });
      const data = await res.json();
      setAgentMsg(data.agent_analysis);
    } catch (e) {
      setAgentMsg("Error al conectar con el agente.");
    }
    setLoading(false);
  };

  const triggerEmergency = async () => {
    setEmergencyMode(true);
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/emergency`, { method: "POST" });
      const data = await res.json();
      setEmergencyMsg(data.emergency_protocol);
    } catch (e) {
      setEmergencyMsg("Error al activar protocolo.");
    }
    setLoading(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: "user", text: userMsg }]);
    setChatLoading(true);

    try {
      const history = chatHistory.slice(-8).map(m => ({
        role: m.role === "agent" ? "assistant" : "user",
        content: m.text
      }));

      const res = await fetch(`${API}/api/copilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: history,
          energy_data: energy || {
            battery_level: 42,
            solar_generation: 2.8,
            energy_consumption: 47.25,
            autonomy_hours: 6.2,
            risk_level: "MEDIUM",
            emergency_mode: false,
            cloud_cover: 65,
            grid_status: "UNSTABLE",
            building_type: "Centro de Salud"
          }
        }),
      });

      const data = await res.json();
      setChatHistory(prev => [...prev, { role: "agent", text: data.response }]);
      if (data.risk_alert) setRiskAlert(data.risk_alert);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: "agent", text: "⚠️ Error de conexión con el copilot." }]);
    }
    setChatLoading(false);
  };

  const handleChatKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  };

  useEffect(() => {
    fetchEnergy();
    const interval = setInterval(fetchEnergy, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  const batteryColor = energy?.battery_level > 60 ? "#22c55e" : energy?.battery_level > 30 ? "#f59e0b" : "#ef4444";
  const gridColor = energy?.grid_status === "estable" ? "#22c55e" : "#ef4444";

  const SUGGESTIONS = [
    "¿Cuántas horas de batería quedan?",
    "¿Cómo ahorro energía ahora?",
    "¿Qué sistemas debo priorizar?",
  ];

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
            background: tab === t ? (t === "copilot" ? "#7c3aed" : "#3b82f6") : "#1e293b",
            color: tab === t ? "#fff" : "#94a3b8",
            fontSize: 13, fontWeight: 600, textTransform: "capitalize"
          }}>{t === "copilot" ? "⚡ AI Copilot" : t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div>
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
          <div style={{ background: "#0f172a", border: "1px solid #4c1d95", borderRadius: 16, overflow: "hidden" }}>

            {/* Copilot Header */}
            <div style={{ background: "linear-gradient(135deg, #1e1040 0%, #0f172a 100%)", padding: "20px 24px", borderBottom: "1px solid #4c1d95", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #7c3aed, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap size={20} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>AI Energy Copilot</div>
                  <div style={{ fontSize: 11, color: "#7c3aed" }}>Solar Guardian AI · La Guajira</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ fontSize: 11, color: "#22c55e" }}>En línea</span>
              </div>
            </div>

            {/* Risk Alert */}
            {riskAlert && (
              <div style={{ background: "#450a0a", borderBottom: "1px solid #ef4444", padding: "10px 24px", display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={14} color="#ef4444" />
                <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>{riskAlert}</span>
              </div>
            )}

            {/* Energy Status Bar */}
            <div style={{ background: "#0a0f1e", borderBottom: "1px solid #1e293b", padding: "8px 24px", display: "flex", gap: 20 }}>
              <span style={{ fontSize: 11, color: "#f59e0b" }}>🔋 42%</span>
              <span style={{ fontSize: 11, color: "#f59e0b" }}>☀️ 2.8 kW</span>
              <span style={{ fontSize: 11, color: "#60a5fa" }}>⚡ 6.2h autonomía</span>
              <span style={{ fontSize: 11, color: "#fbbf24" }}>🟡 MEDIUM</span>
            </div>

            {/* Messages */}
            <div style={{ padding: 24, minHeight: 320, maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
              {chatHistory.map((msg, i) => (
                <div key={i} style={{ display: "flex", gap: 10, flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
                  {/* Avatar */}
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: msg.role === "user" ? "#92400e" : "#1e1b4b",
                    border: `1px solid ${msg.role === "user" ? "#f59e0b55" : "#7c3aed55"}`,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {msg.role === "user"
                      ? <User size={14} color="#f59e0b" />
                      : <Bot size={14} color="#a78bfa" />
                    }
                  </div>
                  {/* Bubble */}
                  <div style={{
                    maxWidth: "75%", padding: "10px 14px", borderRadius: 12,
                    borderTopRightRadius: msg.role === "user" ? 2 : 12,
                    borderTopLeftRadius: msg.role === "user" ? 12 : 2,
                    background: msg.role === "user" ? "#1e293b" : "#1e1b4b",
                    border: `1px solid ${msg.role === "user" ? "#334155" : "#4c1d9555"}`,
                    fontSize: 13, lineHeight: 1.7, color: "#e2e8f0", whiteSpace: "pre-wrap"
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {chatLoading && (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1e1b4b", border: "1px solid #7c3aed55", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Bot size={14} color="#a78bfa" />
                  </div>
                  <div style={{ padding: "12px 16px", background: "#1e1b4b", border: "1px solid #4c1d9555", borderRadius: 12, borderTopLeftRadius: 2, display: "flex", gap: 4, alignItems: "center" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", animation: "bounce 1s infinite", animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            {chatHistory.length <= 1 && (
              <div style={{ padding: "0 24px 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => { setChatInput(s); }} style={{
                    fontSize: 11, padding: "6px 12px", borderRadius: 20,
                    background: "#1e1b4b", border: "1px solid #4c1d95",
                    color: "#a78bfa", cursor: "pointer"
                  }}>{s}</button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #1e293b", display: "flex", gap: 10 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleChatKey}
                placeholder="Pregunta sobre el sistema energético..."
                style={{
                  flex: 1, background: "#0a0f1e", border: "1px solid #334155",
                  borderRadius: 10, padding: "10px 14px", color: "#e2e8f0",
                  fontSize: 13, outline: "none"
                }}
              />
              <button onClick={sendChat} disabled={!chatInput.trim() || chatLoading} style={{
                width: 44, height: 44, borderRadius: 10, border: "none", cursor: "pointer",
                background: chatInput.trim() ? "linear-gradient(135deg, #7c3aed, #f59e0b)" : "#1e293b",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: !chatInput.trim() || chatLoading ? 0.5 : 1
              }}>
                <Send size={16} color="#fff" />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}