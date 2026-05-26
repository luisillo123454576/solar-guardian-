import { useState, useEffect, useRef } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
const PANELES = [
  { id: "p1", x: 32, y: 38, label: "Panel A" },
  { id: "p2", x: 38, y: 44, label: "Panel B" },
  { id: "p3", x: 44, y: 40, label: "Panel C" },
  { id: "p4", x: 36, y: 50, label: "Panel D" },
];

const NODOS_BASE = [
  { id: "solar-alpha",        label: "Estación Solar Alpha",    icono: "solar_power",    tipo: "solar",    prioridad: "fuente",  x: 38, y: 44, bateria: 95, consumo: 0,   riesgo: "bajo",  autonomia: null, descripcion: "Array fotovoltaico principal. 48kWp instalados." },
  { id: "centro-salud",       label: "Centro de Salud Rural",   icono: "emergency",      tipo: "salud",    prioridad: "critica", x: 62, y: 60, bateria: 34, consumo: 4.2, riesgo: "alto",  autonomia: "11h", vacunas: true, descripcion: "Centro médico Wayuu. Refrigeración activa." },
  { id: "escuela",            label: "Escuela Wayuu #4",        icono: "school",         tipo: "escuela",  prioridad: "media",   x: 22, y: 68, bateria: 71, consumo: 1.8, riesgo: "bajo",  autonomia: "28h", descripcion: "Escuela primaria. 120 estudiantes." },
  { id: "centro-comunitario", label: "Centro Comunitario",      icono: "diversity_3",    tipo: "comunidad",prioridad: "apoyo",   x: 78, y: 26, bateria: 52, consumo: 2.9, riesgo: "medio", autonomia: "18h", descripcion: "Centro comunitario y comunicaciones." },
  { id: "torre-comm",         label: "Torre de Comunicaciones", icono: "cell_tower",     tipo: "torre",    prioridad: "critica", x: 55, y: 20, bateria: 88, consumo: 0.6, riesgo: "bajo",  autonomia: "72h", descripcion: "Torre. Cobertura 40km²." },
  { id: "bomba-agua",         label: "Estación de Bombeo",      icono: "water_pump",     tipo: "agua",     prioridad: "critica", x: 30, y: 30, bateria: 61, consumo: 3.1, riesgo: "medio", autonomia: "20h", descripcion: "Bombeo de agua para 340 familias." },
];

const CONEXIONES = [
  { de: "solar-alpha", a: "centro-salud",       grosor: 2.5 },
  { de: "solar-alpha", a: "escuela",            grosor: 1.5 },
  { de: "solar-alpha", a: "centro-comunitario", grosor: 1.5 },
  { de: "solar-alpha", a: "torre-comm",         grosor: 1.5 },
  { de: "solar-alpha", a: "bomba-agua",         grosor: 2 },
];

const PRIORIDAD_CFG = {
  critica: { color: "#ef4444", anillo: "rgba(239,68,68,0.25)",  tamaño: 48 },
  media:   { color: "#f59e0b", anillo: "rgba(245,158,11,0.25)", tamaño: 40 },
  apoyo:   { color: "#f97316", anillo: "rgba(249,115,22,0.25)", tamaño: 40 },
  fuente:  { color: "#914c00", anillo: "rgba(145,76,0,0.3)",    tamaño: 52 },
};

const RIESGO_CFG = {
  bajo:  { bg: "#22c55e", label: "Estable",     texto: "#fff" },
  medio: { bg: "#f97316", label: "Riesgo Med.", texto: "#fff" },
  alto:  { bg: "#ef4444", label: "Emergencia",  texto: "#fff" },
};

const FEED_NORMAL = [
  { msg: "Refrigeración médica priorizada en Centro de Salud.", tiempo: "12s", borde: "#914c00" },
  { msg: "Optimización energética activada por IA.",            tiempo: "2m",  borde: "#914c00" },
  { msg: "Autonomía extendida 4h 12m por balanceo de carga.",   tiempo: "5m",  borde: "#22c55e" },
];

const FEED_APAGON = [
  { msg: "⚡ Corte de red detectado — sector norte.",               tiempo: "ahora", borde: "#ef4444" },
  { msg: "🔒 Refrigeración médica bloqueada a 4°C.",              tiempo: "3s",    borde: "#914c00" },
  { msg: "📡 Torre en batería de respaldo.",                       tiempo: "5s",    borde: "#914c00" },
  { msg: "💧 Bomba elevada a prioridad CRÍTICA.",                  tiempo: "8s",    borde: "#914c00" },
  { msg: "🏫 Escuela: cargas no esenciales reducidas.",            tiempo: "12s",   borde: "#f59e0b" },
  { msg: "🏘 Centro Comunitario: carga reducida al 30%.",          tiempo: "15s",   borde: "#f59e0b" },
  { msg: "✅ Autonomía extendida +6h por rebalanceo IA.",          tiempo: "20s",   borde: "#22c55e" },
];

