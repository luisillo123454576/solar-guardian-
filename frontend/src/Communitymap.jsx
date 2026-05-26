import { useState, useEffect, useRef } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────
const NODES_INITIAL = [
  {
    id: "solar-alpha",
    label: "Solar Station Alpha",
    icon: "solar_power",
    type: "solar",
    priority: "source",
    x: 38, y: 42,
    battery: 95, consumption: 0, risk: "low", autonomy: null,
    connections: ["health-center", "school", "community"],
    description: "Main photovoltaic array. 48kWp installed capacity.",
  },
  {
    id: "health-center",
    label: "Rural Health Center",
    icon: "emergency",
    type: "health",
    priority: "critical",
    x: 62, y: 60,
    battery: 34, consumption: 4.2, risk: "high", autonomy: "11h",
    vaccines: true,
    description: "Centro médico Wayuu. Refrigeración médica activa.",
  },
  {
    id: "school",
    label: "Wayuu School #4",
    icon: "school",
    type: "school",
    priority: "medium",
    x: 22, y: 68,
    battery: 71, consumption: 1.8, risk: "low", autonomy: "28h",
    description: "Escuela primaria. 120 estudiantes activos.",
  },
  {
    id: "community",
    label: "Community Center",
    icon: "diversity_3",
    type: "community",
    priority: "support",
    x: 78, y: 26,
    battery: 52, consumption: 2.9, risk: "medium", autonomy: "18h",
    description: "Centro comunitario. Punto de comunicaciones.",
  },
  {
    id: "tower",
    label: "Comm Tower",
    icon: "cell_tower",
    type: "tower",
    priority: "critical",
    x: 55, y: 20,
    battery: 88, consumption: 0.6, risk: "low", autonomy: "72h",
    description: "Torre de comunicaciones. Cobertura 40km².",
  },
  {
    id: "water-pump",
    label: "Water Pump Station",
    icon: "water_pump",
    type: "water",
    priority: "critical",
    x: 30, y: 30,
    battery: 61, consumption: 3.1, risk: "medium", autonomy: "20h",
    description: "Bombeo de agua. Sirve 340 familias.",
  },
];

const CONNECTIONS = [
  { from: "solar-alpha", to: "health-center", width: 2.5 },
  { from: "solar-alpha", to: "school", width: 1.5 },
  { from: "solar-alpha", to: "community", width: 1.5 },
  { from: "solar-alpha", to: "tower", width: 1.5 },
  { from: "solar-alpha", to: "water-pump", width: 2 },
];

const PRIORITY_CONFIG = {
  critical: { label: "Critical", color: "#ef4444", ring: "rgba(239,68,68,0.25)", size: 48 },
  medium:   { label: "Medium",   color: "#f59e0b", ring: "rgba(245,158,11,0.25)", size: 40 },
  support:  { label: "Support",  color: "#f97316", ring: "rgba(249,115,22,0.25)", size: 40 },
  source:   { label: "Source",   color: "#914c00", ring: "rgba(145,76,0,0.3)",    size: 52 },
};

const RISK_COLORS = {
  low:    { bg: "#22c55e", label: "Stable",    text: "#fff" },
  medium: { bg: "#f97316", label: "Med Risk",  text: "#fff" },
  high:   { bg: "#ef4444", label: "Emergency", text: "#fff" },
};

const BLACKOUT_FEED = [
  { msg: "⚡ Grid outage detected — northern sector.", time: "now",  border: "#ef4444" },
  { msg: "🔒 Medical refrigeration locked at 4°C.",   time: "3s",   border: "#914c00" },
  { msg: "📡 Comm Tower isolated on backup battery.", time: "5s",   border: "#914c00" },
  { msg: "💧 Water pump priority elevated to CRITICAL.", time: "8s", border: "#914c00" },
  { msg: "🏫 School: non-essential loads shed.",      time: "12s",  border: "#f59e0b" },
  { msg: "🏘 Community Center: reduced to 30% load.", time: "15s", border: "#f59e0b" },
  { msg: "✅ Autonomy extended +6h via AI rebalance.", time: "20s", border: "#22c55e" },
];

