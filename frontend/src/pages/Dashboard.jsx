import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

/* ─── API ────────────────────────────────────────────────────────────────── */
const API_BASE = "http://localhost:8000";

async function fetchDashboard() {
  const res = await fetch(`${API_BASE}/dashboard`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchForecast() {
  // GET /forecast → { solar_forecast, consumption_forecast, battery_forecast, risk_estimation }
  const res = await fetch(`${API_BASE}/forecast`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/* ─── Tokens ─────────────────────────────────────────────────────────────── */
const C = {
  primary:                "#914c00",
  primaryContainer:       "#ff8a00",
  onPrimaryContainer:     "#613100",
  primaryFixed:           "#ffdcc4",
  primaryFixedDim:        "#ffb77f",
  secondary:              "#9f402b",
  surface:                "#faf8ff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow:    "#f1f3ff",
  surfaceContainer:       "#e9edff",
  surfaceContainerHigh:   "#e2e8fc",
  onSurface:              "#151b29",
  onSurfaceVariant:       "#564334",
  outlineVariant:         "#ddc1ae",
  outline:                "#8a7362",
  error:                  "#ba1a1a",
  green:                  "#15803d",
  greenBg:                "#dcfce7",
};

const FONT = {
  mono: "'JetBrains Mono', monospace",
  head: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const Label = ({ children, style }) => (
  <span style={{
    fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.08em",
    textTransform: "uppercase", color: C.onSurfaceVariant, ...style,
  }}>{children}</span>
);

const Badge = ({ children, variant = "normal" }) => {
  const map = {
    normal:   { bg: "rgba(145,76,0,0.10)", color: C.primary  },
    optimal:  { bg: C.greenBg,             color: C.green    },
    critical: { bg: "#fee2e2",             color: C.error    },
  };
  const s = map[variant] || map.normal;
  return (
    <span style={{
      background: s.bg, color: s.color, borderRadius: 999,
      padding: "2px 10px", fontFamily: FONT.mono, fontSize: 10,
      fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
    }}>{children}</span>
  );
};

/* Convierte battery.status → Badge variant */
function batteryVariant(status) {
  if (!status) return "normal";
  if (status === "critical") return "critical";
  if (status === "optimal" || status === "charging") return "optimal";
  return "normal";
}

/* Calcula autonomía estimada en horas dado nivel de batería y consumo total */
function estimateAutonomy(batteryLevel, consumptionKw, capacityKwh = 20) {
  if (!consumptionKw || consumptionKw <= 0) return "—";
  const stored = (batteryLevel / 100) * capacityKwh;
  const hours = stored / consumptionKw;
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  return `${h}h ${m}m`;
}

/* ─── Battery Ring ───────────────────────────────────────────────────────── */
function BatteryRing({ level }) {
  const R = 70, circ = 2 * Math.PI * R;
  const offset = circ * (1 - (level || 0) / 100);
  const color = level < 30 ? C.error : level < 60 ? "#d97706" : C.primaryContainer;
  return (
    <div style={{ position: "relative", width: 160, height: 160, flexShrink: 0 }}>
      <svg width="160" height="160" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="80" cy="80" r={R} fill="transparent" stroke={C.surfaceContainer} strokeWidth="8" />
        <circle cx="80" cy="80" r={R} fill="transparent"
          stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ filter: "drop-shadow(0 0 12px rgba(255,138,0,0.45))", transition: "stroke-dashoffset 1.2s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: FONT.head, fontSize: 30, fontWeight: 700, color, lineHeight: 1 }}>
          {level != null ? `${level.toFixed(1)}%` : "—"}
        </span>
        <Label style={{ fontSize: 10, marginTop: 4 }}>Batería</Label>
      </div>
    </div>
  );
}

/* ─── Metric Card ────────────────────────────────────────────────────────── */
function MetricCard({ label, icon, value, sub, accentLeft = false, loading = false }) {
  return (
    <div style={{
      background: C.surface, borderRadius: 12, padding: 20,
      border: `1px solid ${C.outlineVariant}44`,
      borderLeft: accentLeft ? `4px solid ${C.primaryContainer}` : undefined,
      display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 120,
    }}>
      <Label>{label}</Label>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 8 }}>
        <span style={{
          fontFamily: FONT.head, fontSize: 26, fontWeight: 700, color: C.onSurface,
          opacity: loading ? 0.4 : 1, transition: "opacity 0.3s",
        }}>{loading ? "···" : value}</span>
        <span className="material-symbols-outlined" style={{ color: C.primaryContainer, fontSize: 32, opacity: 0.35 }}>{icon}</span>
      </div>
      {sub && <span style={{ fontFamily: FONT.body, fontSize: 12, color: C.onSurfaceVariant, marginTop: 4 }}>{sub}</span>}
    </div>
  );
}

/* ─── KPI Chip ───────────────────────────────────────────────────────────── */
function KpiChip({ label, value, loading }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)",
      border: `1px solid ${C.outlineVariant}33`, borderRadius: 12,
      padding: "16px 20px", textAlign: "center",
    }}>
      <div style={{
        fontFamily: FONT.head, fontSize: 24, fontWeight: 700, color: C.primaryContainer, lineHeight: 1,
        opacity: loading ? 0.4 : 1, transition: "opacity 0.3s",
      }}>{loading ? "···" : value}</div>
      <div style={{ fontFamily: FONT.mono, fontSize: 10, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 8 }}>{label}</div>
    </div>
  );
}

