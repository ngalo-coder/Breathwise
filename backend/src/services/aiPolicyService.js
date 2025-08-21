// backend/src/services/aiPolicyService.js
// OpenRouter AI-powered policy recommendation engine

import axios from 'axios';
import NodeCache from 'node-cache';

class AIPolicyService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 900 }); // 15 minutes cache
    this.openRouterBaseUrl = 'https://openrouter.ai/api/v1';
    this.preferredModel = 'anthropic/claude-3.5-sonnet'; // Best for analysis
  }
  
  // Getter for OpenRouter API key to ensure it's loaded when needed
  get openRouterKey() {
    return process.env.OPENROUTER_API_KEY;
  }

  // Update the API key (useful for test environments)
  updateApiKey(newKey) {
    this.openRouterKey = newKey;
  }

  // 🤖 Generate comprehensive AI analysis
  async generateComprehensiveAnalysis({ satelliteData, weatherData, analysisDepth = 'comprehensive' }) {
    try {
      const cacheKey = `ai_analysis_${analysisDepth}_${Date.now().toString().slice(-6)}`;
      
      // Prepare context for AI
      const analysisContext = this.prepareAnalysisContext(satelliteData, weatherData);
      
      const prompt = this.buildAnalysisPrompt(analysisContext, analysisDepth);
      
      const aiResponse = await this.callOpenRouter(prompt, {
        model: this.preferredModel,
        temperature: 0.3, // Lower for analytical tasks
        max_tokens: 2000
      });

      const analysis = this.parseAIAnalysis(aiResponse);
      
      // Cache the result
      this.cache.set(cacheKey, analysis);
      
      return analysis;

    } catch (error) {
      console.error('❌ AI analysis error:', error);
      return this.generateFallbackAnalysis(satelliteData, weatherData);
    }
  }

  // 🎯 Smart hotspot detection with ML clustering
  async detectSmartHotspots({ data, algorithm = 'dbscan', sensitivity = 'medium', timeWindow = '24h' }) {
    try {
      const hotspots = data.processed_data?.pollution_hotspots || [];
      
      if (hotspots.length === 0) {
        return { clusters: [], overall_confidence: 0, data_sources: [] };
      }

      // Prepare hotspot data for AI analysis
      const hotspotsContext = this.prepareHotspotsContext(hotspots, data);
      
      const prompt = this.buildHotspotAnalysisPrompt(hotspotsContext, algorithm, sensitivity);
      
      const aiResponse = await this.callOpenRouter(prompt, {
        model: this.preferredModel,
        temperature: 0.2,
        max_tokens: 1500
      });

      const smartHotspots = this.parseHotspotAnalysis(aiResponse, hotspots);
      
      return {
        clusters: smartHotspots,
        overall_confidence: this.calculateOverallConfidence(smartHotspots),
        data_sources: Object.keys(data.sources || {}),
        algorithm_used: algorithm
      };

    } catch (error) {
      console.error('❌ Smart hotspots error:', error);
      return this.generateFallbackHotspots(data);
    }
  }

  // 🚨 Generate intelligent early warnings
  async generateEarlyWarnings({ satelliteData, weatherData, warningTypes, timeHorizon }) {
    try {
      const warningsContext = this.prepareWarningsContext(satelliteData, weatherData);
      
      const prompt = this.buildWarningsPrompt(warningsContext, warningTypes, timeHorizon);
      
      const aiResponse = await this.callOpenRouter(prompt, {
        model: this.preferredModel,
        temperature: 0.4,
        max_tokens: 1800
      });

      const warnings = this.parseWarningsResponse(aiResponse);
      
      return {
        active_warnings: warnings,
        overall_risk: this.calculateOverallRisk(warnings),
        next_update: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
        data_confidence: this.assessDataConfidence(satelliteData, weatherData)
      };

    } catch (error) {
      console.error('❌ Early warnings error:', error);
      return this.generateFallbackWarnings(satelliteData, weatherData);
    }
  }

  // 📊 Analyze policy effectiveness
  async analyzePolicyEffectiveness({ policyIds, timeRange, includeProjections }) {
    try {
      // This would integrate with your policy database
      const policies = await this.getPolicyData(policyIds, timeRange);
      
      const effectivenessContext = this.preparePolicyContext(policies);
      
      const prompt = this.buildPolicyAnalysisPrompt(effectivenessContext, timeRange);
      
      const aiResponse = await this.callOpenRouter(prompt, {
        model: this.preferredModel,
        temperature: 0.3,
        max_tokens: 2200
      });

      const effectiveness = this.parsePolicyAnalysis(aiResponse, policies);
      
      if (includeProjections) {
        effectiveness.projections = await this.generatePolicyProjections(policies);
      }
      
      return effectiveness;

    } catch (error) {
      console.error('❌ Policy effectiveness error:', error);
      return this.generateFallbackPolicyAnalysis(policyIds);
    }
  }

  // 🌟 Generate smart recommendations
  async generateSmartRecommendations({ currentConditions, predictions, historicalData }) {
    try {
      const recommendationsContext = this.prepareRecommendationsContext(
        currentConditions, 
        predictions, 
        historicalData
      );
      
      const prompt = this.buildRecommendationsPrompt(recommendationsContext);
      
      const aiResponse = await this.callOpenRouter(prompt, {
        model: this.preferredModel,
        temperature: 0.5, // Higher for creative recommendations
        max_tokens: 2000
      });

      const recommendations = this.parseRecommendations(aiResponse);
      
      return {
        recommendations: recommendations.map(rec => ({
          ...rec,
          confidence: this.calculateRecommendationConfidence(rec, currentConditions),
          implementation_priority: this.calculateImplementationPriority(rec),
          estimated_impact: this.estimateImpact(rec, currentConditions)
        })),
        generated_at: new Date().toISOString(),
        context_factors: this.extractContextFactors(currentConditions, predictions)
      };

    } catch (error) {
      console.error('❌ Smart recommendations error:', error);
      return this.generateFallbackRecommendations(currentConditions);
    }
  }

  // 🔧 Core AI interaction method
  async callOpenRouter(prompt, options = {}) {
    const apiKey = this.openRouterKey;
    if (!apiKey) {
      console.error('OpenRouter API key not found in environment variables');
      throw new Error('OpenRouter API key not configured');
    }

    const payload = {
      model: options.model || this.preferredModel,
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt()
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options.temperature || 0.3,
      max_tokens: options.max_tokens || 1500,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    };

    const response = await axios.post(`${this.openRouterBaseUrl}/chat/completions`, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
        'X-Title': 'UNEP Air Quality Platform'
      },
      timeout: 30000
    });

    return response.data.choices[0].message.content;
  }

  // 📝 System prompt for air quality expertise
  getSystemPrompt() {
    return `You are an expert air quality scientist and policy advisor specializing in environmental data analysis for Nairobi, Kenya. 

Your expertise includes:
- Air quality monitoring and satellite data interpretation
- Environmental health impact assessment  
- Evidence-based policy recommendation
- Weather-pollution correlation analysis
- Hotspot detection and source attribution
- Early warning system development

Guidelines:
- Provide specific, actionable insights
- Use quantified metrics when possible
- Consider local Nairobi context (traffic, industry, weather patterns)
- Prioritize public health protection
- Base recommendations on scientific evidence
- Consider implementation feasibility and cost-effectiveness

Response format: Always structure responses as valid JSON with clear categories and confidence scores where applicable.`;
  }

  // 🏗️ Context preparation methods
  prepareAnalysisContext(satelliteData, weatherData) {
    return {
      air_quality: {
        hotspots_detected: satelliteData.processed_data?.pollution_hotspots?.length || 0,
        alerts_active: satelliteData.processed_data?.alerts?.length || 0,
        data_sources: Object.keys(satelliteData.sources || {}),
        overall_status: satelliteData.processed_data?.air_quality_summary?.overall_status
      },
      weather: {
        current_conditions: weatherData.summary || {},
        impact_on_pollution: this.assessWeatherImpact(weatherData),
        data_quality: weatherData.quality || 'unknown'
      },
      temporal: {
        timestamp: new Date().toISOString(),
        season: this.getCurrentSeason(),
        time_of_day: this.getTimeOfDay()
      }
    };
  }

  prepareHotspotsContext(hotspots, data) {
    return {
      hotspots: hotspots.map(h => ({
        location: h.geometry.coordinates,
        severity: h.properties.severity,
        confidence: h.properties.confidence,
        source: h.properties.source,
        pollutant: h.properties.pollutant || 'PM2.5'
      })),
      data_quality: data.processed_data?.data_fusion_summary?.data_quality,
      sources_correlation: this.analyzeSourcesCorrelation(data.sources)
    };
  }

  prepareWarningsContext(satelliteData, weatherData) {
    return {
      current_pollution: {
        severity: this.assessCurrentSeverity(satelliteData),
        trend: this.assessTrend(satelliteData),
        spatial_distribution: this.assessSpatialDistribution(satelliteData)
      },
      weather_forecast: {
        conditions: weatherData.summary || {},
        pollution_conducive: this.assessPollutionRisk(weatherData)
      },
      historical_patterns: this.getHistoricalPatterns()
    };
  }

  // 📊 Prompt building methods
  buildAnalysisPrompt(context, depth) {
    return `Analyze the following air quality data for Nairobi, Kenya and provide ${depth} assessment:

Context Data:
${JSON.stringify(context, null, 2)}

Please provide analysis in this JSON format:
{
  "assessment": "overall air quality assessment",
  "riskLevel": "low|medium|high|critical",
  "confidence": 0.0-1.0,
  "keyFindings": ["finding1", "finding2", "finding3"],
  "trends": {
    "direction": "improving|stable|worsening",
    "confidence": 0.0-1.0,
    "timeframe": "short_term|medium_term|long_term"
  },
  "predictions": {
    "short_term": "6-hour forecast",
    "daily": "24-hour outlook", 
    "weekly": "7-day trend prediction",
    "seasonal": "seasonal outlook"
  },
  "healthRisks": {
    "immediate": ["risk1", "risk2"],
    "vulnerable": ["children", "elderly", "respiratory_patients"],
    "precautions": ["action1", "action2"],
    "hospitalAlert": true|false
  }
}`;
  }

  buildHotspotAnalysisPrompt(context, algorithm, sensitivity) {
    return `Analyze pollution hotspots using ${algorithm} clustering with ${sensitivity} sensitivity:

Hotspot Data:
${JSON.stringify(context, null, 2)}

Provide AI analysis for each hotspot in JSON format:
{
  "clustered_hotspots": [
    {
      "cluster_id": "unique_id",
      "confidence": 0.0-1.0,
      "severity": "low|moderate|high|critical",
      "source_attribution": "traffic|industrial|waste|mixed",
      "ai_analysis": {
        "risk_factors": ["factor1", "factor2"],
        "priority": "low|medium|high|urgent",
        "response": "recommended immediate response"
      },
      "temporal": {
        "peak_hours": ["hour1", "hour2"],
        "trend": "increasing|stable|decreasing",
        "persistence": 0.0-1.0
      }
    }
  ]
}`;
  }

  buildWarningsPrompt(context, warningTypes, timeHorizon) {
    return `Generate early warnings for ${timeHorizon} time horizon:

Warning Types: ${warningTypes.join(', ')}
Context: ${JSON.stringify(context, null, 2)}

Provide warnings in JSON format:
{
  "warnings": [
    {
      "id": "warning_id",
      "type": "health_emergency|pollution_episode|weather_event",
      "severity": "low|medium|high|critical",
      "confidence": 0.0-1.0,
      "title": "Warning title",
      "description": "Detailed description",
      "geographic_scope": ["area1", "area2"],
      "time_window": {
        "start": "ISO timestamp",
        "end": "ISO timestamp"
      },
      "ai_prediction": {
        "probability": 0.0-1.0,
        "factors": ["factor1", "factor2"],
        "timeline": "expected development timeline"
      },
      "response": {
        "immediate": ["action1", "action2"],
        "preparation": ["prep1", "prep2"],
        "indicators": ["monitor1", "monitor2"]
      }
    }
  ]
}`;
  }

  buildPolicyAnalysisPrompt(context, timeRange) {
    return `Analyze policy effectiveness over ${timeRange}:

Policy Context:
${JSON.stringify(context, null, 2)}

Provide analysis in JSON format:
{
  "overall": {
    "improvement_percentage": 0.0-100.0,
    "pollution_reduction": 0.0-100.0,
    "health_benefits": "quantified health improvements",
    "economic_value": "estimated economic value USD"
  },
  "policies": [
    {
      "id": "policy_id",
      "metrics": {
        "effectiveness_score": 0.0-1.0,
        "target_achievement": 0.0-1.0,
        "side_effects": ["effect1", "effect2"]
      },
      "ai_analysis": {
        "success_factors": ["factor1", "factor2"],
        "improvements": ["improvement1", "improvement2"],
        "sustainability": 0.0-1.0,
        "adaptations": ["adaptation1", "adaptation2"]
      },
      "impacts": {
        "pm25_change": "percentage change",
        "no2_change": "percentage change", 
        "aqi_improvement": "AQI point improvement",
        "hotspots_reduced": "number reduced"
      }
    }
  ]
}`;
  }

  buildRecommendationsPrompt(context) {
    return `Generate evidence-based policy recommendations for Nairobi:

Current Context:
${JSON.stringify(context, null, 2)}

Provide recommendations in JSON format:
{
  "recommendations": [
    {
      "id": "rec_id",
      "category": "traffic|industrial|waste|monitoring|health",
      "title": "Recommendation title",
      "description": "Detailed description",
      "priority": "low|medium|high|urgent",
      "implementation": {
        "timeline": "immediate|short_term|medium_term|long_term",
        "cost_estimate": "low|medium|high",
        "stakeholders": ["stakeholder1", "stakeholder2"],
        "prerequisites": ["prereq1", "prereq2"]
      },
      "expected_outcomes": {
        "air_quality_improvement": "expected improvement",
        "health_benefits": "expected health benefits",
        "economic_impact": "economic considerations",
        "timeframe": "time to see results"
      },
      "monitoring": {
        "kpis": ["kpi1", "kpi2"],
        "measurement_method": "how to measure success",
        "review_frequency": "monitoring frequency"
      }
    }
  ]
}`;
  }

  // 🔍 Response parsing methods
  parseAIAnalysis(response) {
    try {
      const cleaned = this.cleanJSONResponse(response);
      const parsed = JSON.parse(cleaned);
      
      return {
        assessment: parsed.assessment || 'Analysis unavailable',
        riskLevel: parsed.riskLevel || 'medium',
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
        keyFindings: parsed.keyFindings || ['No specific findings available'],
        trends: {
          direction: parsed.trends?.direction || 'stable',
          confidence: parsed.trends?.confidence || 0.5,
          timeframe: parsed.trends?.timeframe || 'medium_term'
        },
        predictions: {
          short_term: parsed.predictions?.short_term || 'No short-term prediction available',
          daily: parsed.predictions?.daily || 'No daily outlook available',
          weekly: parsed.predictions?.weekly || 'No weekly trend available',
          seasonal: parsed.predictions?.seasonal || 'No seasonal outlook available'
        },
        healthRisks: {
          immediate: parsed.healthRisks?.immediate || [],
          vulnerable: parsed.healthRisks?.vulnerable || ['sensitive_groups'],
          precautions: parsed.healthRisks?.precautions || ['monitor_air_quality'],
          hospitalAlert: parsed.healthRisks?.hospitalAlert || false
        }
      };
    } catch (error) {
      console.error('❌ Error parsing AI analysis:', error);
      return this.getDefaultAnalysis();
    }
  }

  parseHotspotAnalysis(response, originalHotspots) {
    try {
      const cleaned = this.cleanJSONResponse(response);
      const parsed = JSON.parse(cleaned);
      
      return (parsed.clustered_hotspots || []).map((cluster, index) => ({
        id: cluster.cluster_id || `cluster_${index}`,
        geometry: originalHotspots[index]?.geometry || { type: 'Point', coordinates: [36.8219, -1.2921] },
        confidence: Math.min(Math.max(cluster.confidence || 0.5, 0), 1),
        severity: cluster.severity || 'moderate',
        source_attribution: cluster.source_attribution || 'mixed',
        pollutants: this.inferPollutants(cluster),
        ai_analysis: {
          risk_factors: cluster.ai_analysis?.risk_factors || ['unknown_factors'],
          priority: cluster.ai_analysis?.priority || 'medium',
          response: cluster.ai_analysis?.response || 'monitor_and_assess'
        },
        temporal: {
          peak_hours: cluster.temporal?.peak_hours || ['07:00-09:00', '17:00-19:00'],
          trend: cluster.temporal?.trend || 'stable',
          persistence: Math.min(Math.max(cluster.temporal?.persistence || 0.5, 0), 1)
        }
      }));
    } catch (error) {
      console.error('❌ Error parsing hotspot analysis:', error);
      return this.getFallbackHotspots(originalHotspots);
    }
  }

  parseWarningsResponse(response) {
    try {
      const cleaned = this.cleanJSONResponse(response);
      const parsed = JSON.parse(cleaned);
      
      return (parsed.warnings || []).map(warning => ({
        id: warning.id || `warning_${Date.now()}`,
        type: warning.type || 'air_pollution',
        severity: warning.severity || 'medium',
        confidence: Math.min(Math.max(warning.confidence || 0.5, 0), 1),
        title: warning.title || 'Air Quality Warning',
        description: warning.description || 'Air quality monitoring alert',
        geographic_scope: warning.geographic_scope || ['Nairobi Central'],
        time_window: {
          start: warning.time_window?.start || new Date().toISOString(),
          end: warning.time_window?.end || new Date(Date.now() + 24*60*60*1000).toISOString()
        },
        ai_prediction: {
          probability: Math.min(Math.max(warning.ai_prediction?.probability || 0.5, 0), 1),
          factors: warning.ai_prediction?.factors || ['pollution_accumulation'],
          timeline: warning.ai_prediction?.timeline || '12-24 hours'
        },
        response: {
          immediate: warning.response?.immediate || ['monitor_conditions'],
          preparation: warning.response?.preparation || ['prepare_health_advisories'],
          indicators: warning.response?.indicators || ['pm25_levels', 'weather_conditions']
        },
        status: 'active',
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('❌ Error parsing warnings:', error);
      return [];
    }
  }

  parsePolicyAnalysis(response, policies) {
    try {
      const cleaned = this.cleanJSONResponse(response);
      const parsed = JSON.parse(cleaned);
      
      return {
        overall: {
          improvement_percentage: parsed.overall?.improvement_percentage || 0,
          pollution_reduction: parsed.overall?.pollution_reduction || 0,
          health_benefits: parsed.overall?.health_benefits || 'Benefits being assessed',
          economic_value: parsed.overall?.economic_value || 'Economic value being calculated'
        },
        policies: (parsed.policies || []).map((policy, index) => ({
          id: policy.id || policies[index]?.id || `policy_${index}`,
          name: policies[index]?.name || `Policy ${index + 1}`,
          implementation_date: policies[index]?.implementation_date || new Date().toISOString(),
          metrics: {
            effectiveness_score: Math.min(Math.max(policy.metrics?.effectiveness_score || 0.5, 0), 1),
            target_achievement: Math.min(Math.max(policy.metrics?.target_achievement || 0.5, 0), 1),
            side_effects: policy.metrics?.side_effects || []
          },
          ai_analysis: {
            success_factors: policy.ai_analysis?.success_factors || ['implementation_quality'],
            improvements: policy.ai_analysis?.improvements || ['monitoring_enhancement'],
            sustainability: Math.min(Math.max(policy.ai_analysis?.sustainability || 0.5, 0), 1),
            adaptations: policy.ai_analysis?.adaptations || ['regular_review']
          },
          impacts: {
            pm25_change: policy.impacts?.pm25_change || '0%',
            no2_change: policy.impacts?.no2_change || '0%',
            aqi_improvement: policy.impacts?.aqi_improvement || '0 points',
            hotspots_reduced: policy.impacts?.hotspots_reduced || '0'
          }
        }))
      };
    } catch (error) {
      console.error('❌ Error parsing policy analysis:', error);
      return this.getDefaultPolicyAnalysis();
    }
  }

  parseRecommendations(response) {
    try {
      const cleaned = this.cleanJSONResponse(response);
      const parsed = JSON.parse(cleaned);
      
      return (parsed.recommendations || []).map(rec => ({
        id: rec.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        category: rec.category || 'monitoring',
        title: rec.title || 'Air Quality Monitoring Enhancement',
        description: rec.description || 'Enhance air quality monitoring capabilities',
        priority: rec.priority || 'medium',
        implementation: {
          timeline: rec.implementation?.timeline || 'medium_term',
          cost_estimate: rec.implementation?.cost_estimate || 'medium',
          stakeholders: rec.implementation?.stakeholders || ['NEMA', 'County_Government'],
          prerequisites: rec.implementation?.prerequisites || ['stakeholder_alignment']
        },
        expected_outcomes: {
          air_quality_improvement: rec.expected_outcomes?.air_quality_improvement || 'Gradual improvement expected',
          health_benefits: rec.expected_outcomes?.health_benefits || 'Reduced respiratory health risks',
          economic_impact: rec.expected_outcomes?.economic_impact || 'Cost-effective intervention',
          timeframe: rec.expected_outcomes?.timeframe || '6-12 months'
        },
        monitoring: {
          kpis: rec.monitoring?.kpis || ['pm25_levels', 'aqi_improvement'],
          measurement_method: rec.monitoring?.measurement_method || 'Continuous monitoring',
          review_frequency: rec.monitoring?.review_frequency || 'monthly'
        }
      }));
    } catch (error) {
      console.error('❌ Error parsing recommendations:', error);
      return this.getDefaultRecommendations();
    }
  }

  // 🛠️ Utility methods
  cleanJSONResponse(response) {
    // Remove markdown formatting and extract JSON
    return response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^\s*[\r\n]/gm, '')
      .trim();
  }

  // Fallback methods for when AI is unavailable
  generateFallbackAnalysis(satelliteData, weatherData) {
    return {
      assessment: 'AI analysis temporarily unavailable - using rule-based assessment',
      riskLevel: 'medium',
      confidence: 0.3,
      keyFindings: ['Automated analysis in progress', 'Multiple data sources active'],
      trends: { direction: 'stable', confidence: 0.3, timeframe: 'medium_term' },
      predictions: {
        short_term: 'Conditions expected to remain stable',
        daily: 'Monitor for changes',
        weekly: 'Seasonal patterns expected',
        seasonal: 'Dry season impact anticipated'
      },
      healthRisks: {
        immediate: [],
        vulnerable: ['sensitive_groups'],
        precautions: ['monitor_air_quality'],
        hospitalAlert: false
      }
    };
  }

  // Quick analysis methods
  async generateQuickAnalysis() {
    return {
      status: 'moderate',
      risk_level: 'medium',
      confidence: 0.7,
      concerns: ['traffic_pollution'],
      improvements: ['monitoring_enhancement'],
      predictions: {
        next_6h: 'Stable conditions',
        next_24h: 'Gradual improvement'
      },
      trends: {
        direction: 'stable',
        seasonal: 'typical_for_season'
      }
    };
  }

  async getActiveHotspots() {
    // This would query your database for active hotspots
    return [];
  }

  async getActiveWarnings() {
    // This would query your database for active warnings
    return [];
  }

  // Helper calculation methods
  calculateOverallConfidence(smartHotspots) {
    if (smartHotspots.length === 0) return 0;
    const avgConfidence = smartHotspots.reduce((sum, h) => sum + h.confidence, 0) / smartHotspots.length;
    return Math.round(avgConfidence * 100) / 100;
  }

  calculateOverallRisk(warnings) {
    if (warnings.length === 0) return 'low';
    const hasHigh = warnings.some(w => w.severity === 'high' || w.severity === 'critical');
    const hasMedium = warnings.some(w => w.severity === 'medium');
    
    if (hasHigh) return 'high';
    if (hasMedium) return 'medium';
    return 'low';
  }

  assessDataConfidence(satelliteData, weatherData) {
    let confidence = 0.5;
    
    if (satelliteData.sources && Object.keys(satelliteData.sources).length > 2) confidence += 0.2;
    if (weatherData.success && weatherData.has_air_quality) confidence += 0.2;
    if (satelliteData.processed_data?.data_fusion_summary?.data_quality === 'excellent') confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  // Context assessment methods
  assessWeatherImpact(weatherData) {
    if (!weatherData.success) return 'unknown';
    
    const summary = weatherData.summary;
    if (summary.avg_wind_speed < 2) return 'pollution_accumulation';
    if (summary.dominant_weather?.includes('rain')) return 'pollution_clearance';
    return 'neutral';
  }

  getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 11 || month <= 2) return 'dry_season';
    if (month >= 3 && month <= 5) return 'long_rains';
    if (month >= 6 && month <= 9) return 'dry_season';
    return 'short_rains';
  }

  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  // More utility methods...
  inferPollutants(cluster) {
    const sourceMap = {
      'traffic': ['NO2', 'PM2.5'],
      'industrial': ['SO2', 'PM10', 'NO2'],
      'waste': ['PM2.5', 'CO'],
      'mixed': ['PM2.5', 'NO2']
    };
    return sourceMap[cluster.source_attribution] || ['PM2.5'];
  }

  // 🔍 Data analysis methods
  analyzeSourcesCorrelation(sources) {
    if (!sources) return 'no_data';

    const sourceCount = Object.keys(sources).length;
    const activeSources = Object.values(sources).filter(s => s.status === 'success').length;
    const correlationStrength = activeSources / Math.max(sourceCount, 1);

    if (correlationStrength >= 0.75) return 'strong';
    if (correlationStrength >= 0.5) return 'moderate';
    if (correlationStrength >= 0.25) return 'weak';
    return 'poor';
  }

  assessCurrentSeverity(satelliteData) {
    if (!satelliteData || !satelliteData.processed_data) return 'unknown';

    const hotspots = satelliteData.processed_data.pollution_hotspots || [];
    const maxSeverity = hotspots.length > 0 ? Math.max(...hotspots.map(h => h.properties.severity || 0)) : 0;

    if (maxSeverity >= 3) return 'critical'; // High severity
    if (maxSeverity >= 2) return 'high';
    if (maxSeverity >= 1) return 'moderate';
    return 'low';
  }

  assessTrend(satelliteData) {
    // Simple trend assessment based on hotspot count
    if (!satelliteData || !satelliteData.processed_data) return 'stable';

    const hotspots = satelliteData.processed_data.pollution_hotspots || [];
    const recentHotspots = hotspots.filter(h => h.properties.timestamp && new Date(h.properties.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000));

    if (recentHotspots.length > hotspots.length * 0.75) return 'increasing';
    if (recentHotspots.length < hotspots.length * 0.25) return 'decreasing';
    return 'stable';
  }

  assessSpatialDistribution(satelliteData) {
    if (!satelliteData || !satelliteData.processed_data) return 'unknown';

    const hotspots = satelliteData.processed_data.pollution_hotspots || [];
    const locations = hotspots
      .filter(h => h.geometry && h.geometry.coordinates)
      .map(h => h.geometry.coordinates.join(','));

    // Simple clustering detection
    const uniqueLocations = new Set(locations);
    const clusterRatio = uniqueLocations.size / hotspots.length;

    if (clusterRatio < 0.25) return 'highly_clustered';
    if (clusterRatio < 0.5) return 'moderately_clustered';
    if (clusterRatio < 0.75) return 'somewhat_clustered';
    return 'widely_dispersed';
  }

  assessPollutionRisk(weatherData) {
    if (!weatherData || !weatherData.success) return 'unknown';

    const { avg_wind_speed, dominant_weather, temperature } = weatherData.summary || {};

    if (avg_wind_speed < 2 && (dominant_weather.includes('clear') || dominant_weather.includes('sunny'))) {
      return 'high';
    }
    if (avg_wind_speed < 3 && temperature > 25) {
      return 'moderate';
    }
    if (dominant_weather.includes('rain') || avg_wind_speed > 5) {
      return 'low';
    }
    return 'neutral';
  }

  getHistoricalPatterns() {
    // This would query historical data
    return {
      seasonal_trend: 'typical_for_season',
      long_term_improvement: 'gradual',
      known_episodes: ['dry_season_peaks', 'rainy_season_clearance']
    };
  }

  // 🛠️ Fallback methods
  generateFallbackHotspots(data) {
    return data.processed_data?.pollution_hotspots || [];
  }

  generateFallbackWarnings(satelliteData, weatherData) {
    const severity = this.assessCurrentSeverity(satelliteData);
    const risk = this.assessPollutionRisk(weatherData);

    return [{
      id: 'fallback_warning_1',
      type: 'air_pollution',
      severity: severity === 'critical' ? 'high' : 'medium',
      confidence: 0.6,
      title: 'Air Quality Advisory',
      description: `Current conditions indicate ${severity} pollution levels with ${risk} risk factors.`,
      geographic_scope: ['Nairobi Central', 'Industrial Areas'],
      time_window: {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      ai_prediction: {
        probability: 0.7,
        factors: ['current_pollution_levels', 'weather_conditions'],
        timeline: 'next 24 hours'
      },
      response: {
        immediate: ['monitor_conditions', 'prepare_health_advisories'],
        preparation: ['enhance_monitoring', 'alert_sensitive_groups'],
        indicators: ['pm25_levels', 'weather_conditions']
      },
      status: 'active',
      timestamp: new Date().toISOString()
    }];
  }

  generateFallbackRecommendations(currentConditions) {
    return [{
      id: 'fallback_rec_1',
      category: 'monitoring',
      title: 'Enhance Air Quality Monitoring',
      description: 'Improve monitoring infrastructure and data collection to better track pollution sources',
      priority: 'high',
      implementation: {
        timeline: 'immediate',
        cost_estimate: 'medium',
        stakeholders: ['NEMA', 'County_Government'],
        prerequisites: ['stakeholder_alignment']
      },
      expected_outcomes: {
        air_quality_improvement: 'Gradual improvement expected with better data',
        health_benefits: 'Reduced exposure for sensitive groups',
        economic_impact: 'Cost-effective intervention',
        timeframe: '6-12 months'
      },
      monitoring: {
        kpis: ['pm25_levels', 'aqi_improvement'],
        measurement_method: 'Continuous monitoring',
        review_frequency: 'monthly'
      }
    }, {
      id: 'fallback_rec_2',
      category: 'traffic',
      title: 'Implement Traffic Restrictions',
      description: 'Temporary traffic restrictions in high pollution areas',
      priority: 'medium',
      implementation: {
        timeline: 'short_term',
        cost_estimate: 'low',
        stakeholders: ['Traffic Police', 'City Council'],
        prerequisites: ['public_awareness_campaign']
      },
      expected_outcomes: {
        air_quality_improvement: 'Temporary reduction in PM2.5 levels',
        health_benefits: 'Immediate relief for residents',
        economic_impact: 'Minimal economic disruption',
        timeframe: 'immediate to 3 months'
      },
      monitoring: {
        kpis: ['traffic_volume_reduction', 'pollution_levels'],
        measurement_method: 'Real-time monitoring',
        review_frequency: 'daily'
      }
    }];
  }

  prepareRecommendationsContext(currentConditions, predictions, historicalData) {
    return {
      current_conditions: currentConditions,
      predictions: predictions,
      historical_data: historicalData,
      environmental_factors: {
        weather: this.assessWeatherImpact(currentConditions.weather || {}),
        season: this.getCurrentSeason(),
        time_of_day: this.getTimeOfDay()
      },
      policy_context: {
        existing_policies: ['traffic_restrictions', 'industrial_emissions_control'],
        enforcement_level: 'moderate',
        public_compliance: 'fair'
      }
    };
  }

  calculateRecommendationConfidence(recommendation, currentConditions) {
    let confidence = 0.5;

    // Increase confidence based on data quality
    if (currentConditions.air_quality_index && currentConditions.air_quality_index.value > 100) confidence += 0.2;
    if (currentConditions.weather && currentConditions.weather.avg_wind_speed < 3) confidence += 0.1;

    // Increase for relevant recommendations
    if (recommendation.category === 'traffic' && currentConditions.traffic_data) confidence += 0.1;
    if (recommendation.category === 'industrial' && currentConditions.industrial_emissions) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  calculateImplementationPriority(recommendation) {
    const priorityMap = {
      'immediate': 4,
      'short_term': 3,
      'medium_term': 2,
      'long_term': 1
    };

    return priorityMap[recommendation.implementation.timeline] || 2;
  }

  estimateImpact(recommendation, currentConditions) {
    const impactEstimates = {
      'monitoring': { improvement: '10-20%', timeframe: '6-12 months' },
      'traffic': { improvement: '15-30%', timeframe: '3-6 months' },
      'industrial': { improvement: '20-40%', timeframe: '6-18 months' },
      'health': { improvement: '5-15%', timeframe: 'immediate to 3 months' }
    };

    return impactEstimates[recommendation.category] || { improvement: '5-15%', timeframe: '6-12 months' };
  }

  extractContextFactors(currentConditions, predictions) {
    const factors = [];

    if (currentConditions.air_quality_index) factors.push(`AQI: ${currentConditions.air_quality_index.value}`);
    if (currentConditions.weather) factors.push(`Weather: ${currentConditions.weather.dominant_weather}`);
    if (currentConditions.traffic_data) factors.push('High traffic detected');
    if (currentConditions.industrial_emissions) factors.push('Industrial emissions present');

    if (predictions.next_24_hours) factors.push(`24h forecast: ${predictions.next_24_hours}`);

    return factors;
  }

  async getPolicyData(policyIds, timeRange) {
    // This would query your policy database
    return []; // Placeholder
  }

  async generatePolicyProjections(policies) {
    // Generate future projections based on current policies
    return {
      next_quarter: 'Continued improvement expected',
      next_year: 'Significant air quality gains projected',
      long_term: 'Sustainable improvements likely'
    };
  }

  getDefaultAnalysis() {
    return this.generateFallbackAnalysis({}, {});
  }

  getDefaultPolicyAnalysis() {
    return {
      overall: { improvement_percentage: 0, pollution_reduction: 0 },
      policies: []
    };
  }

  getDefaultRecommendations() {
    return [{
      id: 'default_rec',
      category: 'monitoring',
      title: 'Enhance Air Quality Monitoring',
      description: 'Improve monitoring infrastructure and data collection',
      priority: 'medium'
    }];
  }
}

export default new AIPolicyService();