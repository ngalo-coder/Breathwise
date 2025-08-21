-- Enhanced UNEP Air Quality Database Schema with AI Support
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enhanced air quality measurements table with additional fields
CREATE TABLE IF NOT EXISTS air_measurements (
    id BIGSERIAL PRIMARY KEY,
    geom GEOMETRY(Point, 4326) NOT NULL,

    -- Core pollutants
    pm25 FLOAT CHECK (pm25 >= 0 AND pm25 <= 1000),
    pm10 FLOAT CHECK (pm10 >= 0 AND pm10 <= 2000),
    no2 FLOAT CHECK (no2 >= 0 AND no2 <= 500),
    so2 FLOAT CHECK (so2 >= 0 AND so2 <= 1000),
    co FLOAT CHECK (co >= 0 AND co <= 100),
    o3 FLOAT CHECK (o3 >= 0 AND o3 <= 500),

    -- Meteorological data
    temperature FLOAT,
    humidity FLOAT CHECK (humidity >= 0 AND humidity <= 100),
    wind_speed FLOAT CHECK (wind_speed >= 0),
    wind_direction FLOAT CHECK (wind_direction >= 0 AND wind_direction <= 360),
    pressure FLOAT CHECK (pressure > 0),

    -- Data quality and source
    source_type VARCHAR(50) CHECK (source_type IN ('satellite', 'weather_api', 'ground_station', 'monitoring_station', 'mobile', 'unknown')),
    data_source VARCHAR(100), -- Specific API or service name
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
    quality_flag INTEGER DEFAULT 1 CHECK (quality_flag IN (1, 2, 3)), -- 1=good, 2=questionable, 3=bad

    -- Temporal data
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- AI processing flags
    ai_processed BOOLEAN DEFAULT FALSE,
    anomaly_detected BOOLEAN DEFAULT FALSE,
    anomaly_score FLOAT,

    -- Indexing for efficient queries
    CONSTRAINT unique_measurement UNIQUE (geom, recorded_at, source_type)
);

-- Comprehensive indexes for performance
CREATE INDEX IF NOT EXISTS air_measurements_geom_idx ON air_measurements USING GIST(geom);
CREATE INDEX IF NOT EXISTS air_measurements_time_idx ON air_measurements (recorded_at DESC);
CREATE INDEX IF NOT EXISTS air_measurements_pm25_idx ON air_measurements (pm25) WHERE pm25 > 15;
CREATE INDEX IF NOT EXISTS air_measurements_source_idx ON air_measurements (source_type, data_source);
CREATE INDEX IF NOT EXISTS air_measurements_quality_idx ON air_measurements (quality_flag, confidence_score);
CREATE INDEX IF NOT EXISTS air_measurements_ai_idx ON air_measurements (ai_processed, anomaly_detected);
CREATE INDEX IF NOT EXISTS air_measurements_compound_idx ON air_measurements (recorded_at, pm25, source_type, quality_flag);

-- Enhanced policy grid with AI features
CREATE TABLE IF NOT EXISTS policy_grid (
    grid_id SERIAL PRIMARY KEY,
    geom GEOMETRY(Polygon, 4326) NOT NULL,

    -- Basic metrics
    priority_score FLOAT DEFAULT 0 CHECK (priority_score >= 0 AND priority_score <= 10),
    dominant_source VARCHAR(50),
    population_density INTEGER,

    -- AI-enhanced metrics
    ai_risk_assessment JSONB,
    ml_hotspot_probability FLOAT CHECK (ml_hotspot_probability >= 0 AND ml_hotspot_probability <= 1),
    pollution_trend VARCHAR(20) CHECK (pollution_trend IN ('improving', 'stable', 'worsening', 'unknown')),
    intervention_urgency VARCHAR(20) CHECK (intervention_urgency IN ('low', 'medium', 'high', 'critical')),

    -- Economic and social factors
    economic_vulnerability_index FLOAT,
    health_vulnerability_index FLOAT,
    infrastructure_quality_score FLOAT,

    -- Temporal tracking
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    last_ai_analysis TIMESTAMPTZ,

    CONSTRAINT valid_coordinates CHECK (ST_IsValid(geom))
);

