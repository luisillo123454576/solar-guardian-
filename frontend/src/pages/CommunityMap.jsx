import { useState, useEffect, useRef } from "react";

// ── Datos de nodos ────────────────────────────────────────────────────────────
const NODOS_BASE = [
  {
    id: "solar-alpha",
    label: "Estación Solar Alpha",
    icono: "solar_power",
    tipo: "solar",
    prioridad: "fuente",
    x: 38, y: 42,
    bateria: 95, consumo: 0, riesgo: "bajo", autonomia: null,
    descripcion: "Array fotovoltaico principal. 48kWp de capacidad instalada.",
  },
  {
    id: "centro-salud",
    label: "Centro de Salud Rural",
    icono: "emergency",
    tipo: "salud",
    prioridad: "critica",
    x: 62, y: 60,
    bateria: 34, consumo: 4.2, riesgo: "alto", autonomia: "11h",
    vacunas: true,
    descripcion: "Centro médico Wayuu. Refrigeración médica activa.",
  },
  {
    id: "escuela",
    label: "Escuela Wayuu #4",
    icono: "school",
    tipo: "escuela",
    prioridad: "media",
    x: 22, y: 68,
    bateria: 71, consumo: 1.8, riesgo: "bajo", autonomia: "28h",
    descripcion: "Escuela primaria. 120 estudiantes activos.",
  },
  {
    id: "centro-comunitario",
    label: "Centro Comunitario",
    icono: "diversity_3",
    tipo: "comunidad",
    prioridad: "apoyo",
    x: 78, y: 26,
    bateria: 52, consumo: 2.9, riesgo: "medio", autonomia: "18h",
    descripcion: "Centro comunitario. Punto de comunicaciones.",
  },
  {
    id: "torre-comm",
    label: "Torre de Comunicaciones",
    icono: "cell_tower",
    tipo: "torre",
    prioridad: "critica",
    x: 55, y: 20,
    bateria: 88, consumo: 0.6, riesgo: "bajo", autonomia: "72h",
    descripcion: "Torre de comunicaciones. Cobertura 40km².",
  },
  {
    id: "bomba-agua",
    label: "Estación de Bombeo",
    icono: "water_pump",
    tipo: "agua",
    prioridad: "critica",
    x: 30, y: 30,
    bateria: 61, consumo: 3.1, riesgo: "medio", autonomia: "20h",
    descripcion: "Bombeo de agua. Sirve 340 familias.",
  },
];

const CONEXIONES = [
  { de: "solar-alpha", a: "centro-salud",       grosor: 2.5 },
  { de: "solar-alpha", a: "escuela",             grosor: 1.5 },
  { de: "solar-alpha", a: "centro-comunitario",  grosor: 1.5 },
  { de: "solar-alpha", a: "torre-comm",          grosor: 1.5 },
  { de: "solar-alpha", a: "bomba-agua",          grosor: 2   },
];

const PRIORIDAD_CFG = {
  critica: { color: "#ef4444", anillo: "rgba(239,68,68,0.25)",  tamaño: 48 },
  media:   { color: "#f59e0b", anillo: "rgba(245,158,11,0.25)", tamaño: 40 },
  apoyo:   { color: "#f97316", anillo: "rgba(249,115,22,0.25)", tamaño: 40 },
  fuente:  { color: "#914c00", anillo: "rgba(145,76,0,0.3)",    tamaño: 52 },
};

const RIESGO_CFG = {
  bajo:  { bg: "#22c55e", label: "Estable",    texto: "#fff" },
  medio: { bg: "#f97316", label: "Riesgo Med", texto: "#fff" },
  alto:  { bg: "#ef4444", label: "Emergencia", texto: "#fff" },
};

const FEED_NORMAL = [
  { msg: "Refrigeración médica priorizada en Centro de Salud.", tiempo: "12s", borde: "#914c00" },
  { msg: "Optimización energética de emergencia activada por IA.", tiempo: "2m",  borde: "#914c00" },
  { msg: "Autonomía extendida 4h 12m mediante balanceo de carga.", tiempo: "5m",  borde: "#22c55e" },
];

