from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os, requests, random, math
from datetime import datetime

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Simulación de datos energéticos realistas para Riohacha
def get_energy_data():
    hour = datetime.now().hour
    # Radiación solar realista según hora del día
    if 6 <= hour <= 18:
        radiation = round(7.0 * math.sin(math.pi * (hour - 6) / 12) + random.uniform(-0.3, 0.3), 2)
    else:
        radiation = 0.0
    
    solar_kw = round(radiation * 2.5 + random.uniform(-0.2, 0.2), 2)
    consumption_kw = round(random.uniform(3.5, 6.0), 2)
    battery_level = round(random.uniform(45, 85), 1)
    grid_status = "estable" if random.random() > 0.2 else "inestable"
    
    return {
        "battery_level": battery_level,
        "solar_kw": max(0, solar_kw),
        "consumption_kw": consumption_kw,
        "radiation": max(0, radiation),
        "grid_status": grid_status,
        "hour": hour,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/energy")
def energy_status():
    return get_energy_data()

@app.post("/api/agent")
def run_agent():
    data = get_energy_data()
    
    priority_list = "refrigeración médica, comunicaciones, bombeo de agua"
    
    prompt = f"""Eres el agente de resiliencia energética Solar Guardian AI para una IPS rural en Riohacha, La Guajira.

ESTADO ACTUAL DEL SISTEMA:
- Batería: {data['battery_level']}%
- Generación solar: {data['solar_kw']} kW
- Consumo actual: {data['consumption_kw']} kW
- Radiación solar: {data['radiation']} kWh/m²
- Hora: {data['hour']}:00
- Red eléctrica: {data['grid_status']}
- Tarifa eléctrica: $943 COP/kWh

PRIORIDADES CRÍTICAS: {priority_list}

Analiza el estado energético actual y emite:
1. Nivel de riesgo (CRÍTICO / ALERTA / ESTABLE)
2. Una acción inmediata concreta
3. Una recomendación de ahorro específica para las próximas 2 horas
4. Estimación de autonomía en horas si falla la red

Responde en máximo 4 líneas. Directo y accionable."""

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 300,
            "temperature": 0.4
        }
    )
    
    result = response.json()
    agent_response = result["choices"][0]["message"]["content"]
    
    return {"data": data, "agent_analysis": agent_response}

@app.post("/api/emergency")
def emergency_mode():
    data = get_energy_data()
    
    prompt = f"""MODO EMERGENCIA ACTIVADO — Solar Guardian AI
    
Estado: Batería {data['battery_level']}%, Red {data['grid_status']}, Solar {data['solar_kw']} kW

Emite protocolo de emergencia energética:
1. Sistemas a PRESERVAR (críticos)
2. Sistemas a REDUCIR (medio)
3. Sistemas a APAGAR (no críticos)
4. Estimación de autonomía con cortes aplicados

Sé específico y conciso. Máximo 5 líneas."""

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 400,
            "temperature": 0.3
        }
    )
    
    result = response.json()
    return {"data": data, "emergency_protocol": result["choices"][0]["message"]["content"]}

@app.post("/api/chat")
def chat(body: dict):
    data = get_energy_data()
    user_message = body.get("message", "")
    
    prompt = f"""Eres el copiloto energético Solar Guardian AI para una IPS en Riohacha, La Guajira.

CONTEXTO DEL SISTEMA AHORA:
- Batería: {data['battery_level']}%, Solar: {data['solar_kw']} kW, Consumo: {data['consumption_kw']} kW
- Radiación: {data['radiation']} kWh/m², Red: {data['grid_status']}
- Tarifa local: $943 COP/kWh

Pregunta del operador: {user_message}

Responde de forma clara, práctica y en español. Máximo 3 líneas."""

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 200,
            "temperature": 0.5
        }
    )
    
    result = response.json()
    return {"response": result["choices"][0]["message"]["content"]}