CREATE INDEX IF NOT EXISTS policy_grid_geom_idx ON policy_grid USING GIST(geom);
CREATE INDEX IF NOT EXISTS policy_grid_priority_idx ON policy_grid (priority_score DESC);
CREATE INDEX IF NOT EXISTS policy_grid_ai_idx ON policy_grid (ml_hotspot_probability DESC, intervention_urgency);
CREATE INDEX IF NOT EXISTS policy_grid_vulnerability_idx ON policy_grid (health_vulnerability_index DESC);

-- Enhanced policy recommendations with AI insights
CREATE TABLE IF NOT EXISTS policy_recommendations (
    id SERIAL PRIMARY KEY,
    grid_id INTEGER REFERENCES policy_grid(grid_id),

    -- Core policy data
    policy_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')),

    -- Impact projections
    expected_impact_percent FLOAT CHECK (expected_impact_percent >= 0 AND expected_impact_percent <= 100),
    cost_estimate DECIMAL(15,2),
    implementation_time_days INTEGER,

    -- AI-generated insights
    ai_confidence_score FLOAT CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
    ai_generated_insights JSONB,
    ml_effectiveness_prediction FLOAT,
    risk_factors JSONB,
    success_indicators JSONB,

    -- Implementation tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented', 'monitoring', 'completed')),
    implementation_start_date TIMESTAMPTZ,
    implementation_end_date TIMESTAMPTZ,
    actual_impact_measured FLOAT,

    -- Stakeholder information
    responsible_agency VARCHAR(100),
    stakeholders JSONB,
    budget_allocated DECIMAL(15,2),

    -- Temporal tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    ai_last_analyzed TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS policy_recommendations_grid_idx ON policy_recommendations (grid_id);
CREATE INDEX IF NOT EXISTS policy_recommendations_priority_idx ON policy_recommendations (priority, ai_confidence_score DESC);
CREATE INDEX IF NOT EXISTS policy_recommendations_status_idx ON policy_recommendations (status, created_at DESC);
CREATE INDEX IF NOT EXISTS policy_recommendations_ai_idx ON policy_recommendations (ai_confidence_score DESC, ml_effectiveness_prediction DESC);

-- Enhanced alert history with AI classification
CREATE TABLE IF NOT EXISTS alert_history (
    id SERIAL PRIMARY KEY,

    -- Alert identification
    alert_type VARCHAR(50) NOT NULL,
    alert_subtype VARCHAR(50),
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    -- Spatial and temporal data
    location GEOMETRY(Point, 4326),
    affected_area GEOMETRY(Polygon, 4326),
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,

    -- Alert details
    message TEXT NOT NULL,
    detailed_description TEXT,
    pollutant VARCHAR(20),
    measurement_value FLOAT,
    threshold_value FLOAT,

    -- AI processing
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_confidence FLOAT CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
    ai_risk_assessment JSONB,
    predicted_duration_hours FLOAT,
    predicted_impact_area GEOMETRY(Polygon, 4326),

    -- Response tracking
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'responding', 'resolved', 'dismissed', 'false_positive')),
    response_actions JSONB,
    response_effectiveness FLOAT,

    -- Population impact
    estimated_affected_population INTEGER,
    vulnerable_groups_affected JSONB,
    health_advisory_issued BOOLEAN DEFAULT FALSE,

    -- System metadata
    data_sources JSONB,
    correlation_id VARCHAR(100), -- For grouping related alerts
    parent_alert_id INTEGER REFERENCES alert_history(id)
);

CREATE INDEX IF NOT EXISTS alert_history_location_idx ON alert_history USING GIST(location);
CREATE INDEX IF NOT EXISTS alert_history_area_idx ON alert_history USING GIST(affected_area);
CREATE INDEX IF NOT EXISTS alert_history_time_idx ON alert_history (triggered_at DESC);
CREATE INDEX IF NOT EXISTS alert_history_status_idx ON alert_history (status, severity);
CREATE INDEX IF NOT EXISTS alert_history_ai_idx ON alert_history (ai_generated, ai_confidence DESC);
CREATE INDEX IF NOT EXISTS alert_history_pollutant_idx ON alert_history (pollutant, measurement_value);