/* ─── Activity Feed ──────────────────────────────────────────────────────── */
function ActivityFeed({ buildings }) {
  const SEED = [
    { color: C.primaryContainer, text: "Optimización Energética Activa",  time: "10:45 AM", node: "Nodo Eficiencia",   detail: "Balanceo de carga prioritario para sistemas de bombeo de agua." },
    { color: C.primaryFixedDim,  text: "Refrigeración Médica Priorizada", time: "09:12 AM", node: "Protocolo Frío",    detail: "Reserva del 15% bloqueada para cadena de frío vacunas." },
    { color: C.secondary,        text: "Nubosidad Detectada",             time: "08:00 AM", node: "Centro Pronóstico", detail: "Ajustando curvas de descarga preventiva ante baja solar." },
    { color: C.outline,          text: "Autodiagnóstico Completo",        time: "07:30 AM", node: "Redundancia",       detail: "100% integridad de sistema confirmada." },
  ];

  const POOL = [
    "Calibrando ángulo del panel solar para el atardecer...",
    "Sistemas de enfriamiento activados en Nodo 7",
    "Caída de uso comunitario detectada: ajustando reservas",
    "Balanceo predictivo de carga aplicado a zona médica",
    "Sincronización de nodos completada",
  ];

  const [items, setItems] = useState(SEED);

  /* Cuando llegan buildings reales, generar evento desde el edificio crítico */
  useEffect(() => {
    if (!buildings || buildings.length === 0) return;
    const critical = buildings.find(b => b.battery_level < 30 && b.critical_load);
    if (critical) {
      setItems(prev => [{
        color: C.error,
        text: `Batería crítica: ${critical.type} (${critical.id})`,
        time: "ahora",
        node: "Guardian IA",
        detail: `Nivel ${critical.battery_level.toFixed(1)}% — carga crítica activa. Acción automática en curso.`,
      }, ...prev.slice(0, 3)]);
    }
  }, [buildings]);

  /* Rotación automática cada 12s */
  useEffect(() => {
    const t = setInterval(() => {
      setItems(prev => [{
        color: C.primaryContainer,
        text: POOL[Math.floor(Math.random() * POOL.length)],
        time: "ahora", node: "IA Guardian",
        detail: "Acción automática ejecutada.",
      }, ...prev.slice(0, 3)]);
    }, 12000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      background: C.surfaceContainerHigh, border: `1px solid ${C.outlineVariant}44`,
      borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", height: "100%", minHeight: 380,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <span className="material-symbols-outlined" style={{ color: C.primaryContainer, fontSize: 20 }}>neurology</span>
        <Label style={{ fontSize: 12, color: C.onSurface, fontWeight: 600 }}>Actividad del Guardián AI</Label>
      </div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: "flex", gap: 12, borderLeft: `2px solid ${item.color}`,
            paddingLeft: 12, paddingTop: 6, paddingBottom: 6, position: "relative",
            animation: i === 0 ? "sgFadeUp 0.4s ease" : "none",
          }}>
            <div style={{ position: "absolute", left: -6, top: 10, width: 10, height: 10, borderRadius: "50%", background: item.color }} />
            <div>
              <p style={{ fontFamily: FONT.mono, fontSize: 10, color: `${C.onSurfaceVariant}99`, marginBottom: 2 }}>{item.time}</p>
              <p style={{ fontFamily: FONT.head, fontSize: 13, fontWeight: 600, color: C.onSurface, marginBottom: 2 }}>{item.text}</p>
              <p style={{ fontFamily: FONT.body, fontSize: 12, color: C.onSurfaceVariant, lineHeight: 1.5 }}>{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
      <button style={{
        marginTop: 16, width: "100%", padding: "10px 0", borderRadius: 999,
        background: C.surfaceContainerLowest, border: "none", cursor: "pointer",
        fontFamily: FONT.mono, fontSize: 11, color: C.primary,
        letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600,
      }}>Ver Log Completo</button>
    </div>
  );
}

/* ─── Hourly Table (datos reales de patterns) ────────────────────────────── */
function HourlyTable({ batteryPattern, consumptionPattern, solarGenKw }) {
  const hours = [0, 3, 6, 9, 12, 15, 18, 21];

  /* Solar real: curva gaussiana centrada en 13h escalada al solar_generation_kw actual */
  function solarAtHour(h, peakKw) {
    if (h < 6 || h > 19) return 0;
    const peak = peakKw || 0;
    const norm = Math.exp(-0.5 * Math.pow((h - 13) / 3.5, 2));
    return parseFloat((peak * norm).toFixed(2));
  }

  function rowVariant(bat, solar) {
    if (bat != null && bat < 30) return "critical";
    if (solar > 0 && bat != null && bat > 70) return "optimal";
    return "normal";
  }

  const thStyle = {
    padding: "12px 16px", fontFamily: FONT.mono, fontSize: 11,
    color: `${C.onSurfaceVariant}99`, textTransform: "uppercase",
    letterSpacing: "0.06em", fontWeight: 500, textAlign: "left",
    borderBottom: `1px solid ${C.outlineVariant}33`,
  };
  const tdStyle = { padding: "12px 16px", fontFamily: FONT.mono, fontSize: 13, color: C.onSurface };

  return (
    <section style={{ marginTop: 32 }}>
      <div style={{
        background: C.surfaceContainerLowest, borderRadius: 16,
        border: `1px solid ${C.outlineVariant}33`, overflow: "hidden",
        boxShadow: "0 2px 12px rgba(131,117,105,0.08)",
      }}>
        <div style={{
          padding: "16px 20px", borderBottom: `1px solid ${C.outlineVariant}33`,
          background: C.surfaceContainerLow,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <h3 style={{ fontFamily: FONT.head, fontSize: 18, fontWeight: 600, color: C.onSurface, margin: 0 }}>
            Detalle Operativo por Hora
          </h3>
          <div style={{ display: "flex", gap: 4 }}>
            {["download", "filter_list"].map(ic => (
              <button key={ic} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 8, color: C.onSurfaceVariant }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{ic}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.surfaceContainerLowest }}>
                {["Hora", "Batería (%)", "Solar (kW)", "Consumo (kW)", "Estado"].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map(h => {
                const bat   = batteryPattern?.[h] ?? null;
                const cons  = consumptionPattern?.[h] ?? null;
                const solar = solarAtHour(h, solarGenKw);
                const variant = rowVariant(bat, solar);
                return (
                  <tr key={h} style={{ borderBottom: `1px solid ${C.outlineVariant}18` }}>
                    <td style={tdStyle}>{String(h).padStart(2, "0")}:00</td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{bat != null ? `${bat}%` : "—"}</td>
                    <td style={{ ...tdStyle, color: solar > 0 ? C.primaryContainer : `${C.onSurfaceVariant}60`, fontWeight: solar > 0 ? 700 : 400 }}>
                      {solar.toFixed(2)}
                    </td>
                    <td style={tdStyle}>{cons != null ? cons.toFixed(2) : "—"}</td>
                    <td style={tdStyle}>
                      <Badge variant={variant}>
                        {variant === "critical" ? "Crítico" : variant === "optimal" ? "Óptimo" : "Normal"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ─── Dashboard principal ────────────────────────────────────────────────── */
export default function Dashboard({ agentMsg, onRunAgent, loading: agentLoading }) {
  const [data, setData]         = useState(null);   // respuesta de /dashboard
  const [forecast, setForecast] = useState(null);   // respuesta de /forecast
  const [fetching, setFetching] = useState(true);
  const [error, setError]       = useState(null);

  const load = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const [dash, fc] = await Promise.all([fetchDashboard(), fetchForecast()]);
      setData(dash);
      setForecast(fc);
    } catch (err) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* Auto-refresh cada 60s */
  useEffect(() => {
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  /* ── Derivar valores del API ── */
  const energy     = data?.energy   ?? {};
  const weather    = data?.weather  ?? {};
  const buildings  = data?.buildings ?? [];

  const battery     = energy.battery       ?? {};
  const consumption = energy.consumption   ?? {};
  const battLevel   = battery.level        ?? null;
  const battStatus  = battery.status       ?? "unknown";
  const solarKw     = energy.solar_generation_kw ?? null;
  const consumKw    = consumption.total_kw ?? null;
  const resScore    = energy.resilience_score    ?? null;
  const gridStable  = energy.grid_stable         ?? null;
  const radiationWm2 = weather.solar_radiation != null
    ? Math.round(weather.solar_radiation)
    : null;
  const cloudPct   = weather.cloud_cover != null
    ? Math.round(weather.cloud_cover * 100)
    : null;

  /* ── Helpers para extraer arrays del forecast ──
     Soporta tanto array [{hour:0,value:x}] como dict {0:x, 1:x, ...}
     hasta confirmar forma exacta de forecasting_service.py              */
  function extractByHour(src, key) {
  if (!src || !Array.isArray(src)) return {};
  const out = {};
  src.forEach(item => {
    const h = parseInt(item.hour);  // "13:00" → 13
    if (!isNaN(h) && item[key] != null) out[h] = item[key];
  });
  return out;
}

  const solarPattern       = extractByHour(forecast?.solar_forecast,       "solar_generation_kw");
const consumptionPattern = extractByHour(forecast?.consumption_forecast,  "consumption_kwh");
const batteryPattern     = extractByHour(forecast?.battery_forecast,      "battery_level");
  const history = Array.from({ length: 24 }, (_, h) => {
    const solarFc  = solarPattern[h];
    const solarEst = solarKw != null
      ? parseFloat((solarKw * Math.exp(-0.5 * Math.pow((h - 13) / 3.5, 2)) * (h >= 6 && h <= 19 ? 1 : 0)).toFixed(2))
      : 0;
    return {
      hour:    `${String(h).padStart(2, "0")}:00`,
      solar:   solarFc   ?? solarEst,
      consumo: consumptionPattern[h] ?? 0,
      bateria: batteryPattern[h]     ?? 0,
    };
  });

  /* Proyección de batería — próximas 8h desde hora actual */
  const nowHour = new Date().getHours();
  const projection = Array.from({ length: 8 }, (_, i) => {
    const h = (nowHour + i) % 24;
    return {
      h: `${String(h).padStart(2, "0")}:00`,
      v: batteryPattern[h] ?? null,
    };
  });

  /* Score ring */
  const circumference = 2 * Math.PI * 88;
  const scoreOffset   = resScore != null ? circumference * (1 - resScore / 100) : circumference;

  /* KPIs derivados de buildings */
  const criticalBuildings = buildings.filter(b => b.critical_load);
  const avgBatBuildings   = buildings.length
    ? (buildings.reduce((s, b) => s + b.battery_level, 0) / buildings.length).toFixed(1)
    : null;
  const totalConsumption  = buildings.length
    ? buildings.reduce((s, b) => s + b.consumption_kwh, 0).toFixed(2)
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes sgFlow    { from { stroke-dashoffset: 100 } to { stroke-dashoffset: 0 } }
        @keyframes sgPulse   { 0%,100% { opacity:1 } 50% { opacity:.35 } }
        @keyframes sgFadeUp  { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes sgSpin    { to { transform:rotate(360deg) } }
        .sg-flow-path { stroke-dasharray:10; animation:sgFlow 20s linear infinite; }
        .sg-spin      { animation:sgSpin 1.5s linear infinite; }
      `}</style>

      {/* Error banner */}
      {error && (
        <div style={{
          marginBottom: 16, padding: "12px 20px", borderRadius: 10,
          background: "#fee2e2", border: `1px solid ${C.error}33`,
          fontFamily: FONT.mono, fontSize: 12, color: C.error,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>warning</span>
          API no disponible: {error} — mostrando últimos datos en caché.
          <button onClick={load} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: C.error, fontFamily: FONT.mono, fontSize: 11 }}>
            Reintentar
          </button>
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{
        marginBottom: 32, position: "relative", overflow: "hidden",
        borderRadius: 20, padding: 32,
        background: `linear-gradient(135deg, ${C.primaryFixed} 0%, ${C.surfaceContainerHigh} 100%)`,
        border: `1px solid ${C.primaryContainer}22`,
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.08, pointerEvents: "none" }}>
          <svg width="100%" height="100%" preserveAspectRatio="none">
            <path className="sg-flow-path" d="M0,50% Q25%,45% 50%,50% T100%,50%" fill="none" stroke={C.primary} strokeWidth="2" />
            <path className="sg-flow-path" d="M0,65% Q25%,60% 50%,65% T100%,65%" fill="none" stroke={C.primary} strokeWidth="1" style={{ animationDelay: "-3s" }} />
          </svg>
        </div>

        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "auto 1fr", gap: 32, alignItems: "center" }}>
          <div style={{ borderRight: `1px solid ${C.primary}22`, paddingRight: 32 }}>
            <BatteryRing level={battLevel} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {/* Autonomía */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Label style={{ fontSize: 10, opacity: 0.7 }}>Autonomía Restante</Label>
              <span style={{ fontFamily: FONT.head, fontSize: 22, fontWeight: 700, color: C.onSurface }}>
                {fetching ? "···" : estimateAutonomy(battLevel, consumKw)}
              </span>
              <div style={{ height: 4, background: C.surfaceContainer, borderRadius: 99, marginTop: 4 }}>
                <div style={{ height: "100%", width: `${battLevel ?? 0}%`, background: C.primaryContainer, borderRadius: 99, transition: "width 1s ease" }} />
              </div>
            </div>

            {/* Solar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Label style={{ fontSize: 10, opacity: 0.7 }}>Prod. Solar</Label>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="material-symbols-outlined" style={{ color: C.primaryContainer, fontSize: 18 }}>solar_power</span>
                <span style={{ fontFamily: FONT.head, fontSize: 22, fontWeight: 700, color: C.onSurface }}>
                  {fetching ? "···" : solarKw != null ? `${solarKw} kW` : "—"}
                </span>
              </div>
              {cloudPct != null && (
                <Label style={{ fontSize: 10 }}>Nubosidad: {cloudPct}%</Label>
              )}
            </div>

            {/* Demanda */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Label style={{ fontSize: 10, opacity: 0.7 }}>Demanda</Label>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="material-symbols-outlined" style={{ color: C.secondary, fontSize: 18 }}>bolt</span>
                <span style={{ fontFamily: FONT.head, fontSize: 22, fontWeight: 700, color: C.onSurface }}>
                  {fetching ? "···" : consumKw != null ? `${consumKw.toFixed(2)} kW` : "—"}
                </span>
              </div>
            </div>

            {/* Red */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Label style={{ fontSize: 10, opacity: 0.7 }}>Estado de Red</Label>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: gridStable ? "#22c55e" : C.error,
                  animation: "sgPulse 2s infinite",
                }} />
                <span style={{ fontFamily: FONT.head, fontSize: 22, fontWeight: 700, color: C.onSurface }}>
                  {fetching ? "···" : gridStable == null ? "—" : gridStable ? "Estable" : "Inestable"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── RESILIENCE SCORE + WEATHER ───────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, marginBottom: 24 }}>
        {/* Score + Agent */}
        <div style={{
          background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)",
          border: `1px solid ${C.outlineVariant}33`, borderRadius: 16, padding: 32,
          display: "flex", alignItems: "center", gap: 32,
        }}>
          {/* Score ring */}
          <div style={{ position: "relative", width: 160, height: 160, flexShrink: 0 }}>
            <svg width="160" height="160" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="80" cy="80" r="72" fill="transparent" stroke={C.surfaceContainer} strokeWidth="10" />
              <circle cx="80" cy="80" r="72" fill="transparent"
                stroke={C.primaryContainer} strokeWidth="12" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={scoreOffset}
                style={{ filter: "drop-shadow(0 0 8px rgba(255,138,0,0.3))", transition: "stroke-dashoffset 1.2s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              {fetching
                ? <span className="material-symbols-outlined sg-spin" style={{ color: C.primaryContainer, fontSize: 28 }}>progress_activity</span>
                : <span style={{ fontFamily: FONT.head, fontSize: 28, fontWeight: 300, color: C.primaryContainer, lineHeight: 1 }}>
                    {resScore != null ? `${resScore.toFixed(1)}%` : "—"}
                  </span>
              }
              <Label style={{ fontSize: 9, marginTop: 4 }}>Resiliencia</Label>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: FONT.head, fontSize: 22, fontWeight: 700, color: C.onSurface, marginBottom: 8 }}>
              Puntuación de Resiliencia IA
            </h2>
            <p style={{ fontFamily: FONT.body, fontSize: 14, color: C.onSurfaceVariant, lineHeight: 1.7, marginBottom: 20 }}>
              {battStatus === "critical"
                ? "⚠ Batería en nivel crítico. Activando protocolos de carga prioritaria para sistemas esenciales."
                : "Sistema operando con datos en tiempo real de la red solar de La Guajira. Todos los nodos sincronizados."
              }
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={onRunAgent} disabled={agentLoading} style={{
                background: C.primaryContainer, color: "#fff", border: "none", borderRadius: 10,
                padding: "10px 20px", fontFamily: FONT.head, fontWeight: 700, fontSize: 14,
                cursor: agentLoading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 8,
                opacity: agentLoading ? 0.7 : 1,
                boxShadow: "0 4px 14px rgba(255,138,0,0.25)",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>bolt</span>
                {agentLoading ? "Analizando..." : "Optimizar Ahora"}
              </button>
              <button onClick={load} style={{
                border: `1px solid ${C.outlineVariant}66`, background: "transparent",
                color: C.onSurface, borderRadius: 10, padding: "10px 20px",
                fontFamily: FONT.body, fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
                Actualizar
              </button>
            </div>
            {agentMsg && (
              <div style={{
                marginTop: 16, padding: 14, background: "rgba(255,138,0,0.06)",
                borderRadius: 10, border: "1px solid rgba(255,138,0,0.15)",
                animation: "sgFadeUp 0.4s ease",
              }}>
                <div style={{ fontFamily: FONT.mono, fontSize: 10, color: C.primaryContainer, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Análisis del Agente
                </div>
                <div style={{ fontFamily: FONT.body, fontSize: 13, color: C.onSurfaceVariant, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {agentMsg}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Weather card */}
        <div style={{
          background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)",
          border: `1px solid ${C.outlineVariant}33`, borderRadius: 16, padding: 28,
          minWidth: 220, display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <Label>Sol Guajiro</Label>
              <span className="material-symbols-outlined" style={{ color: C.primaryContainer, fontSize: 24 }}>
                {cloudPct != null && cloudPct > 50 ? "partly_cloudy_day" : "wb_sunny"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
              <span style={{ fontFamily: FONT.head, fontSize: 36, fontWeight: 300, color: C.onSurface, lineHeight: 1 }}>
                {fetching ? "···" : radiationWm2 != null ? radiationWm2 : "—"}
              </span>
              <span style={{ fontFamily: FONT.body, color: C.onSurfaceVariant, fontSize: 14 }}>W/m²</span>
            </div>
            {cloudPct != null && (
              <p style={{ fontFamily: FONT.body, fontSize: 12, color: C.onSurfaceVariant }}>
                Nubosidad actual: {cloudPct}%
              </p>
            )}
          </div>
          <svg width="100%" height="70" viewBox="0 0 100 40" preserveAspectRatio="none" style={{ marginTop: 16 }}>
            <defs>
              <linearGradient id="sgGradSun" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.primaryContainer} stopOpacity="1" />
                <stop offset="100%" stopColor={C.primaryContainer} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 40 Q 25 10 50 25 T 100 5" fill="none" stroke={C.primaryContainer} strokeWidth="2" />
            <path d="M0 40 Q 25 10 50 25 T 100 5 V 40 H 0 Z" fill="url(#sgGradSun)" opacity="0.15" />
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT.mono, fontSize: 10, color: C.onSurfaceVariant, marginTop: 4 }}>
            <span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span>
          </div>
        </div>
      </div>

      {/* ── METRIC CARDS ─────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 24 }}>
        <MetricCard
          label="Generación Solar Actual" icon="solar_power"
          value={solarKw != null ? `${solarKw} kW` : "—"}
          sub={solarKw != null ? `Balance energético: ${energy.energy_balance_kw >= 0 ? "+" : ""}${energy.energy_balance_kw?.toFixed(2) ?? "—"} kW` : "Sin datos"}
          accentLeft loading={fetching}
        />
        <MetricCard
          label="Consumo Total Red" icon="bolt"
          value={consumKw != null ? `${consumKw.toFixed(2)} kW` : "—"}
          sub={`${buildings.length} edificios activos · ${criticalBuildings.length} carga crítica`}
          loading={fetching}
        />
        <MetricCard
          label="Score Resiliencia IA" icon="shield"
          value={resScore != null ? `${resScore.toFixed(1)}%` : "—"}
          sub={`Batería promedio edificios: ${avgBatBuildings ?? "—"}%`}
          loading={fetching}
        />
      </div>

      {/* ── CHART + ACTIVITY FEED ────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, marginBottom: 24 }}>
        <div style={{
          background: C.surfaceContainerLowest, borderRadius: 16, padding: 28,
          border: `1px solid ${C.outlineVariant}22`,
          boxShadow: "0 2px 12px rgba(131,117,105,0.06)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h3 style={{ fontFamily: FONT.head, fontSize: 18, fontWeight: 600, color: C.onSurface, margin: 0 }}>
              Pronóstico Energético 24h
            </h3>
            <div style={{ display: "flex", gap: 16 }}>
              {[{ color: C.primaryContainer, label: "Solar" }, { color: C.secondary, label: "Consumo" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: l.color }} />
                  <Label style={{ fontSize: 10 }}>{l.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="sgArea1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.primaryContainer} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.primaryContainer} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sgArea2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.secondary} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={C.secondary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={`${C.outlineVariant}33`} />
              <XAxis dataKey="hour" tick={{ fontFamily: FONT.mono, fontSize: 9, fill: C.onSurfaceVariant }} interval={3} />
              <YAxis tick={{ fontFamily: FONT.mono, fontSize: 10, fill: C.onSurfaceVariant }} />
              <Tooltip contentStyle={{
                background: "rgba(255,255,255,0.95)", border: `1px solid ${C.outlineVariant}44`,
                borderRadius: 8, fontFamily: FONT.body, fontSize: 12,
              }} />
              <Area type="monotone" dataKey="solar"   stroke={C.primaryContainer} strokeWidth={2} fill="url(#sgArea1)" name="Solar kW" />
              <Area type="monotone" dataKey="consumo" stroke={C.secondary}        strokeWidth={2} fill="url(#sgArea2)" name="Consumo kW" />
            </AreaChart>
          </ResponsiveContainer>

          {/* 8-hour battery projection */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span className="material-symbols-outlined" style={{ color: C.primaryContainer, fontSize: 18 }}>query_builder</span>
              <Label style={{ fontSize: 10, color: C.onSurface }}>Próximas 8 Horas — Batería Proyectada (dataset)</Label>
            </div>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              {projection.map(p => {
                const lowBat = p.v != null && p.v < 30;
                return (
                  <div key={p.h} style={{
                    minWidth: 88, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    padding: "10px 8px", borderRadius: 10,
                    background: lowBat ? "#fee2e2" : C.surfaceContainer,
                    border: `1px solid ${lowBat ? C.error : C.primaryContainer}18`,
                  }}>
                    <Label style={{ fontSize: 10 }}>{p.h}</Label>
                    <span style={{ fontFamily: FONT.head, fontSize: 18, fontWeight: 700, color: lowBat ? C.error : C.primaryContainer }}>
                      {p.v != null ? `${p.v}%` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <ActivityFeed buildings={buildings} />
      </div>

      {/* ── KPI CHIPS (buildings reales) ─────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 24 }}>
        <KpiChip label="Edificios Monitoreados"  value={fetching ? "···" : buildings.length}         loading={fetching} />
        <KpiChip label="Carga Crítica Activa"    value={fetching ? "···" : criticalBuildings.length} loading={fetching} />
        <KpiChip label="Consumo Total"           value={fetching ? "···" : totalConsumption ? `${totalConsumption} kWh` : "—"} loading={fetching} />
        <KpiChip label="Batería Prom. Edificios" value={fetching ? "···" : avgBatBuildings ? `${avgBatBuildings}%` : "—"} loading={fetching} />
      </div>

      {/* ── HOURLY TABLE ─────────────────────────────────────────────────── */}
      <HourlyTable
        batteryPattern={batteryPattern}
        consumptionPattern={consumptionPattern}
        solarGenKw={solarKw}
      />
    </>
  );
}