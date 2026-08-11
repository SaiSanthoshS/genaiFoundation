"""
Turns a free-text city/address into latitude/longitude using OpenStreetMap's
Nominatim API. It's free, needs no API key, and is plenty accurate for a
mini-project use case.
"""
import requests

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"


def geocode_place(place_name):
    """
    Returns (latitude, longitude, display_name) for a place string,
    or (None, None, None) if it could not be found.
    """
    try:
        response = requests.get(
            NOMINATIM_URL,
            params={"q": place_name, "format": "json", "limit": 1},
            headers={"User-Agent": "disaster-alert-aggregator-mini-project"},
            timeout=10,
        )
        response.raise_for_status()
        results = response.json()
        if not results:
            return None, None, None
        best = results[0]
        return float(best["lat"]), float(best["lon"]), best.get("display_name", place_name)
    except (requests.RequestException, ValueError, KeyError):
        return None, None, None
