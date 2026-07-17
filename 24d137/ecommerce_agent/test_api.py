import requests
import json

print("Sending request to backend...")
response = requests.post("http://localhost:8000/search", json={"prompt": "cheap 128GB iPhone 15"})

print("Status Code:", response.status_code)
if response.status_code == 200:
    data = response.json()
    print("Explanation:", data.get('explanation'))
    print("Viable:", data.get('viable'))
    print("Ranked Results Count:", len(data.get('ranked_results', [])))
    if data.get('coupon_applied'):
        print("Coupon applied:", data.get('winning_store', {}).get('coupon_code'))
        print("Final cost:", data.get('winning_store', {}).get('final_cost'))
else:
    print("Error:", response.text)
