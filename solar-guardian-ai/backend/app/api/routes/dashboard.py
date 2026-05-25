from fastapi import APIRouter, HTTPException
from app.services.weather_service import get_weather_data
from app.services.energy_engine import get_energy_snapshot
from app.services.dataset_service import get_buildings_snapshot

router = APIRouter()

@router.get("/dashboard")
async def dashboard():
    try:
        weather = await get_weather_data()
        energy = get_energy_snapshot(
            solar_radiation=weather["solar_radiation"],
            cloud_cover=weather["cloud_cover"],
            emergency_mode=False
        )
        buildings = get_buildings_snapshot()

        return {
            "weather": weather,
            "energy": energy,
            "buildings": buildings,
            "community": "Riohacha, La Guajira",
            "status": "operational"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))