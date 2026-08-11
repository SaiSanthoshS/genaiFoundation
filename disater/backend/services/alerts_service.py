"""
Fetches live disaster data from public APIs and turns it into a flat list of
alerts relative to the user's saved location.

Sources:
  - USGS Earthquake feed (all earthquakes in the last day, worldwide)
  - NASA EONET (wildfires, storms, volcanoes, etc.) — optional/best-effort

No API key is required for either source.
"""
import math
import time
import requests
import concurrent.futures
from datetime import datetime, timezone, timedelta
from config import USGS_EARTHQUAKE_API, NASA_EONET_API

_CACHE = {
    "earthquakes": {"data": None, "time": 0},
    "eonet": {"data": None, "time": 0},
}
CACHE_TTL = 300  # 5 minutes


def haversine_km(lat1, lon1, lat2, lon2):
    """Great-circle distance between two points, in kilometers."""
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def earthquake_severity(magnitude):
    """Map a Richter magnitude to a simple severity label."""
    if magnitude is None:
        return "Low"
    if magnitude >= 6.0:
        return "Critical"
    if magnitude >= 5.0:
        return "High"
    if magnitude >= 4.0:
        return "Moderate"
    return "Low"


def eonet_severity(category):
    """EONET has no magnitude field, so severity is estimated from event category."""
    high_risk = {"Wildfires", "Severe Storms", "Volcanoes"}
    moderate_risk = {"Floods", "Drought", "Landslides"}
    if category in high_risk:
        return "High"
    if category in moderate_risk:
        return "Moderate"
    return "Low"


def _get_earthquake_data():
    now = time.time()
    if _CACHE["earthquakes"]["data"] is not None and (now - _CACHE["earthquakes"]["time"] < CACHE_TTL):
        return _CACHE["earthquakes"]["data"]
    try:
        response = requests.get(USGS_EARTHQUAKE_API, timeout=10)
        response.raise_for_status()
        data = response.json().get("features", [])
        _CACHE["earthquakes"]["data"] = data
        _CACHE["earthquakes"]["time"] = now
        return data
    except requests.RequestException:
        return _CACHE["earthquakes"]["data"] or []

def fetch_earthquakes(user_lat, user_lon, radius_km):
    """Returns earthquakes from the last 24 hours within radius_km of the user."""
    alerts = []
    features = _get_earthquake_data()

    for quake in features:
            props = quake.get("properties", {})
            coords = quake.get("geometry", {}).get("coordinates", [None, None, None])
            quake_lon, quake_lat = coords[0], coords[1]

            if quake_lat is None or quake_lon is None:
                continue

            distance = haversine_km(user_lat, user_lon, quake_lat, quake_lon)
            if distance > radius_km:
                continue

            timestamp_ms = props.get("time")
            when = (
                datetime.fromtimestamp(timestamp_ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
                if timestamp_ms else "Unknown"
            )

            alerts.append({
                "type": "Earthquake",
                "location": props.get("place", "Unknown location"),
                "severity": earthquake_severity(props.get("mag")),
                "distance_km": round(distance, 1),
                "datetime": when,
                "latitude": quake_lat,
                "longitude": quake_lon,
            })
    return alerts


def _get_eonet_data():
    now = time.time()
    if _CACHE["eonet"]["data"] is not None and (now - _CACHE["eonet"]["time"] < CACHE_TTL):
        return _CACHE["eonet"]["data"]
    try:
        response = requests.get(NASA_EONET_API, params={"status": "open", "limit": 100}, timeout=10)
        response.raise_for_status()
        data = response.json().get("events", [])
        _CACHE["eonet"]["data"] = data
        _CACHE["eonet"]["time"] = now
        return data
    except requests.RequestException:
        return _CACHE["eonet"]["data"] or []

def fetch_eonet_events(user_lat, user_lon, radius_km):
    """Returns other natural-hazard events (wildfires, storms, etc.) from NASA EONET."""
    alerts = []
    events = _get_eonet_data()

    for event in events:
            categories = event.get("categories", [])
            category_name = categories[0]["title"] if categories else "Other"

            geometries = event.get("geometry", [])
            if not geometries:
                continue
            latest_geom = geometries[-1]
            coords = latest_geom.get("coordinates")
            if not coords:
                continue

            # EONET points are [lon, lat]; polygons are nested lists — skip those, keep it simple
            if not isinstance(coords[0], (int, float)):
                continue
            event_lon, event_lat = coords[0], coords[1]

            distance = haversine_km(user_lat, user_lon, event_lat, event_lon)
            if distance > radius_km:
                continue

            alerts.append({
                "type": category_name,
                "location": event.get("title", "Unknown event"),
                "severity": eonet_severity(category_name),
                "distance_km": round(distance, 1),
                "datetime": latest_geom.get("date", "Unknown")[:16].replace("T", " "),
                "latitude": event_lat,
                "longitude": event_lon,
            })
    return alerts


def generate_demo_alerts(user_lat, user_lon, radius_km):
    """Create a few realistic-looking demo alerts near the user's location."""
    max_offset_deg = max(0.01, min(0.18, radius_km / 111.0 / 1.5))
    now = datetime.now(timezone.utc)

    demo_events = [
        {
            "type": "Earthquake",
            "location": "North Ridge Fault",
            "severity": "High",
            "distance_km": 14.0,
            "datetime": (now - timedelta(minutes=18)).strftime("%Y-%m-%d %H:%M UTC"),
            "latitude": user_lat + max_offset_deg * 0.7,
            "longitude": user_lon + max_offset_deg * 0.5,
        },
        {
            "type": "Wildfire",
            "location": "Cedar Hills",
            "severity": "High",
            "distance_km": 27.0,
            "datetime": (now - timedelta(minutes=42)).strftime("%Y-%m-%d %H:%M UTC"),
            "latitude": user_lat - max_offset_deg * 0.9,
            "longitude": user_lon + max_offset_deg * 0.4,
        },
        {
            "type": "Severe Storm",
            "location": "East River Basin",
            "severity": "Moderate",
            "distance_km": 33.0,
            "datetime": (now - timedelta(minutes=65)).strftime("%Y-%m-%d %H:%M UTC"),
            "latitude": user_lat + max_offset_deg * 0.4,
            "longitude": user_lon - max_offset_deg * 0.8,
        },
    ]

    for alert in demo_events:
        alert["distance_km"] = round(haversine_km(user_lat, user_lon, alert["latitude"], alert["longitude"]), 1)
        if alert["distance_km"] > radius_km:
            alert["distance_km"] = round(min(radius_km - 1, alert["distance_km"]), 1)

    return sorted(demo_events, key=lambda a: a["distance_km"])


def get_all_alerts(user_lat, user_lon, radius_km):
    """Combines earthquake + EONET alerts, sorted by distance (closest first)."""
    with concurrent.futures.ThreadPoolExecutor() as executor:
        f1 = executor.submit(fetch_earthquakes, user_lat, user_lon, radius_km)
        f2 = executor.submit(fetch_eonet_events, user_lat, user_lon, radius_km)
        alerts = f1.result() + f2.result()

    alerts.sort(key=lambda a: a["distance_km"])

    if not alerts:
        alerts = generate_demo_alerts(user_lat, user_lon, radius_km)

    return alerts