const FEED_APAGON = [
  { msg: "⚡ Corte de red detectado — sector norte.",                tiempo: "ahora", borde: "#ef4444" },
  { msg: "🔒 Refrigeración médica bloqueada a 4°C.",               tiempo: "3s",    borde: "#914c00" },
  { msg: "📡 Torre de comunicaciones en batería de respaldo.",      tiempo: "5s",    borde: "#914c00" },
  { msg: "💧 Bomba de agua elevada a prioridad CRÍTICA.",           tiempo: "8s",    borde: "#914c00" },
  { msg: "🏫 Escuela: cargas no esenciales reducidas.",             tiempo: "12s",   borde: "#f59e0b" },
  { msg: "🏘 Centro Comunitario: carga reducida al 30%.",           tiempo: "15s",   borde: "#f59e0b" },
  { msg: "✅ Autonomía extendida +6h por rebalanceo de IA.",        tiempo: "20s",   borde: "#22c55e" },
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

function riesgoEfectivo(nodo, apagon) {
  if (!apagon) return nodo.riesgo;
  if (nodo.tipo === "solar") return "alto";
  if (nodo.prioridad === "critica") return "medio";
  return "alto";
}

function bateriaEfectiva(nodo, apagon) {
  if (!apagon) return nodo.bateria;
  if (nodo.tipo === "solar") return 0;
  if (nodo.prioridad === "critica") return Math.max(nodo.bateria - 15, 10);
  return Math.max(nodo.bateria - 30, 5);
}

// ── Líneas de energía ─────────────────────────────────────────────────────────
function LineasEnergia({ nodos, apagon, seleccionadoId }) {
  const mapa = Object.fromEntries(nodos.map(n => [n.id, n]));
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 10 }}>
      <defs>
        <linearGradient id="gradLinea" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"  stopColor="#F59E0B" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#F59E0B" stopOpacity={apagon ? "0.15" : "0.9"} />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="gradLineaRojo" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"  stopColor="#ef4444" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#ef4444" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {CONEXIONES.map(({ de, a, grosor }) => {
        const origen  = mapa[de];
        const destino = mapa[a];
        if (!origen || !destino) return null;
        const selec  = seleccionadoId === de || seleccionadoId === a;
        const stroke = apagon ? "url(#gradLineaRojo)" : "url(#gradLinea)";
        return (
          <path
            key={`${de}-${a}`}
            d={`M${origen.x}%,${origen.y}% L${destino.x}%,${destino.y}%`}
            fill="none"
            stroke={stroke}
            strokeWidth={selec ? grosor + 1 : grosor}
            opacity={selec ? 1 : 0.5}
            strokeDasharray="8 12"
            style={{ animation: apagon ? "none" : "lineaFlujo 1.4s linear infinite" }}
          />
        );
      })}
    </svg>
  );
}

