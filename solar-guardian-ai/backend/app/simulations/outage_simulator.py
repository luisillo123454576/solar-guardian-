import random
from datetime import datetime

def simulate_outage_event() -> dict:
    events = [
        {"type": "partial_outage", "affected_zones": ["Zone A", "Zone C"], "severity": "medium"},
        {"type": "full_outage", "affected_zones": ["Zone A", "Zone B", "Zone C"], "severity": "critical"},
        {"type": "voltage_drop", "affected_zones": ["Zone B"], "severity": "low"},
        {"type": "grid_instability", "affected_zones": ["Zone A"], "severity": "high"},
    ]
    return random.choice(events)

def get_emergency_state(battery_level: float, solar_radiation: float) -> dict:
    is_emergency = battery_level < 25 or solar_radiation < 50

    critical_systems = [
        {"name": "Medical refrigeration", "status": "protected", "consumption_kw": 1.2, "priority": 1},
        {"name": "Communications tower", "status": "protected", "consumption_kw": 0.8, "priority": 2},
        {"name": "Emergency lighting", "status": "protected", "consumption_kw": 0.5, "priority": 3},
    ]

    suspended_systems = [
        {"name": "Air conditioning", "status": "suspended", "saved_kw": 3.5},
        {"name": "Water pumps", "status": "suspended", "saved_kw": 2.0},
        {"name": "General lighting", "status": "reduced", "saved_kw": 0.6},
    ]

    total_critical_kw = sum(s["consumption_kw"] for s in critical_systems)
    autonomy_hours = round((battery_level / 100) * 12, 1) if is_emergency else None

    return {
        "is_emergency": is_emergency,
        "battery_level": battery_level,
        "solar_radiation": solar_radiation,
        "critical_systems": critical_systems,
        "suspended_systems": suspended_systems if is_emergency else [],
        "total_critical_consumption_kw": total_critical_kw,
        "estimated_autonomy_hours": autonomy_hours,
        "triggered_at": datetime.now().isoformat() if is_emergency else None
    }