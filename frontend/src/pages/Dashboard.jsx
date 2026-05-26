import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { MOCK_ENERGY_FALLBACK } from "../constants";

// ── Activity Feed ─────────────────────────────────────────────────────────────
function ActivityFeed() {
  const [items, setItems] = useState([
    { color:"#ff8a00", text:"IA optimizando descarga de batería para pico de demanda", time:"hace 14s", node:"Nodo Eficiencia Energética" },
    { color:"#a93720", text:"Salud de infraestructura: Nominal", time:"hace 2m", node:"Protocolo Mantenimiento 4" },
    { color:"#837569", text:"Actualización climática: 48h cielo despejado", time:"hace 12m", node:"Centro de Pronóstico" },
    { color:"#ffb77f", text:"Protocolos de respaldo activos: sincronización Área C", time:"hace 1h", node:"Verificación Redundancia" },
  ]);

  const mensajes = [
    "Calibrando ángulo del panel solar para el atardecer...",
    "Sistemas de enfriamiento activados en Nodo 7",
    "Caída de uso comunitario detectada: ajustando reservas",
    "Autodiagnóstico completo: 100% integridad",
    "Balanceo predictivo de carga aplicado a zona médica",
  ];

  useEffect(() => {
    const t = setInterval(() => {
      setItems(prev => [
        { color:"#ff8a00", text: mensajes[Math.floor(Math.random()*mensajes.length)], time:"ahora", node:"IA Guardian" },
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
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#837569", textTransform:"uppercase", letterSpacing:"0.1em" }}>Actividad de la IA</span>
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
      }}>Ver Registros Completos</button>
    </div>
  );
}

// ── Dashboard View ────────────────────────────────────────────────────────────
export default function Dashboard({ energy, agentMsg, onRunAgent, loading, history }) {
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
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#837569", textTransform:"uppercase", letterSpacing:"0.1em", marginTop:4 }}>Óptimo</span>
          </div>
        </div>
        <div style={{ flex:1 }}>
          <h2 style={{ fontFamily:"'Geist',sans-serif", fontSize:28, fontWeight:600, color:"#1a1c1e", marginBottom:8 }}>Puntuación de Resiliencia IA</h2>
          <p style={{ fontFamily:"'Geist',sans-serif", color:"#51453a", lineHeight:1.7, marginBottom:24, fontSize:15 }}>
            Sistema operando en máxima eficiencia. Todos los nodos sincronizados con el pico solar de La Guajira.
            Autonomía prevista sobre el umbral de seguridad por los próximos 4 días.
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
              {loading ? "Analizando..." : "Optimizar Ahora"}
            </button>
            <button style={{
              border:"1px solid rgba(131,117,105,0.2)", background:"transparent",
              color:"#1a1c1e", borderRadius:10, padding:"12px 24px",
              fontFamily:"'Geist',sans-serif", fontSize:14, cursor:"pointer",
            }}>Ver Informe Completo</button>
          </div>
          {agentMsg && (
            <div style={{ marginTop:16, padding:14, background:"rgba(255,138,0,0.06)", borderRadius:10, border:"1px solid rgba(255,138,0,0.15)", animation:"fade-up 0.4s ease" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#ff8a00", fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.1em" }}>Análisis del Agente</div>
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
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#837569", textTransform:"uppercase", letterSpacing:"0.1em" }}>Sol Guajiro</span>
            <span className="material-symbols-outlined" style={{ color:"#ff8a00", fontSize:24 }}>wb_sunny</span>
          </div>
          <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:6 }}>
            <span style={{ fontFamily:"'Geist',sans-serif", fontSize:40, fontWeight:300, color:"#1a1c1e", lineHeight:1 }}>
              {currentEnergy ? Math.round(currentEnergy.radiation * 1000 / 7) + 650 : 1045}
            </span>
            <span style={{ color:"#51453a", fontSize:16 }}>W/m²</span>
          </div>
          <p style={{ fontFamily:"'Geist',sans-serif", fontSize:13, color:"#51453a" }}>Irradiancia pico alcanzada a las 13:42</p>
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
        { label:"Generación Solar",  icon:"solar_power",          value: currentEnergy ? `${currentEnergy.solar_kw || 12.4} kW` : "12.4 kW", sub:"+8% vs ayer",                     accent:"#ff8a00", border:true  },
        { label:"Nivel de Batería",  icon:"battery_charging_90",  value: currentEnergy ? `${currentEnergy.battery_level}%` : "82%",          sub:"Carga activa (Red Asistida)",      accent:"#ff8a00", border:false },
        { label:"Estabilidad Red",   icon:"security",             value: currentEnergy?.grid_status === "estable" ? "99.9%" : "72.1%",       sub:`Estado: ${currentEnergy?.grid_status || "estable"}`, accent:"#a93720", border:false },
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

      {/* Energy Flow Chart */}
      <div style={{
        gridColumn:"span 7", background:"rgba(255,255,255,0.7)", backdropFilter:"blur(12px)",
        border:"1px solid rgba(131,117,105,0.1)", borderRadius:16, padding:32,
        boxShadow:"0 4px 20px -2px rgba(131,117,105,0.1)",
      }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#837569", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:24 }}>Flujo de Energía en Red</div>
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
            <Area type="monotone" dataKey="solar"  stroke="#ff8a00" strokeWidth={2} fill="url(#gradArea1)" name="Solar kW"/>
            <Area type="monotone" dataKey="consumo" stroke="#a93720" strokeWidth={2} fill="url(#gradArea2)" name="Consumo kW"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <ActivityFeed />

      {/* Impact KPIs */}
      {[
        { label:"Horas Protegidas",   value:"1,247 h" },
        { label:"Vacunas Preservadas", value:"3,840"  },
        { label:"Energía Ahorrada",   value:"2.4 MWh" },
        { label:"CO₂ Evitado",        value:"1.2 ton" },
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