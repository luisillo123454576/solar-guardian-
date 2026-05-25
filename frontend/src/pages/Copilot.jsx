import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Zap, AlertTriangle, RefreshCw } from "lucide-react";

// ─── Mock energy data (replace with real context/API) ──────────────────────
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

// ─── API call ───────────────────────────────────────────────────────────────
async function sendMessage(message, history, energyData) {
  const res = await fetch("/api/copilot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, energy_data: energyData }),
  });
  if (!res.ok) throw new Error("Error al contactar el copilot");
  return res.json();
}

async function getSuggestions(batteryLevel, riskLevel) {
  const res = await fetch(`/api/copilot/suggestions?battery_level=${batteryLevel}&risk_level=${riskLevel}`);
  if (!res.ok) return { suggestions: [] };
  return res.json();
}

// ─── Sub-components ─────────────────────────────────────────────────────────
function RiskBanner({ alert }) {
  if (!alert) return null;
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-300 text-sm font-medium animate-pulse">
      <AlertTriangle size={16} />
      {alert}
    </div>
  );
}

function EnergyStatusBar({ data }) {
  const batteryColor = data.battery_level > 60 ? "text-green-400" : data.battery_level > 30 ? "text-yellow-400" : "text-red-400";
  return (
    <div className="flex gap-4 text-xs text-gray-400 px-1">
      <span className={batteryColor}>🔋 {data.battery_level}%</span>
      <span className="text-yellow-400">☀️ {data.solar_generation} kW</span>
      <span className="text-blue-400">⚡ {data.autonomy_hours}h autonomía</span>
      <span className={data.risk_level === "HIGH" ? "text-red-400" : data.risk_level === "MEDIUM" ? "text-yellow-400" : "text-green-400"}>
        {data.risk_level === "HIGH" ? "🔴" : data.risk_level === "MEDIUM" ? "🟡" : "🟢"} {data.risk_level}
      </span>
    </div>
  );
}

function ChatBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? "bg-amber-500/20 border border-amber-500/40" : "bg-blue-500/20 border border-blue-500/40"}`}>
        {isUser ? <User size={14} className="text-amber-400" /> : <Bot size={14} className="text-blue-400" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? "bg-amber-500/15 border border-amber-500/25 text-amber-50 rounded-tr-sm"
          : "bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm"
      }`}>
        {msg.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/20 border border-blue-500/40">
        <Bot size={14} className="text-blue-400" />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Copilot() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "¡Hola! Soy el Copilot de Solar Guardian AI ⚡\n\nEstoy monitoreando el sistema energético en tiempo real. ¿En qué te puedo ayudar hoy?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [riskAlert, setRiskAlert] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Load suggestions on mount
  useEffect(() => {
    getSuggestions(MOCK_ENERGY.battery_level, MOCK_ENERGY.risk_level)
      .then((data) => setSuggestions(data.suggestions || []));
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    const userMsg = { role: "user", content: userText };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.slice(-8); // last 8 for context
      const data = await sendMessage(userText, history, MOCK_ENERGY);

      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      if (data.risk_alert) setRiskAlert(data.risk_alert);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Error de conexión. Verifica la API y vuelve a intentarlo." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([{ role: "assistant", content: "Chat reiniciado. ¿En qué te puedo ayudar? ⚡" }]);
    setRiskAlert(null);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0B1020] text-white">
      {/* ── Header ── */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-white">AI Energy Copilot</h1>
            <p className="text-xs text-gray-400">Solar Guardian AI · La Guajira</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-gray-400">En línea</span>
          <button onClick={clearChat} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Limpiar chat">
            <RefreshCw size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* ── Energy Status Bar ── */}
      <div className="px-6 py-2 border-b border-white/5">
        <EnergyStatusBar data={MOCK_ENERGY} />
      </div>

      {/* ── Risk Alert ── */}
      {riskAlert && (
        <div className="px-6 pt-3">
          <RiskBanner alert={riskAlert} />
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <ChatBubble key={i} msg={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ── Quick Suggestions ── */}
      {suggestions.length > 0 && messages.length <= 2 && (
        <div className="px-6 pb-2 flex gap-2 flex-wrap">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSend(s.replace(/^[^\w]+/, "").trim())}
              className="text-xs px-3 py-1.5 bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/30 rounded-full text-gray-300 hover:text-amber-300 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Input ── */}
      <div className="px-6 pb-6 pt-2 border-t border-white/10">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Pregunta sobre el sistema energético..."
              rows={1}
              className="w-full bg-white/5 border border-white/15 hover:border-white/25 focus:border-amber-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none resize-none transition-colors"
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />
          </div>
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:from-amber-400 hover:to-orange-500 transition-all active:scale-95"
          >
            <Send size={18} className="text-white" />
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">Enter para enviar · Shift+Enter nueva línea</p>
      </div>
    </div>
  );
}