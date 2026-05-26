import { useState, useEffect, useRef } from "react";
import { fetchEnergy, triggerNotify } from "../services/api";

export const MOCK_ENERGY = {
  battery_level: 42,
  solar_generation: 2.8,
  solar_kw: 12.4,
  energy_consumption: 47.25,
  autonomy_hours: 6.2,
  risk_level: "MEDIUM",
  emergency_mode: false,
  cloud_cover: 65,
  grid_status: "UNSTABLE",
  building_type: "Centro de Salud",
  radiation: 7.2,
  current_time: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
};

// Umbrales para triggers de WhatsApp
const THRESHOLDS = {
  BATTERY_CRITICAL: 30,       // batería < 30%
  PEAK_HOUR_START: 11,        // ventana mediodía 11:00–14:00
  PEAK_HOUR_END: 14,
  PEAK_RADIATION: 5.5,        // radiación suficiente para recomendar carga
  CLOUD_COVER_HIGH: 70,       // nubosidad alta > 70%
  NIGHT_HOUR_START: 19,       // noche 19:00–06:00
  NIGHT_HOUR_END: 6,
};

export function useEnergy() {
  const [energy, setEnergy] = useState(MOCK_ENERGY);
  const [simState, setSimState] = useState(null); // "battery_low" | "peak_solar" | "cloudy" | "night"
  const notifiedRef = useRef({
    battery_critical: false,
    peak_charge: false,
    cloudy: false,
    night: false,
  });

  // Fetch real del backend
  useEffect(() => {
    const load = () =>
      fetchEnergy()
        .then(setEnergy)
        .catch(() => {});
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  // Monitor automático de triggers sobre datos reales
  useEffect(() => {
    if (!energy) return;
    const hour = new Date().getHours();

    // 1. Batería crítica
    if (energy.battery_level < THRESHOLDS.BATTERY_CRITICAL && !notifiedRef.current.battery_critical) {
      notifiedRef.current.battery_critical = true;
      triggerNotify("battery_critical", { battery_pct: energy.battery_level }).catch(() => {});
    }
    if (energy.battery_level >= THRESHOLDS.BATTERY_CRITICAL) {
      notifiedRef.current.battery_critical = false; // reset cuando sube
    }

    // 2. Ventana mediodía con radiación alta
    const isPeakHour = hour >= THRESHOLDS.PEAK_HOUR_START && hour < THRESHOLDS.PEAK_HOUR_END;
    if (isPeakHour && energy.radiation >= THRESHOLDS.PEAK_RADIATION && !notifiedRef.current.peak_charge) {
      notifiedRef.current.peak_charge = true;
      triggerNotify("peak_charge", { radiation: energy.radiation }).catch(() => {});
    }
    if (!isPeakHour) notifiedRef.current.peak_charge = false;

    // 3. Nubosidad alta
    if (energy.cloud_cover > THRESHOLDS.CLOUD_COVER_HIGH && !notifiedRef.current.cloudy) {
      notifiedRef.current.cloudy = true;
      triggerNotify("cloudy", { cloud_cover: energy.cloud_cover, battery_pct: energy.battery_level }).catch(() => {});
    }
    if (energy.cloud_cover <= THRESHOLDS.CLOUD_COVER_HIGH) notifiedRef.current.cloudy = false;

  }, [energy]);

  // ── Simulaciones manuales ────────────────────────────────────────────────
  const simulate = async (type) => {
    let overrides = {};

    switch (type) {
      case "battery_low":
        overrides = { battery_level: 18, risk_level: "HIGH", autonomy_hours: 1.2 };
        setSimState("battery_low");
        await triggerNotify("battery_critical", { battery_pct: 18 }).catch(() => {});
        break;

      case "peak_solar":
        overrides = { radiation: 7.0, solar_kw: 18.5, solar_generation: 7.0, cloud_cover: 5, battery_level: 62 };
        setSimState("peak_solar");
        await triggerNotify("peak_charge", { radiation: 7.0 }).catch(() => {});
        break;

      case "cloudy":
        overrides = { cloud_cover: 85, solar_kw: 3.1, solar_generation: 1.2, radiation: 2.1, risk_level: "MEDIUM" };
        setSimState("cloudy");
        await triggerNotify("cloudy", { cloud_cover: 85, battery_pct: energy.battery_level }).catch(() => {});
        break;

      case "night":
        overrides = { solar_kw: 0, solar_generation: 0, radiation: 0, cloud_cover: 0, battery_level: Math.max(energy.battery_level - 8, 10) };
        setSimState("night");
        await triggerNotify("night_mode", { battery_pct: overrides.battery_level }).catch(() => {});
        break;

      case "reset":
        setSimState(null);
        setEnergy(MOCK_ENERGY);
        return;

      default:
        break;
    }

    setEnergy((prev) => ({ ...prev, ...overrides }));
  };

  return { energy, simState, simulate };
}