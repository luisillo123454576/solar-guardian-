import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Zap, AlertTriangle, RefreshCw } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

const MOCK_ENERGY = {
  battery_level: 42,
  solar_generation: 2.8,
  energy_consumption: 47.25,
  autonomy_hours: 6.2,
  risk_level: "MEDIUM",
  emergency_mode: false,
  cloud_cover: 65,
  grid_status: "UNSTABLE",
  building_type: "Centro de Salud",
  current_time: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
};

async function sendMessage(message, history, energyData) {
  const res = await fetch(`${API_BASE}/api/copilot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, energy_data: energyData }),
  });
  if (!res.ok) throw new Error("Error al contactar el copilot");
  return res.json();
}

async function getSuggestions(batteryLevel, riskLevel) {
  const battery = batteryLevel ?? 100;
  const risk = riskLevel ?? "LOW";
  const res = await fetch(`${API_BASE}/api/copilot/suggestions?battery_level=${battery}&risk_level=${risk}`);
  if (!res.ok) return { suggestions: [] };
  return res.json();
}

function RiskBanner({ alert }) {
  if (!alert) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:8, color:"#dc2626", fontSize:13, fontWeight:500 }}>
      <AlertTriangle size={15} />
      {alert}
    </div>
  );
}

function EnergyStatusBar({ data }) {
  const batteryColor = data.battery_level > 60 ? "#16a34a" : data.battery_level > 30 ? "#ca8a04" : "#dc2626";
  return (
    <div style={{ display:"flex", gap:20, fontSize:12, color:"#6b7280" }}>
      <span style={{ color: batteryColor, fontWeight:600 }}>🔋 {data.battery_level}%</span>
      <span style={{ color:"#b45309", fontWeight:600 }}>☀️ {data.solar_generation} kW</span>
      <span style={{ color:"#1d4ed8", fontWeight:600 }}>⚡ {data.autonomy_hours}h autonomía</span>
      <span style={{ color: data.risk_level === "HIGH" ? "#dc2626" : data.risk_level === "MEDIUM" ? "#ca8a04" : "#16a34a", fontWeight:600 }}>
        {data.risk_level === "HIGH" ? "🔴" : data.risk_level === "MEDIUM" ? "🟡" : "🟢"} {data.risk_level}
      </span>
    </div>
  );
}

function ChatBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display:"flex", gap:10, flexDirection: isUser ? "row-reverse" : "row", alignItems:"flex-start" }}>
      <div style={{
        width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
        background: isUser ? "rgba(255,138,0,0.12)" : "rgba(59,130,246,0.1)",
        border: `1px solid ${isUser ? "rgba(255,138,0,0.3)" : "rgba(59,130,246,0.25)"}`,
      }}>
        {isUser ? <User size={14} style={{ color:"#ff8a00" }} /> : <Bot size={14} style={{ color:"#3b82f6" }} />}
      </div>
      <div style={{
        maxWidth:"72%", padding:"10px 14px", borderRadius:14, fontSize:13.5, lineHeight:1.65,
        borderTopRightRadius: isUser ? 3 : 14,
        borderTopLeftRadius: isUser ? 14 : 3,
        background: isUser ? "rgba(255,138,0,0.08)" : "#f8f9fa",
        border: `1px solid ${isUser ? "rgba(255,138,0,0.2)" : "rgba(131,117,105,0.12)"}`,
        color: "#1a1c1e",
        whiteSpace: "pre-wrap",
        fontFamily: "'Geist', sans-serif",
      }}>
        {msg.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
      <div style={{ width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.25)" }}>
        <Bot size={14} style={{ color:"#3b82f6" }} />
      </div>
      <div style={{ background:"#f8f9fa", border:"1px solid rgba(131,117,105,0.12)", borderRadius:14, borderTopLeftRadius:3, padding:"12px 16px", display:"flex", gap:5, alignItems:"center" }}>
        {[0,1,2].map(i => (
          <span key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#3b82f6", display:"inline-block", animation:"bounce 1s infinite", animationDelay:`${i*0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

export default function Copilot({ energy }) {
  const currentEnergy = energy || MOCK_ENERGY;
  const [messages, setMessages] = useState([
    { role:"assistant", content:"¡Hola! Soy el Copilot de Solar Guardian AI ⚡\n\nEstoy monitoreando el sistema energético en tiempo real. ¿En qué te puedo ayudar hoy?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [riskAlert, setRiskAlert] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    getSuggestions(currentEnergy.battery_level, currentEnergy.risk_level)
      .then(d => setSuggestions(d.suggestions || []));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, loading]);

  const handleSend = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setMessages(p => [...p, { role:"user", content:userText }]);
    setInput("");
    setLoading(true);
    try {
      const data = await sendMessage(userText, messages.slice(-8), currentEnergy);
      setMessages(p => [...p, { role:"assistant", content:data.response }]);
      if (data.risk_alert) setRiskAlert(data.risk_alert);
    } catch {
      setMessages(p => [...p, { role:"assistant", content:"⚠️ Error de conexión. Verifica la API y vuelve a intentarlo." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const clearChat = () => {
    setMessages([{ role:"assistant", content:"Chat reiniciado. ¿En qué te puedo ayudar? ⚡" }]);
    setRiskAlert(null);
  };

  return (
    <div style={{
      display:"flex", flexDirection:"column",
      height:"100%",
      background:"#ffffff",
      borderRadius:16,
      border:"1px solid rgba(131,117,105,0.12)",
      overflow:"hidden",
      boxShadow:"0 4px 20px -2px rgba(131,117,105,0.08)",
    }}>

      {/* Header */}
      <div style={{ borderBottom:"1px solid rgba(131,117,105,0.1)", padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0, background:"#fff" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,#ff8a00,#e65c00)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Zap size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:"#1a1c1e", fontFamily:"'Geist',sans-serif" }}>Copilot Energético IA</div>
            <div style={{ fontSize:11, color:"#837569", fontFamily:"'JetBrains Mono',monospace" }}>Solar Guardian AI · La Guajira</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e", display:"inline-block" }} />
          <span style={{ fontSize:12, color:"#6b7280", fontFamily:"'Geist',sans-serif" }}>En línea</span>
          <button onClick={clearChat} style={{ padding:6, background:"transparent", border:"1px solid rgba(131,117,105,0.15)", cursor:"pointer", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }} title="Limpiar chat">
            <RefreshCw size={14} color="#837569" />
          </button>
        </div>
      </div>

      {/* Energy bar */}
      <div style={{ padding:"10px 20px", borderBottom:"1px solid rgba(131,117,105,0.08)", flexShrink:0, background:"#faf8f6" }}>
        <EnergyStatusBar data={currentEnergy} />
      </div>

      {/* Risk alert */}
      {riskAlert && (
        <div style={{ padding:"10px 20px 0", flexShrink:0 }}>
          <RiskBanner alert={riskAlert} />
        </div>
      )}

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"20px", display:"flex", flexDirection:"column", gap:14, minHeight:0, background:"#fff" }}>
        {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && messages.length <= 2 && (
        <div style={{ padding:"0 20px 10px", display:"flex", gap:8, flexWrap:"wrap", flexShrink:0, background:"#fff" }}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => handleSend(s.replace(/^[^\w]+/, "").trim())} style={{
              fontSize:12, padding:"5px 12px",
              background:"rgba(255,138,0,0.06)",
              border:"1px solid rgba(255,138,0,0.2)",
              borderRadius:999, color:"#51453a", cursor:"pointer",
              fontFamily:"'Geist',sans-serif",
            }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding:"12px 20px 16px", borderTop:"1px solid rgba(131,117,105,0.1)", flexShrink:0, background:"#fff" }}>
        <div style={{ display:"flex", gap:10, alignItems:"flex-end" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Pregunta sobre el sistema energético..."
            rows={1}
            style={{
              flex:1,
              background:"#f8f9fa",
              border:"1px solid rgba(131,117,105,0.2)",
              borderRadius:10, padding:"10px 14px",
              fontSize:13.5, color:"#1a1c1e",
              outline:"none", resize:"none",
              minHeight:44, maxHeight:110,
              fontFamily:"'Geist',sans-serif",
              lineHeight:1.5,
            }}
          />
          <button onClick={() => handleSend()} disabled={!input.trim() || loading} style={{
            width:44, height:44, borderRadius:10, flexShrink:0,
            background: (!input.trim() || loading) ? "rgba(255,138,0,0.3)" : "#ff8a00",
            border:"none", cursor: (!input.trim() || loading) ? "not-allowed" : "pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow: (!input.trim() || loading) ? "none" : "0 2px 8px rgba(255,138,0,0.3)",
            transition:"all 0.15s",
          }}>
            <Send size={16} color="white" />
          </button>
        </div>
        <p style={{ fontSize:11, color:"#9ca3af", marginTop:7, textAlign:"center", fontFamily:"'JetBrains Mono',monospace" }}>
          Enter para enviar · Shift+Enter nueva línea
        </p>
      </div>
    </div>
  );
}