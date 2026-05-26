# Script de la ruta de emergencia, que maneja la lógica para determinar el estado de emergencia basado en los niveles de batería y las condiciones meteorológicas, así como la simulación de eventos de corte de energía para pruebas y validación del sistema.
from fastapi import APIRouter, HTTPException
from app.services.weather_service import get_weather_data
from app.services.energy_engine import get_energy_snapshot
from app.simulations.outage_simulator import get_emergency_state, simulate_outage_event

router = APIRouter()

@router.get("/emergency")
async def emergency_status():
    try:
        weather = await get_weather_data()
        energy = get_energy_snapshot(
            solar_radiation=weather["solar_radiation"],
            cloud_cover=weather["cloud_cover"]
        )

        battery_level = energy["battery"]["level"]
        state = get_emergency_state(battery_level, weather["solar_radiation"])

        return {
            "emergency_state": state,
            "weather": weather,
            "energy": energy
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/emergency/simulate")
async def simulate_emergency():
    try:
        event = simulate_outage_event()
        state = get_emergency_state(battery_level=15.0, solar_radiation=20.0)

        return {
            "simulated_event": event,
            "emergency_state": state,
            "message": "Emergency simulation triggered"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))