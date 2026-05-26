export default function TopBar({ onSimulateBlackout, isEmergency }) {
  return (
    <header style={{
      position: "fixed", top: 0, right: 0, left: 256, height: 80,
      background: "rgba(252,249,247,0.85)", backdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(213,195,182,0.3)",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "0 24px", zIndex: 40,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <span style={{ fontFamily: "'Geist',sans-serif", fontSize: 22, fontWeight: 600, color: "#1a1c1e" }}>
          Centro de Resiliencia Wayúu
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {isEmergency ? (
            <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#ba1a1a", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, animation: "pulsate-red 2s infinite" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ba1a1a", display: "inline-block" }} />
              APAGÓN DETECTADO
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff8a00", display: "inline-block", animation: "pulse-ring 2s infinite" }} />
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#ff8a00", fontWeight: 700 }}>Conectado</span>
            </span>
          )}
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#51453a" }}>98h Autonomía</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#51453a" }}>99% Estabilidad</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onSimulateBlackout} style={{
          padding: "8px 18px", border: `1px solid ${isEmergency ? "#ba1a1a" : "rgba(131,117,105,0.3)"}`,
          background: isEmergency ? "rgba(186,26,26,0.08)" : "transparent",
          color: isEmergency ? "#ba1a1a" : "#51453a",
          borderRadius: 8, fontFamily: "'Geist',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
          transition: "all 0.2s",
        }}>
          {isEmergency ? "Cancelar Simulación" : "Simular Apagón"}
        </button>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#ff8a00", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="material-symbols-outlined" style={{ color: "#fff", fontSize: 20 }}>monitor_heart</span>
        </div>
      </div>
    </header>
  );
}