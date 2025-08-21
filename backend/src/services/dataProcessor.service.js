// backend/src/services/dataProcessor.service.js
// High-performance real-time data processing engine

import db from '../config/database.js';
import { io } from '../app.js';
import enhancedSatelliteService from './enhancedSatelliteService.js';
import enhancedWeatherService from './enhancedWeatherService.js';
import aiPolicyService from './aiPolicyService.js';

class DataProcessorService {
  constructor() {
    this.processingQueue = [];
    this.isProcessing = false;
    this.lastUpdate = null;
    this.updateInterval = 10 * 60 * 1000; // 10 minutes

    // Start automatic processing
    this.startAutomaticProcessing();
  }

  // 🔄 Main data processing pipeline
  async processRealTimeData() {
    if (this.isProcessing) {
      console.log('📊 Data processing already in progress, skipping...');
      return;
    }

    try {
      this.isProcessing = true;
      console.log('🚀 Starting real-time data processing pipeline...');

      const startTime = Date.now();

      // Step 1: Collect data from all sources
      const [satelliteData, weatherData] = await Promise.all([
        this.collectSatelliteData(),
        this.collectWeatherData()
      ]);

      // Step 2: Process and validate data
      const processedData = await this.processAndValidateData(satelliteData, weatherData);

      // Step 3: Store in database
      await this.storeProcessedData(processedData);

      // Step 4: Generate AI insights
      const aiInsights = await this.generateAIInsights(processedData);

      // Step 5: Check for alerts
      const alerts = await this.checkForAlerts(processedData, aiInsights);

      // Step 6: Update real-time dashboard
      await this.updateRealTimeDashboard(processedData, aiInsights, alerts);

      const processingTime = Date.now() - startTime;
      console.log(`✅ Data processing completed in ${processingTime}ms`);

      this.lastUpdate = new Date();

      return {
        success: true,
        processingTime,
        dataPoints: processedData.measurements?.length || 0,
        alerts: alerts.length,
        timestamp: this.lastUpdate.toISOString()
      };

    } catch (error) {
      console.error('❌ Data processing error:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  // 📡 Collect satellite data
  async collectSatelliteData() {
    try {
      console.log('📡 Collecting satellite data...');
      const data = await enhancedSatelliteService.getNairobiComprehensiveData();

      return {
        source: 'satellite',
        timestamp: new Date().toISOString(),
        data: data,
        quality: this.assessDataQuality(data),
        measurements_count: data.sources?.satellite_no2?.measurements?.length || 0
      };
    } catch (error) {
      console.warn('⚠️ Satellite data collection failed:', error.message);
      return { source: 'satellite', error: error.message, data: null };
    }
  }

  // 🌤️ Collect weather data
  async collectWeatherData() {
    try {
      console.log('🌤️ Collecting weather data...');
      const data = await enhancedWeatherService.getNairobiWeatherAndAirQuality();

      return {
        source: 'weather',
        timestamp: new Date().toISOString(),
        data: data,
        quality: data.quality || 'unknown',
        locations_count: data.locations?.length || 0
      };
    } catch (error) {
      console.warn('⚠️ Weather data collection failed:', error.message);
      return { source: 'weather', error: error.message, data: null };
    }
  }

  // 🔄 Process and validate collected data
  async processAndValidateData(satelliteData, weatherData) {
    console.log('🔄 Processing and validating data...');

    const processed = {
      timestamp: new Date().toISOString(),
      sources: [],
      measurements: [],
      quality_flags: [],
      summary: {}
    };

    // Process satellite data
    if (satelliteData.data && !satelliteData.error) {
      processed.sources.push('satellite');

      // Extract measurements from satellite data
      if (satelliteData.data.sources?.satellite_no2?.measurements) {
        satelliteData.data.sources.satellite_no2.measurements.forEach(measurement => {
          processed.measurements.push({
            id: `sat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            source: 'satellite',
            location: {
              lat: measurement.latitude,
              lon: measurement.longitude
            },
            pollutants: {
              no2_tropospheric: measurement.no2_tropospheric,
              quality_flag: measurement.qa_value
            },
            timestamp: measurement.observation_time,
            confidence: measurement.qa_value
          });
        });
      }
    } else {
      processed.quality_flags.push('satellite_data_unavailable');
    }

    // Process weather data
    if (weatherData.data && !weatherData.error && weatherData.data.success) {
      processed.sources.push('weather');

      // Extract measurements from weather data
      if (weatherData.data.locations) {
        weatherData.data.locations.forEach(location => {
          processed.measurements.push({
            id: `weather_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            source: 'weather_api',
            location: {
              lat: location.coordinates?.lat,
              lon: location.coordinates?.lon
            },
            pollutants: location.air_quality || {},
            weather: {
              temperature: location.temperature,
              humidity: location.humidity,
              wind_speed: location.wind_speed,
              pressure: location.pressure
            },
            timestamp: location.timestamp,
            confidence: this.calculateWeatherConfidence(location)
          });
        });
      }
    } else {
      processed.quality_flags.push('weather_data_unavailable');
    }

    // Calculate summary statistics
    processed.summary = this.calculateSummaryStatistics(processed.measurements);

    // Validate data quality
    this.validateDataQuality(processed);

    return processed;
  }

  // 💾 Store processed data in database
  async storeProcessedData(processedData) {
    console.log('💾 Storing processed data...');

    try {
      // Store individual measurements
      for (const measurement of processedData.measurements) {
        if (measurement.location?.lat && measurement.location?.lon) {
          await this.storeMeasurement(measurement);
        }
      }

      // Store processing summary
      await this.storeProcessingSummary(processedData);

      console.log(`✅ Stored ${processedData.measurements.length} measurements`);
    } catch (error) {
      console.error('❌ Database storage error:', error);
      throw error;
    }
  }

  // 🤖 Generate AI insights
  async generateAIInsights(processedData) {
    console.log('🤖 Generating AI insights...');

    try {
      // Quick AI analysis for real-time processing
      const insights = await aiPolicyService.generateQuickAnalysis();

      // Add processing-specific insights
      insights.data_summary = {
        sources_active: processedData.sources.length,
        measurements_processed: processedData.measurements.length,
        quality_flags: processedData.quality_flags,
        processing_timestamp: processedData.timestamp
      };

      return insights;
    } catch (error) {
      console.warn('⚠️ AI insights generation failed:', error.message);
      return { status: 'unavailable', error: error.message };
    }
  }

  // 🚨 Check for alerts and warnings
  async checkForAlerts(processedData, aiInsights) {
    console.log('🚨 Checking for alerts...');

    const alerts = [];

    // Check PM2.5 levels
    const pm25Measurements = processedData.measurements
      .map(m => m.pollutants?.pm25 || m.pollutants?.pm2_5)
      .filter(pm25 => pm25 != null);

    if (pm25Measurements.length > 0) {
      const avgPM25 = pm25Measurements.reduce((sum, val) => sum + val, 0) / pm25Measurements.length;
      const maxPM25 = Math.max(...pm25Measurements);

      // Critical level alert
      if (avgPM25 > 55) {
        alerts.push({
          id: `critical_pm25_${Date.now()}`,
          type: 'health_emergency',
          severity: 'critical',
          pollutant: 'PM2.5',
          value: avgPM25,
          threshold: 55,
          message: `Critical air pollution detected: PM2.5 at ${avgPM25.toFixed(1)} μg/m³`,
          location: 'Nairobi Metropolitan Area',
          timestamp: new Date().toISOString(),
          actions: [
            'Issue immediate public health advisory',
            'Recommend staying indoors',
            'Alert vulnerable populations',
            'Activate emergency response protocols'
          ]
        });
      }

      // High level alert
      else if (avgPM25 > 35) {
        alerts.push({
          id: `high_pm25_${Date.now()}`,
          type: 'air_pollution',
          severity: 'high',
          pollutant: 'PM2.5',
          value: avgPM25,
          threshold: 35,
          message: `Unhealthy air quality detected: PM2.5 at ${avgPM25.toFixed(1)} μg/m³`,
          location: 'Nairobi Metropolitan Area',
          timestamp: new Date().toISOString(),
          actions: [
            'Sensitive groups should limit outdoor activities',
            'Monitor air quality closely',
            'Consider mask wearing outdoors'
          ]
        });
      }
    }

    // Check data quality issues
    if (processedData.quality_flags.length > 0) {
      alerts.push({
        id: `data_quality_${Date.now()}`,
        type: 'data_quality',
        severity: 'medium',
        message: `Data quality issues detected: ${processedData.quality_flags.join(', ')}`,
        flags: processedData.quality_flags,
        timestamp: new Date().toISOString(),
        actions: [
          'Verify data source connectivity',
          'Check API service status',
          'Use backup data sources if available'
        ]
      });
    }

    // Check for insufficient data
    if (processedData.measurements.length < 2) {
      alerts.push({
        id: `insufficient_data_${Date.now()}`,
        type: 'system',
        severity: 'medium',
        message: 'Insufficient data sources available for comprehensive analysis',
        timestamp: new Date().toISOString(),
        actions: [
          'Check API configurations',
          'Verify network connectivity',
          'Contact data providers if issues persist'
        ]
      });
    }

    return alerts;
  }

  // 📊 Update real-time dashboard
  async updateRealTimeDashboard(processedData, aiInsights, alerts) {
    console.log('📊 Updating real-time dashboard...');

    if (!io) return;

    const dashboardUpdate = {
      timestamp: new Date().toISOString(),
      data_summary: {
        sources_active: processedData.sources.length,
        measurements_count: processedData.measurements.length,
        quality_score: this.calculateOverallQuality(processedData),
        last_update: processedData.timestamp
      },
      air_quality: processedData.summary,
      ai_insights: {
        status: aiInsights.status,
        risk_level: aiInsights.risk_level,
        confidence: aiInsights.confidence
      },
      alerts: {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        latest: alerts[0] || null
      }
    };

    // Emit to all dashboard clients
    io.to('nairobi_dashboard').emit('realtime_update', dashboardUpdate);

    // Send critical alerts separately
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    if (criticalAlerts.length > 0) {
      io.to('nairobi_dashboard').emit('critical_alert', {
        alerts: criticalAlerts,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`📡 Dashboard updated: ${processedData.measurements.length} measurements, ${alerts.length} alerts`);
  }

  // 🔄 Start automatic processing
  startAutomaticProcessing() {
    console.log('🔄 Starting automatic data processing...');

    setInterval(async () => {
      try {
        await this.processRealTimeData();
      } catch (error) {
        console.error('❌ Automatic processing error:', error);
      }
    }, this.updateInterval);

    // Initial processing
    setTimeout(() => {
      this.processRealTimeData().catch(console.error);
    }, 5000); // 5 second delay for startup
  }

  // 💾 Store individual measurement
  async storeMeasurement(measurement) {
    const query = `
      INSERT INTO air_measurements (
        geom, pm25, pm10, no2, so2, co, o3,
        source_type, recorded_at, quality_flag,
        temperature, humidity, wind_speed, pressure
      ) VALUES (
        ST_SetSRID(ST_MakePoint($1, $2), 4326),
        $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      )
      ON CONFLICT DO NOTHING
    `;

    const values = [
      measurement.location.lon,
      measurement.location.lat,
      measurement.pollutants?.pm25 || measurement.pollutants?.pm2_5,
      measurement.pollutants?.pm10,
      measurement.pollutants?.no2 || measurement.pollutants?.no2_tropospheric,
      measurement.pollutants?.so2,
      measurement.pollutants?.co,
      measurement.pollutants?.o3,
      measurement.source,
      measurement.timestamp,
      Math.round((measurement.confidence || 0.5) * 3), // Convert to 1-3 scale
      measurement.weather?.temperature,
      measurement.weather?.humidity,
      measurement.weather?.wind_speed,
      measurement.weather?.pressure
    ];

    await db.query(query, values);
  }

  // 📈 Store processing summary
  async storeProcessingSummary(processedData) {
    const query = `
      INSERT INTO processing_log (
        timestamp, sources_count, measurements_count,
        quality_flags, avg_pm25, max_pm25, data_completeness
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    const values = [
      processedData.timestamp,
      processedData.sources.length,
      processedData.measurements.length,
      JSON.stringify(processedData.quality_flags),
      processedData.summary.avg_pm25,
      processedData.summary.max_pm25,
      this.calculateDataCompleteness(processedData)
    ];

    await db.query(query, values);
  }

  // 📊 Calculate summary statistics
  calculateSummaryStatistics(measurements) {
    if (measurements.length === 0) {
      return {
        avg_pm25: null,
        max_pm25: null,
        min_pm25: null,
        measurements_count: 0,
        aqi_category: 'Unknown'
      };
    }

    const pm25Values = measurements
      .map(m => m.pollutants?.pm25 || m.pollutants?.pm2_5)
      .filter(pm25 => pm25 != null);

    const no2Values = measurements
      .map(m => m.pollutants?.no2 || m.pollutants?.no2_tropospheric)
      .filter(no2 => no2 != null);

    const summary = {
      measurements_count: measurements.length,
      sources: [...new Set(measurements.map(m => m.source))],
      timestamp: new Date().toISOString()
    };

    if (pm25Values.length > 0) {
      summary.avg_pm25 = pm25Values.reduce((sum, val) => sum + val, 0) / pm25Values.length;
      summary.max_pm25 = Math.max(...pm25Values);
      summary.min_pm25 = Math.min(...pm25Values);
      summary.aqi = this.calculateAQI(summary.avg_pm25);
      summary.aqi_category = this.getAQICategory(summary.avg_pm25);
    }

    if (no2Values.length > 0) {
      summary.avg_no2 = no2Values.reduce((sum, val) => sum + val, 0) / no2Values.length;
      summary.max_no2 = Math.max(...no2Values);
    }

    return summary;
  }

  // 🏥 Validate data quality
  validateDataQuality(processedData) {
    // Check temporal freshness
    const now = new Date();
    const measurements = processedData.measurements;

    const freshMeasurements = measurements.filter(m => {
      const measurementTime = new Date(m.timestamp);
      const ageHours = (now - measurementTime) / (1000 * 60 * 60);
      return ageHours <= 2; // Within last 2 hours
    });

    if (freshMeasurements.length < measurements.length * 0.5) {
      processedData.quality_flags.push('stale_data_detected');
    }

    // Check spatial coverage
    const uniqueLocations = new Set(
      measurements.map(m => `${m.location?.lat},${m.location?.lon}`)
    );

    if (uniqueLocations.size < 3) {
      processedData.quality_flags.push('limited_spatial_coverage');
    }

    // Check for suspicious values
    const pm25Values = measurements
      .map(m => m.pollutants?.pm25 || m.pollutants?.pm2_5)
      .filter(pm25 => pm25 != null);

    const suspiciousValues = pm25Values.filter(pm25 => pm25 > 500 || pm25 < 0);
    if (suspiciousValues.length > 0) {
      processedData.quality_flags.push('suspicious_values_detected');
    }
  }

  // 🎯 Assess data quality
  assessDataQuality(data) {
    if (!data || !data.sources) return 'poor';

    const activeSources = Object.values(data.sources).filter(s => s.status === 'success').length;
    const totalSources = Object.keys(data.sources).length;

    const ratio = activeSources / totalSources;

    if (ratio >= 0.8) return 'excellent';
    if (ratio >= 0.6) return 'good';
    if (ratio >= 0.4) return 'fair';
    return 'poor';
  }

  // 🌤️ Calculate weather confidence
  calculateWeatherConfidence(location) {
    let confidence = 0.7; // Base confidence

    if (location.air_quality && Object.keys(location.air_quality).length > 3) {
      confidence += 0.2; // More pollutants = higher confidence
    }

    if (location.data_source === 'WeatherAPI.com') {
      confidence += 0.1; // Premium source
    }

    return Math.min(confidence, 1.0);
  }

  // 📈 Calculate overall quality score
  calculateOverallQuality(processedData) {
    let score = 0.5; // Base score

    // Source diversity bonus
    if (processedData.sources.length >= 2) score += 0.2;
    if (processedData.sources.length >= 3) score += 0.1;

    // Measurement count bonus
    if (processedData.measurements.length >= 5) score += 0.1;
    if (processedData.measurements.length >= 10) score += 0.1;

    // Quality flags penalty
    score -= processedData.quality_flags.length * 0.1;

    return Math.max(0, Math.min(1, score));
  }

  // 📊 Calculate data completeness
  calculateDataCompleteness(processedData) {
    const expectedSources = ['satellite', 'weather', 'ground_stations'];
    const activeSources = processedData.sources;

    return activeSources.length / expectedSources.length;
  }

  // 🏭 AQI calculation utilities
  calculateAQI(pm25) {
    if (!pm25) return 0;
    if (pm25 <= 15) return Math.round((50 / 15) * pm25);
    if (pm25 <= 25) return Math.round(50 + ((100 - 50) / (25 - 15)) * (pm25 - 15));
    if (pm25 <= 35) return Math.round(100 + ((150 - 100) / (35 - 25)) * (pm25 - 25));
    if (pm25 <= 55) return Math.round(150 + ((200 - 150) / (55 - 35)) * (pm25 - 35));
    return Math.min(500, Math.round(200 + ((300 - 200) / (150 - 55)) * (pm25 - 55)));
  }

  getAQICategory(pm25) {
    if (!pm25) return 'Unknown';
    if (pm25 <= 15) return 'Good';
    if (pm25 <= 25) return 'Moderate';
    if (pm25 <= 35) return 'Unhealthy for Sensitive Groups';
    if (pm25 <= 55) return 'Unhealthy';
    return 'Very Unhealthy';
  }

  // 📊 Get processing status
  getStatus() {
    return {
      is_processing: this.isProcessing,
      last_update: this.lastUpdate,
      update_interval_ms: this.updateInterval,
      queue_size: this.processingQueue.length
    };
  }

  // 🔧 Manual trigger for processing
  async triggerManualProcessing() {
    console.log('🔧 Manual processing triggered...');
    return await this.processRealTimeData();
  }

  // 🛑 Stop automatic processing
  stopAutomaticProcessing() {
    console.log('🛑 Stopping automatic processing...');
    this.isProcessing = false;
  }
}

export default new DataProcessorService();