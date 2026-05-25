from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.weather import router as weather_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.emergency import router as emergency_router
from app.api.routes.forecast import router as forecast_router
from app.api.routes.alerts import router as alerts_router

app = FastAPI(
    title="Solar Guardian AI",
    description="Autonomous energy resilience system for La Guajira",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(emergency_router, prefix="/api")
app.include_router(forecast_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")

@app.get("/")
def root():
    return {"status": "Solar Guardian AI online", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}