const FEED_PANEL_DAÑO = [
  { msg: "🔴 Panel solar dañado detectado.",                        tiempo: "ahora", borde: "#ef4444" },
  { msg: "⚡ Generación solar reducida al 25%.",                   tiempo: "2s",    borde: "#ef4444" },
  { msg: "🔋 IA reasignando carga a baterías de respaldo.",        tiempo: "5s",    borde: "#f59e0b" },
  { msg: "⚠️ Autonomía reducida. Nodos críticos priorizados.",     tiempo: "10s",   borde: "#f59e0b" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function Ico({ name, style = {} }) {
  return (
    <span className="material-symbols-outlined"
      style={{ fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, ...style }}>
      {name}
    </span>
  );
}

function riesgoEfectivo(nodo, apagon, panelDañado) {
  if (panelDañado && nodo.tipo !== "solar") {
    if (nodo.prioridad === "critica") return "medio";
    return "alto";
  }
  if (!apagon) return nodo.riesgo;
  if (nodo.tipo === "solar") return "alto";
  if (nodo.prioridad === "critica") return "medio";
  return "alto";
}

function bateriaEfectiva(nodo, apagon, panelDañado, baterias) {
  const override = baterias[nodo.id];
  if (override !== undefined) return Math.max(0, override);
  if (apagon) {
    if (nodo.tipo === "solar") return 0;
    if (nodo.prioridad === "critica") return Math.max(nodo.bateria - 15, 10);
    return Math.max(nodo.bateria - 30, 5);
  }
  if (panelDañado && nodo.tipo !== "solar") return Math.max(nodo.bateria - 10, 5);
  return nodo.bateria;
}

function formatTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ── Panel Solar SVG con titileo ───────────────────────────────────────────────
function PanelSolar({ panel, dañado, seleccionado, onClick }) {
  const [pulso, setPulso] = useState(false);

  useEffect(() => {
    if (dañado) return;
    const delay = Math.random() * 1200;
    const t = setTimeout(() => {
      const id = setInterval(() => setPulso(p => !p), 900 + Math.random() * 600);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(t);
  }, [dañado]);

  const color = dañado ? "#ef4444" : pulso ? "#ffffff" : "#ffe082";
  const glow  = dañado ? "0 0 18px rgba(239,68,68,0.9)" : pulso ? "0 0 16px rgba(255,255,255,0.95)" : "0 0 8px rgba(255,224,130,0.5)";

  return (
    <div
      onClick={() => onClick(panel)}
      style={{
        position: "absolute",
        left: `${panel.x}%`, top: `${panel.y}%`,
        transform: "translate(-50%,-50%)",
        zIndex: seleccionado ? 25 : 15,
        cursor: "pointer",
      }}
    >
      <svg width="36" height="28" viewBox="0 0 36 28">
        {/* Marco */}
        <rect x="1" y="1" width="34" height="26" rx="3" fill={dañado ? "#3a0000" : "#1a237e"}
          stroke={color} strokeWidth={seleccionado ? 2.5 : 1.5} />
        {/* Celdas */}
        {[0,1,2].map(col => [0,1].map(row => (
          <rect key={`${col}-${row}`}
            x={4 + col * 11} y={4 + row * 11}
            width="9" height="9" rx="1"
            fill={dañado ? "#7f0000" : "#283593"}
            stroke={color} strokeWidth="0.5" opacity={0.8}
          />
        )))}
        {/* Brillo / crack */}
        {dañado
          ? <path d="M12 4 L18 14 L14 14 L20 24" stroke="#ef4444" strokeWidth="1.5" fill="none" opacity="0.9"/>
          : <ellipse cx="10" cy="8" rx="4" ry="2" fill={color} opacity={pulso ? 0.5 : 0.15}/>
        }
      </svg>
      {/* Halo */}
      <div style={{
        position: "absolute", inset: -4, borderRadius: 6,
        boxShadow: glow, pointerEvents: "none",
        transition: "box-shadow 0.4s ease",
      }}/>
      {/* Label tooltip */}
      <div style={{
        position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)",
        background: dañado ? "#ef4444" : "#151b29ee",
        color: "#fff", fontSize: 9,
        fontFamily: "'JetBrains Mono',monospace",
        padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap",
        opacity: seleccionado ? 1 : 0, transition: "opacity 0.2s",
        pointerEvents: "none",
      }}>
        {dañado ? "⚠ FALLA" : panel.label}
      </div>
    </div>
  );
}

// ── Líneas energía ────────────────────────────────────────────────────────────
function LineasEnergia({ nodos, apagon, panelDañado, selId }) {
  const mapa = Object.fromEntries(nodos.map(n => [n.id, n]));
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 10 }}>
      <defs>
        <linearGradient id="gL1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#F59E0B" stopOpacity="0.05"/>
          <stop offset="50%"  stopColor="#F59E0B" stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.05"/>
        </linearGradient>
        <linearGradient id="gL2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ef4444" stopOpacity="0.05"/>
          <stop offset="50%"  stopColor="#ef4444" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      {CONEXIONES.map(({ de, a, grosor }) => {
        const o = mapa[de], d = mapa[a];
        if (!o || !d) return null;
        const sel    = selId === de || selId === a;
        const broken = (apagon || panelDañado) && de === "solar-alpha";
        return (
          <path key={`${de}-${a}`}
            d={`M${o.x}%,${o.y}% L${d.x}%,${d.y}%`}
            fill="none"
            stroke={broken ? "url(#gL2)" : "url(#gL1)"}
            strokeWidth={sel ? grosor + 1.5 : grosor}
            opacity={sel ? 1 : broken ? 0.4 : 0.55}
            strokeDasharray={broken ? "3 10" : "8 12"}
            style={{ animation: broken ? "none" : "lineaFlujo 1.4s linear infinite" }}
          />
        );
      })}
    </svg>
  );
}

