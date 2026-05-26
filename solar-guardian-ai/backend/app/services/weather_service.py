# Script del servicio de clima, que se encarga de obtener datos meteorológicos actuales y pronósticos para ayudar a los usuarios a entender cómo las condiciones climáticas pueden afectar la generación de energía solar y el consumo energético.
import httpx

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# Coordenadas de Riohacha, La Guajira
LAT = 11.5444
LON = -72.9072

async def get_weather_data():
    params = {
        "latitude": LAT,
        "longitude": LON,
        "current": [
            "temperature_2m",
            "relative_humidity_2m",
            "cloud_cover",
            "wind_speed_10m",
            "weather_code"
        ],
        "hourly": [
            "direct_radiation",
            "diffuse_radiation",
            "temperature_2m"
        ],
        "forecast_days": 1,
        "timezone": "America/Bogota"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(OPEN_METEO_URL, params=params)
        response.raise_for_status()
        data = response.json()

    current = data["current"]
    hourly = data["hourly"]

    # Radiación solar de la hora actual
    from datetime import datetime
    current_hour_index = datetime.now().hour
    radiation = hourly["direct_radiation"][current_hour_index]

    return {
        "temperature": current["temperature_2m"],
        "humidity": current["relative_humidity_2m"],
        "cloud_cover": current["cloud_cover"],
        "wind_speed": current["wind_speed_10m"],
        "weather_code": current["weather_code"],
        "solar_radiation": radiation,
        "hourly_radiation": hourly["direct_radiation"],
        "location": "Riohacha, La Guajira",
        "coordinates": {"lat": LAT, "lon": LON}
    }