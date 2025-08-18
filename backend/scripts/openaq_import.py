#!/usr/bin/env python3
"""
OpenAQ Data Import Script for UNEP Air Quality Platform
Fetches real-time air quality data from Nairobi and formats for Africa GeoPortal upload

Requirements:
pip install requests pandas geopandas

Usage:
python openaq_import.py
"""

import requests
import pandas as pd
import json
from datetime import datetime, timedelta
import csv
import os

class OpenAQImporter:
    def __init__(self):
        self.base_url = "https://api.openaq.org/v2"
        self.nairobi_bounds = {
            'coordinates': [36.70, -1.40, 37.12, -1.15]  # [min_lon, min_lat, max_lon, max_lat]
        }

    def fetch_nairobi_locations(self):
        """Fetch all monitoring locations in Nairobi"""
        url = f"{self.base_url}/locations"
        params = {
            'country': 'KE',
            'city': 'Nairobi',
            'limit': 100
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            print(f"Found {len(data['results'])} monitoring locations in Nairobi")
            return data['results']
        except requests.RequestException as e:
            print(f"Error fetching locations: {e}")
            return []

    def fetch_latest_measurements(self, location_id=None, hours_back=24):
        """Fetch latest measurements for Nairobi or specific location"""
        url = f"{self.base_url}/measurements"
        
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(hours=hours_back)
        
        params = {
            'country': 'KE',
            'city': 'Nairobi',
            'date_from': start_date.strftime('%Y-%m-%dT%H:%M:%S+00:00'),
            'date_to': end_date.strftime('%Y-%m-%dT%H:%M:%S+00:00'),
            'limit': 10000,
            'sort': 'desc'
        }
        
        if location_id:
            params['location'] = location_id
            
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            print(f"Found {len(data['results'])} measurements")
            return data['results']
        except requests.RequestException as e:
            print(f"Error fetching measurements: {e}")
            return []

    def process_measurements(self, measurements):
        """Process raw measurements into structured format"""
        processed_data = []
        
        # Group by location to get latest values per parameter
        location_data = {}
        
        for measurement in measurements:
            location_id = measurement['location']
            parameter = measurement['parameter']
            
            if location_id not in location_data:
                location_data[location_id] = {
                    'location_id': location_id,
                    'location_name': measurement.get('locationId', location_id),
                    'latitude': measurement['coordinates']['latitude'],
                    'longitude': measurement['coordinates']['longitude'],
                    'country': measurement['country'],
                    'city': measurement['city'],
                    'source_name': measurement.get('sourceName', 'Unknown'),
                    'last_updated': measurement['date']['utc'],
                    'measurements': {}
                }
            
            # Keep the latest measurement for each parameter
            current_time = datetime.fromisoformat(measurement['date']['utc'].replace('Z', '+00:00'))
            existing_time = location_data[location_id].get('measurements', {}).get(parameter, {}).get('date')
            
            if not existing_time or current_time > datetime.fromisoformat(existing_time.replace('Z', '+00:00')):
                location_data[location_id]['measurements'][parameter] = {
                    'value': measurement['value'],
                    'unit': measurement['unit'],
                    'date': measurement['date']['utc']
                }
        
        # Convert to final format
        for location_id, data in location_data.items():
            # Get the most recent measurement time
            latest_time = max([meas['date'] for meas in data['measurements'].values()],
                            default=data['last_updated'])
            
            # Extract key pollutants
            pm25 = data['measurements'].get('pm25', {}).get('value', None)
            pm10 = data['measurements'].get('pm10', {}).get('value', None)
            no2 = data['measurements'].get('no2', {}).get('value', None)
            o3 = data['measurements'].get('o3', {}).get('value', None)
            so2 = data['measurements'].get('so2', {}).get('value', None)
            
            # Calculate AQI category based on PM2.5 (WHO guidelines)
            aqi_category = self.calculate_aqi_category(pm25)
            
            # Determine data quality
            data_quality = self.assess_data_quality(data['measurements'])
            
            processed_record = {
                'Location_ID': location_id,
                'Location_Name': data['location_name'],
                'Latitude': data['latitude'],
                'Longitude': data['longitude'],
                'City': data['city'],
                'Country': data['country'],
                'PM25_ugm3': pm25,
                'PM10_ugm3': pm10,
                'NO2_ugm3': no2,
                'O3_ugm3': o3,
                'SO2_ugm3': so2,
                'AQI_Category': aqi_category,
                'Data_Quality': data_quality,
                'Source_Name': data['source_name'],
                'Last_Updated': latest_time,
                'Update_Local': self.utc_to_nairobi_time(latest_time)
            }
            
            processed_data.append(processed_record)
        
        return processed_data

    def calculate_aqi_category(self, pm25_value):
        """Calculate AQI category based on WHO 2021 guidelines"""
        if pm25_value is None:
            return "No Data"
        
        # WHO 2021 Air Quality Guidelines for PM2.5
        if pm25_value <= 15:
            return "Good"
        elif pm25_value <= 25:
            return "Moderate"
        elif pm25_value <= 35:
            return "Unhealthy for Sensitive Groups"
        elif pm25_value <= 55:
            return "Unhealthy"
        else:
            return "Very Unhealthy"

    def assess_data_quality(self, measurements):
        """Assess data quality based on available parameters"""
        param_count = len(measurements)
        if param_count >= 3:
            return "High"
        elif param_count >= 2:
            return "Medium"
        elif param_count >= 1:
            return "Low"
        else:
            return "Poor"

    def utc_to_nairobi_time(self, utc_timestamp):
        """Convert UTC timestamp to Nairobi time (EAT = UTC+3)"""
        try:
            utc_dt = datetime.fromisoformat(utc_timestamp.replace('Z', '+00:00'))
            nairobi_dt = utc_dt + timedelta(hours=3)
            return nairobi_dt.strftime('%Y-%m-%d %H:%M:%S EAT')
        except:
            return utc_timestamp

    def export_to_csv(self, data, filename="nairobi_air_quality.csv"):
        """Export processed data to CSV for Africa GeoPortal upload"""
        if not data:
            print("No data to export")
            return
        
        df = pd.DataFrame(data)
        
        # Ensure required columns for ArcGIS
        required_columns = ['Location_ID', 'Location_Name', 'Latitude', 'Longitude',
                          'PM25_ugm3', 'AQI_Category', 'Last_Updated', 'Data_Quality']
        
        for col in required_columns:
            if col not in df.columns:
                df[col] = None
        
        # Sort by AQI severity for better visualization
        category_order = ['Very Unhealthy', 'Unhealthy', 'Unhealthy for Sensitive Groups', 
                         'Moderate', 'Good', 'No Data']
        df['AQI_Order'] = df['AQI_Category'].apply(
            lambda x: category_order.index(x) if x in category_order else 999
        )
        df = df.sort_values('AQI_Order').drop('AQI_Order', axis=1)
        
        # Export
        df.to_csv(filename, index=False)
        print(f"Data exported to {filename}")
        print(f"Records: {len(df)}")
        print(f"AQI Categories: {df['AQI_Category'].value_counts().to_dict()}")
        
        return filename

    def export_to_geojson(self, data, filename="nairobi_air_quality.geojson"):
        """Export as GeoJSON for direct import to web maps"""
        if not data:
            print("No data to export")
            return
        
        features = []
        for record in data:
            if record['Latitude'] and record['Longitude']:
                feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [record['Longitude'], record['Latitude']]
                    },
                    "properties": {k: v for k, v in record.items() 
                                 if k not in ['Latitude', 'Longitude']}
                }
                features.append(feature)
        
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        
        with open(filename, 'w') as f:
            json.dump(geojson, f, indent=2)
        
        print(f"GeoJSON exported to {filename}")
        return filename

    def create_sample_policy_zones(self):
        """Create sample policy intervention zones for demo"""
        policy_zones = [
            {
                "Zone_ID": "NBO_CBD_01",
                "Zone_Name": "Central Business District",
                "Latitude": -1.2864,
                "Longitude": 36.8172,
                "Priority_Score": 85,
                "Dominant_Source": "Traffic",
                "Policy_Type": "Vehicle Restriction",
                "Description": "Peak-hour truck ban (6AM-10AM, 4PM-8PM)",
                "Expected_Impact": "25-30% PM2.5 reduction",
                "Cost_Estimate": "$8,200/month",
                "Status": "Pending Approval"
            },
            {
                "Zone_ID": "NBO_IND_01", 
                "Zone_Name": "Industrial Area",
                "Latitude": -1.3128,
                "Longitude": 36.8581,
                "Priority_Score": 92,
                "Dominant_Source": "Industry",
                "Policy_Type": "Emission Monitoring",
                "Description": "Continuous stack monitoring for top 5 emitters",
                "Expected_Impact": "15-20% SO2 reduction",
                "Cost_Estimate": "$15,000 setup",
                "Status": "Approved"
            },
            {
                "Zone_ID": "NBO_DAN_01",
                "Zone_Name": "Dandora Area",
                "Latitude": -1.2364,
                "Longitude": 36.8969,
                "Priority_Score": 78,
                "Dominant_Source": "Waste",
                "Policy_Type": "Waste Management",
                "Description": "Enhanced collection + burning prohibition",
                "Expected_Impact": "40-50% PM2.5 spike reduction",
                "Cost_Estimate": "$12,000/month",
                "Status": "In Progress"
            }
        ]
        
        df = pd.DataFrame(policy_zones)
        df.to_csv("nairobi_policy_zones.csv", index=False)
        print("Sample policy zones created: nairobi_policy_zones.csv")
        
        return policy_zones

