import requests
import time

class WAQIDataFetcher:
    def __init__(self, token):
        self.token = token
        self.base_search_url = 'https://api.waqi.info/search/'
        self.base_feed_url = 'https://api.waqi.info/feed/'
    
    def fetch_waqi_data(self, city='Nairobi'):
        if not self.token:
            print("⚠️ No WAQI token provided")
            return []
        
        try:
            # Search for stations in the city
            search_params = {
                'token': self.token,
                'keyword': city
            }
            
            print(f"🔍 Searching for stations in {city}...")
            search_response = requests.get(self.base_search_url, params=search_params, timeout=8)
            search_data = search_response.json()
            
            if search_response.status_code != 200 or search_data.get('status') != 'ok':
                print(f"❌ Search API error: {search_data.get('message', 'Unknown error')}")
                return []
            
            stations = search_data.get('data', [])
            if not stations:
                print(f"⚠️ No stations found for {city}")
                return []
            
            print(f"✅ Found {len(stations)} stations")
            
            # Get data from the first station
            station_id = stations[0].get('uid')
            if not station_id:
                print("⚠️ No station ID found")
                return []
            
            # Get detailed feed for the station
            feed_url = f"{self.base_feed_url}@{station_id}/"
            feed_params = {'token': self.token}
            
            print(f"📡 Fetching data for station {station_id}...")
            feed_response = requests.get(feed_url, params=feed_params, timeout=8)
            feed_data = feed_response.json()
            
            if feed_response.status_code != 200 or feed_data.get('status') != 'ok':
                print(f"❌ Feed API error: {feed_data.get('message', 'Unknown error')}")
                return []
            
            # Format the response similar to your JavaScript function
            station_data = feed_data.get('data', {})
            result = {
                'station': stations[0].get('station', {}).get('name', 'Unknown'),
                'location': station_data.get('city', {}).get('name', 'Unknown'),
                'coordinates': station_data.get('city', {}).get('geo', []),
                'aqi': station_data.get('aqi', 'No data'),
                'measurements': station_data.get('iaqi', {}),
                'time': station_data.get('time', {}),
                'source': 'WAQI'
            }
            
            print("✅ Data fetched successfully!")
            return [result]
            
        except requests.exceptions.Timeout:
            print("❌ Request timed out")
            return []
        except requests.exceptions.RequestException as e:
            print(f"❌ Network error: {e}")
            return []
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return []

# Your WAQI token
WAQI_TOKEN = "215c4c7d39d4fe45d4e9af3e15dc5929d426ae4d"

# Create fetcher instance
fetcher = WAQIDataFetcher(WAQI_TOKEN)

# Fetch data for Nairobi
print("🌍 Fetching air quality data for Nairobi...")
result = fetcher.fetch_waqi_data('Nairobi')

# Display the results
if result:
    print("\n" + "="*60)
    print("AIR QUALITY DATA FOR NAIROBI")
    print("="*60)
    
    data = result[0]
    print(f"Station: {data.get('station')}")
    print(f"Location: {data.get('location')}")
    print(f"AQI: {data.get('aqi')}")
    
    # Display coordinates if available
    coords = data.get('coordinates', [])
    if coords and len(coords) == 2:
        print(f"Coordinates: {coords[0]}, {coords[1]}")
    
    # Display measurements
    measurements = data.get('measurements', {})
    if measurements:
        print("\nMeasurements:")
        for param, values in measurements.items():
            if isinstance(values, dict) and 'v' in values:
                print(f"  - {param}: {values['v']}")
    
    # Display time information
    time_data = data.get('time', {})
    if time_data:
        print(f"\nLast updated: {time_data.get('s', 'Unknown')}")
    
    print(f"Source: {data.get('source')}")
else:
    print("❌ No data received")