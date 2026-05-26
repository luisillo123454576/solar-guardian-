#script de la ruta del copilot, que maneja las interacciones con el modelo de lenguaje para proporcionar respuestas contextuales y alertas de riesgo basadas en el estado energético actual.
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from groq import Groq
import os
from app.ai.prompts import COPILOT_SYSTEM_PROMPT, build_energy_context

router = APIRouter()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class CopilotRequest(BaseModel):
    message: str
    history: List[Message] = []
    energy_data: Optional[dict] = {}

class CopilotResponse(BaseModel):
    response: str
    risk_alert: Optional[str] = None

@router.post("/copilot", response_model=CopilotResponse)
async def chat_with_copilot(request: CopilotRequest):
    try:
        # Build system prompt with current energy context
        energy_context = build_energy_context(request.energy_data or {})
        system_prompt = COPILOT_SYSTEM_PROMPT.format(energy_context=energy_context)

        # Build messages: system + history + new message
        messages = [{"role": "system", "content": system_prompt}]
        messages += [
            {"role": msg.role, "content": msg.content}
            for msg in request.history[-10:]
        ]
        messages.append({"role": "user", "content": request.message})

        # Call Groq API
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=500,
            temperature=0.7,
            messages=messages
        )

        ai_response = response.choices[0].message.content

        # Surface risk alerts if needed
        risk_alert = None
        energy_data = request.energy_data or {}
        if energy_data.get("risk_level") == "HIGH" or energy_data.get("emergency_mode"):
            risk_alert = "⚠️ MODO EMERGENCIA ACTIVO — Priorizando sistemas críticos"
        elif energy_data.get("battery_level", 100) < 30:
            risk_alert = "🔋 Batería crítica — Considera reducir consumo no esencial"

        return CopilotResponse(response=ai_response, risk_alert=risk_alert)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error del copilot: {str(e)}")


@router.get("/copilot/suggestions")
async def get_suggestions(battery_level: float = 100, risk_level: str = "LOW"):
    """Sugerencias rápidas contextuales según estado energético."""
    if risk_level == "HIGH":
        return {"suggestions": [
            "⚡ ¿Qué sistemas debo apagar ahora?",
            "🔋 ¿Cuánto tiempo duran las vacunas si se va la luz?",
            "📡 ¿Cómo mantengo las comunicaciones activas?",
        ]}
    elif battery_level < 50:
        return {"suggestions": [
            "💡 ¿Cómo ahorro energía ahora?",
            "⏱️ ¿Cuántas horas de batería quedan?",
            "☀️ ¿Cuándo habrá más generación solar?",
        ]}
    else:
        return {"suggestions": [
            "📊 ¿Cómo está el sistema hoy?",
            "🌤️ ¿Qué clima esperar esta tarde?",
            "💚 ¿Cuánta energía hemos ahorrado?",
        ]}