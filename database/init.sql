-- UNEP Air Quality Policy Platform Database Schema
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Air quality measurements table
CREATE TABLE IF NOT EXISTS air_measurements (
    id BIGSERIAL PRIMARY KEY,
    geom GEOMETRY(Point, 4326) NOT NULL,
    pm25 FLOAT CHECK (pm25 >= 0 AND pm25 <= 1000),
    pm10 FLOAT CHECK (pm10 >= 0 AND pm10 <= 2000),
    no2 FLOAT CHECK (no2 >= 0 AND no2 <= 500),
    so2 FLOAT CHECK (so2 >= 0 AND so2 <= 1000),
    source_type VARCHAR(20) CHECK (source_type IN ('traffic', 'industry', 'waste', 'background', 'unknown')),
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    quality_flag INTEGER DEFAULT 1 CHECK (quality_flag IN (1, 2, 3)), -- 1=good, 2=questionable, 3=bad
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial and temporal indexes for performance
CREATE INDEX IF NOT EXISTS air_measurements_geom_idx ON air_measurements USING GIST(geom);
CREATE INDEX IF NOT EXISTS air_measurements_time_idx ON air_measurements (recorded_at);
CREATE INDEX IF NOT EXISTS air_measurements_pm25_idx ON air_measurements (pm25) WHERE pm25 > 35;
CREATE INDEX IF NOT EXISTS air_measurements_source_idx ON air_measurements (source_type);

-- Policy grid for 1km x 1km zones
CREATE TABLE IF NOT EXISTS policy_grid (
    grid_id SERIAL PRIMARY KEY,
    geom GEOMETRY(Polygon, 4326) NOT NULL,
    priority_score FLOAT DEFAULT 0,
    dominant_source VARCHAR(20),
    population_density INTEGER,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS policy_grid_geom_idx ON policy_grid USING GIST(geom);
CREATE INDEX IF NOT EXISTS policy_grid_priority_idx ON policy_grid (priority_score);

-- Policy recommendations
CREATE TABLE IF NOT EXISTS policy_recommendations (
    id SERIAL PRIMARY KEY,
    grid_id INTEGER REFERENCES policy_grid(grid_id),
    policy_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    expected_impact_percent FLOAT,
    cost_estimate DECIMAL(12,2),
    implementation_time_days INTEGER,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS policy_recommendations_grid_idx ON policy_recommendations (grid_id);
CREATE INDEX IF NOT EXISTS policy_recommendations_priority_idx ON policy_recommendations (priority);
CREATE INDEX IF NOT EXISTS policy_recommendations_status_idx ON policy_recommendations (status);

-- Alert history
CREATE TABLE IF NOT EXISTS alert_history (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    location GEOMETRY(Point, 4326),
    severity VARCHAR(10) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    pm25_level FLOAT,
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed'))
);

CREATE INDEX IF NOT EXISTS alert_history_location_idx ON alert_history USING GIST(location);
CREATE INDEX IF NOT EXISTS alert_history_time_idx ON alert_history (triggered_at);
CREATE INDEX IF NOT EXISTS alert_history_status_idx ON alert_history (status);

-- Sample data for Nairobi
INSERT INTO air_measurements (geom, pm25, pm10, no2, source_type) VALUES 
-- Central Business District (high traffic)
(ST_SetSRID(ST_MakePoint(36.817, -1.286), 4326), 45.2, 78.5, 32.1, 'traffic'),
(ST_SetSRID(ST_MakePoint(36.825, -1.291), 4326), 38.7, 65.2, 28.5, 'traffic'),
(ST_SetSRID(ST_MakePoint(36.820, -1.288), 4326), 52.1, 89.3, 35.7, 'traffic'),

-- Industrial area (Embakasi)
(ST_SetSRID(ST_MakePoint(36.789, -1.275), 4326), 67.3, 125.8, 15.2, 'industry'),
(ST_SetSRID(ST_MakePoint(36.795, -1.278), 4326), 71.5, 134.2, 18.9, 'industry'),
(ST_SetSRID(ST_MakePoint(36.785, -1.272), 4326), 58.9, 98.7, 12.4, 'industry'),

-- Residential areas (mixed sources)
(ST_SetSRID(ST_MakePoint(36.765, -1.295), 4326), 28.4, 45.6, 22.1, 'background'),
(ST_SetSRID(ST_MakePoint(36.845, -1.265), 4326), 31.7, 52.3, 19.8, 'background'),

-- Waste burning hotspots
(ST_SetSRID(ST_MakePoint(36.801, -1.315), 4326), 89.2, 156.7, 25.4, 'waste'),
(ST_SetSRID(ST_MakePoint(36.798, -1.318), 4326), 95.8, 178.9, 28.9, 'waste');

-- Create sample policy grid (1km x 1km squares covering Nairobi)
INSERT INTO policy_grid (geom, priority_score, dominant_source, population_density) VALUES
-- CBD grid
(ST_SetSRID(ST_MakeEnvelope(36.810, -1.295, 36.820, -1.285, 4326), 4326), 8.5, 'traffic', 15000),
(ST_SetSRID(ST_MakeEnvelope(36.820, -1.295, 36.830, -1.285, 4326), 4326), 7.2, 'traffic', 12000),

-- Industrial grid
(ST_SetSRID(ST_MakeEnvelope(36.780, -1.285, 36.790, -1.275, 4326), 4326), 9.1, 'industry', 8000),
(ST_SetSRID(ST_MakeEnvelope(36.790, -1.285, 36.800, -1.275, 4326), 4326), 8.8, 'industry', 7500),

-- Residential grids
(ST_SetSRID(ST_MakeEnvelope(36.760, -1.305, 36.770, -1.295, 4326), 4326), 4.2, 'background', 25000),
(ST_SetSRID(ST_MakeEnvelope(36.840, -1.275, 36.850, -1.265, 4326), 4326), 3.8, 'background', 22000);

-- Sample policy recommendations
INSERT INTO policy_recommendations (grid_id, policy_type, title, description, priority, expected_impact_percent, cost_estimate, implementation_time_days) VALUES
(1, 'traffic_restriction', 'Peak-Hour Truck Restriction (CBD)', 'Restrict heavy vehicles 6AM-10AM in Central Business District', 'high', 28.5, 8200.00, 30),
(3, 'industrial_monitoring', 'Industrial Stack Monitoring (Embakasi)', 'Install continuous monitoring on top 5 industrial emitters', 'medium', 18.2, 15000.00, 90),
(1, 'low_emission_zone', 'Low Emission Zone Implementation', 'Restrict older vehicles from entering CBD during peak hours', 'high', 35.0, 25000.00, 180),
(5, 'waste_management', 'Community Waste Collection Program', 'Increase waste collection frequency in high-density residential areas', 'medium', 15.8, 5000.00, 60);

-- Sample alerts
INSERT INTO alert_history (alert_type, location, severity, message, pm25_level) VALUES
('pollution_spike', ST_SetSRID(ST_MakePoint(36.801, -1.315), 4326), 'critical', 'Critical PM2.5 levels detected near waste burning site', 89.2),
('policy_trigger', ST_SetSRID(ST_MakePoint(36.817, -1.286), 4326), 'high', 'Traffic restriction policy should be activated in CBD', 52.1),
('health_advisory', ST_SetSRID(ST_MakePoint(36.789, -1.275), 4326), 'medium', 'Air quality unhealthy for sensitive groups in industrial area', 67.3);

-- Create a view for real-time dashboard
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT 
    COUNT(*) as total_measurements,
    AVG(pm25) as avg_pm25,
    MAX(pm25) as max_pm25,
    COUNT(*) FILTER (WHERE pm25 > 35) as unhealthy_readings,
    COUNT(*) FILTER (WHERE pm25 > 55) as very_unhealthy_readings,
    COUNT(DISTINCT source_type) as source_types,
    MAX(recorded_at) as last_update
FROM air_measurements 
WHERE recorded_at > NOW() - INTERVAL '24 HOURS';

-- Function to calculate grid priority scores
CREATE OR REPLACE FUNCTION update_grid_priorities() 
RETURNS void AS $$
BEGIN
    UPDATE policy_grid 
    SET priority_score = (
        SELECT COALESCE(AVG(pm25) / 10.0, 0)
        FROM air_measurements 
        WHERE ST_Within(air_measurements.geom, policy_grid.geom)
        AND recorded_at > NOW() - INTERVAL '24 HOURS'
    ),
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS air_measurements_compound_idx ON air_measurements (recorded_at, pm25, source_type);
CREATE INDEX IF NOT EXISTS policy_recommendations_compound_idx ON policy_recommendations (status, priority, created_at);

COMMENT ON TABLE air_measurements IS 'Real-time air quality measurements from various sources';
COMMENT ON TABLE policy_grid IS '1km x 1km grid system for policy zone management';
COMMENT ON TABLE policy_recommendations IS 'AI-generated policy recommendations based on air quality data';
COMMENT ON TABLE alert_history IS 'Historical record of air quality alerts and policy triggers';