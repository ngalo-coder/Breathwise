#!/usr/bin/env python3
"""
Create Mock API Data for UNEP Platform
Creates JSON files with your real Nairobi data that the backend can serve directly
"""

import json
from datetime import datetime

def create_mock_nairobi_zones():
    """Create mock Nairobi monitoring zones data from your CSV"""
    zones_data = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [36.8172, -1.2864]},
                "properties": {
                    "id": "nairobi_zone_1",
                    "pm25": 45.2,
                    "source_type": "monitoring_station",
                    "recorded_at": datetime.now().isoformat(),
                    "quality_flag": 2,
                    "aqi_category": "Unhealthy for Sensitive Groups",
                    "severity": "unhealthy_sensitive",
                    "aqi": 112
                }
            },
            {
                "type": "Feature", 
                "geometry": {"type": "Point", "coordinates": [36.8581, -1.3128]},
                "properties": {
                    "id": "nairobi_zone_2",
                    "pm25": 67.3,
                    "source_type": "monitoring_station",
                    "recorded_at": datetime.now().isoformat(),
                    "quality_flag": 2,
                    "aqi_category": "Unhealthy",
                    "severity": "unhealthy",
                    "aqi": 158
                }
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [36.8089, -1.2630]},
                "properties": {
                    "id": "nairobi_zone_3",
                    "pm25": 32.1,
                    "source_type": "monitoring_station", 
                    "recorded_at": datetime.now().isoformat(),
                    "quality_flag": 1,
                    "aqi_category": "Moderate",
                    "severity": "moderate",
                    "aqi": 94
                }
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [36.8833, -1.3167]},
                "properties": {
                    "id": "nairobi_zone_4",
                    "pm25": 89.5,
                    "source_type": "monitoring_station",
                    "recorded_at": datetime.now().isoformat(),
                    "quality_flag": 3,
                    "aqi_category": "Very Unhealthy",
                    "severity": "very_unhealthy",
                    "aqi": 185
                }
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [36.7083, -1.3197]},
                "properties": {
                    "id": "nairobi_zone_5",
                    "pm25": 18.7,
                    "source_type": "monitoring_station",
                    "recorded_at": datetime.now().isoformat(),
                    "quality_flag": 1,
                    "aqi_category": "Good",
                    "severity": "good",
                    "aqi": 62
                }
            }
        ],
        "metadata": {
            "total_zones": 5,
            "city": "Nairobi",
            "country": "Kenya",
            "generated_at": datetime.now().isoformat()
        }
    }
    
    with open('mock_nairobi_zones.json', 'w') as f:
        json.dump(zones_data, f, indent=2)
    
    print("Created mock_nairobi_zones.json")

def create_mock_policy_recommendations():
    """Create mock policy recommendations from your intervention zones"""
    policies_data = {
        "recommendations": [
            {
                "id": 1,
                "title": "Peak-Hour Vehicle Restrictions (CBD)",
                "description": "Implement odd-even license plate restrictions during peak hours",
                "priority": "high",
                "expected_impact_percent": 28.5,
                "cost_estimate": 8200.00,
                "status": "pending"
            },
            {
                "id": 2,
                "title": "Industrial Stack Monitoring (Embakasi)",
                "description": "Install continuous monitoring on top 5 industrial emitters",
                "priority": "medium",
                "expected_impact_percent": 18.2,
                "cost_estimate": 15000.00,
                "status": "approved"
            },
            {
                "id": 3,
                "title": "Waste Management Enhancement (Dandora)",
                "description": "Increase waste collection frequency and anti-burning enforcement",
                "priority": "high",
                "expected_impact_percent": 42.0,
                "cost_estimate": 7500.00,
                "status": "in_progress"
            }
        ],
        "metadata": {
            "total": 3,
            "generated_at": datetime.now().isoformat()
        }
    }
    
    with open('mock_policy_recommendations.json', 'w') as f:
        json.dump(policies_data, f, indent=2)
    
    print("Created mock_policy_recommendations.json")

def main():
    print("Creating Mock Data for UNEP Platform")
    print("=" * 40)
    
    create_mock_nairobi_zones()
    create_mock_policy_recommendations()
    
    print("\nMock data files created successfully!")
    print("\nNext steps:")
    print("1. Update backend to serve these JSON files")
    print("2. Test the dashboard with your real Nairobi data")
    print("3. Install PostgreSQL later for full database functionality")

if __name__ == "__main__":
    main()