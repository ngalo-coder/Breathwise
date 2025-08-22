import requests

# Your OpenAQ API key
api_key = "7f49fea0984ad56d130352ece4369b113d820104952983c013ee1d8a4c7d2774"

# OpenAQ API v3 endpoint for locations
url = "https://api.openaq.org/v3/locations"

# Set up headers with your API key
headers = {
    "X-API-Key": api_key
}

# Parameters for the request (let's get locations in Los Angeles)
params = {
    "city": "Los Angeles",
    "limit": 5  # Just get 5 locations for testing
}

print("Testing OpenAQ API key with v3 API...")
print(f"Request URL: {url}")
print(f"Parameters: {params}")

try:
    # Make the API request
    response = requests.get(url, headers=headers, params=params)
    
    # Check if the request was successful
    if response.status_code == 200:
        print("✅ API key is working correctly!")
        print(f"Status Code: {response.status_code}")
        
        # Parse and display some data
        data = response.json()
        results = data.get('results', [])
        
        print(f"\nFound {len(results)} location(s) in Los Angeles:")
        
        for i, location in enumerate(results, 1):
            name = location.get('name', 'Unknown location')
            city = location.get('city', 'Unknown city')
            country = location.get('country', 'Unknown country')
            
            print(f"\n{i}. Name: {name}")
            print(f"   - City: {city}")
            print(f"   - Country: {country}")
            
            # Get parameters measured at this location
            parameters = location.get('parameters', [])
            if parameters:
                print(f"   - Parameters measured: {', '.join([p.get('name', '') for p in parameters if p.get('name')])}")
                
    elif response.status_code == 401:
        print("❌ API key is invalid or unauthorized")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    else:
        print(f"❌ Request failed with status code: {response.status_code}")
        print(f"Response: {response.text}")

except Exception as e:
    print(f"❌ An error occurred: {str(e)}")