def main():
    """Main execution function"""
    print("=== UNEP Air Quality Data Import ===")
    print("Fetching real-time data from OpenAQ...")
    
    importer = OpenAQImporter()
    
    # Step 1: Get monitoring locations
    print("\n1. Fetching monitoring locations...")
    locations = importer.fetch_nairobi_locations()
    
    if not locations:
        print("No locations found. Creating sample data...")
        # Fallback to sample data if API is unavailable
        sample_data = [{
            'Location_ID': 'sample_001',
            'Location_Name': 'Nairobi CBD',
            'Latitude': -1.2864,
            'Longitude': 36.8172,
            'PM25_ugm3': 42.5,
            'AQI_Category': 'Unhealthy for Sensitive Groups',
            'Data_Quality': 'High',
            'Last_Updated': datetime.utcnow().isoformat() + 'Z'
        }]
        importer.export_to_csv(sample_data)
        return
    
    # Step 2: Get latest measurements
    print("\n2. Fetching latest measurements...")
    measurements = importer.fetch_latest_measurements(hours_back=6)
    
    # Step 3: Process data
    print("\n3. Processing measurements...")
    processed_data = importer.process_measurements(measurements)
    
    if not processed_data:
        print("No valid measurements found")
        return
    
    # Step 4: Export data
    print("\n4. Exporting data...")
    csv_file = importer.export_to_csv(processed_data)
    geojson_file = importer.export_to_geojson(processed_data)
    
    # Step 5: Create policy zones
    print("\n5. Creating sample policy zones...")
    importer.create_sample_policy_zones()
    
    print("\n=== EXPORT COMPLETE ===")
    print("Files created:")
    print(f"  - {csv_file} (for Africa GeoPortal upload)")
    print(f"  - {geojson_file} (for web mapping)")
    print(f"  - nairobi_policy_zones.csv (policy intervention zones)")
    print("\nNext Steps:")
    print("1. Upload CSV files to Africa GeoPortal")
    print("2. Create feature layers with appropriate styling")
    print("3. Build dashboard with real-time widgets")

if __name__ == "__main__":
    main()