// ── Nodo mapa ─────────────────────────────────────────────────────────────────
function NodoMapa({ nodo, apagon, panelDañado, baterias, seleccionado, onClick }) {
  const riesgo  = riesgoEfectivo(nodo, apagon, panelDañado);
  const bateria = bateriaEfectiva(nodo, apagon, panelDañado, baterias);
  const pCfg    = PRIORIDAD_CFG[nodo.prioridad];
  const rCfg    = RIESGO_CFG[riesgo];
  const sz      = pCfg.tamaño;
  const alarm   = apagon || (panelDañado && riesgo === "alto");
  const glow    = alarm ? "#ef4444" : pCfg.color;

  return (
    <div style={{ position: "absolute", left: `${nodo.x}%`, top: `${nodo.y}%`, transform: "translate(-50%,-50%)", zIndex: seleccionado ? 30 : 20 }}>
      <div style={{
        position: "absolute", inset: -10, borderRadius: "50%",
        background: pCfg.anillo, pointerEvents: "none",
        animation: alarm && riesgo === "alto" ? "pulsoRojo 1s ease-in-out infinite" : "respirar 3s ease-in-out infinite",
      }}/>
      <div onClick={() => onClick(nodo)} style={{
        width: sz, height: sz, borderRadius: "50%",
        background: alarm
          ? riesgo === "alto" ? "#ef4444" : riesgo === "medio" ? "#f97316" : rCfg.bg
          : pCfg.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        boxShadow: seleccionado
          ? `0 0 0 4px ${glow}55, 0 0 30px ${glow}88`
          : `0 0 15px ${glow}44`,
        transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        transform: seleccionado ? "scale(1.18)" : "scale(1)",
        border: seleccionado ? `2px solid ${glow}` : "none",
      }}>
        <Ico name={nodo.icono} style={{ color: "white", fontSize: sz * 0.42 }}/>
      </div>
      <div style={{
        position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
        background: rCfg.bg, color: rCfg.texto,
        fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600,
        padding: "1px 6px", borderRadius: 4, whiteSpace: "nowrap",
      }}>{rCfg.label}</div>
      <div style={{
        position: "absolute", top: -30, left: "50%", transform: "translateX(-50%)",
        background: "#151b29ee", color: "#fff",
        fontSize: 10, fontFamily: "'JetBrains Mono',monospace",
        padding: "3px 8px", borderRadius: 4, whiteSpace: "nowrap",
        opacity: seleccionado ? 1 : 0, transition: "opacity 0.2s", pointerEvents: "none",
      }}>{nodo.label}</div>
      {nodo.tipo !== "solar" && (
        <div style={{ position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)", width: 40, height: 5, background: "#dde2f6", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${bateria}%`,
            background: bateria < 30 ? "#ef4444" : bateria < 60 ? "#f59e0b" : "#22c55e",
            borderRadius: 3, transition: "width 1s ease",
            animation: bateria < 30 && alarm ? "parpadeo 0.8s ease-in-out infinite" : "none",
          }}/>
        </div>
      )}
    </div>
  );
}

