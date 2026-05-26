# Script del servicio de dataset, que se encarga de cargar y procesar los datos del conjunto de datos para proporcionar patrones de consumo energético, niveles de batería y un snapshot del estado actual de los edificios, que luego pueden ser utilizados por otras partes del sistema para análisis y generación de alertas.
import csv
from pathlib import Path
from collections import defaultdict

DATASET_PATH = Path(__file__).parent.parent.parent / "dataset" / "raw" / "dataset_guajira_hybrid_ready.csv"

def load_dataset() -> list:
    rows = []
    with open(DATASET_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows

def get_hourly_consumption_pattern() -> dict:
    rows = load_dataset()
    hourly = defaultdict(list)

    for row in rows:
        try:
            hour = int(row["Timestamp"].split(" ")[1].split(":")[0])
            usage = float(row["Energy_Usage_kWh"])
            hourly[hour].append(usage)
        except:
            continue

    return {h: round(sum(v) / len(v), 2) for h, v in hourly.items()}

def get_hourly_battery_pattern() -> dict:
    rows = load_dataset()
    hourly = defaultdict(list)

    for row in rows:
        try:
            hour = int(row["Timestamp"].split(" ")[1].split(":")[0])
            battery = float(row["Battery_Level"])
            hourly[hour].append(battery)
        except:
            continue

    return {h: round(sum(v) / len(v), 2) for h, v in hourly.items()}

def get_buildings_snapshot() -> list:
    rows = load_dataset()
    latest = {}

    for row in rows:
        bid = row["Building_ID"]
        latest[bid] = row

    result = []
    for bid, row in latest.items():
        result.append({
            "id": bid,
            "type": row["Building_Type"],
            "consumption_kwh": float(row["Energy_Usage_kWh"]),
            "battery_level": float(row["Battery_Level"]),
            "solar_radiation": float(row["Solar_Radiation"]),
            "grid_status": row["Grid_Status"],
            "critical_load": row["Critical_Load"] == "True",
            "priority": row["Energy_Priority"],
            "event_type": row["Event_Type"],
            "occupancy": int(row["Occupancy_Level"]),
            "temperature": float(row["Temperature"]),
            "humidity": float(row["Humidity"])
        })

    return result