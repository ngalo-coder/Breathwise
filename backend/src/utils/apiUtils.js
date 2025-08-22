// Helper function for API recommendations
export function generateAPIRecommendations(testResults) {
  const recommendations = [];

  if (!testResults.weatherapi) {
    recommendations.push({
      priority: 'high',
      message: 'WeatherAPI.com is required for air quality data',
      action: 'Get free API key at https://www.weatherapi.com/signup.aspx'
    });
  }

  if (!testResults.openaq && !testResults.iqair && !testResults.waqi) {
    recommendations.push({
      priority: 'medium',
      message: 'Consider adding additional data sources for better coverage',
      action: 'Register for OpenAQ (free) or other premium services'
    });
  }

  if (Object.values(testResults).every(result => result === false)) {
    recommendations.push({
      priority: 'critical',
      message: 'No working API connections found',
      action: 'Check internet connection and API key configurations'
    });
  }

  return recommendations;
}
