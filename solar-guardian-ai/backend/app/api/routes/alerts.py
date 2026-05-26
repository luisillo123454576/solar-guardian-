from fastapi import APIRouter, HTTPException
from app.services.weather_service import get_weather_data
from app.services.energy_engine import get_energy_snapshot
from app.services.alert_engine import generate_alerts
from app.services.dataset_service import get_buildings_snapshot

router = APIRouter()

@router.get("/alerts")
async def alerts():
    try:
        weather = await get_weather_data()
        energy = get_energy_snapshot(
            solar_radiation=weather["solar_radiation"],
            cloud_cover=weather["cloud_cover"]
        )
        buildings = get_buildings_snapshot()
        active_alerts = generate_alerts(energy, weather, buildings)

        return {
            "alerts": active_alerts,
            "total": len(active_alerts),
            "has_critical": any(a["severity"] == "critical" for a in active_alerts),
            "timestamp": __import__("datetime").datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))