from fastapi import APIRouter, HTTPException
from app.services.weather_service import get_weather_data
from app.services.energy_engine import get_energy_snapshot
from app.services.forecasting_service import (
    get_solar_forecast,
    get_consumption_forecast,
    get_battery_forecast,
    get_risk_estimation
)

router = APIRouter()

@router.get("/forecast")
async def forecast():
    try:
        weather = await get_weather_data()
        energy = get_energy_snapshot(
            solar_radiation=weather["solar_radiation"],
            cloud_cover=weather["cloud_cover"]
        )

        battery_level = energy["battery"]["level"]
        hourly_radiation = weather["hourly_radiation"]

        solar = get_solar_forecast(hourly_radiation)
        consumption = get_consumption_forecast()
        battery = get_battery_forecast(hourly_radiation, battery_level)
        risk = get_risk_estimation(battery)

        return {
            "solar_forecast": solar,
            "consumption_forecast": consumption,
            "battery_forecast": battery,
            "risk_estimation": risk,
            "community": "Riohacha, La Guajira"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))