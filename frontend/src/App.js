import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Send, Bot, User, Zap, AlertTriangle, RefreshCw } from "lucide-react";

const API = "http://127.0.0.1:8000";

// ── helpers ──────────────────────────────────────────────────────────────────
const generateHistory = () =>
  Array.from({ length: 12 }, (_, i) => ({
    hour: `${String(6 + i).padStart(2, "0")}:00`,
    solar: parseFloat((7.0 * Math.sin(Math.PI * i / 11) * 2.5 + Math.random() * 0.4).toFixed(2)),
    consumo: parseFloat((4 + Math.random() * 2).toFixed(2)),
  }));

const pulse = `
@keyframes pulse-ring {
  0% { transform:scale(1); opacity:1; }
  50% { transform:scale(1.6); opacity:0.4; }
  100% { transform:scale(1); opacity:1; }
}
@keyframes march {
  from { stroke-dashoffset: 20; }
  to   { stroke-dashoffset: 0; }
}
@keyframes spin-slow { to { transform: rotate(360deg); } }
@keyframes fade-up {
  from { opacity:0; transform:translateY(12px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes pulsate-red {
  0%,100% { opacity:1; }
  50% { opacity:0.35; }
}
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}
`;

// ── MOCK ENERGY (fallback cuando no hay API) ─────────────────────────────────
const MOCK_ENERGY_FALLBACK = {
  battery_level: 42,
  solar_generation: 2.8,
  solar_kw: 12.4,
  energy_consumption: 47.25,
  autonomy_hours: 6.2,
  risk_level: "MEDIUM",
  emergency_mode: false,
  cloud_cover: 65,
  grid_status: "UNSTABLE",
  building_type: "Centro de Salud",
  radiation: 7.2,
  current_time: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
};

