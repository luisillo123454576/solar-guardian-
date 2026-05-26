import { MOCK_ENERGY_FALLBACK } from "../constants";

export default function Emergency({ energy, emergencyMsg, onTrigger, loading }) {
  const currentEnergy = energy || MOCK_ENERGY_FALLBACK;
  const autonomy = Math.round(currentEnergy.battery_level * 0.18);

  return (
    <div>
      {/* Banner de alerta */}
      <div style={{
        background:"#ffdad6", border:"2px solid #ba1a1a", borderRadius:16,
        padding:24, marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center",
        boxShadow:"0 8px 30px rgba(186,26,26,0.12)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ background:"#ba1a1a", width:48, height:48, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span className="material-symbols-outlined" style={{ color:"#fff", fontSize:28, animation:"pulsate-red 2s infinite" }}>emergency_home</span>
          </div>
          <div>
            <h2 style={{ fontFamily:"'Geist',sans-serif", fontSize:22, fontWeight:700, color:"#410002", margin:0 }}>FALLA DE RED DETECTADA</h2>
            <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"rgba(65,0,2,0.7)", textTransform:"uppercase", letterSpacing:"0.1em", marginTop:4 }}>
              Redistribución autónoma activa • Centro de Salud priorizado
            </p>
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'Geist',sans-serif", fontSize:40, fontWeight:300, color:"#410002", lineHeight:1 }}>{autonomy}h 22m</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"rgba(65,0,2,0.6)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Autonomía Estimada</div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:24 }}>
        {/* Columna izquierda */}
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
          <div style={{
            background:"rgba(255,255,255,0.9)", backdropFilter:"blur(12px)",
            border:"1px solid rgba(131,117,105,0.1)", borderRadius:20, padding:32,
            boxShadow:"0 4px 20px -2px rgba(131,117,105,0.08)",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:32 }}>
              <div>
                <h3 style={{ fontFamily:"'Geist',sans-serif", fontSize:20, fontWeight:600, color:"#1a1c1e", margin:0 }}>Flujo de Distribución de Energía</h3>
                <p style={{ fontFamily:"'Geist',sans-serif", fontSize:13, color:"#51453a", marginTop:4 }}>Agente IA redistribuyendo corriente activa a zonas médicas prioritarias.</p>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <span style={{ background:"#f1edeb", padding:"6px 12px", borderRadius:8, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:"#ba1a1a" }}>OFF: ZONA ESCOLAR</span>
                <span style={{ background:"#ffdcc4", padding:"6px 12px", borderRadius:8, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:"#2f1500" }}>ACTIVO: CLÍNICA</span>
              </div>
            </div>
            <svg width="100%" height="160" viewBox="0 0 400 160">
              <line x1="90" y1="80" x2="160" y2="80" stroke="#ff8a00" strokeWidth="3" strokeDasharray="4,6"
                style={{ animation:"march 1.5s linear infinite" }}/>
              <line x1="240" y1="80" x2="310" y2="50" stroke="#ff8a00" strokeWidth="3" strokeDasharray="4,6"
                style={{ animation:"march 1.5s linear infinite" }}/>
              <line x1="240" y1="80" x2="310" y2="120" stroke="#ba1a1a" strokeWidth="2" opacity="0.3"/>
              <text x="270" y="115" fontFamily="'JetBrains Mono',monospace" fontSize="9" fill="#ba1a1a" fontWeight="700">CORTADO</text>

              <rect x="30" y="55" width="60" height="50" rx="8" fill="white" stroke="#ffb77f" strokeWidth="1.5"/>
              <text x="60" y="120" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="9" fill="#837569">SOLAR</text>

              <circle cx="200" cy="80" r="40" fill="white" stroke="#ff8a00" strokeWidth="3"/>
              <text x="200" y="76" textAnchor="middle" fontFamily="'Geist',sans-serif" fontSize="16" fontWeight="700" fill="#ff8a00">{currentEnergy?.battery_level ?? 82}%</text>
              <text x="200" y="100" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="9" fill="#837569">ALMACENAMIENTO</text>

              <rect x="320" y="25" width="60" height="50" rx="8" fill="#ffdcc4" stroke="#ff8a00" strokeWidth="2"/>
              <text x="350" y="86" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="9" fill="#ff8a00" fontWeight="700">CLÍNICA</text>

              <rect x="320" y="95" width="60" height="50" rx="8" fill="#f1edeb" stroke="#837569" strokeWidth="1.5" opacity="0.5"/>
              <text x="350" y="156" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="9" fill="#837569" opacity="0.5">ESCUELA</text>
            </svg>
          </div>

          <button onClick={onTrigger} disabled={loading} style={{
            width:"100%", padding:"16px", background:"#ba1a1a", color:"#fff",
            border:"none", borderRadius:12, fontFamily:"'Geist',sans-serif",
            fontWeight:700, fontSize:15, cursor:"pointer",
            boxShadow:"0 4px 20px rgba(186,26,26,0.3)", transition:"transform 0.15s",
            letterSpacing:"0.03em",
          }}
          onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"}
          onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
          >
            {loading ? "Activando protocolo de emergencia..." : "SIMULAR APAGÓN — Activar Protocolo"}
          </button>

          {emergencyMsg && (
            <div style={{
              background:"rgba(255,255,255,0.9)", border:"2px solid #ba1a1a", borderRadius:16, padding:24,
              animation:"fade-up 0.4s ease",
            }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#ba1a1a", fontWeight:700, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.1em" }}>
                PROTOCOLO DE EMERGENCIA ACTIVO
              </div>
              <div style={{ fontFamily:"'Geist',sans-serif", fontSize:14, lineHeight:1.8, color:"#1a1c1e", whiteSpace:"pre-wrap" }}>{emergencyMsg}</div>
            </div>
          )}
        </div>

        {/* Columna derecha — prioridades */}
        <div style={{
          background:"rgba(255,255,255,0.9)", backdropFilter:"blur(12px)",
          border:"1px solid rgba(131,117,105,0.1)", borderTop:"4px solid #ba1a1a",
          borderRadius:20, padding:24, boxShadow:"0 4px 20px -2px rgba(131,117,105,0.08)",
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
            <h3 style={{ fontFamily:"'Geist',sans-serif", fontSize:18, fontWeight:700, color:"#1a1c1e", margin:0 }}>Prioridades Críticas</h3>
            <span style={{ background:"rgba(186,26,26,0.08)", color:"#ba1a1a", padding:"4px 10px", borderRadius:6, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, border:"1px solid rgba(186,26,26,0.2)" }}>BLOQUEADO</span>
          </div>
          {[
            { icon:"ac_unit",       label:"Refrigerador Vacunas",  sub:"Protegido - Vital",          pct:100, active:true  },
            { icon:"lightbulb",     label:"Iluminación Emergencia", sub:"Activa - Reducida",          pct:75,  active:true  },
            { icon:"satellite_alt", label:"Relay Comunicaciones",  sub:"Activo - Crítico",            pct:100, active:true  },
            { icon:"air",           label:"HVAC Administrativo",   sub:"Desactivado - Baja Prioridad", pct:0,  active:false },
          ].map((item, i) => (
            <div key={i} style={{
              marginBottom:12, padding:"16px", borderRadius:16,
              background: item.active ? "#faf8f4" : "rgba(241,237,235,0.5)",
              border:`1px solid ${item.active ? "rgba(131,117,105,0.2)" : "rgba(131,117,105,0.08)"}`,
              opacity: item.active ? 1 : 0.55,
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: item.active ? 10 : 0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background: item.active ? "rgba(255,138,0,0.1)" : "rgba(131,117,105,0.08)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span className="material-symbols-outlined" style={{ color: item.active ? "#ff8a00" : "#837569", fontSize:18 }}>{item.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily:"'Geist',sans-serif", fontSize:13, fontWeight:700, color:"#1a1c1e" }}>{item.label}</div>
                    <div style={{ fontFamily:"'Geist',sans-serif", fontSize:11, color:"#51453a" }}>{item.sub}</div>
                  </div>
                </div>
                {item.active && <span style={{ fontFamily:"'Geist',sans-serif", fontSize:20, fontWeight:700, color:"#ff8a00" }}>{item.pct}%</span>}
              </div>
              {item.active && (
                <div style={{ height:4, background:"#f1edeb", borderRadius:4, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${item.pct}%`, background:"#ff8a00", borderRadius:4 }}/>
                </div>
              )}
            </div>
          ))}
          <div style={{ marginTop:16, padding:14, background:"rgba(255,138,0,0.05)", borderRadius:12, border:"1px solid rgba(255,138,0,0.12)" }}>
            <div style={{ display:"flex", gap:10 }}>
              <span className="material-symbols-outlined" style={{ color:"#ff8a00", fontSize:16 }}>info</span>
              <p style={{ fontFamily:"'Geist',sans-serif", fontSize:11, color:"#51453a", lineHeight:1.6, margin:0 }}>
                Guardian IA simulando <strong>244 escenarios de redistribución/seg</strong> para maximizar autonomía del Centro de Salud.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}