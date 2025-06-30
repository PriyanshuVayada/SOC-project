/**
 * Security Analytics & Reporting Component
 * 
 * Comprehensive analytics dashboard with vulnerability management,
 * asset inventory, compliance monitoring, and threat intelligence.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, Shield, Server, FileCheck, Target,
  Download, Filter, Search, AlertTriangle, CheckCircle,
  XCircle, TrendingUp, TrendingDown, Eye
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { format } from 'date-fns';

interface Asset {
  id: number;
  name: string;
  ip_address: string;
  asset_type: 'Server' | 'Endpoint' | 'Network Device' | 'Cloud Resource';
  operating_system: string;
  criticality: 'Critical' | 'High' | 'Medium' | 'Low';
  owner: string;
  location?: string;
  last_seen: string;
  vulnerability_count: number;
  is_active: boolean;
}

interface ComplianceFramework {
  id: number;
  name: string;
  description: string;
  total_controls: number;
  passed_controls: number;
  failed_controls: number;
  compliance_percentage: number;
  last_assessment: string;
  is_active: boolean;
}

export function SecurityAnalytics() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [compliance, setCompliance] = useState<ComplianceFramework[]>([]);
  const [activeTab, setActiveTab] = useState<'vulnerabilities' | 'assets' | 'compliance' | 'threat-intel'>('vulnerabilities');
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [assetFilters, setAssetFilters] = useState({
    assetType: '',
    criticality: '',
    owner: '',
    search: ''
  });

  useEffect(() => {
    fetchAssets();
    fetchCompliance();
  }, [assetFilters]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(assetFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await axios.get(`/assets?${params.toString()}`);
      setAssets(response.data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompliance = async () => {
    try {
      const response = await axios.get('/compliance');
      setCompliance(response.data);
    } catch (error) {
      console.error('Failed to fetch compliance data:', error);
    }
  };

  const handleAssetFilterChange = (key: string, value: string) => {
    setAssetFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAssetFilters = () => {
    setAssetFilters({ assetType: '', criticality: '', owner: '', search: '' });
  };

  const exportAssets = () => {
    const csvData = assets.map(asset => ({
      ID: asset.id,
      Name: asset.name,
      'IP Address': asset.ip_address,
      Type: asset.asset_type,
      OS: asset.operating_system,
      Criticality: asset.criticality,
      Owner: asset.owner,
      'Vulnerability Count': asset.vulnerability_count,
      'Last Seen': format(new Date(asset.last_seen), 'yyyy-MM-dd HH:mm:ss')
    }));
    
    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assets-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'Critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'High': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'Medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'Low': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case 'Server': return Server;
      case 'Endpoint': return Shield;
      case 'Network Device': return Target;
      case 'Cloud Resource': return BarChart3;
      default: return Server;
    }
  };

  // Sample vulnerability data for demonstration
  const vulnerabilityData = [
    { name: 'Critical', count: 23, color: '#dc2626' },
    { name: 'High', count: 45, color: '#ea580c' },
    { name: 'Medium', count: 78, color: '#d97706' },
    { name: 'Low', count: 156, color: '#65a30d' }
  ];

  const vulnerabilityTrendData = [
    { date: '2024-01-01', Critical: 25, High: 48, Medium: 82, Low: 160 },
    { date: '2024-01-02', Critical: 23, High: 45, Medium: 78, Low: 156 },
    { date: '2024-01-03', Critical: 21, High: 42, Medium: 75, Low: 152 },
    { date: '2024-01-04', Critical: 19, High: 40, Medium: 72, Low: 148 },
    { date: '2024-01-05', Critical: 18, High: 38, Medium: 70, Low: 145 },
    { date: '2024-01-06', Critical: 16, High: 35, Medium: 68, Low: 142 },
    { date: '2024-01-07', Critical: 15, High: 33, Medium: 65, Low: 140 }
  ];

  const topVulnerableAssets = assets
    .filter(asset => asset.vulnerability_count > 0)
    .sort((a, b) => b.vulnerability_count - a.vulnerability_count)
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Security Analytics & Reporting
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive security analytics, vulnerability management, and compliance monitoring
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Generate Report
          </motion.button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('vulnerabilities')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'vulnerabilities'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            Vulnerability Management
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'assets'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Server className="w-4 h-4 inline mr-2" />
            Asset Inventory ({assets.length})
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'compliance'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <FileCheck className="w-4 h-4 inline mr-2" />
            Compliance Monitoring
          </button>
          <button
            onClick={() => setActiveTab('threat-intel')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'threat-intel'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Target className="w-4 h-4 inline mr-2" />
            Threat Intelligence
          </button>
        </nav>
      </div>

      {/* Vulnerability Management Tab */}
      {activeTab === 'vulnerabilities' && (
        <div className="space-y-6">
          {/* Vulnerability Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {vulnerabilityData.map((vuln, index) => (
              <motion.div
                key={vuln.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {vuln.name} Vulnerabilities
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {vuln.count}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: `${vuln.color}20` }}>
                    <AlertTriangle className="w-6 h-6" style={{ color: vuln.color }} />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    -12% from last week
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vulnerability Distribution */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Vulnerability Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={vulnerabilityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {vulnerabilityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Vulnerability Trends */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Vulnerability Trends (7 Days)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={vulnerabilityTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                  />
                  <Line type="monotone" dataKey="Critical" stroke="#dc2626" strokeWidth={2} />
                  <Line type="monotone" dataKey="High" stroke="#ea580c" strokeWidth={2} />
                  <Line type="monotone" dataKey="Medium" stroke="#d97706" strokeWidth={2} />
                  <Line type="monotone" dataKey="Low" stroke="#65a30d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Top Vulnerable Assets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Top 5 Most Vulnerable Assets
            </h3>
            <div className="space-y-4">
              {topVulnerableAssets.map((asset, index) => (
                <div key={asset.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-4 ${
                      index === 0 ? 'bg-red-500' : 
                      index === 1 ? 'bg-orange-500' : 
                      index === 2 ? 'bg-yellow-500' : 
                      index === 3 ? 'bg-blue-500' : 'bg-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {asset.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {asset.ip_address} • {asset.asset_type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                      {asset.vulnerability_count}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      vulnerabilities
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Asset Inventory Tab */}
      {activeTab === 'assets' && (
        <div className="space-y-6">
          {/* Asset Filters */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Filter className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Asset Filters
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={clearAssetFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Clear All
                </button>
                <button
                  onClick={exportAssets}
                  className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={assetFilters.search}
                  onChange={(e) => handleAssetFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Asset Type Filter */}
              <select
                value={assetFilters.assetType}
                onChange={(e) => handleAssetFilterChange('assetType', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Asset Types</option>
                <option value="Server">Server</option>
                <option value="Endpoint">Endpoint</option>
                <option value="Network Device">Network Device</option>
                <option value="Cloud Resource">Cloud Resource</option>
              </select>
              
              {/* Criticality Filter */}
              <select
                value={assetFilters.criticality}
                onChange={(e) => handleAssetFilterChange('criticality', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Criticalities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              
              {/* Owner Filter */}
              <input
                type="text"
                placeholder="Owner"
                value={assetFilters.owner}
                onChange={(e) => handleAssetFilterChange('owner', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </motion.div>

          {/* Assets Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Asset
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Criticality
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Vulnerabilities
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Seen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-gray-500 dark:text-gray-400">Loading assets...</span>
                        </div>
                      </td>
                    </tr>
                  ) : assets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No assets found
                      </td>
                    </tr>
                  ) : (
                    assets.map((asset) => {
                      const AssetIcon = getAssetTypeIcon(asset.asset_type);
                      return (
                        <motion.tr
                          key={asset.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <AssetIcon className="w-5 h-5 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {asset.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                                  {asset.ip_address}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {asset.asset_type}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCriticalityColor(asset.criticality)}`}>
                              {asset.criticality}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {asset.owner}
                          </td>
                          <td className="px-6 py-4">
                            {asset.vulnerability_count > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200">
                                {asset.vulnerability_count}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                                0
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {format(new Date(asset.last_seen), 'MMM dd, HH:mm')}
                          </td>
                          <td className="px-6 py-4">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              <Eye className="w-4 h-4" />
                            </motion.button>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      {/* Compliance Monitoring Tab */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {compliance.map((framework, index) => (
              <motion.div
                key={framework.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {framework.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {framework.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {framework.compliance_percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Compliance
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${framework.compliance_percentage}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {framework.total_controls}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Total Controls
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {framework.passed_controls}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Passed
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                      {framework.failed_controls}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Failed
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  Last assessed: {format(new Date(framework.last_assessment), 'MMM dd, yyyy')}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Threat Intelligence Tab */}
      {activeTab === 'threat-intel' && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 text-center"
          >
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Threat Intelligence
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Threat intelligence feeds and indicators of compromise (IOCs) will be displayed here.
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Configure Threat Feeds
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}