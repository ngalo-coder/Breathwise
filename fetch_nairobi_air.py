import requests
import pandas as pd

# Your OpenAQ API key
API_KEY = "7f49fea0984ad56d130352ece4369b113d820104952983c013ee1d8a4c7d2774"

# Nairobi city ID list endpoint (fetches all stations with pm25 in Nairobi)
url = "https://api.openaq.org/v3/locations?city=Nairobi&parameter=pm25&limit=100"

headers = {"X-API-Key": API_KEY}

# Fetch data
response = requests.get(url, headers=headers)
data = response.json()

# Extract rows
rows = []
for loc in data.get("results", []):
    name = loc.get("name")
    lat = loc.get("coordinates", {}).get("latitude")
    lon = loc.get("coordinates", {}).get("longitude")
    
    # Find PM2.5 parameter entry
    pm25_entry = next((p for p in loc.get("parameters", []) if p.get("parameter") == "pm25"), None)
    pm25_value = pm25_entry.get("lastValue") if pm25_entry else None
    
    # Categorize status + color
    if pm25_value is None:
        status = "No Data"
        color = "#808080"   # Gray
    elif pm25_value <= 15:
        status = "Good"
        color = "#00FF00"   # Green
    elif pm25_value <= 35:
        status = "Moderate"
        color = "#FFFF00"   # Yellow
    else:
        status = "Unhealthy"
        color = "#FF0000"   # Red
    
    rows.append({
        "Name": name,
        "Latitude": lat,
        "Longitude": lon,
        "PM25_Latest": pm25_value,
        "Status": status,
        "ColorCode": color
    })

# Convert to DataFrame
df = pd.DataFrame(rows)

# Save CSV
df.to_csv("nairobi_air_quality.csv", index=False)

print("✅ CSV saved as nairobi_air_quality.csv with", len(df), "stations")
