
class AIPolicyEngine {
  constructor() {
    this.policyTemplates = {
      traffic: {
        low: { action: 'Traffic monitoring', cost: 5000, impact: 'Medium' },
        medium: { action: 'Odd-even vehicle restrictions', cost: 15000, impact: 'High' },
        high: { action: 'Vehicle-free zones + Public transport', cost: 50000, impact: 'Very High' }
      },
      industrial: {
        low: { action: 'Emission monitoring', cost: 10000, impact: 'Medium' },
        medium: { action: 'Mandatory emission controls', cost: 30000, impact: 'High' },
        high: { action: 'Industrial relocation incentives', cost: 100000, impact: 'Very High' }
      },
      waste: {
        low: { action: 'Waste collection improvement', cost: 8000, impact: 'Medium' },
        medium: { action: 'Waste-to-energy facility', cost: 25000, impact: 'High' },
        high: { action: 'Complete waste management overhaul', cost: 75000, impact: 'Very High' }
      }
    };
  }

  generateSmartRecommendations(zones) {
    const recommendations = [];
    
    zones.forEach(zone => {
      const analysis = this.analyzeZone(zone);
      const recommendation = this.selectBestPolicy(analysis);
      
      recommendations.push({
        zone_id: zone.id,
        zone_name: zone.name,
        current_pm25: zone.pm25,
        predicted_improvement: this.calculatePredictedImprovement(zone, recommendation),
        recommended_action: recommendation.action,
        estimated_cost_usd: recommendation.cost,
        expected_impact: recommendation.impact,
        priority_score: this.calculatePriorityScore(zone),
        timeline: this.estimateTimeline(recommendation),
        health_benefits: this.calculateHealthBenefits(zone),
        roi_months: this.calculateROI(recommendation, zone)
      });
    });
    
    return recommendations.sort((a, b) => b.priority_score - a.priority_score);
  }

  analyzeZone(zone) {
    const severity = this.calculateSeverity(zone.pm25);
    const source = this.identifyPrimarySource(zone);
    
    return {
      severity,
      source,
      urgency: severity > 0.7 ? 'high' : severity > 0.4 ? 'medium' : 'low'
    };
  }

  calculateSeverity(pm25) {
    // WHO guideline is 15 μg/m³
    return Math.min(pm25 / 50, 1); // Normalize to 0-1 scale
  }

  identifyPrimarySource(zone) {
    // Simple heuristic based on zone name
    const name = zone.name.toLowerCase();
    if (name.includes('industrial') || name.includes('embakasi')) return 'industrial';
    if (name.includes('cbd') || name.includes('westlands')) return 'traffic';
    return 'waste';
  }

  selectBestPolicy(analysis) {
    const { source, urgency } = analysis;
    return this.policyTemplates[source][urgency];
  }

  calculatePredictedImprovement(zone, recommendation) {
    const baseImprovement = {
      'Medium': 0.15,
      'High': 0.30,
      'Very High': 0.50
    }[recommendation.impact];
    
    const currentExcess = Math.max(0, zone.pm25 - 15); // Above WHO guideline
    return Math.round(currentExcess * baseImprovement * 10) / 10;
  }

  calculatePriorityScore(zone) {
    const severity = this.calculateSeverity(zone.pm25);
    const population = this.estimatePopulationImpact(zone);
    return Math.round((severity * 0.6 + population * 0.4) * 100);
  }

  estimatePopulationImpact(zone) {
    // Estimate based on zone characteristics
    const populationDensity = {
      'CBD': 0.9,
      'Westlands': 0.7,
      'Embakasi': 0.8,
      'Karen': 0.3,
      'Industrial': 0.5
    };
    
    const zoneName = Object.keys(populationDensity).find(key => 
      zone.name.includes(key)
    );
    
    return populationDensity[zoneName] || 0.5;
  }

  estimateTimeline(recommendation) {
    const timelines = {
      'Medium': '3-6 months',
      'High': '6-12 months',
      'Very High': '12-24 months'
    };
    return timelines[recommendation.impact];
  }

  calculateHealthBenefits(zone) {
    const excessPM25 = Math.max(0, zone.pm25 - 15);
    const estimatedCases = Math.round(excessPM25 * 10); // Simplified calculation
    return {
      respiratory_cases_prevented: estimatedCases,
      cardiovascular_cases_prevented: Math.round(estimatedCases * 0.6),
      estimated_lives_saved: Math.round(excessPM25 / 10)
    };
  }

  calculateROI(recommendation, zone) {
    const healthCostSavings = this.calculateHealthBenefits(zone).respiratory_cases_prevented * 500; // $500 per case
    const monthlyROI = healthCostSavings / (recommendation.cost / 12);
    return Math.max(1, Math.round(1 / monthlyROI));
  }
}

module.exports = AIPolicyEngine;
