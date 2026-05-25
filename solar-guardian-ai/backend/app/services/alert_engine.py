from datetime import datetime

def generate_alerts(energy: dict, weather: dict, buildings: list) -> list:
    alerts = []

    battery = energy["battery"]
    if battery["level"] < 20:
        alerts.append({
            "id": "BAT_CRITICAL",
            "severity": "critical",
            "title": "Battery critically low",
            "message": f"Battery at {battery['level']}%. Estimated {battery['autonomy_hours']}h autonomy remaining.",
            "timestamp": datetime.now().isoformat()
        })
    elif battery["level"] < 40:
        alerts.append({
            "id": "BAT_WARNING",
            "severity": "warning",
            "title": "Battery level low",
            "message": f"Battery at {battery['level']}%. Consider reducing non-critical loads.",
            "timestamp": datetime.now().isoformat()
        })

    if weather["solar_radiation"] < 50 and weather["cloud_cover"] > 70:
        alerts.append({
            "id": "SOLAR_LOW",
            "severity": "warning",
            "title": "Low solar generation",
            "message": f"Cloud cover at {weather['cloud_cover']}%. Solar generation reduced.",
            "timestamp": datetime.now().isoformat()
        })

    if energy["energy_balance_kw"] < -5:
        alerts.append({
            "id": "ENERGY_DEFICIT",
            "severity": "high",
            "title": "Energy deficit detected",
            "message": f"Consuming {abs(energy['energy_balance_kw'])} kW more than generating.",
            "timestamp": datetime.now().isoformat()
        })

    if not energy["grid_stable"]:
        alerts.append({
            "id": "GRID_UNSTABLE",
            "severity": "critical",
            "title": "Grid instability detected",
            "message": "Grid is unstable. Emergency protocols may activate.",
            "timestamp": datetime.now().isoformat()
        })

    for building in buildings:
        if building["grid_status"] == "Unstable" and building["critical_load"]:
            alerts.append({
                "id": f"BUILDING_{building['id']}",
                "severity": "critical",
                "title": f"Critical building at risk: {building['type']}",
                "message": f"{building['id']} has unstable grid and is a critical load.",
                "timestamp": datetime.now().isoformat()
            })

    if not alerts:
        alerts.append({
            "id": "ALL_OK",
            "severity": "info",
            "title": "All systems nominal",
            "message": "No alerts detected. System operating normally.",
            "timestamp": datetime.now().isoformat()
        })

    return sorted(alerts, key=lambda x: {"critical": 0, "high": 1, "warning": 2, "info": 3}[x["severity"]])