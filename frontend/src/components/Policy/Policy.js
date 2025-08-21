import React, { useState, useEffect } from 'react';
import {
  Shield,
  TrendingUp,
  Target,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  RefreshCw,
  Filter,
  Search,
  Plus,
  Eye,
  Edit,
  BarChart3
} from 'lucide-react';
import { useData } from '../../context/DataContext';

const Policy = () => {
  const { policyRecommendations, refreshSpecificData, loading } = useData();
  const [filteredPolicies, setFilteredPolicies] = useState([]);
  const [filters, setFilters] = useState({
    priority: 'all',
    status: 'all',
    category: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [showSimulation, setShowSimulation] = useState(false);

  useEffect(() => {
    applyFilters();
  }, [policyRecommendations, filters, searchTerm]);

  const applyFilters = () => {
    let filtered = [...policyRecommendations];

    if (filters.priority !== 'all') {
      filtered = filtered.filter(policy => policy.priority === filters.priority);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(policy => (policy.status || 'pending') === filters.status);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(policy => policy.category === filters.category);
    }

    if (searchTerm) {
      filtered = filtered.filter(policy =>
        policy.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by priority
    const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
    filtered.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));

    setFilteredPolicies(filtered);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'implemented':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'traffic':
        return '🚗';
      case 'industrial':
        return '🏭';
      case 'monitoring':
        return '📊';
      case 'health':
        return '🏥';
      case 'emergency':
        return '🚨';
      default:
        return '📋';
    }
  };

  const simulatePolicy = (policy) => {
    setSelectedPolicy(policy);
    setShowSimulation(true);
  };

  const exportPolicies = () => {
    const exportData = {
      policies: filteredPolicies,
      filters,
      exportTime: new Date().toISOString(),
      summary: {
        total: filteredPolicies.length,
        by_priority: {
          urgent: filteredPolicies.filter(p => p.priority === 'urgent').length,
          high: filteredPolicies.filter(p => p.priority === 'high').length,
          medium: filteredPolicies.filter(p => p.priority === 'medium').length,
          low: filteredPolicies.filter(p => p.priority === 'low').length
        }
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `policy-recommendations-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const mockPolicies = [
    {
      id: 'policy_1',
      title: 'Implement Emergency Air Quality Measures',
      description: 'Multiple data sources confirm unhealthy air quality levels requiring immediate intervention',
      category: 'emergency',
      priority: 'urgent',
      status: 'pending',
      implementation: {
        timeline: 'immediate',
        cost_estimate: 'medium',
        stakeholders: ['NEMA', 'County Government', 'Traffic Police'],
        prerequisites: ['Stakeholder coordination', 'Public notification']
      },
      expected_outcomes: {
        air_quality_improvement: '20-30% reduction in peak pollution',
        health_benefits: 'Reduced respiratory health risks for 500K+ residents',
        economic_impact: 'Short-term economic adjustment, long-term health savings',
        timeframe: '0-24 hours'
      },
      monitoring: {
        kpis: ['PM2.5 levels', 'Traffic volume', 'Public compliance'],
        measurement_method: 'Real-time monitoring stations',
        review_frequency: 'hourly'
      }
    },
    {
      id: 'policy_2',
      title: 'Deploy Targeted Pollution Control Measures',
      description: 'Satellite-detected and ground-confirmed pollution hotspots require targeted action',
      category: 'monitoring',
      priority: 'high',
      status: 'approved',
      implementation: {
        timeline: 'short_term',
        cost_estimate: 'high',
        stakeholders: ['NEMA', 'Industrial regulators', 'Local authorities'],
        prerequisites: ['Hotspot validation', 'Resource allocation']
      },
      expected_outcomes: {
        air_quality_improvement: '15-25% reduction in hotspot intensity',
        health_benefits: 'Protection for 200K+ residents in affected areas',
        economic_impact: 'Cost-effective targeted intervention',
        timeframe: '24-48 hours'
      },
      monitoring: {
        kpis: ['Hotspot intensity', 'Source compliance', 'Community feedback'],
        measurement_method: 'Mobile monitoring units + satellite verification',
        review_frequency: 'daily'
      }
    },
    {
      id: 'policy_3',
      title: 'Enhance Public Transport Infrastructure',
      description: 'Long-term strategy to reduce traffic-related emissions in CBD areas',
      category: 'traffic',
      priority: 'medium',
      status: 'pending',
      implementation: {
        timeline: 'long_term',
        cost_estimate: 'high',
        stakeholders: ['Ministry of Transport', 'Matatu operators', 'City Council'],
        prerequisites: ['Budget approval', 'Route planning', 'Stakeholder agreements']
      },
      expected_outcomes: {
        air_quality_improvement: '10-20% reduction in traffic emissions',
        health_benefits: 'City-wide improvement in air quality',
        economic_impact: 'High initial investment, long-term economic benefits',
        timeframe: '6-12 months'
      },
      monitoring: {
        kpis: ['Public transport usage', 'Traffic volume reduction', 'Emission levels'],
        measurement_method: 'Traffic counters + emission monitoring',
        review_frequency: 'monthly'
      }
    }
  ];

  // Use mock data if no real policy data
  const displayPolicies = filteredPolicies.length > 0 ? filteredPolicies : mockPolicies.filter(policy => {
    if (filters.priority !== 'all' && policy.priority !== filters.priority) return false;
    if (filters.status !== 'all' && policy.status !== filters.status) return false;
    if (filters.category !== 'all' && policy.category !== filters.category) return false;
    if (searchTerm && !policy.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !policy.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-green-600 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Policy Management</h1>
              <p className="text-sm text-gray-600">AI-generated recommendations and impact analysis</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              {displayPolicies.length} recommendations
            </span>

            <button
              onClick={() => refreshSpecificData('policy')}
              disabled={loading}
              className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              title="Refresh Policies"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={exportPolicies}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
              title="Export Policies"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Policy Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {['urgent', 'high', 'medium', 'low'].map((priority) => {
            const count = displayPolicies.filter(policy => policy.priority === priority).length;
            return (
              <div key={priority} className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className={`w-5 h-5 ${
                      priority === 'urgent' ? 'text-red-500' :
                      priority === 'high' ? 'text-orange-500' :
                      priority === 'medium' ? 'text-yellow-500' : 'text-green-500'
                    }`} />
                    <span className="font-medium text-gray-900 capitalize">{priority} Priority</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getPriorityColor(priority)}`}>
                    {count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="all">All Categories</option>
                <option value="emergency">Emergency</option>
                <option value="traffic">Traffic</option>
                <option value="industrial">Industrial</option>
                <option value="monitoring">Monitoring</option>
                <option value="health">Health</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="implemented">Implemented</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search policies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Policy Recommendations */}
        <div className="space-y-6">
          {displayPolicies.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No policy recommendations found</h3>
              <p className="text-gray-600">
                Try adjusting your filters or check back later for new recommendations.
              </p>
            </div>
          ) : (
            displayPolicies.map((policy) => (
              <div key={policy.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6">
                  {/* Policy Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{getCategoryIcon(policy.category)}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(policy.priority)}`}>
                            {policy.priority.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(policy.status)}`}>
                            {(policy.status || 'pending').toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500 capitalize">
                            {policy.category}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {policy.title}
                        </h3>
                        <p className="text-gray-600">
                          {policy.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => simulatePolicy(policy)}
                        className="bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 text-sm flex items-center space-x-1"
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span>Simulate</span>
                      </button>
                      
                      <button className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>Details</span>
                      </button>
                    </div>
                  </div>

                  {/* Policy Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Implementation Details */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Implementation
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Timeline:</span>
                          <span className="font-medium">{policy.implementation?.timeline || 'TBD'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cost:</span>
                          <span className="font-medium">{policy.implementation?.cost_estimate || 'TBD'}</span>
                        </div>
                        <div className="mt-3">
                          <span className="text-gray-600 text-xs">Stakeholders:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(policy.implementation?.stakeholders || []).map((stakeholder, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                {stakeholder}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expected Outcomes */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Expected Outcomes
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600 text-xs">Air Quality:</span>
                          <p className="font-medium">{policy.expected_outcomes?.air_quality_improvement || 'TBD'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 text-xs">Health Benefits:</span>
                          <p className="font-medium">{policy.expected_outcomes?.health_benefits || 'TBD'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 text-xs">Timeline:</span>
                          <p className="font-medium">{policy.expected_outcomes?.timeframe || 'TBD'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Monitoring */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Monitoring
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600 text-xs">Method:</span>
                          <p className="font-medium">{policy.monitoring?.measurement_method || 'TBD'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 text-xs">Frequency:</span>
                          <p className="font-medium">{policy.monitoring?.review_frequency || 'TBD'}</p>
                        </div>
                        <div className="mt-3">
                          <span className="text-gray-600 text-xs">Key Metrics:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(policy.monitoring?.kpis || []).map((kpi, index) => (
                              <span key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                {kpi}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Policy Simulation Modal */}
        {showSimulation && selectedPolicy && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Policy Impact Simulation</h2>
                  <button
                    onClick={() => setShowSimulation(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-gray-600 mt-1">{selectedPolicy.title}</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Simulation Parameters */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Simulation Parameters</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Implementation Speed
                        </label>
                        <select className="w-full rounded-lg border-gray-300">
                          <option>Immediate (0-24h)</option>
                          <option>Fast (1-7 days)</option>
                          <option>Standard (1-4 weeks)</option>
                          <option>Gradual (1-6 months)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Compliance Rate
                        </label>
                        <input
                          type="range"
                          min="50"
                          max="100"
                          defaultValue="80"
                          className="w-full"
                        />
                        <div className="text-sm text-gray-600 mt-1">80% expected compliance</div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Budget Allocation
                        </label>
                        <select className="w-full rounded-lg border-gray-300">
                          <option>Full Budget</option>
                          <option>75% Budget</option>
                          <option>50% Budget</option>
                          <option>Minimal Budget</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Projected Results */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Projected Results</h3>
                    <div className="space-y-4">
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-green-800 font-medium">PM2.5 Reduction</span>
                          <span className="text-green-800 font-bold">-25%</span>
                        </div>
                        <div className="text-sm text-green-600 mt-1">
                          Expected reduction in peak pollution levels
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-800 font-medium">Health Benefits</span>
                          <span className="text-blue-800 font-bold">500K+</span>
                        </div>
                        <div className="text-sm text-blue-600 mt-1">
                          Residents with improved air quality
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-purple-800 font-medium">Implementation Time</span>
                          <span className="text-purple-800 font-bold">0-24h</span>
                        </div>
                        <div className="text-sm text-purple-600 mt-1">
                          Time to see initial results
                        </div>
                      </div>
                      
                      <div className="bg-orange-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-orange-800 font-medium">Economic Impact</span>
                          <span className="text-orange-800 font-bold">Positive</span>
                        </div>
                        <div className="text-sm text-orange-600 mt-1">
                          Long-term health savings outweigh costs
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowSimulation(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Approve Policy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Policy;