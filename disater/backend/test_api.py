import time
import requests

def test_api(url, params=None):
    start = time.time()
    try:
        r = requests.get(url, params=params, timeout=10)
        print(f"{url} took {time.time() - start:.2f}s, status {r.status_code}")
    except Exception as e:
        print(f"{url} failed in {time.time() - start:.2f}s: {e}")

test_api("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson")
test_api("https://eonet.gsfc.nasa.gov/api/v3/events", params={"status": "open", "limit": 100})
