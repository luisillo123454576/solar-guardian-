import { useState } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import DashboardView from "./pages/Dashboard";
import EmergencyView from "./pages/Emergency";
import CopilotView from "./pages/Copilot";
import SimulationsPanel from "./pages/Simulations";
import ForecastingView from "./pages/Forecasting";
import CommunityMap from "./pages/CommunityMap";
import { useEnergy } from "./hooks/useEnergy";
import { simulateBlackout } from "./services/api";

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
`;

const FULL_VIEWS = ["copilot", "map"];

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencyMsg, setEmergencyMsg] = useState("");
  const [agentMsg, setAgentMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const { energy, simState, simulate } = useEnergy();

  const triggerEmergency = async () => {
    setIsEmergency(true);
    setActive("emergency");
    setLoading(true);
    try {
      const data = await simulateBlackout();
      setEmergencyMsg(data.emergency_protocol || data.message || "Protocolo activado.");
    } catch {
      setEmergencyMsg(
        "🚨 PROTOCOLO DE EMERGENCIA ACTIVADO\n\n• Redistribuyendo energía al Centro de Salud\n• Cortando suministro a zonas no esenciales\n• Autonomía estimada: 14 horas\n• Prioridad: Vacunas, Comunicaciones, Iluminación crítica"
      );
    }
    setLoading(false);
  };

  const cancelEmergency = () => {
    setIsEmergency(false);
    setEmergencyMsg("");
    setActive("dashboard");
  };

  const isFull = FULL_VIEWS.includes(active);
  const KNOWN_VIEWS = ["dashboard", "emergency", "simulate", "forecast", "copilot", "map"];

  return (
    <>
      <style>{pulse}</style>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Geist:wght@300;400;600;700&display=swap" rel="stylesheet" />

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -100, left: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,#ff8a00 0%,transparent 70%)", filter: "blur(80px)", opacity: 0.08 }} />
        <div style={{ position: "absolute", bottom: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,#ff8a00 0%,transparent 70%)", filter: "blur(80px)", opacity: 0.06 }} />
      </div>

      <Sidebar active={active} setActive={setActive} onEmergencyOverride={triggerEmergency} />
      <TopBar onSimulateBlackout={isEmergency ? cancelEmergency : triggerEmergency} isEmergency={isEmergency} />

      <main style={{
        marginLeft: 256,
        paddingTop: 80,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Vistas full-height sin padding */}
        {isFull && (
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {active === "copilot" && <CopilotView energy={energy} />}
            {active === "map"     && <CommunityMap isEmergency={isEmergency} />}
          </div>
        )}

        {/* Vistas con padding y scroll */}
        {!isFull && (
          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            {active === "dashboard" && (
              <DashboardView energy={energy} agentMsg={agentMsg} loading={loading} />
            )}
            {active === "emergency" && (
              <EmergencyView energy={energy} emergencyMsg={emergencyMsg} onTrigger={triggerEmergency} loading={loading} />
            )}
            {active === "simulate" && (
              <SimulationsPanel simulate={simulate} simState={simState} />
            )}
            {active === "forecast" && (
              <ForecastingView />
            )}

            {/* Fallback para vistas no implementadas */}
            {!KNOWN_VIEWS.includes(active) && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 16 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#d5c3b6" }}>construction</span>
                <p style={{ fontFamily: "'Geist',sans-serif", color: "#837569", fontSize: 16 }}>Módulo en desarrollo</p>
                <button onClick={() => setActive("dashboard")} style={{ padding: "10px 20px", background: "#ff8a00", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "'Geist',sans-serif", fontWeight: 600 }}>
                  Volver al Panel Principal
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}