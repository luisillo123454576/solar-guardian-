# Script del servicio de pronóstico, que genera predicciones detalladas sobre la generación solar, el consumo energético y el estado de la batería para ayudar a los usuarios a planificar su uso de energía y tomar decisiones informadas sobre su consumo.
from datetime import datetime
import random
from app.services.dataset_service import get_hourly_consumption_pattern, get_hourly_battery_pattern

def get_solar_forecast(hourly_radiation: list) -> list:
    forecast = []
    base_time = datetime.now().replace(minute=0, second=0, microsecond=0)

    for i, radiation in enumerate(hourly_radiation):
        hour_time = base_time.replace(hour=i)
        solar_kw = round((radiation / 1000) * 5.0, 2)
        forecast.append({
            "hour": hour_time.strftime("%H:00"),
            "radiation_wm2": radiation,
            "solar_generation_kw": solar_kw,
            "timestamp": hour_time.isoformat()
        })

    return forecast

def get_consumption_forecast() -> list:
    pattern = get_hourly_consumption_pattern()
    forecast = []
    base_time = datetime.now().replace(minute=0, second=0, microsecond=0)

    for i in range(24):
        hour_time = base_time.replace(hour=i)
        base_kw = pattern.get(i, 10.0)
        noise = random.uniform(0.97, 1.03)
        forecast.append({
            "hour": hour_time.strftime("%H:00"),
            "consumption_kwh": round(base_kw * noise, 2),
            "timestamp": hour_time.isoformat()
        })

    return forecast

def get_battery_forecast(hourly_radiation: list, current_level: float) -> list:
    battery_pattern = get_hourly_battery_pattern()
    forecast = []
    base_time = datetime.now().replace(minute=0, second=0, microsecond=0)

    for i, radiation in enumerate(hourly_radiation):
        hour_time = base_time.replace(hour=i)
        expected = battery_pattern.get(i, current_level)
        noise = random.uniform(0.98, 1.02)
        level = round(min(100, max(0, expected * noise)), 1)
        status = "optimal" if level > 80 else "normal" if level > 50 else "warning" if level > 25 else "critical"

        forecast.append({
            "hour": hour_time.strftime("%H:00"),
            "battery_level": level,
            "status": status,
            "timestamp": hour_time.isoformat()
        })

    return forecast

def get_risk_estimation(battery_forecast: list) -> dict:
    critical_hours = [h for h in battery_forecast if h["status"] == "critical"]
    warning_hours = [h for h in battery_forecast if h["status"] == "warning"]

    risk_level = "low"
    if len(critical_hours) > 2:
        risk_level = "critical"
    elif len(critical_hours) > 0 or len(warning_hours) > 3:
        risk_level = "high"
    elif len(warning_hours) > 0:
        risk_level = "medium"

    return {
        "risk_level": risk_level,
        "critical_hours_count": len(critical_hours),
        "warning_hours_count": len(warning_hours),
        "first_critical_hour": critical_hours[0]["hour"] if critical_hours else None,
        "recommendation": _get_risk_recommendation(risk_level)
    }

def _get_risk_recommendation(risk_level: str) -> str:
    recommendations = {
        "low": "System operating normally. No action required.",
        "medium": "Monitor battery levels. Consider reducing non-critical loads.",
        "high": "Reduce non-critical consumption immediately.",
        "critical": "Activate emergency mode. Prioritize critical systems only."
    }
    return recommendations.get(risk_level, "Monitor system closely.")