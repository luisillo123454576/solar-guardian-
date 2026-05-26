from twilio.rest import Client
import os
from datetime import datetime

ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
FROM_NUMBER = "whatsapp:+14155238886"
TO_NUMBER = f"whatsapp:{os.getenv('TWILIO_TO_NUMBER')}"


def _get_client() -> Client:
    return Client(ACCOUNT_SID, AUTH_TOKEN)


def send_whatsapp(body: str) -> dict:
    client = _get_client()
    message = client.messages.create(body=body, from_=FROM_NUMBER, to=TO_NUMBER)
    return {"sid": message.sid, "status": message.status}


def msg_battery_critical(battery_pct: float, location: str = "IPS Riohacha") -> str:
    return (
        f"⚠️ SOLAR GUARDIAN — ALERTA CRÍTICA\n"
        f"📍 {location}\n"
        f"🔋 Batería al {battery_pct:.1f}% — por debajo del umbral mínimo (30%)\n"
        f"🕐 {datetime.now().strftime('%H:%M')} hrs\n\n"
        f"ACCIÓN REQUERIDA: Reducir carga no crítica inmediatamente. "
        f"Sistemas priorizados: refrigeración médica, iluminación emergencia, equipos UCI."
    )


def msg_peak_charge(radiation: float, location: str = "IPS Riohacha") -> str:
    return (
        f"☀️ SOLAR GUARDIAN — VENTANA DE CARGA MÁXIMA\n"
        f"📍 {location}\n"
        f"🌞 Radiación actual: {radiation:.1f} kWh/m²\n"
        f"🕐 {datetime.now().strftime('%H:%M')} hrs\n\n"
        f"RECOMENDACIÓN: Activar carga máxima de baterías ahora. "
        f"Ventana óptima estimada: próximas 2 horas."
    )


def msg_emergency_protocol(cause: str = "Fallo de red eléctrica") -> str:
    return (
        f"🚨 SOLAR GUARDIAN — PROTOCOLO DE EMERGENCIA ACTIVADO\n"
        f"📍 IPS Riohacha\n"
        f"⚡ Causa: {cause}\n"
        f"🕐 {datetime.now().strftime('%H:%M')} hrs\n\n"
        f"Sistema operando en modo autónomo solar. "
        f"Carga no crítica desconectada automáticamente. "
        f"Autonomía estimada según batería actual."
    )


def msg_cloudy(cloud_cover: float, battery_pct: float, location: str = "IPS Riohacha") -> str:
    return (
        f"☁️ SOLAR GUARDIAN — ALERTA DE NUBOSIDAD ALTA\n"
        f"📍 {location}\n"
        f"🌥️ Nubosidad: {cloud_cover:.0f}% — generación solar reducida significativamente\n"
        f"🔋 Batería actual: {battery_pct:.1f}%\n"
        f"🕐 {datetime.now().strftime('%H:%M')} hrs\n\n"
        f"RECOMENDACIÓN: Reducir consumo no esencial. "
        f"Conservar reservas de batería para equipos críticos. "
        f"Se espera recuperación solar cuando mejore el cielo."
    )


def msg_night_mode(battery_pct: float, location: str = "IPS Riohacha") -> str:
    return (
        f"🌙 SOLAR GUARDIAN — MODO NOCTURNO ACTIVO\n"
        f"📍 {location}\n"
        f"🔋 Batería disponible: {battery_pct:.1f}%\n"
        f"🕐 {datetime.now().strftime('%H:%M')} hrs\n\n"
        f"Generación solar suspendida. Sistema operando en reservas. "
        f"Carga no crítica reducida automáticamente. "
        f"Próxima ventana solar estimada: 06:00 hrs."
    )