// ── Nodo del mapa ─────────────────────────────────────────────────────────────
function NodoMapa({ nodo, apagon, seleccionado, onClick }) {
  const riesgo   = riesgoEfectivo(nodo, apagon);
  const bateria  = bateriaEfectiva(nodo, apagon);
  const pCfg     = PRIORIDAD_CFG[nodo.prioridad];
  const rCfg     = RIESGO_CFG[riesgo];
  const sz       = pCfg.tamaño;
  const colorGlow = apagon
    ? riesgo === "alto" ? "#ef4444" : "#f59e0b"
    : pCfg.color;

  return (
    <div style={{
      position: "absolute", left: `${nodo.x}%`, top: `${nodo.y}%`,
      transform: "translate(-50%,-50%)", zIndex: seleccionado ? 30 : 20,
    }}>
      {/* Anillo pulsante */}
      <div style={{
        position: "absolute", inset: -10, borderRadius: "50%",
        background: pCfg.anillo, pointerEvents: "none",
        animation: apagon && riesgo === "alto"
          ? "pulsoRojo 1s ease-in-out infinite"
          : "respirar 3s ease-in-out infinite",
      }} />

      {/* Círculo principal */}
      <div onClick={() => onClick(nodo)} style={{
        width: sz, height: sz, borderRadius: "50%",
        background: apagon
          ? riesgo === "alto" ? "#ef4444" : riesgo === "medio" ? "#f97316" : rCfg.bg
          : pCfg.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        boxShadow: seleccionado
          ? `0 0 0 4px ${colorGlow}55, 0 0 30px ${colorGlow}88`
          : `0 0 15px ${colorGlow}44`,
        transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        transform: seleccionado ? "scale(1.18)" : "scale(1)",
        border: seleccionado ? `2px solid ${colorGlow}` : "none",
      }}>
        <Ico name={nodo.icono} style={{ color: "white", fontSize: sz * 0.42 }} />
      </div>

      {/* Badge de estado */}
      <div style={{
        position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
        background: rCfg.bg, color: rCfg.texto,
        fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600,
        padding: "1px 6px", borderRadius: 4, whiteSpace: "nowrap", letterSpacing: "0.05em",
      }}>
        {rCfg.label}
      </div>

      {/* Etiqueta al seleccionar */}
      <div style={{
        position: "absolute", top: -30, left: "50%", transform: "translateX(-50%)",
        background: "#151b29ee", color: "#fff",
        fontSize: 10, fontFamily: "'JetBrains Mono',monospace",
        padding: "3px 8px", borderRadius: 4, whiteSpace: "nowrap",
        opacity: seleccionado ? 1 : 0, transition: "opacity 0.2s", pointerEvents: "none",
      }}>
        {nodo.label}
      </div>

      {/* Barra de batería */}
      {nodo.tipo !== "solar" && (
        <div style={{
          position: "absolute", bottom: -18, left: "50%", transform: "translateX(-50%)",
          width: 36, height: 4, background: "#dde2f6", borderRadius: 2, overflow: "hidden",
        }}>
          <div style={{
            height: "100%", width: `${bateria}%`,
            background: bateria < 30 ? "#ef4444" : bateria < 60 ? "#f59e0b" : "#22c55e",
            borderRadius: 2, transition: "width 1s ease, background 0.5s",
          }} />
        </div>
      )}
    </div>
  );
}