-- New: AI analysis results tracking
CREATE TABLE IF NOT EXISTS ai_analysis_results (
    id SERIAL PRIMARY KEY,

    -- Analysis metadata
    analysis_type VARCHAR(50) NOT NULL,
    analysis_depth VARCHAR(20) CHECK (analysis_depth IN ('quick', 'standard', 'comprehensive', 'deep')),
    model_used VARCHAR(100),

    -- Input data summary
    data_sources JSONB NOT NULL,
    input_data_summary JSONB,
    spatial_bounds GEOMETRY(Polygon, 4326),
    temporal_range TSTZRANGE,

    -- AI results
    ai_assessment TEXT,
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
    key_findings JSONB,
    predictions JSONB,
    recommendations JSONB,

    -- Processing metadata
    processing_time_ms INTEGER,
    tokens_used INTEGER,
    cost_usd DECIMAL(10,4),

    -- Temporal tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- For caching purposes

    -- Validation
    human_validated BOOLEAN DEFAULT FALSE,
    validation_score FLOAT,
    validation_notes TEXT
);

CREATE INDEX IF NOT EXISTS ai_analysis_type_idx ON ai_analysis_results (analysis_type, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_analysis_risk_idx ON ai_analysis_results (risk_level, confidence_score DESC);
CREATE INDEX IF NOT EXISTS ai_analysis_spatial_idx ON ai_analysis_results USING GIST(spatial_bounds);
CREATE INDEX IF NOT EXISTS ai_analysis_temporal_idx ON ai_analysis_results USING GIST(temporal_range);

-- New: Processing log for monitoring system health
CREATE TABLE IF NOT EXISTS processing_log (
    id SERIAL PRIMARY KEY,

    -- Processing metadata
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    processing_type VARCHAR(50) DEFAULT 'automatic',
    processing_duration_ms INTEGER,

    -- Data summary
    sources_count INTEGER,
    measurements_count INTEGER,
    quality_flags JSONB,

    -- Air quality metrics
    avg_pm25 FLOAT,
    max_pm25 FLOAT,
    min_pm25 FLOAT,
    aqi_category VARCHAR(50),

    -- System health
    data_completeness FLOAT CHECK (data_completeness >= 0 AND data_completeness <= 1),
    api_response_times JSONB,
    error_count INTEGER DEFAULT 0,
    warnings_count INTEGER DEFAULT 0,

    -- Performance metrics
    cpu_usage_percent FLOAT,
    memory_usage_mb FLOAT,
    cache_hit_rate FLOAT,

    -- Processing status
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('started', 'completed', 'failed', 'timeout')),
    error_message TEXT,

    CONSTRAINT processing_log_check CHECK (
        (status = 'completed' AND error_message IS NULL) OR
        (status IN ('failed', 'timeout') AND error_message IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS processing_log_time_idx ON processing_log (timestamp DESC);
CREATE INDEX IF NOT EXISTS processing_log_status_idx ON processing_log (status, timestamp DESC);
CREATE INDEX IF NOT EXISTS processing_log_performance_idx ON processing_log (data_completeness DESC, error_count);

-- New: API usage tracking for cost management
CREATE TABLE IF NOT EXISTS api_usage_log (
    id SERIAL PRIMARY KEY,

    -- API details
    api_provider VARCHAR(50) NOT NULL,
    api_endpoint VARCHAR(200),
    request_type VARCHAR(20),

    -- Usage metrics
    requests_count INTEGER DEFAULT 1,
    tokens_used INTEGER,
    cost_usd DECIMAL(10,4),
    response_time_ms INTEGER,

    -- Quality metrics
    success_rate FLOAT CHECK (success_rate >= 0 AND success_rate <= 1),
    error_count INTEGER DEFAULT 0,
    data_quality_score FLOAT,

    -- Temporal data
    usage_date DATE DEFAULT CURRENT_DATE,
    hour_of_day INTEGER CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Rate limiting
    daily_limit INTEGER,
    daily_usage INTEGER,
    monthly_limit INTEGER,
    monthly_usage INTEGER,

    CONSTRAINT unique_api_usage UNIQUE (api_provider, api_endpoint, usage_date, hour_of_day)
);

CREATE INDEX IF NOT EXISTS api_usage_provider_idx ON api_usage_log (api_provider, usage_date DESC);
CREATE INDEX IF NOT EXISTS api_usage_cost_idx ON api_usage_log (usage_date DESC, cost_usd DESC);
CREATE INDEX IF NOT EXISTS api_usage_limits_idx ON api_usage_log (api_provider, daily_usage, monthly_usage);

-- Enhanced views for common queries
CREATE OR REPLACE VIEW realtime_dashboard_summary AS
SELECT 
    COUNT(*) as total_measurements,
    AVG(pm25) as avg_pm25,
    MAX(pm25) as max_pm25,
    MIN(pm25) as min_pm25,
    COUNT(*) FILTER (WHERE pm25 > 35) as unhealthy_readings,
    COUNT(*) FILTER (WHERE pm25 > 55) as very_unhealthy_readings,
    COUNT(DISTINCT source_type) as source_types,
    COUNT(DISTINCT data_source) as data_sources,
    MAX(recorded_at) as last_update,
    AVG(confidence_score) as avg_confidence,
    COUNT(*) FILTER (WHERE ai_processed = true) as ai_processed_count,
    COUNT(*) FILTER (WHERE anomaly_detected = true) as anomaly_count
FROM air_measurements 
WHERE recorded_at > NOW() - INTERVAL '4 HOURS';

CREATE OR REPLACE VIEW active_alerts_summary AS
SELECT
    COUNT(*) as total_active_alerts,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical_alerts,
    COUNT(*) FILTER (WHERE severity = 'high') as high_alerts,
    COUNT(*) FILTER (WHERE ai_generated = true) as ai_generated_alerts,
    AVG(ai_confidence) FILTER (WHERE ai_generated = true) as avg_ai_confidence,
    MAX(triggered_at) as latest_alert_time,
    COUNT(DISTINCT alert_type) as alert_types
FROM alert_history
WHERE status IN ('active', 'acknowledged', 'responding')
AND triggered_at > NOW() - INTERVAL '24 HOURS';

CREATE OR REPLACE VIEW policy_effectiveness_summary AS
SELECT
    COUNT(*) as total_recommendations,
    COUNT(*) FILTER (WHERE status = 'implemented') as implemented_count,
    COUNT(*) FILTER (WHERE ai_confidence_score > 0.8) as high_confidence_count,
    AVG(ai_confidence_score) as avg_ai_confidence,
    AVG(expected_impact_percent) as avg_expected_impact,
    AVG(actual_impact_measured) FILTER (WHERE actual_impact_measured IS NOT NULL) as avg_actual_impact,
    COUNT(*) FILTER (WHERE status = 'monitoring') as monitoring_count
FROM policy_recommendations
WHERE created_at > NOW() - INTERVAL '90 DAYS';

-- Functions for automated processing

-- Function to update grid priority scores with AI insights
CREATE OR REPLACE FUNCTION update_grid_priorities_ai()
RETURNS void AS $$
BEGIN
    UPDATE policy_grid 
    SET
        priority_score = COALESCE(
            (SELECT AVG(am.pm25) / 10.0
             FROM air_measurements am
             WHERE ST_Within(am.geom, policy_grid.geom)
             AND am.recorded_at > NOW() - INTERVAL '24 HOURS'
             AND am.quality_flag = 1),
            priority_score
        ),
        ml_hotspot_probability = CASE
            WHEN priority_score > 7 THEN LEAST(priority_score / 10.0 + 0.2, 1.0)
            WHEN priority_score > 5 THEN priority_score / 10.0 + 0.1
            ELSE priority_score / 10.0
        END,
        intervention_urgency = CASE
            WHEN priority_score > 8 THEN 'critical'
            WHEN priority_score > 6 THEN 'high'
            WHEN priority_score > 4 THEN 'medium'
            ELSE 'low'
        END,
        last_updated = NOW(),
        last_ai_analysis = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean old data and maintain performance
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Keep only 30 days of detailed measurements
    DELETE FROM air_measurements
    WHERE recorded_at < NOW() - INTERVAL '30 DAYS'
    AND quality_flag > 1;

    -- Keep only 90 days of processing logs
    DELETE FROM processing_log
    WHERE timestamp < NOW() - INTERVAL '90 DAYS';

    -- Keep only 7 days of API usage logs (aggregate older data)
    DELETE FROM api_usage_log
    WHERE created_at < NOW() - INTERVAL '7 DAYS';

    -- Archive resolved alerts older than 1 year
    UPDATE alert_history
    SET status = 'archived'
    WHERE status = 'resolved'
    AND resolved_at < NOW() - INTERVAL '1 YEAR';

    -- Update statistics
    ANALYZE air_measurements;
    ANALYZE policy_grid;
    ANALYZE alert_history;

    RAISE NOTICE 'Data cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Create automated maintenance job
SELECT cron.schedule('cleanup-old-data', '0 2 * * *', 'SELECT cleanup_old_data();');
SELECT cron.schedule('update-grid-priorities', '*/30 * * * *', 'SELECT update_grid_priorities_ai();');

-- Insert sample enhanced data for testing
INSERT INTO air_measurements (geom, pm25, pm10, no2, so2, temperature, humidity, wind_speed, source_type, data_source, confidence_score, ai_processed) VALUES
-- Nairobi CBD (enhanced with meteorological data)
(ST_SetSRID(ST_MakePoint(36.817, -1.286), 4326), 45.2, 78.5, 32.1, 8.5, 24.5, 68, 3.2, 'weather_api', 'WeatherAPI.com', 0.95, true),
(ST_SetSRID(ST_MakePoint(36.825, -1.291), 4326), 38.7, 65.2, 28.5, 6.2, 25.1, 65, 2.8, 'ground_station', 'OpenAQ', 0.88, true),
(ST_SetSRID(ST_MakePoint(36.820, -1.288), 4326), 52.1, 89.3, 35.7, 12.1, 23.8, 72, 1.9, 'satellite', 'Sentinel-5P', 0.76, true),

-- Industrial area with enhanced data
(ST_SetSRID(ST_MakePoint(36.789, -1.275), 4326), 67.3, 125.8, 15.2, 45.6, 26.2, 58, 4.1, 'ground_station', 'IQAir', 0.92, true),
(ST_SetSRID(ST_MakePoint(36.795, -1.278), 4326), 71.5, 134.2, 18.9, 52.3, 25.8, 61, 3.8, 'weather_api', 'WeatherAPI.com', 0.89, true),

-- Residential areas
(ST_SetSRID(ST_MakePoint(36.765, -1.295), 4326), 28.4, 45.6, 22.1, 5.2, 22.9, 75, 2.1, 'weather_api', 'WeatherAPI.com', 0.91, true),
(ST_SetSRID(ST_MakePoint(36.845, -1.265), 4326), 31.7, 52.3, 19.8, 4.8, 23.4, 70, 2.6, 'ground_station', 'OpenAQ', 0.85, true);

-- Sample AI analysis results
INSERT INTO ai_analysis_results (analysis_type, analysis_depth, model_used, data_sources, ai_assessment, risk_level, confidence_score, key_findings, predictions, processing_time_ms) VALUES
('comprehensive', 'comprehensive', 'anthropic/claude-3.5-sonnet',
 '{"satellite": true, "weather": true, "ground_stations": true}',
 'Current air quality shows moderate to unhealthy levels across Nairobi, with industrial areas showing highest pollution concentrations. Traffic-related pollution is elevated during peak hours.',
 'medium', 0.87,
 '["Industrial area pollution 2.5x higher than WHO guidelines", "Traffic patterns correlate with NO2 spikes", "Weather conditions favor pollution accumulation"]',
 '{"short_term": "Gradual improvement expected with increased wind speed", "daily": "Peak pollution during morning and evening rush hours"}',
 2340);

COMMENT ON TABLE air_measurements IS 'Enhanced real-time air quality measurements with meteorological data and AI processing flags';
COMMENT ON TABLE policy_grid IS 'AI-enhanced policy zone management with ML predictions and vulnerability assessments';
COMMENT ON TABLE policy_recommendations IS 'AI-generated policy recommendations with confidence scoring and impact predictions';
COMMENT ON TABLE alert_history IS 'Comprehensive alert system with AI classification and impact assessment';
COMMENT ON TABLE ai_analysis_results IS 'AI analysis results tracking for model performance and cost management';
COMMENT ON TABLE processing_log IS 'System health monitoring and performance tracking';
COMMENT ON TABLE api_usage_log IS 'API usage and cost tracking for budget management';