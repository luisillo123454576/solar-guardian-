import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { fetchForecast } from "../services/api";

// ── Configuraciones ───────────────────────────────────────────────────────────
const RIESGO_CFG = {
  low:      { color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0", label: "Riesgo Bajo",      icono: "check_circle"  },
  medium:   { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", label: "Riesgo Medio",     icono: "warning"       },
  high:     { color: "#f97316", bg: "#fff7ed", border: "#fed7aa", label: "Riesgo Alto",      icono: "error"         },
  critical: { color: "#ef4444", bg: "#fef2f2", border: "#fecaca", label: "Riesgo Crítico",   icono: "crisis_alert"  },
};

const STATUS_CFG = {
  optimal:  { color: "#22c55e", label: "Óptimo"   },
  normal:   { color: "#3b82f6", label: "Normal"   },
  warning:  { color: "#f59e0b", label: "Alerta"   },
  critical: { color: "#ef4444", label: "Crítico"  },
};

const TABS = [
  { key: "battery",     label: "Batería",    icono: "battery_charging_full", color: "#ff8a00", unit: "%"   },
  { key: "solar",       label: "Solar",      icono: "solar_power",           color: "#f59e0b", unit: "kW"  },
  { key: "consumption", label: "Consumo",    icono: "bolt",                  color: "#f97316", unit: "kWh" },
];

// ── Helpers UI ────────────────────────────────────────────────────────────────
function Ico({ name, style = {} }) {
  return (
    <span className="material-symbols-outlined"
      style={{ fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, ...style }}>
      {name}
    </span>
  );
}

function TooltipCustom({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(255,255,255,0.97)", border: "1px solid rgba(131,117,105,0.2)",
      borderRadius: 10, padding: "10px 14px", boxShadow: "0 8px 24px rgba(21,27,41,0.12)",
    }}>
      <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#837569", marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
          <span style={{ fontFamily: "'Geist',sans-serif", fontSize: 12, color: "#1a1c1e", fontWeight: 600 }}>
            {p.name}: {p.value}{p.unit ?? ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function TarjetaStat({ icono, label, valor, sub, color = "#ff8a00" }) {
  return (
    <div style={{
      background: "white", border: "1px solid rgba(131,117,105,0.15)",
      borderRadius: 16, padding: "20px 22px",
      boxShadow: "0 2px 12px rgba(131,117,105,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Ico name={icono} style={{ color, fontSize: 20 }} />
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#837569", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily: "'Geist',sans-serif", fontSize: 26, fontWeight: 300, color: "#1a1c1e", lineHeight: 1 }}>
        {valor}
      </div>
      {sub && <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#837569", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function LineaTiempo({ batteryForecast }) {
  const ahora = new Date().getHours();
  const proximas = batteryForecast.slice(ahora, ahora + 8);

  return (
    <div>
      <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#837569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
        Próximas 8 horas
      </p>
      <div style={{ display: "flex", gap: 6 }}>
        {proximas.map((h, i) => {
          const cfg = STATUS_CFG[h.status] ?? STATUS_CFG.normal;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: "100%", height: 52, borderRadius: 10,
                background: cfg.color + "22", border: `1px solid ${cfg.color}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontFamily: "'Geist',sans-serif", fontSize: 13, fontWeight: 700, color: cfg.color }}>
                  {h.battery_level}%
                </span>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#837569" }}>{h.hour}</span>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Vista principal ───────────────────────────────────────────────────────────
export default function ForecastingView() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [actualizado, setActualizado] = useState(null);
  const [tabActiva, setTabActiva] = useState("battery");

  const cargarForecast = useCallback(async () => {
    try {
      setError(null);
      const json = await fetchForecast();
      setDatos(json);
      setActualizado(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarForecast();
    const t = setInterval(cargarForecast, 60_000);
    return () => clearInterval(t);
  }, [cargarForecast]);

  // ── Cargando ──
  if (cargando) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 16 }}>
      <div style={{ width: 40, height: 40, border: "3px solid #ff8a00", borderTopColor: "transparent", borderRadius: "50%", animation: "spin-slow 0.8s linear infinite" }} />
      <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#837569" }}>Cargando predicción energética…</p>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12 }}>
      <Ico name="cloud_off" style={{ fontSize: 48, color: "#d5c3b6" }} />
      <p style={{ fontFamily: "'Geist',sans-serif", fontSize: 16, color: "#837569" }}>No se pudo conectar al backend</p>
      <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#ba1a1a" }}>{error}</p>
      <button onClick={cargarForecast} style={{ padding: "10px 20px", background: "#ff8a00", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "'Geist',sans-serif", fontWeight: 600 }}>
        Reintentar
      </button>
    </div>
  );
  if (!datos) return null;
  const { solar_forecast, consumption_forecast, battery_forecast, risk_estimation, community } = datos;
  const riesgo = RIESGO_CFG[risk_estimation.risk_level] ?? RIESGO_CFG.low;
  const ahora = new Date().getHours();

  // Stats derivados
  const picoSolar       = [...solar_forecast].sort((a, b) => b.solar_generation_kw - a.solar_generation_kw)[0];
  const picoConsumo     = [...consumption_forecast].sort((a, b) => b.consumption_kwh - a.consumption_kwh)[0];
  const bateriaActual   = battery_forecast[ahora]?.battery_level ?? "—";
  const statusActual    = battery_forecast[ahora]?.status ?? "normal";
  const horasAutonomia  = (() => {
    const idx = battery_forecast.slice(ahora).findIndex(h => h.status === "critical");
    return idx === -1 ? "24+" : idx;
  })();

  // Dataset para gráfica (las 24h)
  const datosGrafica = battery_forecast.map((b, i) => ({
    hour:        b.hour,
    battery:     b.battery_level,
    solar:       solar_forecast[i]?.solar_generation_kw ?? 0,
    consumption: consumption_forecast[i]?.consumption_kwh ?? 0,
    status:      b.status,
  }));

  const tabCfg = TABS.find(t => t.key === tabActiva);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fade-up 0.5s ease both" }}>

      {/* ── Encabezado ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontFamily: "'Geist',sans-serif", fontSize: 24, fontWeight: 700, color: "#1a1c1e" }}>
            Predicción Energética
          </h2>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#837569", marginTop: 4 }}>
            {community} · {actualizado ? `Actualizado ${actualizado.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}` : ""}
          </p>
        </div>
        <button onClick={cargarForecast}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "white", border: "1px solid rgba(131,117,105,0.2)", borderRadius: 10, cursor: "pointer", fontFamily: "'Geist',sans-serif", fontSize: 13, color: "#51453a", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#ff8a00"; e.currentTarget.style.color = "#ff8a00"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(131,117,105,0.2)"; e.currentTarget.style.color = "#51453a"; }}
        >
          <Ico name="refresh" style={{ fontSize: 16 }} /> Actualizar
        </button>
      </div>

      {/* ── Banner de riesgo ── */}
      <div style={{
        background: riesgo.bg, border: `1px solid ${riesgo.border}`, borderRadius: 16,
        padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: `0 4px 20px ${riesgo.color}18`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: riesgo.color + "22", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ico name={riesgo.icono} style={{ color: riesgo.color, fontSize: 26 }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Geist',sans-serif", fontSize: 18, fontWeight: 700, color: riesgo.color }}>
              {riesgo.label}
            </div>
            <div style={{ fontFamily: "'Geist',sans-serif", fontSize: 14, color: "#1a1c1e", marginTop: 2 }}>
              {risk_estimation.recommendation}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 28, textAlign: "center" }}>
          <div>
            <div style={{ fontFamily: "'Geist',sans-serif", fontSize: 26, fontWeight: 300, color: riesgo.color }}>
              {risk_estimation.critical_hours_count}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#837569", textTransform: "uppercase" }}>Horas críticas</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Geist',sans-serif", fontSize: 26, fontWeight: 300, color: "#f59e0b" }}>
              {risk_estimation.warning_hours_count}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#837569", textTransform: "uppercase" }}>Horas en alerta</div>
          </div>
          {risk_estimation.first_critical_hour && (
            <div>
              <div style={{ fontFamily: "'Geist',sans-serif", fontSize: 26, fontWeight: 300, color: "#ef4444" }}>
                {risk_estimation.first_critical_hour}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#837569", textTransform: "uppercase" }}>Primera hora crítica</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tarjetas de stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        <TarjetaStat icono="battery_charging_full" label="Batería Actual"  valor={`${bateriaActual}%`}                      sub={STATUS_CFG[statusActual]?.label}          color="#ff8a00" />
        <TarjetaStat icono="hourglass_empty"       label="Autonomía"       valor={`${horasAutonomia}h`}                      sub="Hasta umbral crítico"                     color="#3b82f6" />
        <TarjetaStat icono="solar_power"           label="Pico Solar"      valor={`${picoSolar?.solar_generation_kw} kW`}    sub={`a las ${picoSolar?.hour}`}               color="#f59e0b" />
        <TarjetaStat icono="bolt"                  label="Pico de Demanda" valor={`${picoConsumo?.consumption_kwh} kWh`}     sub={`a las ${picoConsumo?.hour}`}             color="#f97316" />
      </div>

      {/* ── Gráfica principal ── */}
      <div style={{ background: "white", border: "1px solid rgba(131,117,105,0.15)", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(131,117,105,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h3 style={{ fontFamily: "'Geist',sans-serif", fontSize: 16, fontWeight: 700, color: "#1a1c1e" }}>Pronóstico 24 horas</h3>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#837569", marginTop: 2 }}>Predicción horaria · {community}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setTabActiva(tab.key)} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                background: tabActiva === tab.key ? tab.color : "rgba(131,117,105,0.08)",
                color: tabActiva === tab.key ? "white" : "#51453a",
                fontFamily: "'Geist',sans-serif", fontSize: 13,
                fontWeight: tabActiva === tab.key ? 700 : 400,
                transition: "all 0.2s",
              }}>
                <Ico name={tab.icono} style={{ fontSize: 16 }} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={datosGrafica} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="gradChart" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={tabCfg.color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={tabCfg.color} stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(131,117,105,0.1)" />
            <XAxis dataKey="hour" tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: "#837569" }} interval={2} />
            <YAxis tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: "#837569" }} domain={tabActiva === "battery" ? [0, 100] : ["auto", "auto"]} />
            <Tooltip content={<TooltipCustom />} />
            {tabActiva === "battery" && <>
              <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Crítico", fill: "#ef4444", fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }} />
              <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Alerta",  fill: "#f59e0b", fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }} />
            </>}
            <Area
              type="monotone"
              dataKey={tabActiva}
              name={tabCfg.label}
              unit={tabCfg.unit}
              stroke={tabCfg.color}
              strokeWidth={2}
              fill="url(#gradChart)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Fila inferior ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Línea de tiempo de riesgo */}
        <div style={{ background: "white", border: "1px solid rgba(131,117,105,0.15)", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(131,117,105,0.06)" }}>
          <LineaTiempo batteryForecast={battery_forecast} />
        </div>

        {/* Tabla horaria */}
        <div style={{ background: "white", border: "1px solid rgba(131,117,105,0.15)", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(131,117,105,0.06)", overflowY: "auto", maxHeight: 300 }}>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#837569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
            Detalle por hora
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Hora", "Batería", "Solar", "Consumo", "Estado"].map(h => (
                  <th key={h} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#837569", textAlign: "left", paddingBottom: 8, fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {battery_forecast.slice(ahora, ahora + 10).map((b, i) => {
                const s   = solar_forecast[ahora + i];
                const c   = consumption_forecast[ahora + i];
                const cfg = STATUS_CFG[b.status] ?? STATUS_CFG.normal;
                const esAhora = i === 0;
                return (
                  <tr key={i} style={{ background: esAhora ? "rgba(255,138,0,0.05)" : "transparent" }}>
                    <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: esAhora ? "#ff8a00" : "#1a1c1e", fontWeight: esAhora ? 700 : 400, padding: "6px 0" }}>
                      {b.hour}{esAhora ? " ←" : ""}
                    </td>
                    <td style={{ fontFamily: "'Geist',sans-serif", fontSize: 12, color: cfg.color, fontWeight: 600, padding: "6px 0" }}>{b.battery_level}%</td>
                    <td style={{ fontFamily: "'Geist',sans-serif", fontSize: 12, color: "#f59e0b", padding: "6px 0" }}>{s?.solar_generation_kw ?? "—"} kW</td>
                    <td style={{ fontFamily: "'Geist',sans-serif", fontSize: 12, color: "#f97316", padding: "6px 0" }}>{c?.consumption_kwh ?? "—"} kWh</td>
                    <td style={{ padding: "6px 0" }}>
                      <span style={{ background: cfg.color + "22", color: cfg.color, borderRadius: 6, padding: "2px 8px", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700 }}>
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}