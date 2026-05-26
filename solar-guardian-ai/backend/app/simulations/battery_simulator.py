# Script del simulador de batería, que genera un estado de batería simulado basado en la radiación solar y la cobertura de nubes, proporcionando información sobre el nivel de batería, su estado (óptimo, normal, advertencia, crítico), autonomía estimada en horas, si está cargando o no, y la última actualización para ayudar a los usuarios a entender el estado de su batería y tomar decisiones informadas sobre su consumo energético.
import random
from datetime import datetime

def get_battery_status(solar_radiation: float, cloud_cover: float) -> dict:
    # Simula nivel de batería basado en radiación solar
    base_level = 75.0
    solar_boost = (solar_radiation / 1000) * 20
    cloud_penalty = (cloud_cover / 100) * 10
    noise = random.uniform(-3, 3)

    level = round(min(100, max(0, base_level + solar_boost - cloud_penalty + noise)), 1)

    if level > 80:
        status = "optimal"
    elif level > 50:
        status = "normal"
    elif level > 25:
        status = "warning"
    else:
        status = "critical"

    autonomy_hours = round((level / 100) * 12, 1)

    return {
        "level": level,
        "status": status,
        "autonomy_hours": autonomy_hours,
        "charging": solar_radiation > 100,
        "updated_at": datetime.now().isoformat()
    }