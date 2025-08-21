import React from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Wind, Droplets, Thermometer, Activity } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AirQualityChart = ({ data, type = 'line', title, pollutant = 'pm25' }) => {
  // Default options for all chart types
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          font: {
            family: "'Inter', sans-serif",
            size: 12
          }
        }
      },
      title: {
        display: !!title,
        text: title,
        font: {
          family: "'Inter', sans-serif",
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#374151',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          family: "'Inter', sans-serif",
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 13
        },
        boxPadding: 6
      }
    }
  };

  // Get color based on pollutant type
  const getColor = (pollutant) => {
    switch (pollutant) {
      case 'pm25':
        return {
          primary: '#00857c',
          secondary: 'rgba(0, 133, 124, 0.2)'
        };
      case 'pm10':
        return {
          primary: '#0077c8',
          secondary: 'rgba(0, 119, 200, 0.2)'
        };
      case 'no2':
        return {
          primary: '#3f9c35',
          secondary: 'rgba(63, 156, 53, 0.2)'
        };
      case 'o3':
        return {
          primary: '#ffc72c',
          secondary: 'rgba(255, 199, 44, 0.2)'
        };
      default:
        return {
          primary: '#00857c',
          secondary: 'rgba(0, 133, 124, 0.2)'
        };
    }
  };

  // Get pollutant label
  const getPollutantLabel = (pollutant) => {
    switch (pollutant) {
      case 'pm25':
        return 'PM2.5 (μg/m³)';
      case 'pm10':
        return 'PM10 (μg/m³)';
      case 'no2':
        return 'NO₂ (μg/m³)';
      case 'o3':
        return 'O₃ (μg/m³)';
      default:
        return pollutant.toUpperCase();
    }
  };

  // Prepare data for Line Chart
  const prepareLineData = () => {
    const colors = getColor(pollutant);
    
    return {
      labels: data.labels || Array(data.values.length).fill('').map((_, i) => `Point ${i+1}`),
      datasets: [
        {
          label: getPollutantLabel(pollutant),
          data: data.values,
          borderColor: colors.primary,
          backgroundColor: colors.secondary,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: colors.primary,
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2
        }
      ]
    };
  };

  // Prepare data for Bar Chart
  const prepareBarData = () => {
    const colors = getColor(pollutant);
    
    return {
      labels: data.labels || Array(data.values.length).fill('').map((_, i) => `Point ${i+1}`),
      datasets: [
        {
          label: getPollutantLabel(pollutant),
          data: data.values,
          backgroundColor: colors.primary,
          borderRadius: 4,
          borderWidth: 0
        }
      ]
    };
  };

  // Prepare data for Doughnut Chart
  const prepareDoughnutData = () => {
    // For doughnut chart, we need to transform the data
    // We'll categorize the values into different air quality levels
    const values = data.values;
    const categories = {
      'Good': 0,
      'Moderate': 0,
      'Unhealthy for Sensitive': 0,
      'Unhealthy': 0,
      'Very Unhealthy': 0
    };
    
    values.forEach(value => {
      if (pollutant === 'pm25') {
        if (value <= 15) categories['Good']++;
        else if (value <= 25) categories['Moderate']++;
        else if (value <= 35) categories['Unhealthy for Sensitive']++;
        else if (value <= 55) categories['Unhealthy']++;
        else categories['Very Unhealthy']++;
      } else {
        // Default categorization for other pollutants
        if (value <= 20) categories['Good']++;
        else if (value <= 40) categories['Moderate']++;
        else if (value <= 60) categories['Unhealthy for Sensitive']++;
        else if (value <= 80) categories['Unhealthy']++;
        else categories['Very Unhealthy']++;
      }
    });
    
    return {
      labels: Object.keys(categories),
      datasets: [
        {
          data: Object.values(categories),
          backgroundColor: [
            '#3f9c35', // Good - Green
            '#ffc72c', // Moderate - Yellow
            '#ff9933', // Unhealthy for Sensitive - Orange
            '#cc0033', // Unhealthy - Red
            '#660099'  // Very Unhealthy - Purple
          ],
          borderWidth: 0,
          hoverOffset: 4
        }
      ]
    };
  };

  // Render the appropriate chart based on type
  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={prepareLineData()} options={defaultOptions} height={300} />;
      case 'bar':
        return <Bar data={prepareBarData()} options={defaultOptions} height={300} />;
      case 'doughnut':
        return (
          <div className="flex flex-col items-center">
            <div className="h-64 w-64">
              <Doughnut 
                data={prepareDoughnutData()} 
                options={{
                  ...defaultOptions,
                  cutout: '70%',
                  plugins: {
                    ...defaultOptions.plugins,
                    legend: {
                      ...defaultOptions.plugins.legend,
                      position: 'bottom'
                    }
                  }
                }} 
              />
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">Distribution of {getPollutantLabel(pollutant)} readings</p>
            </div>
          </div>
        );
      default:
        return <Line data={prepareLineData()} options={defaultOptions} height={300} />;
    }
  };

  // Render a placeholder if no data is provided
  if (!data || !data.values || data.values.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-unep-primary h-80 flex flex-col items-center justify-center">
        <Activity className="w-12 h-12 text-unep-primary/30 mb-4" />
        <p className="text-gray-400 text-center">No data available for visualization</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-unep-primary">
      <div className="flex items-center mb-4">
        {pollutant === 'pm25' && <Wind className="w-5 h-5 mr-2 text-unep-primary" />}
        {pollutant === 'pm10' && <Wind className="w-5 h-5 mr-2 text-unep-secondary" />}
        {pollutant === 'no2' && <Droplets className="w-5 h-5 mr-2 text-unep-green" />}
        {pollutant === 'o3' && <Thermometer className="w-5 h-5 mr-2 text-unep-yellow" />}
        <h3 className="text-lg font-semibold text-gray-900">
          {title || `${getPollutantLabel(pollutant)} Measurements`}
        </h3>
      </div>
      <div className="h-64">
        {renderChart()}
      </div>
      {data.summary && (
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-500">Average</p>
            <p className="text-lg font-semibold text-unep-primary">
              {data.summary.avg?.toFixed(1) || 'N/A'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Maximum</p>
            <p className="text-lg font-semibold text-unep-primary">
              {data.summary.max?.toFixed(1) || 'N/A'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Minimum</p>
            <p className="text-lg font-semibold text-unep-primary">
              {data.summary.min?.toFixed(1) || 'N/A'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AirQualityChart;