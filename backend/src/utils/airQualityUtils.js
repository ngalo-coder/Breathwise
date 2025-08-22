export function getAirQualityEmoji(status) {
  const emojiMap = {
    'Good': '😊',
    'Moderate': '😐',
    'Unhealthy for Sensitive Groups': '😷',
    'Unhealthy': '😨',
    'Very Unhealthy': '🚨',
    'Unknown': '❓'
  };
  return emojiMap[status] || '❓';
}

export function getHealthMessage(pm25) {
  if (!pm25) return 'Air quality data unavailable';
  if (pm25 <= 15) return 'Air quality is good for outdoor activities';
  if (pm25 <= 25) return 'Air quality is acceptable for most people';
  if (pm25 <= 35) return 'Sensitive individuals should consider limiting prolonged outdoor exertion';
  if (pm25 <= 55) return 'Everyone should limit prolonged outdoor exertion';
  return 'Avoid outdoor activities. Health alert in effect.';
}

export function getTrendIndicator(pm25) {
  // Simplified trend - in real app you'd compare with historical data
  if (!pm25) return 'stable';
  return pm25 > 35 ? 'worsening' : pm25 < 25 ? 'improving' : 'stable';
}

export function getQuickRecommendation(pm25) {
  if (!pm25) return 'Monitor air quality regularly';
  if (pm25 <= 15) return 'Great day for outdoor activities!';
  if (pm25 <= 25) return 'Good air quality - enjoy outdoor time';
  if (pm25 <= 35) return 'Consider wearing a mask for extended outdoor activities';
  if (pm25 <= 55) return 'Limit outdoor activities, especially for sensitive groups';
  return 'Stay indoors and avoid outdoor activities';
}

export const generateRecommendedActions = (cityData) => {
  const actions = [];
  const { summary, hotspots } = cityData;

  if (summary.avg_pm25 > 35) {
    actions.push('Issue public health advisory for sensitive groups');
  }

  if (summary.avg_pm25 > 55) {
    actions.push('Consider implementing traffic restrictions in high-pollution areas');
  }

  if (hotspots.filter(h => h.properties.severity === 'critical').length > 0) {
    actions.push('Deploy mobile monitoring units to critical areas for detailed assessment');
  }

  if (summary.avg_pm25 > 0 && summary.avg_pm25 <= 35) {
    actions.push('Continue routine monitoring and public awareness campaigns');
  }

  return actions.length > 0 ? actions : ['No specific actions recommended at this time'];
};