// ── Panel de detalle ──────────────────────────────────────────────────────────
function PanelDetalle({ nodo, apagon, onCerrar }) {
  if (!nodo) return null;
  const riesgo  = riesgoEfectivo(nodo, apagon);
  const bateria = bateriaEfectiva(nodo, apagon);
  const rCfg    = RIESGO_CFG[riesgo];

  return (
    <div style={{
      position: "absolute", bottom: 80, left: "50%",
      transform: "translateX(-50%)", width: 340,
      background: "rgba(255,255,255,0.94)", backdropFilter: "blur(20px)",
      borderRadius: 16, border: "1px solid rgba(221,193,174,0.4)",
      boxShadow: "0 20px 60px rgba(21,27,41,0.18)", padding: 24, zIndex: 50,
      animation: "subirPanel 0.4s cubic-bezier(0.16,1,0.3,1) both",
    }}>
      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: rCfg.bg, display: "inline-block" }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#564334", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {rCfg.label}
            </span>
          </div>
          <h3 style={{ fontFamily: "'Geist',sans-serif", fontWeight: 700, fontSize: 18, color: "#151b29", marginTop: 4 }}>
            {nodo.label}
          </h3>
          <p style={{ fontSize: 12, color: "#56433488", marginTop: 2 }}>{nodo.descripcion}</p>
        </div>
        <button onClick={onCerrar} style={{ background: "none", border: "none", cursor: "pointer", color: "#564334", fontSize: 20 }}>✕</button>
      </div>

      {/* Batería */}
      {nodo.tipo !== "solar" && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: "#564334" }}>Nivel de Batería</span>
            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: bateria < 30 ? "#ef4444" : "#914c00", fontWeight: 700 }}>
              {bateria}%
            </span>
          </div>
          <div style={{ height: 8, background: "#e9edff", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${bateria}%`,
              background: bateria < 30 ? "#ef4444" : bateria < 60 ? "#f59e0b" : "#22c55e",
              borderRadius: 4, transition: "width 1s ease",
            }} />
          </div>
          {bateria < 30 && (
            <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4, fontFamily: "'JetBrains Mono'" }}>
              ⚠ Umbral crítico en aproximación
            </p>
          )}
        </div>
      )}

      {/* Grid de stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {nodo.consumo > 0 && (
          <div style={{ background: "#f1f3ff", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#56433488", fontFamily: "'JetBrains Mono'", textTransform: "uppercase" }}>Carga</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#151b29", fontFamily: "'Geist'" }}>{nodo.consumo} kW</div>
          </div>
        )}
        {nodo.autonomia && (
          <div style={{ background: "#f1f3ff", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#56433488", fontFamily: "'JetBrains Mono'", textTransform: "uppercase" }}>Autonomía</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#151b29", fontFamily: "'Geist'" }}>
              {apagon ? "⚡ Red" : nodo.autonomia}
            </div>
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

      {/* Acción IA en apagón */}
      {apagon && (
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ fontSize: 11, color: "#914c00", fontFamily: "'JetBrains Mono'", marginBottom: 4, fontWeight: 700 }}>
            🤖 ACCIÓN COPILOT IA
          </div>
          <div style={{ fontSize: 13, color: "#151b29" }}>
            {nodo.prioridad === "critica"
              ? "Carga reducida. Sistemas esenciales aislados en batería de respaldo."
              : nodo.prioridad === "media"
              ? "Cargas no críticas reducidas 40%. Ganancia estimada +4h de autonomía."
              : "Nodo suspendido. Recursos redirigidos a infraestructura crítica."}
          </div>
        </div>
      )}
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function CommunityMap({ isEmergency = false }) {
  const [nodos]           = useState(NODOS_BASE);
  const [seleccionado, setSeleccionado] = useState(null);
  const [apagon, setApagon]             = useState(false);
  const [feedVisible, setFeedVisible]   = useState(FEED_NORMAL);
  const timersRef = useRef([]);

  // Sincronizar con isEmergency del App padre
  useEffect(() => {
    if (isEmergency && !apagon) activarApagon(true);
    if (!isEmergency && apagon)  restaurar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmergency]);

  const activarApagon = (externo = false) => {
    setApagon(true);
    setFeedVisible([]);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = FEED_APAGON.map((item, i) =>
      setTimeout(() => setFeedVisible(prev => [item, ...prev].slice(0, 6)), i * 900)
    );
  };

  const restaurar = () => {
    setApagon(false);
    setFeedVisible(FEED_NORMAL);
    timersRef.current.forEach(clearTimeout);
  };

  const toggleApagon = () => apagon ? restaurar() : activarApagon();

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#faf8ff" }}>
      <style>{`
        @keyframes lineaFlujo    { from { stroke-dashoffset: 20; } to { stroke-dashoffset: 0; } }
        @keyframes respirar      { 0%,100%{ transform:scale(1); opacity:.6; } 50%{ transform:scale(1.3); opacity:.2; } }
        @keyframes pulsoRojo     { 0%,100%{ transform:scale(1); opacity:.7; } 50%{ transform:scale(1.5); opacity:.2; } }
        @keyframes subirPanel    { from{ opacity:0; transform:translateX(-50%) translateY(20px); } to{ opacity:1; transform:translateX(-50%) translateY(0); } }
        @keyframes parpadeo      { 0%,100%{ opacity:1; } 50%{ opacity:.6; } }
      `}</style>

      {/* Fondo */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(221,193,174,0.4) 1px, transparent 0)",
        backgroundSize: "40px 40px",
        background: apagon ? "linear-gradient(135deg,#1a0a0a,#2d0f0f)" : "#faf8ff",
        transition: "background 1s",
      }} />

      {/* Imagen desierto */}
      {!apagon && (
        <div style={{ position: "absolute", inset: 0, opacity: 0.18, filter: "grayscale(1) contrast(1.2)" }}>
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDZ8l7CBxP2_lGP1MHWEe1l4H8EINSGviCiXO5etTbk7Hh4SQHyxFP8qlJjOYj_5VSk8xPfSxl14OLsZRfregniffGuerxdSSWMQQ9XzfNEhhR3bcY59uzTomlxe2VJLtLWOwrnBo6fsr4jSC3_rCgU2dFLEW1xq867m3ZD7ocPpn7S28QrnHfRQZRjQD2MtGJTIjv_RZ8iXwOwI0pOUoOBLbLD0BOLq1Fr1redDZN7I3mKj48I1bvx918CWSfm2Rzsh3UoClOICNa"
            alt="La Guajira" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}

      {/* Viñeta roja en apagón */}
      {apagon && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(239,68,68,0.25) 100%)",
          animation: "parpadeo 2s ease-in-out infinite",
        }} />
      )}

      {/* Líneas */}
      <LineasEnergia nodos={nodos} apagon={apagon} seleccionadoId={seleccionado?.id} />

      {/* Nodos */}
      {nodos.map(n => (
        <NodoMapa key={n.id} nodo={n} apagon={apagon}
          seleccionado={seleccionado?.id === n.id}
          onClick={n => setSeleccionado(prev => prev?.id === n.id ? null : n)}
        />
      ))}

      {/* Banner apagón */}
      {apagon && (
        <div style={{
          position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
          background: "#ef4444", color: "#fff",
          padding: "10px 24px", borderRadius: 10,
          fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em",
          zIndex: 60, boxShadow: "0 4px 24px rgba(239,68,68,0.5)",
          animation: "parpadeo 1.5s ease-in-out infinite", whiteSpace: "nowrap",
        }}>
          ⚡ CORTE DE RED — PROTOCOLO DE EMERGENCIA IA ACTIVO
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
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#564334" }}>{l}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid rgba(221,193,174,0.3)", marginTop: 6, paddingTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4 3" /></svg>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#564334" }}>Flujo energético</span>
        </div>
      </div>

      {/* Botón simular — solo si no viene del padre */}
      {!isEmergency && (
        <div style={{ position: "absolute", bottom: 24, right: 24, zIndex: 40 }}>
          <button onClick={toggleApagon} style={{
            background: apagon ? "#22c55e" : "#ef4444", color: "#fff",
            border: "none", borderRadius: 10, padding: "12px 22px",
            fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 13, letterSpacing: "0.05em",
            cursor: "pointer",
            boxShadow: apagon ? "0 4px 20px rgba(34,197,94,0.4)" : "0 4px 20px rgba(239,68,68,0.4)",
            transition: "all 0.3s ease",
          }}>
            {apagon ? "✅ Restaurar Red" : "⚡ Simular Apagón"}
          </button>
        </div>
      )}

      {/* Feed en vivo */}
      <div style={{
        position: "absolute", bottom: 24, left: 16, width: 300,
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)",
        borderRadius: 14, border: "1px solid rgba(221,193,174,0.3)",
        padding: "14px 16px", zIndex: 40,
        boxShadow: "0 8px 32px rgba(21,27,41,0.1)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#564334", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Feed IA en Vivo
          </span>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: apagon ? "#ef4444" : "#914c00", animation: "parpadeo 1s infinite" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {feedVisible.map((item, i) => (
            <div key={i} style={{ borderLeft: `2px solid ${item.borde}`, paddingLeft: 10, paddingTop: 4, paddingBottom: 4, animation: "fade-up 0.4s ease both" }}>
              <p style={{ fontSize: 12, color: "#151b29", lineHeight: 1.4, margin: 0 }}>{item.msg}</p>
              <p style={{ fontSize: 10, color: "#56433466", marginTop: 2, fontFamily: "'JetBrains Mono'" }}>hace {item.tiempo}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Panel detalle nodo */}
      {seleccionado && (
        <PanelDetalle nodo={seleccionado} apagon={apagon} onCerrar={() => setSeleccionado(null)} />
      )}
    </div>
  );
}