// ── Panel detalle ─────────────────────────────────────────────────────────────
function PanelDetalle({ nodo, apagon, panelDañado, baterias, tiempoRecarga, onCerrar }) {
  if (!nodo) return null;
  const riesgo  = riesgoEfectivo(nodo, apagon, panelDañado);
  const bateria = bateriaEfectiva(nodo, apagon, panelDañado, baterias);
  const rCfg    = RIESGO_CFG[riesgo];

  return (
    <div style={{
      position: "absolute", bottom: 90, left: "50%", transform: "translateX(-50%)",
      width: 360, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(20px)",
      borderRadius: 16, border: "1px solid rgba(221,193,174,0.4)",
      boxShadow: "0 20px 60px rgba(21,27,41,0.18)", padding: 24, zIndex: 50,
      animation: "subirPanel 0.4s cubic-bezier(0.16,1,0.3,1) both",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: rCfg.bg, display: "inline-block" }}/>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#564334", letterSpacing: "0.08em", textTransform: "uppercase" }}>{rCfg.label}</span>
          </div>
          <h3 style={{ fontFamily: "'Geist',sans-serif", fontWeight: 700, fontSize: 18, color: "#151b29", marginTop: 4 }}>{nodo.label}</h3>
          <p style={{ fontSize: 12, color: "#56433488", marginTop: 2 }}>{nodo.descripcion}</p>
        </div>
        <button onClick={onCerrar} style={{ background: "none", border: "none", cursor: "pointer", color: "#564334", fontSize: 20 }}>✕</button>
      </div>

      {/* Batería + temporizador */}
      {nodo.tipo !== "solar" && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: "#564334" }}>Nivel de Batería</span>
            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: bateria < 30 ? "#ef4444" : "#914c00", fontWeight: 700 }}>{bateria.toFixed(0)}%</span>
          </div>
          <div style={{ height: 10, background: "#e9edff", borderRadius: 5, overflow: "hidden", marginBottom: 6 }}>
            <div style={{
              height: "100%", width: `${bateria}%`,
              background: bateria < 30 ? "#ef4444" : bateria < 60 ? "#f59e0b" : "#22c55e",
              borderRadius: 5, transition: "width 1.5s ease",
              animation: bateria < 30 ? "parpadeo 0.8s ease-in-out infinite" : "none",
            }}/>
          </div>
          {(apagon || panelDañado) && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: bateria < 30 ? "#fef2f2" : "#fff7ed", border: `1px solid ${bateria < 30 ? "#fca5a5" : "#fed7aa"}`, borderRadius: 8, padding: "8px 12px" }}>
              <div>
                <div style={{ fontSize: 10, color: bateria < 30 ? "#ef4444" : "#914c00", fontFamily: "'JetBrains Mono'", fontWeight: 700, marginBottom: 2 }}>
                  {bateria < 30 ? "⚠ BATERÍA CRÍTICA" : "⏱ TIEMPO DE RECARGA"}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#151b29", fontFamily: "'Geist'" }}>
                  {formatTime(tiempoRecarga)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "#56433488", fontFamily: "'JetBrains Mono'" }}>ESTIMADO</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#914c00" }}>para recarga completa</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: nodo.vacunas || (apagon || panelDañado) ? 16 : 0 }}>
        {nodo.consumo > 0 && (
          <div style={{ background: "#f1f3ff", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#56433488", fontFamily: "'JetBrains Mono'", textTransform: "uppercase" }}>Carga</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#151b29", fontFamily: "'Geist'" }}>{nodo.consumo} kW</div>
          </div>
        )}
        {nodo.autonomia && (
          <div style={{ background: "#f1f3ff", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#56433488", fontFamily: "'JetBrains Mono'", textTransform: "uppercase" }}>Autonomía</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#151b29", fontFamily: "'Geist'" }}>{apagon ? "⚡ Red" : nodo.autonomia}</div>
          </div>
        )}
        <div style={{ background: "#f1f3ff", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, color: "#56433488", fontFamily: "'JetBrains Mono'", textTransform: "uppercase" }}>Prioridad</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#914c00", fontFamily: "'Geist'", textTransform: "capitalize" }}>{nodo.prioridad}</div>
        </div>
        {nodo.vacunas && (
          <div style={{ background: "#fef2f2", borderRadius: 10, padding: "10px 12px", border: "1px solid #fca5a5" }}>
            <div style={{ fontSize: 10, color: "#ef4444aa", fontFamily: "'JetBrains Mono'", textTransform: "uppercase" }}>Vacunas</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#ef4444", fontFamily: "'Geist'" }}>🔒 Protegidas</div>
          </div>
        )}
      </div>

      {(apagon || panelDañado) && (
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ fontSize: 11, color: "#914c00", fontFamily: "'JetBrains Mono'", marginBottom: 4, fontWeight: 700 }}>🤖 ACCIÓN COPILOT IA</div>
          <div style={{ fontSize: 13, color: "#151b29" }}>
            {nodo.prioridad === "critica"
              ? "Sistemas esenciales aislados en batería de respaldo. Carga reducida al mínimo vital."
              : nodo.prioridad === "media"
              ? "Cargas no críticas reducidas 40%. Ganancia estimada +4h de autonomía."
              : "Nodo suspendido. Recursos redirigidos a infraestructura crítica."}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mapa de efectos por simulación ───────────────────────────────────────────
const SIM_MAP = {
  battery_low: {
    apagon: false,
    panelDañado: false,
    bgColor: "#1a0a05",
    viñeta: "radial-gradient(ellipse at center, transparent 30%, rgba(186,26,26,0.4) 100%)",
    banner: { text: "🔋 BATERÍA CRÍTICA — 18% — ALERTA ENVIADA AL PERSONAL IPS", bg: "#ba1a1a" },
    baterias: { "centro-salud": 18, "escuela": 22, "bomba-agua": 15, "centro-comunitario": 20, "torre-comm": 25 },
    feed: [
      { msg: "🔋 Batería global al 18% — umbral crítico alcanzado.", tiempo: "ahora", borde: "#ba1a1a" },
      { msg: "📲 WhatsApp enviado al personal IPS con lista de prioridades.", tiempo: "2s", borde: "#ff8a00" },
      { msg: "⚡ IA reduciendo cargas no esenciales automáticamente.", tiempo: "5s", borde: "#f59e0b" },
    ],
    timerLabel: "⏱ AUTONOMÍA RESTANTE",
    timerSeg: 3 * 3600 + 20 * 60,
  },
  peak_solar: {
    apagon: false,
    panelDañado: false,
    bgColor: "#fffbf0",
    viñeta: "radial-gradient(ellipse at center, rgba(255,200,0,0.08) 0%, transparent 70%)",
    banner: { text: "☀️ PICO SOLAR 7.0 kWh/m² — CARGA MÁXIMA RECOMENDADA", bg: "#ff8a00" },
    baterias: { "centro-salud": 98, "escuela": 95, "bomba-agua": 99, "centro-comunitario": 92, "torre-comm": 100 },
    feed: [
      { msg: "☀️ Radiación máxima detectada: 7.0 kWh/m².", tiempo: "ahora", borde: "#ff8a00" },
      { msg: "📲 WhatsApp: ventana óptima de carga activada.", tiempo: "3s", borde: "#ff8a00" },
      { msg: "🔋 Cargando baterías al máximo — 100% en ~45 min.", tiempo: "6s", borde: "#22c55e" },
    ],
    timerLabel: "⏱ VENTANA DE CARGA ÓPTIMA",
    timerSeg: 2 * 3600 + 15 * 60,
  },
  cloudy: {
    apagon: false,
    panelDañado: true,
    bgColor: "#1a1810",
    viñeta: "radial-gradient(ellipse at center, transparent 30%, rgba(100,90,60,0.45) 100%)",
    banner: { text: "🌧 NUBOSIDAD 85% — GENERACIÓN REDUCIDA — CONSERVAR BATERÍA", bg: "#51453a" },
    baterias: { "centro-salud": 48, "escuela": 55, "bomba-agua": 42, "centro-comunitario": 38, "torre-comm": 70 },
    feed: [
      { msg: "🌧 Nubosidad al 85% — generación solar -70%.", tiempo: "ahora", borde: "#51453a" },
      { msg: "📲 WhatsApp: alerta de reducción de generación enviada.", tiempo: "3s", borde: "#f59e0b" },
      { msg: "⚡ IA activando modo conservación de reservas.", tiempo: "7s", borde: "#f59e0b" },
    ],
    timerLabel: "⏱ TIEMPO ESTIMADO CON RESERVAS",
    timerSeg: 9 * 3600 + 40 * 60,
  },
  night: {
    apagon: false,
    panelDañado: true,
    bgColor: "#080c18",
    viñeta: "radial-gradient(ellipse at center, transparent 20%, rgba(30,20,60,0.7) 100%)",
    banner: { text: "🌙 MODO NOCTURNO — SOLAR EN 0 — CONSUMIENDO RESERVAS", bg: "#4a4e69" },
    baterias: { "centro-salud": 60, "escuela": 45, "bomba-agua": 52, "centro-comunitario": 30, "torre-comm": 80 },
    feed: [
      { msg: "🌙 Generación solar en 0 — modo nocturno activo.", tiempo: "ahora", borde: "#4a4e69" },
      { msg: "📲 WhatsApp: alerta consumo de reservas nocturnas.", tiempo: "3s", borde: "#f59e0b" },
      { msg: "⚡ IA priorizando sistemas críticos para la noche.", tiempo: "8s", borde: "#914c00" },
    ],
    timerLabel: "⏱ HASTA AMANECER SOLAR",
    timerSeg: 7 * 3600 + 10 * 60,
  },
  reset: null,
};

// ── Componente principal ──────────────────────────────────────────────────────
export default function CommunityMap({ isEmergency = false, simState = null }) {
  const [seleccionado, setSeleccionado] = useState(null);
  const [apagon, setApagon]             = useState(false);
  const [panelDañado, setPanelDañado]   = useState(false);
  const [panelSelId, setPanelSelId]     = useState(null);
  const [feedVisible, setFeedVisible]   = useState(FEED_NORMAL);
  const [baterias, setBaterias]         = useState({});          // override bat %
  const [tiempoRecarga, setTiempoRecarga] = useState(0);         // segundos
  const timersRef   = useRef([]);
  const drainRef    = useRef(null);
  const rechargeRef = useRef(null);

  // Sync con prop isEmergency del padre
  useEffect(() => {
    if (isEmergency && !apagon) activarApagon(true);
    if (!isEmergency && apagon)  restaurar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmergency]);

  // Sync con simulaciones del panel
  useEffect(() => {
    if (!simState || simState === "reset") { restaurar(); return; }
    const cfg = SIM_MAP[simState];
    if (!cfg) return;
    restaurar();
    setTimeout(() => {
      setApagon(cfg.apagon);
      setPanelDañado(cfg.panelDañado);
      setBaterias(cfg.baterias || {});
      setFeedVisible([]);
      timersRef.current = cfg.feed.map((item, i) =>
        setTimeout(() => setFeedVisible(prev => [item, ...prev].slice(0, 6)), i * 900)
      );
      if (cfg.timerSeg) iniciarRecarga(cfg.timerSeg);
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simState]);

  // Drenaje de baterías durante emergencia
  const iniciarDrenaje = () => {
    clearInterval(drainRef.current);
    setBaterias({});
    drainRef.current = setInterval(() => {
      setBaterias(prev => {
        const next = { ...prev };
        NODOS_BASE.forEach(n => {
          if (n.tipo === "solar") return;
          const base = prev[n.id] ?? bateriaEfectiva(n, true, panelDañado, {});
          const tasa = n.prioridad === "critica" ? 0.4 : n.prioridad === "media" ? 0.8 : 1.5;
          next[n.id] = Math.max(0, base - tasa);
        });
        return next;
      });
    }, 1000);
  };

  // Temporizador de recarga
  const iniciarRecarga = (segundos) => {
    clearInterval(rechargeRef.current);
    setTiempoRecarga(segundos);
    rechargeRef.current = setInterval(() => {
      setTiempoRecarga(t => {
        if (t <= 1) { clearInterval(rechargeRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const activarApagon = (externo = false) => {
    setApagon(true);
    setFeedVisible([]);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = FEED_APAGON.map((item, i) =>
      setTimeout(() => setFeedVisible(prev => [item, ...prev].slice(0, 6)), i * 900)
    );
    iniciarDrenaje();
    iniciarRecarga(14 * 3600 + 22 * 60); // 14h 22m
  };

  const activarFallaPaneles = () => {
    setPanelDañado(true);
    setPanelSelId(null);
    setFeedVisible([]);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = FEED_PANEL_DAÑO.map((item, i) =>
      setTimeout(() => setFeedVisible(prev => [item, ...prev].slice(0, 6)), i * 1000)
    );
    iniciarDrenaje();
    iniciarRecarga(6 * 3600); // 6h para reparación estimada
  };

  const restaurar = () => {
    setApagon(false);
    setPanelDañado(false);
    setFeedVisible(FEED_NORMAL);
    setBaterias({});
    setTiempoRecarga(0);
    timersRef.current.forEach(clearTimeout);
    clearInterval(drainRef.current);
    clearInterval(rechargeRef.current);
  };

  const toggleApagon = () => apagon ? restaurar() : activarApagon();

  const onClickPanel = (panel) => {
    setPanelSelId(prev => prev === panel.id ? null : panel.id);
  };

  const emergency = apagon || panelDañado;
  const simCfg    = (simState && simState !== "reset") ? SIM_MAP[simState] : null;
  const bgColor   = simCfg?.bgColor ?? (apagon ? "#1a0505" : panelDañado ? "#1a1005" : "#faf8ff");
  const viñeta    = simCfg?.viñeta  ?? (apagon ? "radial-gradient(ellipse at center, transparent 30%, rgba(239,68,68,0.35) 100%)" : "radial-gradient(ellipse at center, transparent 30%, rgba(245,158,11,0.25) 100%)");
  const bannerCfg = simCfg?.banner  ?? (apagon ? { text: "⚡ CORTE DE RED — PROTOCOLO DE EMERGENCIA IA ACTIVO", bg: "#ef4444" } : panelDañado ? { text: "🔴 FALLA EN PANELES SOLARES — GENERACIÓN REDUCIDA AL 25%", bg: "#f59e0b" } : null);
  const timerLabel = simCfg?.timerLabel ?? (apagon ? "⏱ TIEMPO ESTIMADO DE RECARGA" : "🔧 TIEMPO DE REPARACIÓN ESTIMADO");

  return (
    <div style={{ width: "100%", height: "calc(100vh - 80px)", position: "relative", overflow: "hidden", background: bgColor, transition: "background 1s" }}>
      <style>{`
        @keyframes lineaFlujo { from { stroke-dashoffset: 20; } to { stroke-dashoffset: 0; } }
        @keyframes respirar   { 0%,100%{ transform:scale(1); opacity:.6; } 50%{ transform:scale(1.3); opacity:.2; } }
        @keyframes pulsoRojo  { 0%,100%{ transform:scale(1); opacity:.7; } 50%{ transform:scale(1.5); opacity:.15; } }
        @keyframes subirPanel { from{ opacity:0; transform:translateX(-50%) translateY(20px); } to{ opacity:1; transform:translateX(-50%) translateY(0); } }
        @keyframes parpadeo   { 0%,100%{ opacity:1; } 50%{ opacity:.45; } }
      `}</style>

      {/* Fondo cuadrícula */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `radial-gradient(circle at 1px 1px, ${apagon ? "rgba(239,68,68,0.2)" : panelDañado ? "rgba(245,158,11,0.2)" : "rgba(221,193,174,0.35)"} 1px, transparent 0)`,
        backgroundSize: "40px 40px", pointerEvents: "none",
      }}/>

      {/* Foto desierto */}
      {!emergency && (
        <div style={{ position: "absolute", inset: 0, opacity: 0.15, filter: "grayscale(1) contrast(1.2)", pointerEvents: "none" }}>
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDZ8l7CBxP2_lGP1MHWEe1l4H8EINSGviCiXO5etTbk7Hh4SQHyxFP8qlJjOYj_5VSk8xPfSxl14OLsZRfregniffGuerxdSSWMQQ9XzfNEhhR3bcY59uzTomlxe2VJLtLWOwrnBo6fsr4jSC3_rCgU2dFLEW1xq867m3ZD7ocPpn7S28QrnHfRQZRjQD2MtGJTIjv_RZ8iXwOwI0pOUoOBLbLD0BOLq1Fr1redDZN7I3mKj48I1bvx918CWSfm2Rzsh3UoClOICNa"
            alt="La Guajira" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
        </div>
      )}

      {/* Viñeta */}
      {(emergency || simCfg) && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: viñeta,
          animation: "parpadeo 2.5s ease-in-out infinite",
        }}/>
      )}

      {/* Líneas energía */}
      <LineasEnergia nodos={NODOS_BASE} apagon={apagon} panelDañado={panelDañado} selId={seleccionado?.id}/>

      {/* Paneles solares */}
      {PANELES.map(p => (
        <PanelSolar key={p.id}
          panel={p}
          dañado={panelDañado}
          seleccionado={panelSelId === p.id}
          onClick={onClickPanel}
        />
      ))}

      {/* Nodos */}
      {NODOS_BASE.map(n => (
        <NodoMapa key={n.id} nodo={n}
          apagon={apagon} panelDañado={panelDañado} baterias={baterias}
          seleccionado={seleccionado?.id === n.id}
          onClick={n => setSeleccionado(prev => prev?.id === n.id ? null : n)}
        />
      ))}

      {/* Banner unificado */}
      {bannerCfg && (
        <div style={{
          position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
          background: bannerCfg.bg, color: "#fff",
          padding: "10px 28px", borderRadius: 10,
          fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em",
          zIndex: 60, boxShadow: `0 4px 24px ${bannerCfg.bg}88`,
          animation: "parpadeo 1.5s ease-in-out infinite", whiteSpace: "nowrap",
        }}>
          {bannerCfg.text}
        </div>
      )}

      {/* Encabezado */}
      <div style={{
        position: "absolute", top: 16, left: 16,
        background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)",
        borderRadius: 12, padding: "12px 16px",
        border: "1px solid rgba(221,193,174,0.35)", zIndex: 40,
      }}>
        <div style={{ fontFamily: "'Geist',sans-serif", fontWeight: 700, fontSize: 15, color: "#151b29" }}>Mapa Comunitario</div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#56433488", marginTop: 2 }}>La Guajira · Territorio Wayuu</div>
      </div>

      {/* Leyenda */}
      <div style={{
        position: "absolute", top: 16, right: 16,
        background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)",
        borderRadius: 12, padding: "12px 16px",
        border: "1px solid rgba(221,193,174,0.35)", zIndex: 40,
      }}>
        {[{ c: "#22c55e", l: "Estable" }, { c: "#f97316", l: "Riesgo Med." }, { c: "#ef4444", l: "Emergencia" }].map(({ c, l }) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: c }}/>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#564334" }}>{l}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid rgba(221,193,174,0.3)", marginTop: 6, paddingTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4 3"/></svg>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#564334" }}>Flujo energético</span>
        </div>
        <div style={{ borderTop: "1px solid rgba(221,193,174,0.3)", marginTop: 6, paddingTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="20" height="14" viewBox="0 0 20 14"><rect x="1" y="1" width="18" height="12" rx="2" fill="#1a237e" stroke="#ffe082" strokeWidth="1"/><rect x="3" y="3" width="6" height="4" rx="0.5" fill="#283593" stroke="#ffe082" strokeWidth="0.4"/></svg>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#564334" }}>Paneles solares</span>
        </div>
      </div>

      {/* Botones simulación */}
      {!isEmergency && (
        <div style={{ position: "absolute", bottom: 24, right: 24, zIndex: 40, display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={toggleApagon} style={{
            background: apagon ? "#22c55e" : "#ef4444", color: "#fff",
            border: "none", borderRadius: 10, padding: "11px 20px",
            fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 12, letterSpacing: "0.05em",
            cursor: "pointer",
            boxShadow: apagon ? "0 4px 20px rgba(34,197,94,0.4)" : "0 4px 20px rgba(239,68,68,0.4)",
            transition: "all 0.3s ease", whiteSpace: "nowrap",
          }}>
            {apagon ? "✅ Restaurar Red" : "⚡ Simular Apagón"}
          </button>
          {!apagon && (
            <button onClick={panelDañado ? restaurar : activarFallaPaneles} style={{
              background: panelDañado ? "#22c55e" : "#f59e0b", color: panelDañado ? "#fff" : "#1a0a00",
              border: "none", borderRadius: 10, padding: "11px 20px",
              fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 12, letterSpacing: "0.05em",
              cursor: "pointer",
              boxShadow: panelDañado ? "0 4px 20px rgba(34,197,94,0.4)" : "0 4px 20px rgba(245,158,11,0.4)",
              transition: "all 0.3s ease", whiteSpace: "nowrap",
            }}>
              {panelDañado ? "✅ Reparar Paneles" : "🔴 Simular Falla Solar"}
            </button>
          )}
        </div>
      )}

      {/* Feed IA */}
      <div style={{
        position: "absolute", bottom: 24, left: 16, width: 300,
        background: "rgba(255,255,255,0.93)", backdropFilter: "blur(20px)",
        borderRadius: 14, border: "1px solid rgba(221,193,174,0.3)",
        padding: "14px 16px", zIndex: 40,
        boxShadow: "0 8px 32px rgba(21,27,41,0.1)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#564334", textTransform: "uppercase", letterSpacing: "0.1em" }}>Feed IA en Vivo</span>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: apagon ? "#ef4444" : panelDañado ? "#f59e0b" : "#914c00", animation: "parpadeo 1s infinite" }}/>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {feedVisible.map((item, i) => (
            <div key={i} style={{ borderLeft: `2px solid ${item.borde}`, paddingLeft: 10, paddingTop: 4, paddingBottom: 4 }}>
              <p style={{ fontSize: 12, color: "#151b29", lineHeight: 1.4, margin: 0 }}>{item.msg}</p>
              <p style={{ fontSize: 10, color: "#56433466", marginTop: 2, fontFamily: "'JetBrains Mono'" }}>hace {item.tiempo}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Temporizador global */}
      {emergency && tiempoRecarga > 0 && (
        <div style={{
          position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.96)", backdropFilter: "blur(16px)",
          borderRadius: 14, border: `1px solid ${apagon ? "#fca5a5" : "#fed7aa"}`,
          padding: "14px 28px", zIndex: 45,
          boxShadow: `0 8px 32px ${apagon ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)"}`,
          textAlign: "center",
        }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: apagon ? "#ef4444" : "#914c00", fontWeight: 700, marginBottom: 4, letterSpacing: "0.1em" }}>
            {timerLabel}
          </div>
          <div style={{ fontFamily: "'Geist',sans-serif", fontSize: 32, fontWeight: 300, color: "#151b29", letterSpacing: "-0.02em" }}>
            {formatTime(tiempoRecarga)}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#56433488", marginTop: 4 }}>
            {apagon ? "con generación solar al 0%" : "hasta restauración de paneles"}
          </div>
        </div>
      )}

      {/* Panel detalle nodo */}
      {seleccionado && (
        <PanelDetalle
          nodo={seleccionado}
          apagon={apagon}
          panelDañado={panelDañado}
          baterias={baterias}
          tiempoRecarga={tiempoRecarga}
          onCerrar={() => setSeleccionado(null)}
        />
      )}
    </div>
  );
}