// ── API calls ────────────────────────────────────────────────────────────────
async function sendCopilotMessage(message, history, energyData) {
  try {
    const res = await fetch(`${API}/api/copilot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, energy_data: energyData }),
    });
    if (!res.ok) throw new Error("Error al contactar el copilot");
    return await res.json();
  } catch (error) {
    console.error("Error en sendCopilotMessage:", error);
    // Respuesta simulada cuando no hay backend
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes("batería") || lowerMsg.includes("bateria")) {
      return { response: `🔋 La batería está al ${energyData?.battery_level || 42}% de capacidad.`, risk_alert: null };
    }
    if (lowerMsg.includes("riesgo")) {
      return { response: `⚠️ Nivel de riesgo: ${energyData?.risk_level || "MEDIUM"}`, risk_alert: null };
    }
    return { 
      response: "✅ Sistema operando normalmente. ¿Necesitas información sobre batería, consumo o riesgo?", 
      risk_alert: null 
    };
  }
}

async function getCopilotSuggestions(batteryLevel, riskLevel) {
  try {
    const res = await fetch(`${API}/api/copilot/suggestions?battery_level=${batteryLevel}&risk_level=${riskLevel}`);
    if (!res.ok) return { suggestions: [] };
    return await res.json();
  } catch (error) {
    console.error("Error obteniendo sugerencias:", error);
    // Sugerencias simuladas
    return { 
      suggestions: [
        "🔋 ¿Cuál es el nivel de batería?",
        "⚠️ ¿Hay algún riesgo en el sistema?",
        "📊 Muéstrame el consumo actual"
      ] 
    };
  }
}

// ── Subcomponentes ────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, onEmergencyOverride }) {
  const items = [
    { key: "dashboard",  icon: "dashboard",            label: "Dashboard" },
    { key: "emergency",  icon: "warning",              label: "Emergency Mode" },
    { key: "copilot",    icon: "psychology",           label: "AI Copilot" },
    { key: "map",        icon: "map",                  label: "Community Map" },
    { key: "forecast",   icon: "query_stats",          label: "Forecasting" },
    { key: "analytics",  icon: "monitoring",           label: "Analytics" },
    { key: "infra",      icon: "account_tree",         label: "Infrastructure" },
    { key: "alerts",     icon: "notifications_active", label: "Alerts" },
    { key: "settings",   icon: "settings",             label: "Settings" },
  ];
  return (
    <aside style={{
      width:256, height:"100vh", position:"fixed", left:0, top:0,
      background:"rgba(255,255,255,0.92)", backdropFilter:"blur(12px)",
      borderRight:"1px solid rgba(131,117,105,0.15)",
      display:"flex", flexDirection:"column", padding:"24px 16px", zIndex:50,
    }}>
      <div style={{ marginBottom:40, padding:"0 8px" }}>
        <div style={{ fontFamily:"'Geist',sans-serif", fontSize:24, fontWeight:700, color:"#ff8a00", letterSpacing:"-0.02em" }}>
          Solar Guardian AI
        </div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#837569", letterSpacing:"0.2em", textTransform:"uppercase", marginTop:4 }}>
          Precision Intelligence
        </div>
      </div>

      <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:2 }}>
        {items.map(({ key, icon, label }) => {
          const isActive = active === key;
          return (
            <button key={key} onClick={() => setActive(key)} style={{
              display:"flex", alignItems:"center", gap:12,
              padding:"10px 12px", borderRadius:8, border:"none", cursor:"pointer",
              background: isActive ? "rgba(255,138,0,0.08)" : "transparent",
              color: isActive ? "#ff8a00" : "#51453a",
              fontFamily:"'Geist',sans-serif", fontSize:15, fontWeight: isActive ? 700 : 400,
              borderRight: isActive ? "3px solid #ff8a00" : "3px solid transparent",
              transition:"all 0.25s ease", textAlign:"left",
            }}
            onMouseEnter={e => { if(!isActive){ e.currentTarget.style.background="rgba(255,138,0,0.05)"; e.currentTarget.style.color="#ff8a00"; e.currentTarget.style.paddingLeft="20px"; }}}
            onMouseLeave={e => { if(!isActive){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#51453a"; e.currentTarget.style.paddingLeft="12px"; }}}
            >
              <span className="material-symbols-outlined" style={{ fontSize:22 }}>{icon}</span>
              {label}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop:"auto", paddingTop:24, borderTop:"1px solid rgba(131,117,105,0.15)" }}>
        <button onClick={onEmergencyOverride} style={{
          width:"100%", padding:"14px", background:"#ff8a00", color:"#fff",
          border:"none", borderRadius:10, fontFamily:"'Geist',sans-serif",
          fontWeight:700, fontSize:13, letterSpacing:"0.05em", cursor:"pointer",
          boxShadow:"0 4px 16px rgba(255,138,0,0.3)", transition:"transform 0.15s",
        }}
        onMouseDown={e=>e.currentTarget.style.transform="scale(0.97)"}
        onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
        >
          Emergency Override
        </button>
      </div>
    </aside>
  );
}

function TopBar({ activeView, onSimulateBlackout, isEmergency }) {
  return (
    <header style={{
      position:"fixed", top:0, right:0, left:256, height:80,
      background:"rgba(252,249,247,0.85)", backdropFilter:"blur(16px)",
      borderBottom:"1px solid rgba(213,195,182,0.3)",
      display:"flex", justifyContent:"space-between", alignItems:"center",
      padding:"0 24px", zIndex:40,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:32 }}>
        <span style={{ fontFamily:"'Geist',sans-serif", fontSize:22, fontWeight:600, color:"#1a1c1e" }}>
          Wayuu Resilience Hub
        </span>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          {isEmergency ? (
            <span style={{ display:"flex", alignItems:"center", gap:8, color:"#ba1a1a", fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, animation:"pulsate-red 2s infinite" }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:"#ba1a1a", display:"inline-block" }}/>
              BLACKOUT DETECTED
            </span>
          ) : (
            <span style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:"#ff8a00", display:"inline-block", animation:"pulse-ring 2s infinite" }}/>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:"#ff8a00", fontWeight:700 }}>Connected</span>
            </span>
          )}
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#51453a" }}>98h Autonomy</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#51453a" }}>99% Stability</span>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={onSimulateBlackout} style={{
          padding:"8px 18px", border:`1px solid ${isEmergency ? "#ba1a1a" : "rgba(131,117,105,0.3)"}`,
          background: isEmergency ? "rgba(186,26,26,0.08)" : "transparent",
          color: isEmergency ? "#ba1a1a" : "#51453a",
          borderRadius:8, fontFamily:"'Geist',sans-serif", fontSize:13, fontWeight:600, cursor:"pointer",
          transition:"all 0.2s",
        }}>
          {isEmergency ? "Cancel Simulation" : "Simulate Blackout"}
        </button>
        <div style={{ width:40, height:40, borderRadius:"50%", background:"#ff8a00", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span className="material-symbols-outlined" style={{ color:"#fff", fontSize:20 }}>monitor_heart</span>
        </div>
      </div>
    </header>
  );
}

// ── DASHBOARD VIEW ────────────────────────────────────────────────────────────
function DashboardView({ energy, agentMsg, onRunAgent, loading, history }) {
  const currentEnergy = energy || MOCK_ENERGY_FALLBACK;
  const score = Math.min(99.9, 60 + currentEnergy.battery_level * 0.35 + (currentEnergy.solar_kw || 12.4) * 0.8);
  const circumference = 2 * Math.PI * 88;
  const offset = circumference * (1 - score / 100);

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(12,1fr)", gap:24 }}>

      {/* Hero AI Score */}
      <div style={{
        gridColumn:"span 8", background:"rgba(255,255,255,0.7)", backdropFilter:"blur(12px)",
        border:"1px solid rgba(131,117,105,0.1)", borderRadius:16, padding:32,
        display:"flex", alignItems:"center", gap:40,
        boxShadow:"0 4px 20px -2px rgba(131,117,105,0.1)",
      }}>
        <div style={{ position:"relative", width:192, height:192, flexShrink:0 }}>
          <svg width="192" height="192" style={{ transform:"rotate(-90deg)" }}>
            <circle cx="96" cy="96" r="88" fill="transparent" stroke="#f1edeb" strokeWidth="12"/>
            <circle cx="96" cy="96" r="88" fill="transparent"
              stroke="#ff8a00" strokeWidth="12" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              style={{ filter:"drop-shadow(0 0 8px rgba(255,138,0,0.3))", transition:"stroke-dashoffset 1s ease" }}
            />
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontFamily:"'Geist',sans-serif", fontSize:36, fontWeight:300, color:"#ff8a00", lineHeight:1 }}>{score.toFixed(1)}%</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#837569", textTransform:"uppercase", letterSpacing:"0.1em", marginTop:4 }}>Optimal</span>
          </div>
        </div>
        <div style={{ flex:1 }}>
          <h2 style={{ fontFamily:"'Geist',sans-serif", fontSize:28, fontWeight:600, color:"#1a1c1e", marginBottom:8 }}>AI Resilience Score</h2>
          <p style={{ fontFamily:"'Geist',sans-serif", color:"#51453a", lineHeight:1.7, marginBottom:24, fontSize:15 }}>
            System performing at peak efficiency. All neural nodes synchronized with La Guajira solar peak.
            Predicted autonomy remains above safety threshold for the next 4 days.
          </p>
          <div style={{ display:"flex", gap:12 }}>
            <button onClick={onRunAgent} disabled={loading} style={{
              background:"#ff8a00", color:"#fff", border:"none", borderRadius:10,
              padding:"12px 24px", fontFamily:"'Geist',sans-serif", fontWeight:700, fontSize:14,
              cursor:"pointer", display:"flex", alignItems:"center", gap:8,
              boxShadow:"0 4px 14px rgba(255,138,0,0.25)", transition:"transform 0.15s",
            }}
            onMouseDown={e=>e.currentTarget.style.transform="scale(0.97)"}
            onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
            >
              <span className="material-symbols-outlined" style={{ fontSize:18 }}>bolt</span>
              {loading ? "Analyzing..." : "Optimize Now"}
            </button>
            <button style={{
              border:"1px solid rgba(131,117,105,0.2)", background:"transparent",
              color:"#1a1c1e", borderRadius:10, padding:"12px 24px",
              fontFamily:"'Geist',sans-serif", fontSize:14, cursor:"pointer",
            }}>View Full Report</button>
          </div>
          {agentMsg && (
            <div style={{ marginTop:16, padding:14, background:"rgba(255,138,0,0.06)", borderRadius:10, border:"1px solid rgba(255,138,0,0.15)", animation:"fade-up 0.4s ease" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#ff8a00", fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.1em" }}>Agent Analysis</div>
              <div style={{ fontFamily:"'Geist',sans-serif", fontSize:13, color:"#51453a", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{agentMsg}</div>
            </div>
          )}
        </div>
      </div>

      {/* Weather Card */}
      <div style={{
        gridColumn:"span 4", background:"rgba(255,255,255,0.7)", backdropFilter:"blur(12px)",
        border:"1px solid rgba(131,117,105,0.1)", borderRadius:16, padding:32,
        boxShadow:"0 4px 20px -2px rgba(131,117,105,0.1)",
        display:"flex", flexDirection:"column", justifyContent:"space-between",
      }}>
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#837569", textTransform:"uppercase", letterSpacing:"0.1em" }}>Guajira Sun</span>
            <span className="material-symbols-outlined" style={{ color:"#ff8a00", fontSize:24 }}>wb_sunny</span>
          </div>
          <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:6 }}>
            <span style={{ fontFamily:"'Geist',sans-serif", fontSize:40, fontWeight:300, color:"#1a1c1e", lineHeight:1 }}>
              {currentEnergy ? Math.round(currentEnergy.radiation * 1000 / 7) + 650 : 1045}
            </span>
            <span style={{ color:"#51453a", fontSize:16 }}>W/m²</span>
          </div>
          <p style={{ fontFamily:"'Geist',sans-serif", fontSize:13, color:"#51453a" }}>Peak irradiance achieved at 13:42</p>
        </div>
        <div style={{ height:96, marginTop:16, position:"relative" }}>
          <svg width="100%" height="80" viewBox="0 0 100 40" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gradSun" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ff8a00" stopOpacity="1"/>
                <stop offset="100%" stopColor="#ff8a00" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d="M0 40 Q 25 10 50 25 T 100 5" fill="none" stroke="#ff8a00" strokeWidth="2"/>
            <path d="M0 40 Q 25 10 50 25 T 100 5 V 40 H 0 Z" fill="url(#gradSun)" opacity="0.15"/>
          </svg>
          <div style={{ display:"flex", justifyContent:"space-between", fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#837569", marginTop:4 }}>
            <span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      {[
        { label:"Solar Generation", icon:"solar_power", value: currentEnergy ? `${currentEnergy.solar_kw || 12.4} kW` : "12.4 kW", sub:"+8% from yesterday", accent:"#ff8a00", border:true },
        { label:"Battery Level",    icon:"battery_charging_90", value: currentEnergy ? `${currentEnergy.battery_level}%` : "82%", sub:"Charging active (Grid Assist)", accent:"#ff8a00", border:false },
        { label:"Grid Stability",   icon:"security", value: currentEnergy?.grid_status === "estable" ? "99.9%" : "72.1%",
          sub: `Status: ${currentEnergy?.grid_status || "estable"}`, accent:"#a93720", border:false },
      ].map((card, i) => (
        <div key={i} style={{
          gridColumn:"span 4",
          background:"rgba(255,255,255,0.7)", backdropFilter:"blur(12px)",
          border:"1px solid rgba(131,117,105,0.1)",
          borderLeft: card.border ? `4px solid ${card.accent}` : "1px solid rgba(131,117,105,0.1)",
          borderRadius:16, padding:24,
          boxShadow:"0 4px 20px -2px rgba(131,117,105,0.1)", position:"relative", overflow:"hidden",
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#837569", textTransform:"uppercase", letterSpacing:"0.08em" }}>{card.label}</span>
            <span className="material-symbols-outlined" style={{ color:card.accent, fontSize:22 }}>{card.icon}</span>
          </div>
          <div style={{ fontFamily:"'Geist',sans-serif", fontSize:30, fontWeight:700, color:"#1a1c1e", marginBottom:12 }}>{card.value}</div>
          <div style={{ fontFamily:"'Geist',sans-serif", fontSize:12, color:"#51453a", display:"flex", alignItems:"center", gap:4 }}>
            {i === 0 && <span className="material-symbols-outlined" style={{ fontSize:14, color:card.accent }}>trending_up</span>}
            {i === 1 && <span style={{ width:8, height:8, borderRadius:"50%", background:card.accent, display:"inline-block", animation:"pulse-ring 2s infinite" }}/>}
            {card.sub}
          </div>
          {i === 1 && (
            <div style={{ position:"absolute", bottom:0, left:0, height:3, background:`rgba(255,138,0,0.2)`, width:`${currentEnergy?.battery_level ?? 82}%`, transition:"width 1s ease" }}/>
          )}
        </div>
      ))}

      {/* Energy Flow */}
      <div style={{
        gridColumn:"span 7", background:"rgba(255,255,255,0.7)", backdropFilter:"blur(12px)",
        border:"1px solid rgba(131,117,105,0.1)", borderRadius:16, padding:32,
        boxShadow:"0 4px 20px -2px rgba(131,117,105,0.1)",
      }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#837569", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:24 }}>Grid Energy Flow</div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={history}>
            <defs>
              <linearGradient id="gradArea1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff8a00" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#ff8a00" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gradArea2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a93720" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#a93720" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(131,117,105,0.1)"/>
            <XAxis dataKey="hour" tick={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fill:"#837569" }}/>
            <YAxis tick={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fill:"#837569" }}/>
            <Tooltip contentStyle={{ background:"rgba(255,255,255,0.95)", border:"1px solid rgba(131,117,105,0.2)", borderRadius:8, fontFamily:"'Geist',sans-serif", fontSize:12 }}/>
            <Area type="monotone" dataKey="solar" stroke="#ff8a00" strokeWidth={2} fill="url(#gradArea1)" name="Solar kW"/>
            <Area type="monotone" dataKey="consumo" stroke="#a93720" strokeWidth={2} fill="url(#gradArea2)" name="Consumo kW"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* AI Activity Feed */}
      <ActivityFeed />

      {/* Impact KPIs */}
      {[
        { label:"Horas Protegidas", value:"1,247 h" },
        { label:"Vacunas Preservadas", value:"3,840" },
        { label:"Energía Ahorrada", value:"2.4 MWh" },
        { label:"CO₂ Evitado", value:"1.2 ton" },
      ].map((m, i) => (
        <div key={i} style={{
          gridColumn:"span 3", background:"rgba(255,255,255,0.7)", backdropFilter:"blur(12px)",
          border:"1px solid rgba(131,117,105,0.1)", borderRadius:16, padding:20, textAlign:"center",
          boxShadow:"0 4px 20px -2px rgba(131,117,105,0.1)",
        }}>
          <div style={{ fontFamily:"'Geist',sans-serif", fontSize:26, fontWeight:700, color:"#ff8a00", lineHeight:1 }}>{m.value}</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#837569", textTransform:"uppercase", letterSpacing:"0.08em", marginTop:8 }}>{m.label}</div>
        </div>
      ))}
    </div>
  );
}

function ActivityFeed() {
  const [items, setItems] = useState([
    { color:"#ff8a00", text:"AI optimizing battery discharge for peak demand", time:"14s ago", node:"Energy Efficiency Node" },
    { color:"#a93720", text:"Infrastructure health: Nominal", time:"2m ago", node:"Maintenance Protocol 4" },
    { color:"#837569", text:"Weather update received: 48h Clear Sky", time:"12m ago", node:"Forecast Hub" },
    { color:"#ffb77f", text:"Backup protocols engaged: Area C synchronization", time:"1h ago", node:"Redundancy Check" },
  ]);

  const messages = [
    "Calibrating solar array angle for sunset...",
    "Cooling systems activated in Node 7",
    "Community usage dip detected: adjusting reserves",
    "Self-diagnostic complete: 100% integrity",
    "Predictive load balancing applied to medical zone",
  ];

  useEffect(() => {
    const t = setInterval(() => {
      setItems(prev => [
        { color:"#ff8a00", text: messages[Math.floor(Math.random()*messages.length)], time:"just now", node:"AI Guardian" },
        ...prev.slice(0, 3)
      ]);
    }, 12000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      gridColumn:"span 5", background:"rgba(255,255,255,0.7)", backdropFilter:"blur(12px)",
      border:"1px solid rgba(131,117,105,0.1)", borderRadius:16, padding:32,
      boxShadow:"0 4px 20px -2px rgba(131,117,105,0.1)",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#837569", textTransform:"uppercase", letterSpacing:"0.1em" }}>AI Activity Feed</span>
        <span className="material-symbols-outlined" style={{ color:"#ff8a00", fontSize:20, animation:"spin-slow 4s linear infinite" }}>progress_activity</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display:"flex", gap:16, animation: i===0 ? "fade-up 0.4s ease" : "none" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:item.color, flexShrink:0, marginTop:6 }}/>
            <div>
              <p style={{ fontFamily:"'Geist',sans-serif", fontSize:13, fontWeight:600, color:"#1a1c1e", marginBottom:2 }}>{item.text}</p>
              <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#837569" }}>{item.time} • {item.node}</p>
            </div>
          </div>
        ))}
      </div>
      <button style={{
        width:"100%", marginTop:24, paddingTop:16, borderTop:"1px solid rgba(131,117,105,0.1)",
        background:"transparent", border:"none", cursor:"pointer",
        fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#837569",
        textTransform:"uppercase", letterSpacing:"0.15em",
      }}>View Full Logs</button>
    </div>
  );
}

// ── EMERGENCY VIEW ────────────────────────────────────────────────────────────
function EmergencyView({ energy, emergencyMsg, onTrigger, loading }) {
  const currentEnergy = energy || MOCK_ENERGY_FALLBACK;
  const autonomy = Math.round(currentEnergy.battery_level * 0.18);

  return (
    <div>
      <div style={{
        background:"#ffdad6", border:"2px solid #ba1a1a", borderRadius:16,
        padding:24, marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center",
        boxShadow:"0 8px 30px rgba(186,26,26,0.12)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ background:"#ba1a1a", width:48, height:48, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span className="material-symbols-outlined" style={{ color:"#fff", fontSize:28, animation:"pulsate-red 2s infinite" }}>emergency_home</span>
          </div>
          <div>
            <h2 style={{ fontFamily:"'Geist',sans-serif", fontSize:22, fontWeight:700, color:"#410002", margin:0 }}>GRID FAILURE DETECTED</h2>
            <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"rgba(65,0,2,0.7)", textTransform:"uppercase", letterSpacing:"0.1em", marginTop:4 }}>
              Autonomous redistribution active • Health Center prioritized
            </p>
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'Geist',sans-serif", fontSize:40, fontWeight:300, color:"#410002", lineHeight:1 }}>{autonomy}h 22m</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"rgba(65,0,2,0.6)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Estimated Autonomy</div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:24 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
          <div style={{
            background:"rgba(255,255,255,0.9)", backdropFilter:"blur(12px)",
            border:"1px solid rgba(131,117,105,0.1)", borderRadius:20, padding:32,
            boxShadow:"0 4px 20px -2px rgba(131,117,105,0.08)",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:32 }}>
              <div>
                <h3 style={{ fontFamily:"'Geist',sans-serif", fontSize:20, fontWeight:600, color:"#1a1c1e", margin:0 }}>Power Distribution Flow</h3>
                <p style={{ fontFamily:"'Geist',sans-serif", fontSize:13, color:"#51453a", marginTop:4 }}>AI Agent redistributing active current to medical priority zones.</p>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <span style={{ background:"#f1edeb", padding:"6px 12px", borderRadius:8, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:"#ba1a1a" }}>OFF: SCHOOL ZONE</span>
                <span style={{ background:"#ffdcc4", padding:"6px 12px", borderRadius:8, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:"#2f1500" }}>LIVE: CLINIC</span>
              </div>
            </div>
            <svg width="100%" height="160" viewBox="0 0 400 160">
              <line x1="90" y1="80" x2="160" y2="80" stroke="#ff8a00" strokeWidth="3" strokeDasharray="4,6"
                style={{ animation:"march 1.5s linear infinite" }}/>
              <line x1="240" y1="80" x2="310" y2="50" stroke="#ff8a00" strokeWidth="3" strokeDasharray="4,6"
                style={{ animation:"march 1.5s linear infinite" }}/>
              <line x1="240" y1="80" x2="310" y2="120" stroke="#ba1a1a" strokeWidth="2" opacity="0.3"/>
              <text x="270" y="115" fontFamily="'JetBrains Mono',monospace" fontSize="9" fill="#ba1a1a" fontWeight="700">SEVERED</text>

              <rect x="30" y="55" width="60" height="50" rx="8" fill="white" stroke="#ffb77f" strokeWidth="1.5"/>
              <text x="60" y="120" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="9" fill="#837569">SOLAR</text>

              <circle cx="200" cy="80" r="40" fill="white" stroke="#ff8a00" strokeWidth="3"/>
              <text x="200" y="76" textAnchor="middle" fontFamily="'Geist',sans-serif" fontSize="16" fontWeight="700" fill="#ff8a00">{currentEnergy?.battery_level ?? 82}%</text>
              <text x="200" y="100" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="9" fill="#837569">STORAGE</text>

              <rect x="320" y="25" width="60" height="50" rx="8" fill="#ffdcc4" stroke="#ff8a00" strokeWidth="2"/>
              <text x="350" y="86" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="9" fill="#ff8a00" fontWeight="700">CLINIC</text>

              <rect x="320" y="95" width="60" height="50" rx="8" fill="#f1edeb" stroke="#837569" strokeWidth="1.5" opacity="0.5"/>
              <text x="350" y="156" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="9" fill="#837569" opacity="0.5">SCHOOL</text>
            </svg>
          </div>

          <button onClick={onTrigger} disabled={loading} style={{
            width:"100%", padding:"16px", background:"#ba1a1a", color:"#fff",
            border:"none", borderRadius:12, fontFamily:"'Geist',sans-serif",
            fontWeight:700, fontSize:15, cursor:"pointer",
            boxShadow:"0 4px 20px rgba(186,26,26,0.3)", transition:"transform 0.15s",
            letterSpacing:"0.03em",
          }}
          onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"}
          onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
          >
            {loading ? "Activando protocolo de emergencia..." : "SIMULAR APAGÓN — Activar Protocolo"}
          </button>

          {emergencyMsg && (
            <div style={{
              background:"rgba(255,255,255,0.9)", border:"2px solid #ba1a1a", borderRadius:16, padding:24,
              animation:"fade-up 0.4s ease",
            }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#ba1a1a", fontWeight:700, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.1em" }}>
                PROTOCOLO DE EMERGENCIA ACTIVO
              </div>
              <div style={{ fontFamily:"'Geist',sans-serif", fontSize:14, lineHeight:1.8, color:"#1a1c1e", whiteSpace:"pre-wrap" }}>{emergencyMsg}</div>
            </div>
          )}
        </div>

        <div style={{
          background:"rgba(255,255,255,0.9)", backdropFilter:"blur(12px)",
          border:"1px solid rgba(131,117,105,0.1)", borderTop:"4px solid #ba1a1a",
          borderRadius:20, padding:24, boxShadow:"0 4px 20px -2px rgba(131,117,105,0.08)",
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
            <h3 style={{ fontFamily:"'Geist',sans-serif", fontSize:18, fontWeight:700, color:"#1a1c1e", margin:0 }}>Critical Priorities</h3>
            <span style={{ background:"rgba(186,26,26,0.08)", color:"#ba1a1a", padding:"4px 10px", borderRadius:6, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, border:"1px solid rgba(186,26,26,0.2)" }}>LOCKED</span>
          </div>
          {[
            { icon:"ac_unit",        label:"Vaccine Fridge",        sub:"Protected - Vital",    pct:100, active:true },
            { icon:"lightbulb",      label:"Emergency Lighting",    sub:"Active - Reduced",     pct:75,  active:true },
            { icon:"satellite_alt",  label:"Communication Relay",   sub:"Active - Critical",    pct:100, active:true },
            { icon:"air",            label:"Admin HVAC",            sub:"Disabled - Low Priority", pct:0, active:false },
          ].map((item, i) => (
            <div key={i} style={{
              marginBottom:12, padding:"16px", borderRadius:16,
              background: item.active ? "#faf8f4" : "rgba(241,237,235,0.5)",
              border:`1px solid ${item.active ? "rgba(131,117,105,0.2)" : "rgba(131,117,105,0.08)"}`,
              opacity: item.active ? 1 : 0.55,
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: item.active ? 10 : 0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background: item.active ? "rgba(255,138,0,0.1)" : "rgba(131,117,105,0.08)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span className="material-symbols-outlined" style={{ color: item.active ? "#ff8a00" : "#837569", fontSize:18 }}>{item.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily:"'Geist',sans-serif", fontSize:13, fontWeight:700, color:"#1a1c1e" }}>{item.label}</div>
                    <div style={{ fontFamily:"'Geist',sans-serif", fontSize:11, color:"#51453a" }}>{item.sub}</div>
                  </div>
                </div>
                {item.active && <span style={{ fontFamily:"'Geist',sans-serif", fontSize:20, fontWeight:700, color:"#ff8a00" }}>{item.pct}%</span>}
              </div>
              {item.active && (
                <div style={{ height:4, background:"#f1edeb", borderRadius:4, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${item.pct}%`, background:"#ff8a00", borderRadius:4 }}/>
                </div>
              )}
            </div>
          ))}
          <div style={{ marginTop:16, padding:14, background:"rgba(255,138,0,0.05)", borderRadius:12, border:"1px solid rgba(255,138,0,0.12)" }}>
            <div style={{ display:"flex", gap:10 }}>
              <span className="material-symbols-outlined" style={{ color:"#ff8a00", fontSize:16 }}>info</span>
              <p style={{ fontFamily:"'Geist',sans-serif", fontSize:11, color:"#51453a", lineHeight:1.6, margin:0 }}>
                Guardian AI simulating <strong>244 redistribution scenarios/sec</strong> to maximize autonomy for the Health Clinic.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── COPILOT VIEW (CORREGIDO Y FUNCIONAL) ──────────────────────────────────────
