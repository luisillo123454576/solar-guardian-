# Script del simulador de consumo, que genera datos de consumo energético simulados basados en la hora del día y el modo de emergencia, proporcionando información sobre el consumo total en kW, los sistemas activos, si es hora pico o no, y la última actualización para ayudar a los usuarios a entender su patrón de consumo energético y tomar decisiones informadas sobre su uso de energía.

import random
from datetime import datetime

CRITICAL_SYSTEMS = [
    {"name": "Medical refrigeration", "consumption_kw": 1.2, "priority": 1},
    {"name": "Communications", "consumption_kw": 0.8, "priority": 2},
    {"name": "Emergency lighting", "consumption_kw": 0.5, "priority": 3},
]

NON_CRITICAL_SYSTEMS = [
    {"name": "Air conditioning", "consumption_kw": 3.5, "priority": 4},
    {"name": "General lighting", "consumption_kw": 1.0, "priority": 5},
    {"name": "Water pumps", "consumption_kw": 2.0, "priority": 6},
]

def get_consumption_data(emergency_mode: bool = False) -> dict:
    hour = datetime.now().hour

    # Consumo base según hora del día
    if 6 <= hour <= 9 or 18 <= hour <= 22:
        base_multiplier = 1.4
    elif 10 <= hour <= 17:
        base_multiplier = 1.1
    else:
        base_multiplier = 0.6

    noise = random.uniform(0.9, 1.1)

    if emergency_mode:
        active_systems = CRITICAL_SYSTEMS
    else:
        active_systems = CRITICAL_SYSTEMS + NON_CRITICAL_SYSTEMS

    total_kw = sum(s["consumption_kw"] for s in active_systems)
    total_kw = round(total_kw * base_multiplier * noise, 2)

    return {
        "total_kw": total_kw,
        "active_systems": active_systems,
        "emergency_mode": emergency_mode,
        "peak_hours": 6 <= hour <= 9 or 18 <= hour <= 22,
        "updated_at": datetime.now().isoformat()
    }