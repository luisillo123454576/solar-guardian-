from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.whatsapp_service import (
    send_whatsapp,
    msg_battery_critical,
    msg_peak_charge,
    msg_emergency_protocol,
    msg_cloudy,
    msg_night_mode,
)

router = APIRouter(prefix="/notify", tags=["notifications"])


class NotifyRequest(BaseModel):
    trigger: str  # battery_critical | peak_charge | emergency | cloudy | night_mode
    battery_pct: Optional[float] = None
    radiation: Optional[float] = None
    cloud_cover: Optional[float] = None
    cause: Optional[str] = None
    location: Optional[str] = "IPS Riohacha"


@router.post("")
async def notify(req: NotifyRequest):
    if req.trigger == "battery_critical":
        if req.battery_pct is None:
            raise HTTPException(status_code=422, detail="battery_pct requerido")
        body = msg_battery_critical(req.battery_pct, req.location)

    elif req.trigger == "peak_charge":
        if req.radiation is None:
            raise HTTPException(status_code=422, detail="radiation requerido")
        body = msg_peak_charge(req.radiation, req.location)

    elif req.trigger == "emergency":
        body = msg_emergency_protocol(req.cause or "Fallo de red eléctrica")

    elif req.trigger == "cloudy":
        if req.cloud_cover is None or req.battery_pct is None:
            raise HTTPException(status_code=422, detail="cloud_cover y battery_pct requeridos")
        body = msg_cloudy(req.cloud_cover, req.battery_pct, req.location)

    elif req.trigger == "night_mode":
        if req.battery_pct is None:
            raise HTTPException(status_code=422, detail="battery_pct requerido")
        body = msg_night_mode(req.battery_pct, req.location)

    else:
        raise HTTPException(status_code=400, detail=f"Trigger desconocido: {req.trigger}")

    result = send_whatsapp(body)
    return {"ok": True, "trigger": req.trigger, "twilio": result}