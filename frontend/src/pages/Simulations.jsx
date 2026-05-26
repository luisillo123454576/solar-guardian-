import { useState } from "react";

const SIMS = [
  {
    key: "battery_low",
    icon: "battery_alert",
    label: "Batería Crítica",
    desc: "Simula batería al 18% — dispara alerta WhatsApp crítica al personal de la IPS.",
    color: "#ba1a1a",
    bg: "rgba(186,26,26,0.06)",
    border: "rgba(186,26,26,0.2)",
    tag: "CRÍTICO",
  },
  {
    key: "peak_solar",
    icon: "wb_sunny",
    label: "Pico Solar Mediodía",
    desc: "Simula radiación máxima 7.0 kWh/m² — recomienda carga máxima de baterías vía WhatsApp.",
    color: "#ff8a00",
    bg: "rgba(255,138,0,0.06)",
    border: "rgba(255,138,0,0.2)",
    tag: "ÓPTIMO",
  },
  {
    key: "cloudy",
    icon: "cloud",
    label: "Nubosidad Alta",
    desc: "Simula 85% de nubosidad — notifica reducción de generación y recomienda conservar batería.",
    color: "#51453a",
    bg: "rgba(81,69,58,0.06)",
    border: "rgba(81,69,58,0.2)",
    tag: "PRECAUCIÓN",
  },
  {
    key: "night",
    icon: "dark_mode",
    label: "Modo Nocturno",
    desc: "Simula condición nocturna — generación solar en 0, alerta sobre consumo de reservas.",
    color: "#4a4e69",
    bg: "rgba(74,78,105,0.06)",
    border: "rgba(74,78,105,0.2)",
    tag: "NOCHE",
  },
];

export default function SimulationsPanel({ simulate, simState }) {
  const [sent, setSent] = useState({});
  const [loading, setLoading] = useState(null);

  const handleSim = async (key) => {
    setLoading(key);
    await simulate(key);
    setSent((prev) => ({ ...prev, [key]: true }));
    setLoading(null);
    setTimeout(() => setSent((prev) => ({ ...prev, [key]: false })), 4000);
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: "'Geist',sans-serif", fontSize: 26, fontWeight: 700, color: "#1a1c1e", margin: 0 }}>
          Panel de Simulaciones
        </h2>
        <p style={{ fontFamily: "'Geist',sans-serif", fontSize: 14, color: "#51453a", marginTop: 6 }}>
          Cada simulación modifica el estado del sistema en tiempo real y dispara la notificación WhatsApp correspondiente al número registrado.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 24 }}>
        {SIMS.map((sim) => (
          <div key={sim.key} style={{
            background: simState === sim.key ? sim.bg : "rgba(255,255,255,0.8)",
            border: `1.5px solid ${simState === sim.key ? sim.border : "rgba(131,117,105,0.12)"}`,
            borderRadius: 16, padding: 28,
            backdropFilter: "blur(12px)",
            boxShadow: simState === sim.key ? `0 8px 32px ${sim.bg}` : "0 4px 20px -2px rgba(131,117,105,0.08)",
            transition: "all 0.3s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: sim.bg, border: `1px solid ${sim.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined" style={{ color: sim.color, fontSize: 24 }}>{sim.icon}</span>
                </div>
                <div>
                  <div style={{ fontFamily: "'Geist',sans-serif", fontSize: 16, fontWeight: 700, color: "#1a1c1e" }}>{sim.label}</div>
                  <span style={{ background: sim.bg, color: sim.color, border: `1px solid ${sim.border}`, padding: "2px 8px", borderRadius: 6, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700 }}>
                    {sim.tag}
                  </span>
                </div>
              </div>
              {simState === sim.key && (
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: sim.color, display: "inline-block", animation: "pulse-ring 2s infinite" }} />
              )}
            </div>

            <p style={{ fontFamily: "'Geist',sans-serif", fontSize: 13, color: "#51453a", lineHeight: 1.7, marginBottom: 20 }}>
              {sim.desc}
            </p>

            <button
              onClick={() => handleSim(sim.key)}
              disabled={loading === sim.key}
              style={{
                width: "100%", padding: "10px 16px",
                background: simState === sim.key ? sim.color : "transparent",
                color: simState === sim.key ? "#fff" : sim.color,
                border: `1.5px solid ${sim.color}`, borderRadius: 10,
                fontFamily: "'Geist',sans-serif", fontWeight: 700, fontSize: 13,
                cursor: "pointer", transition: "all 0.2s",
                opacity: loading === sim.key ? 0.6 : 1,
              }}
            >
              {loading === sim.key ? "Enviando..." : sent[sim.key] ? "✓ Enviado" : "Simular + Notificar"}
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          onClick={() => simulate("reset")}
          style={{
            padding: "10px 28px", background: "transparent",
            border: "1.5px solid rgba(131,117,105,0.3)", borderRadius: 10,
            fontFamily: "'Geist',sans-serif", fontSize: 13, color: "#51453a", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>restart_alt</span>
          Restablecer estado
        </button>
      </div>

      <div style={{ marginTop: 32, padding: 20, background: "rgba(255,138,0,0.04)", border: "1px solid rgba(255,138,0,0.12)", borderRadius: 14 }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#ff8a00", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
          Disparadores automáticos activos (datos reales)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { cond: "Batería < 30%", action: "→ WhatsApp: alerta crítica + lista de prioridades" },
            { cond: "11:00–14:00 + radiación > 5.5 kWh/m²", action: "→ WhatsApp: ventana de carga máxima" },
            { cond: "Nubosidad > 70%", action: "→ WhatsApp: reducción de generación + conservar reservas" },
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 12, fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>
              <span style={{ color: "#ff8a00", minWidth: 260 }}>{t.cond}</span>
              <span style={{ color: "#51453a" }}>{t.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}