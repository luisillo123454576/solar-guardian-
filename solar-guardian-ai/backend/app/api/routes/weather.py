from fastapi import APIRouter, HTTPException
from app.services.weather_service import get_weather_data

router = APIRouter()

@router.get("/weather")
async def weather():
    try:
        data = await get_weather_data()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))