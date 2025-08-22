import requests

# Your credentials
client_id = "sh-63424625-2356-478e-ba73-7bfb8cef591c"
client_secret = "18pqj2jqnCaemVsdgmOLNbAlS8vuqPlp"

# Step 1: Get authentication token
print("Step 1: Getting authentication token...")
token_url = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
data = {
    "grant_type": "client_credentials",
    "client_id": client_id,
    "client_secret": client_secret
}

response = requests.post(token_url, data=data)
if response.status_code != 200:
    print(f"Error getting token: {response.status_code} - {response.text}")
    exit(1)

token = response.json().get("access_token")
if not token:
    print("Failed to get token. Check credentials.")
    exit(1)

print("Token obtained successfully!")

# Step 2: Search for available data
print("\nStep 2: Searching for Sentinel-5P data...")
catalogue_url = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"

# Search for data over Paris on a specific date
params = {
    "$filter": (
        "Collection/Name eq 'SENTINEL-5P' and "
        "OData.CSC.Intersects(area=geography'SRID=4326;POLYGON((2.1 48.7, 2.5 48.7, 2.5 49.0, 2.1 49.0, 2.1 48.7))') and "
        "ContentDate/Start gt 2023-06-01T00:00:00.000Z and "
        "ContentDate/Start lt 2023-06-02T00:00:00.000Z"
    ),
    "$top": 1
}

headers = {"Authorization": f"Bearer {token}"}
response = requests.get(catalogue_url, headers=headers, params=params)

if response.status_code != 200:
    print(f"Error searching products: {response.status_code} - {response.text}")
    exit(1)

products = response.json().get("value", [])
if not products:
    print("No products found. Try a different area/date.")
    exit(1)

product_id = products[0]["Id"]
product_name = products[0]["Name"]
print(f"Found product: {product_name} (ID: {product_id})")

# Step 3: Download a small sample
print("\nStep 3: Downloading sample (first 1MB)...")
download_url = f"https://catalogue.dataspace.copernicus.eu/odata/v1/Products({product_id})/$value"

response = requests.get(download_url, headers=headers, stream=True)
if response.status_code != 200:
    print(f"Error downloading: {response.status_code} - {response.text}")
    exit(1)

with open("sample_product.nc", "wb") as f:
    downloaded = 0
    for chunk in response.iter_content(chunk_size=1024):
        if chunk:  # filter out keep-alive chunks
            f.write(chunk)
            downloaded += len(chunk)
            if downloaded > 1024 * 1024:  # Stop after 1MB
                break

print("Download completed! Sample saved as 'sample_product.nc'")
print("Script finished successfully!")