function CopilotView({ energy }) {
  const currentEnergy = energy || MOCK_ENERGY_FALLBACK;
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

  useEffect(() => {
    getCopilotSuggestions(currentEnergy.battery_level, currentEnergy.risk_level)
      .then((data) => setSuggestions(data.suggestions || []));
  }, [currentEnergy]);

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
      const history = messages.slice(-8);
      const data = await sendCopilotMessage(userText, history, currentEnergy);

      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      if (data.risk_alert) setRiskAlert(data.risk_alert);
    } catch (error) {
      console.error("Error en la solicitud:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Error de conexión. Verifica la consola y vuelve a intentarlo." },
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
    <div className="flex flex-col rounded-2xl overflow-hidden bg-[#0B1020] text-white" style={{ height: "calc(100vh - 120px)" }}>
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

      <div className="px-6 py-2 border-b border-white/5">
        <EnergyStatusBar data={currentEnergy} />
      </div>

      {riskAlert && (
        <div className="px-6 pt-3">
          <RiskBanner alert={riskAlert} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <ChatBubble key={i} msg={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

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

// ── SUBCOMPONENTES DE COPILOT ─────────────────────────────────────────────────
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
      <span className="text-yellow-400">☀️ {data.solar_generation || data.solar_kw || 2.8} kW</span>
      <span className="text-blue-400">⚡ {data.autonomy_hours || 6.2}h autonomía</span>
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
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? "bg-amber-500/20 border border-amber-500/40" : "bg-blue-500/20 border border-blue-500/40"}`}>
        {isUser ? <User size={14} className="text-amber-400" /> : <Bot size={14} className="text-blue-400" />}
      </div>
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

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState("dashboard");
  const [energy, setEnergy] = useState(null);
  const [agentMsg, setAgentMsg] = useState("");
  const [emergencyMsg, setEmergencyMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [history] = useState(generateHistory());

  useEffect(() => {
    fetch(`${API}/api/energy`)
      .then(r => r.json())
      .then(setEnergy)
      .catch(() => setEnergy(MOCK_ENERGY_FALLBACK));
    
    const t = setInterval(() => {
      fetch(`${API}/api/energy`)
        .then(r => r.json())
        .then(setEnergy)
        .catch(() => {});
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const runAgent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/agent`, { method:"POST" });
      const data = await res.json();
      setAgentMsg(data.agent_analysis);
    } catch { 
      setAgentMsg("✅ Sistema optimizado. Generación solar: 12.4 kW. Recomendación: Reducir consumo no esencial entre 14:00-16:00."); 
    }
    setLoading(false);
  };

  const triggerEmergency = async () => {
    setIsEmergency(true);
    setActive("emergency");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/emergency`, { method:"POST" });
      const data = await res.json();
      setEmergencyMsg(data.emergency_protocol);
    } catch { 
      setEmergencyMsg("🚨 PROTOCOLO DE EMERGENCIA ACTIVADO\n\n• Redistribuyendo energía al Centro de Salud\n• Cortando suministro a zonas no esenciales\n• Autonomía estimada: 14 horas\n• Prioridad: Vacunas, Comunicaciones, Iluminación crítica"); 
    }
    setLoading(false);
  };

  const cancelEmergency = () => {
    setIsEmergency(false);
    setEmergencyMsg("");
    setActive("dashboard");
  };

  return (
    <>
      <style>{pulse}</style>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Geist:wght@300;400;600;700&display=swap" rel="stylesheet"/>

      <div style={{ position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0 }}>
        <div style={{ position:"absolute", top:-100, left:-100, width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,#ff8a00 0%,transparent 70%)", filter:"blur(80px)", opacity:0.08 }}/>
        <div style={{ position:"absolute", bottom:-200, right:-200, width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,#ff8a00 0%,transparent 70%)", filter:"blur(80px)", opacity:0.06 }}/>
      </div>

      <Sidebar active={active} setActive={setActive} onEmergencyOverride={triggerEmergency}/>
      <TopBar activeView={active} onSimulateBlackout={isEmergency ? cancelEmergency : triggerEmergency} isEmergency={isEmergency}/>

      <main style={{ marginLeft:256, paddingTop:80, minHeight:"100vh", overflowY:"auto", maxHeight:"100vh", position:"relative", zIndex:1 }}>
        <div style={{ padding:24 }}>
          {active === "dashboard" && (
            <DashboardView energy={energy} agentMsg={agentMsg} onRunAgent={runAgent} loading={loading} history={history}/>
          )}
          {active === "emergency" && (
            <EmergencyView energy={energy} emergencyMsg={emergencyMsg} onTrigger={triggerEmergency} loading={loading}/>
          )}
          {active === "copilot" && (
            <CopilotView energy={energy}/>
          )}
          {!["dashboard","emergency","copilot"].includes(active) && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60vh", gap:16 }}>
              <span className="material-symbols-outlined" style={{ fontSize:48, color:"#d5c3b6" }}>construction</span>
              <p style={{ fontFamily:"'Geist',sans-serif", color:"#837569", fontSize:16 }}>Módulo en desarrollo</p>
              <button onClick={()=>setActive("dashboard")} style={{ padding:"10px 20px", background:"#ff8a00", color:"white", border:"none", borderRadius:10, cursor:"pointer", fontFamily:"'Geist',sans-serif", fontWeight:600 }}>
                Volver al Dashboard
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}