# Script del motor de energía, que calcula el balance energético actual basado en la radiación solar, la cobertura de nubes y el consumo energético, proporcionando un snapshot del estado energético del sistema que incluye generación solar estimada, nivel de batería, consumo total y un score de resiliencia para ayudar a los usuarios a entender su situación energética actual y tomar decisiones informadas.
from app.simulations.battery_simulator import get_battery_status
from app.simulations.consumption_simulator import get_consumption_data

def get_energy_snapshot(solar_radiation: float, cloud_cover: float, emergency_mode: bool = False) -> dict:
    battery = get_battery_status(solar_radiation, cloud_cover)
    consumption = get_consumption_data(emergency_mode)

    # Generación solar estimada en kW
    solar_generation = round((solar_radiation / 1000) * 5.0, 2)

    # Balance energético
    energy_balance = round(solar_generation - consumption["total_kw"], 2)

    # Score de resiliencia 0-100
    resilience_score = round(
        (battery["level"] * 0.5) +
        (min(solar_generation, 5) / 5 * 30) +
        (20 if not emergency_mode else 10),
        1
    )

    return {
        "solar_generation_kw": solar_generation,
        "energy_balance_kw": energy_balance,
        "battery": battery,
        "consumption": consumption,
        "resilience_score": resilience_score,
        "grid_stable": battery["status"] != "critical" and energy_balance > -2,
    }