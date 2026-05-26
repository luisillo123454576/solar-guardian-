export const API = "http://127.0.0.1:8000";

export async function fetchEnergy() {
  const res = await fetch(`${API}/api/dashboard`);
  if (!res.ok) throw new Error("energy fetch failed");
  return res.json();
}

export async function fetchEmergency() {
  const res = await fetch(`${API}/api/emergency`);
  if (!res.ok) throw new Error("emergency fetch failed");
  return res.json();
}

export async function simulateBlackout() {
  const res = await fetch(`${API}/api/emergency/simulate`, { method: "POST" });
  if (!res.ok) throw new Error("simulate failed");
  return res.json();
}

export async function sendCopilotMessage(message, history, energyData) {
  const res = await fetch(`${API}/api/copilot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, energy_data: energyData }),
  });
  if (!res.ok) throw new Error("copilot error");
  return res.json();
}

export async function getCopilotSuggestions(batteryLevel, riskLevel) {
  const res = await fetch(`${API}/api/copilot/suggestions?battery_level=${batteryLevel}&risk_level=${riskLevel}`);
  if (!res.ok) return { suggestions: [] };
  return res.json();
}

export async function triggerNotify(trigger, extras = {}) {
  const res = await fetch(`${API}/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trigger, ...extras }),
  });
  if (!res.ok) throw new Error("notify failed");
  return res.json();
}

// ── NUEVOS ────────────────────────────────────────────────────────────────────
export async function fetchForecast() {
  const res = await fetch(`${API}/api/forecast`);  // ← debe tener /api/
  if (!res.ok) throw new Error("forecast fetch failed");
  return res.json();
}

export async function fetchWeather() {
  const res = await fetch(`${API}/weather`);
  if (!res.ok) throw new Error("weather fetch failed");
  return res.json();
}