const NORMAL_FEED = [
  { msg: "Medical refrigeration prioritized at Rural Center.", time: "12s", border: "#914c00" },
  { msg: "Emergency energy optimization activated via AI Copilot.", time: "2m", border: "#914c00" },
  { msg: "Autonomy extended by 4h 12m through load balancing.", time: "5m", border: "#22c55e" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function Icon({ name, className = "" }) {
  return (
    <span className={`material-symbols-outlined ${className}`} style={{ fontVariationSettings: "'FILL' 0,'wght' 400" }}>
      {name}
    </span>
  );
}

function riskForBlackout(node, isBlackout) {
  if (!isBlackout) return node.risk;
  if (node.type === "solar") return "high";
  if (node.priority === "critical") return "medium";
  return "high";
}

function batteryForBlackout(node, isBlackout) {
  if (!isBlackout) return node.battery;
  if (node.type === "solar") return 0;
  if (node.priority === "critical") return Math.max(node.battery - 15, 10);
  return Math.max(node.battery - 30, 5);
}

// ─── ENERGY LINE SVG ─────────────────────────────────────────────────────────
function EnergyLines({ nodes, isBlackout, selectedId }) {
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#F59E0B" stopOpacity="0.1" />
          <stop offset="50%"  stopColor="#F59E0B" stopOpacity={isBlackout ? "0.15" : "0.9"} />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="lineGradBlackout" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ef4444" stopOpacity="0.1" />
          <stop offset="50%"  stopColor="#ef4444" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {CONNECTIONS.map(({ from, to, width }) => {
        const a = nodeMap[from], b = nodeMap[to];
        if (!a || !b) return null;
        const isSelected = selectedId === from || selectedId === to;
        const stroke = isBlackout ? "url(#lineGradBlackout)" : "url(#lineGrad)";
        const opacity = isSelected ? 1 : 0.5;
        return (
          <path
            key={`${from}-${to}`}
            d={`M${a.x}%,${a.y}% L${b.x}%,${b.y}%`}
            fill="none"
            stroke={stroke}
            strokeWidth={isSelected ? width + 1 : width}
            opacity={opacity}
            strokeDasharray="8 12"
            style={{
              animation: isBlackout ? "none" : `flowLine 1.4s linear infinite`,
            }}
          />
        );
      })}
    </svg>
  );
}

// ─── NODE ─────────────────────────────────────────────────────────────────────
function MapNode({ node, isBlackout, isSelected, onClick }) {
  const risk = riskForBlackout(node, isBlackout);
  const battery = batteryForBlackout(node, isBlackout);
  const pCfg = PRIORITY_CONFIG[node.priority];
  const rCfg = RISK_COLORS[risk];
  const sz = pCfg.size;

  const glowColor = isBlackout
    ? risk === "high" ? "#ef4444" : "#f59e0b"
    : pCfg.color;

  return (
    <div
      className="absolute"
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: isSelected ? 30 : 20,
      }}
    >
      {/* Outer pulse ring */}
      <div
        style={{
          position: "absolute",
          inset: -10,
          borderRadius: "50%",
          background: pCfg.ring,
          animation: isBlackout && risk === "high"
            ? "pulseRed 1s ease-in-out infinite"
            : "breatheRing 3s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* Node circle */}
      <div
        onClick={() => onClick(node)}
        style={{
          width: sz,
          height: sz,
          borderRadius: "50%",
          background: isBlackout
            ? risk === "high" ? "#ef4444" : risk === "medium" ? "#f97316" : rCfg.bg
            : pCfg.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: isSelected
            ? `0 0 0 4px ${glowColor}55, 0 0 30px ${glowColor}88`
            : `0 0 15px ${glowColor}44`,
          transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          transform: isSelected ? "scale(1.18)" : "scale(1)",
          border: isSelected ? `2px solid ${glowColor}` : "none",
        }}
      >
        <Icon name={node.icon} className="text-white" style={{ fontSize: sz * 0.45 }} />
      </div>

      {/* Status badge */}
      <div
        style={{
          position: "absolute",
          bottom: -6,
          left: "50%",
          transform: "translateX(-50%)",
          background: rCfg.bg,
          color: rCfg.text,
          fontSize: 9,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          padding: "1px 6px",
          borderRadius: 4,
          whiteSpace: "nowrap",
          letterSpacing: "0.05em",
        }}
      >
        {rCfg.label}
      </div>

      {/* Hover label */}
      <div
        style={{
          position: "absolute",
          top: -30,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#151b29ee",
          color: "#fff",
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          padding: "3px 8px",
          borderRadius: 4,
          whiteSpace: "nowrap",
          opacity: isSelected ? 1 : 0,
          transition: "opacity 0.2s",
          pointerEvents: "none",
        }}
      >
        {node.label}
      </div>

      {/* Battery mini bar */}
      {node.type !== "solar" && (
        <div
          style={{
            position: "absolute",
            bottom: -18,
            left: "50%",
            transform: "translateX(-50%)",
            width: 36,
            height: 4,
            background: "#dde2f6",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${battery}%`,
              background: battery < 30 ? "#ef4444" : battery < 60 ? "#f59e0b" : "#22c55e",
              borderRadius: 2,
              transition: "width 1s ease, background 0.5s",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── DETAIL PANEL ─────────────────────────────────────────────────────────────
function DetailPanel({ node, isBlackout, onClose }) {
  if (!node) return null;
  const risk = riskForBlackout(node, isBlackout);
  const battery = batteryForBlackout(node, isBlackout);
  const rCfg = RISK_COLORS[risk];

  return (
    <div
      style={{
        position: "absolute",
        bottom: 80,
        left: "50%",
        transform: "translateX(-50%)",
        width: 340,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        borderRadius: 16,
        border: "1px solid rgba(221,193,174,0.4)",
        boxShadow: "0 20px 60px rgba(21,27,41,0.18)",
        padding: 24,
        zIndex: 50,
        animation: "slideUpFade 0.4s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 10, height: 10, borderRadius: "50%",
                background: rCfg.bg, display: "inline-block",
              }}
            />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#564334", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {rCfg.label}
            </span>
          </div>
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#151b29", marginTop: 4 }}>
            {node.label}
          </h3>
          <p style={{ fontSize: 12, color: "#56433488", marginTop: 2 }}>{node.description}</p>
        </div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#564334", fontSize: 20, lineHeight: 1 }}
        >
          ✕
        </button>
      </div>

      {/* Battery */}
      {node.type !== "solar" && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: "#564334" }}>Battery SOC</span>
            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: battery < 30 ? "#ef4444" : "#914c00", fontWeight: 700 }}>
              {battery}%
            </span>
          </div>
          <div style={{ height: 8, background: "#e9edff", borderRadius: 4, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${battery}%`,
                background: battery < 30 ? "#ef4444" : battery < 60 ? "#f59e0b" : "#22c55e",
                borderRadius: 4,
                transition: "width 1s ease",
              }}
            />
          </div>
          {battery < 30 && (
            <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4, fontFamily: "'JetBrains Mono'" }}>
              ⚠ Critical threshold approaching
            </p>
          )}
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {node.consumption > 0 && (
          <div style={{ background: "#f1f3ff", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#56433488", fontFamily: "'JetBrains Mono'", textTransform: "uppercase", letterSpacing: "0.08em" }}>Load</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#151b29", fontFamily: "'Space Grotesk'" }}>{node.consumption}kW</div>
          </div>
        )}
        {node.autonomy && (
          <div style={{ background: "#f1f3ff", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#56433488", fontFamily: "'JetBrains Mono'", textTransform: "uppercase", letterSpacing: "0.08em" }}>Autonomy</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#151b29", fontFamily: "'Space Grotesk'" }}>
              {isBlackout ? "⚡ Grid" : node.autonomy}
            </div>
          </div>
        )}
        <div style={{ background: "#f1f3ff", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, color: "#56433488", fontFamily: "'JetBrains Mono'", textTransform: "uppercase", letterSpacing: "0.08em" }}>Priority</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#914c00", fontFamily: "'Space Grotesk'", textTransform: "capitalize" }}>{node.priority}</div>
        </div>
        {node.vaccines && (
          <div style={{ background: "#fef2f2", borderRadius: 10, padding: "10px 12px", border: "1px solid #fca5a5" }}>
            <div style={{ fontSize: 10, color: "#ef4444aa", fontFamily: "'JetBrains Mono'", textTransform: "uppercase", letterSpacing: "0.08em" }}>Vaccines</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#ef4444", fontFamily: "'Space Grotesk'" }}>🔒 Protected</div>
          </div>
        )}
      </div>

      {/* AI Action */}
      {isBlackout && (
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ fontSize: 11, color: "#914c00", fontFamily: "'JetBrains Mono'", marginBottom: 4, fontWeight: 700 }}>
            🤖 AI COPILOT ACTION
          </div>
          <div style={{ fontSize: 13, color: "#151b29" }}>
            {node.priority === "critical"
              ? "Load shed applied. Essential systems isolated on backup battery."
              : node.priority === "medium"
              ? "Non-critical loads reduced 40%. Estimated +4h autonomy gain."
              : "Node suspended. Resources redirected to critical infrastructure."}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function CommunityMap() {
  const [nodes] = useState(NODES_INITIAL);
  const [selected, setSelected] = useState(null);
  const [isBlackout, setIsBlackout] = useState(false);
  const [feed, setFeed] = useState(NORMAL_FEED);
  const [feedVisible, setFeedVisible] = useState(NORMAL_FEED);
  const [showBlackoutBanner, setShowBlackoutBanner] = useState(false);
  const feedTimeout = useRef([]);

  const triggerBlackout = () => {
    if (isBlackout) {
      // Restore
      setIsBlackout(false);
      setShowBlackoutBanner(false);
      setFeedVisible(NORMAL_FEED);
      feedTimeout.current.forEach(clearTimeout);
      return;
    }

    setIsBlackout(true);
    setShowBlackoutBanner(true);
    setFeedVisible([]);
    feedTimeout.current.forEach(clearTimeout);

    BLACKOUT_FEED.forEach((item, i) => {
      const t = setTimeout(() => {
        setFeedVisible(prev => [item, ...prev].slice(0, 6));
      }, i * 900);
      feedTimeout.current.push(t);
    });
  };

  const handleNodeClick = (node) => {
    setSelected(prev => prev?.id === node.id ? null : node);
  };

  // Legend data
  const legendItems = [
    { color: "#22c55e", label: "Stable" },
    { color: "#f97316", label: "Med Risk" },
    { color: "#ef4444", label: "Emergency" },
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: "#faf8ff",
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ── CSS keyframes injected ── */}
      <style>{`
        @keyframes flowLine {
          from { stroke-dashoffset: 20; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes breatheRing {
          0%,100% { transform: scale(1); opacity: 0.6; }
          50%      { transform: scale(1.3); opacity: 0.2; }
        }
        @keyframes pulseRed {
          0%,100% { transform: scale(1); opacity: 0.7; }
          50%      { transform: scale(1.5); opacity: 0.2; }
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes bannerPulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.7; }
        }
      `}</style>

      {/* ── Map background mesh ── */}
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(221,193,174,0.4) 1px, transparent 0)
          `,
          backgroundSize: "40px 40px",
          transition: "background 1s",
          background: isBlackout
            ? "linear-gradient(135deg, #1a0a0a 0%, #2d0f0f 100%)"
            : "#faf8ff",
        }}
      />

      {/* ── Desert image overlay ── */}
      {!isBlackout && (
        <div style={{ position: "absolute", inset: 0, opacity: 0.18, filter: "grayscale(1) contrast(1.2)" }}>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDZ8l7CBxP2_lGP1MHWEe1l4H8EINSGviCiXO5etTbk7Hh4SQHyxFP8qlJjOYj_5VSk8xPfSxl14OLsZRfregniffGuerxdSSWMQQ9XzfNEhhR3bcY59uzTomlxe2VJLtLWOwrnBo6fsr4jSC3_rCgU2dFLEW1xq867m3ZD7ocPpn7S28QrnHfRQZRjQD2MtGJTIjv_RZ8iXwOwI0pOUoOBLbLD0BOLq1Fr1redDZN7I3mKj48I1bvx918CWSfm2Rzsh3UoClOICNa"
            alt="La Guajira"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

      {/* ── Red vignette in blackout ── */}
      {isBlackout && (
        <div
          style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(239,68,68,0.25) 100%)",
            pointerEvents: "none",
            animation: "bannerPulse 2s ease-in-out infinite",
          }}
        />
      )}

      {/* ── Energy lines ── */}
      <EnergyLines nodes={nodes} isBlackout={isBlackout} selectedId={selected?.id} />

      {/* ── Nodes ── */}
      {nodes.map(node => (
        <MapNode
          key={node.id}
          node={node}
          isBlackout={isBlackout}
          isSelected={selected?.id === node.id}
          onClick={handleNodeClick}
        />
      ))}

      {/* ── Blackout banner ── */}
      {showBlackoutBanner && (
        <div
          style={{
            position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
            background: "#ef4444",
            color: "#fff",
            padding: "10px 24px",
            borderRadius: 10,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.08em",
            zIndex: 60,
            boxShadow: "0 4px 24px rgba(239,68,68,0.5)",
            animation: "bannerPulse 1.5s ease-in-out infinite",
            whiteSpace: "nowrap",
          }}
        >
          ⚡ GRID OUTAGE — AI EMERGENCY PROTOCOL ACTIVE
        </div>
      )}

      {/* ── Top-left header ── */}
      <div
        style={{
          position: "absolute", top: 16, left: 16,
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(16px)",
          borderRadius: 12,
          padding: "12px 16px",
          border: "1px solid rgba(221,193,174,0.35)",
          zIndex: 40,
        }}
      >
        <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 15, color: "#151b29" }}>
          Community Energy Map
        </div>
        <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "#56433488", marginTop: 2 }}>
          La Guajira · Wayuu Territory
        </div>
      </div>

      {/* ── Legend ── */}
      <div
        style={{
          position: "absolute", top: 16, right: 16,
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(16px)",
          borderRadius: 12,
          padding: "12px 16px",
          border: "1px solid rgba(221,193,174,0.35)",
          zIndex: 40,
        }}
      >
        {legendItems.map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "#564334" }}>{label}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid rgba(221,193,174,0.3)", marginTop: 6, paddingTop: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="20" height="6">
              <line x1="0" y1="3" x2="20" y2="3" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4 3" />
            </svg>
            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "#564334" }}>Energy flow</span>
          </div>
        </div>
      </div>

      {/* ── Simulate button ── */}
      <div style={{ position: "absolute", bottom: 24, right: 24, zIndex: 40 }}>
        <button
          onClick={triggerBlackout}
          style={{
            background: isBlackout ? "#22c55e" : "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "12px 22px",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.05em",
            cursor: "pointer",
            boxShadow: isBlackout
              ? "0 4px 20px rgba(34,197,94,0.4)"
              : "0 4px 20px rgba(239,68,68,0.4)",
            transition: "all 0.3s ease",
          }}
        >
          {isBlackout ? "✅ Restore Grid" : "⚡ Simulate Blackout"}
        </button>
      </div>

      {/* ── Live feed ── */}
      <div
        style={{
          position: "absolute", bottom: 24, left: 16,
          width: 300,
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(20px)",
          borderRadius: 14,
          border: "1px solid rgba(221,193,174,0.3)",
          padding: "14px 16px",
          zIndex: 40,
          boxShadow: "0 8px 32px rgba(21,27,41,0.1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "#564334", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            AI Live Feed
          </span>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: isBlackout ? "#ef4444" : "#914c00", animation: "bannerPulse 1s infinite" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {feedVisible.map((item, i) => (
            <div
              key={i}
              style={{
                borderLeft: `2px solid ${item.border}`,
                paddingLeft: 10,
                paddingTop: 4,
                paddingBottom: 4,
                animation: "slideUpFade 0.4s ease both",
              }}
            >
              <p style={{ fontSize: 12, color: "#151b29", lineHeight: 1.4, margin: 0 }}>{item.msg}</p>
              <p style={{ fontSize: 10, color: "#56433466", marginTop: 2, fontFamily: "'JetBrains Mono'" }}>{item.time} ago</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Node detail panel ── */}
      {selected && (
        <DetailPanel
          node={selected}
          isBlackout={isBlackout}
          onClose={() => setSelected(null)}
        />
      )}

      {/* ── Overlay glow ── */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: isBlackout
            ? "linear-gradient(135deg, rgba(239,68,68,0.04), transparent)"
            : "linear-gradient(135deg, rgba(145,76,0,0.04), transparent)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}