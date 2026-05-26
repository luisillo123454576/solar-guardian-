export default function Sidebar({ active, setActive, onEmergencyOverride }) {
  const items = [
    { key: "dashboard",  icon: "dashboard",            label: "Panel Principal" },
    { key: "emergency",  icon: "warning",              label: "Modo Emergencia" },
    { key: "copilot",    icon: "psychology",           label: "Copilot IA" },
    { key: "simulate",   icon: "science",              label: "Simulaciones" },
    { key: "map",        icon: "map",                  label: "Mapa Comunitario" },
    { key: "forecast",   icon: "query_stats",          label: "Pronóstico" },
    { key: "analytics",  icon: "monitoring",           label: "Analíticas" },
    { key: "alerts",     icon: "notifications_active", label: "Alertas" },
    { key: "settings",   icon: "settings",             label: "Configuración" },
  ];

  return (
    <aside style={{
      width: 235, height: "100vh", position: "fixed", left: 0, top: 0,
      background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
      borderRight: "1px solid rgba(131,117,105,0.15)",
      display: "flex", flexDirection: "column", padding: "24px 16px", zIndex: 50,
    }}>
      <div style={{ marginBottom: 40, padding: "0 8px" }}>
        <div style={{ fontFamily: "'Geist',sans-serif", fontSize: 24, fontWeight: 700, color: "#ff8a00", letterSpacing: "-0.02em" }}>
          Solar Guardian IA
        </div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#837569", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 4 }}>
          Inteligencia de Precisión
        </div>
      </div>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map(({ key, icon, label }) => {
          const isActive = active === key;
          return (
            <button key={key} onClick={() => setActive(key)} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              background: isActive ? "rgba(255,138,0,0.08)" : "transparent",
              color: isActive ? "#ff8a00" : "#51453a",
              fontFamily: "'Geist',sans-serif", fontSize: 15, fontWeight: isActive ? 700 : 400,
              borderRight: isActive ? "3px solid #ff8a00" : "3px solid transparent",
              transition: "all 0.25s ease", textAlign: "left",
            }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,138,0,0.05)"; e.currentTarget.style.color = "#ff8a00"; e.currentTarget.style.paddingLeft = "20px"; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#51453a"; e.currentTarget.style.paddingLeft = "12px"; } }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
              {label}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", paddingTop: 24, borderTop: "1px solid rgba(131,117,105,0.15)" }}>
        <button onClick={onEmergencyOverride} style={{
          width: "100%", padding: "14px", background: "#ff8a00", color: "#fff",
          border: "none", borderRadius: 10, fontFamily: "'Geist',sans-serif",
          fontWeight: 700, fontSize: 13, letterSpacing: "0.05em", cursor: "pointer",
          boxShadow: "0 4px 16px rgba(255,138,0,0.3)", transition: "transform 0.15s",
        }}
          onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
          onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
        >
          Anular Emergencia
        </button>
      </div>
    </aside>
  );
}