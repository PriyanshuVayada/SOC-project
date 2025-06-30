/**
 * Security Overview Dashboard Component
 * 
 * Main dashboard view displaying key security metrics, threat trends,
 * and real-time security posture overview with interactive visualizations.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, AlertTriangle, Activity, Server, 
  TrendingUp, TrendingDown, Eye, Download 
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useSocket } from '../../contexts/SocketContext';

interface DashboardMetrics {
  alerts24h: number;
  alerts7d: number;
  alerts30d: number;
  threatLevel: 'Green' | 'Yellow' | 'Red';
}

interface ChartDataPoint {
  date: string;
  severity: string;
  count: number;
}

export function Overview() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [severityData, setSeverityData] = useState<any[]>([]);
  const [incidentData, setIncidentData] = useState<any[]>([]);
  const [topAlertTypes, setTopAlertTypes] = useState<any[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { subscribeToAlerts } = useSocket();

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
    fetchTimelineData();

    // Subscribe to real-time alerts for live updates
    const handleNewAlert = (alert: any) => {
      // Update metrics in real-time
      fetchDashboardData();
    };

    subscribeToAlerts(handleNewAlert);

    return () => {
      // Cleanup subscription handled by context
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/dashboard/overview');
      const { metrics, severityBreakdown, incidentStatus, topAlertTypes } = response.data;
      
      setMetrics(metrics);
      setSeverityData(severityBreakdown);
      setIncidentData(incidentStatus);
      setTopAlertTypes(topAlertTypes);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const fetchTimelineData = async () => {
    try {
      const response = await axios.get('/charts/alerts-timeline');
      
      // Transform data for timeline chart
      const transformedData = response.data.reduce((acc: any[], item: ChartDataPoint) => {
        const existingDate = acc.find(d => d.date === item.date);
        if (existingDate) {
          existingDate[item.severity] = item.count;
        } else {
          acc.push({
            date: item.date,
            [item.severity]: item.count
          });
        }
        return acc;
      }, []);
      
      setTimelineData(transformedData);
    } catch (error) {
      console.error('Failed to fetch timeline data:', error);
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'Red': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'Yellow': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'Green': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const severityColors = {
    Critical: '#dc2626',
    High: '#ea580c',
    Medium: '#d97706',
    Low: '#65a30d',
    Informational: '#2563eb'
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 h-32 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg"></div>
            <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Security Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time security posture and threat intelligence dashboard
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </motion.button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Alerts 24h */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Alerts (24h)
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.alerts24h || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">
              +12% from yesterday
            </span>
          </div>
        </motion.div>

        {/* Active Incidents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Incidents
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {incidentData.filter(i => i.status !== 'Closed').reduce((sum, i) => sum + i.count, 0)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
            <span className="text-sm text-red-600 dark:text-red-400">
              -5% from last week
            </span>
          </div>
        </motion.div>

        {/* Threat Level */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Threat Level
              </p>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getThreatLevelColor(metrics?.threatLevel || 'Green')}`}>
                {metrics?.threatLevel || 'Green'}
              </div>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              All systems operational
            </span>
          </div>
        </motion.div>

        {/* Asset Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Asset Health
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                98.5%
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Server className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Eye className="w-4 h-4 text-gray-400 mr-1" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              245 assets monitored
            </span>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Timeline */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Alert Trends (7 Days)
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Critical</span>
              <div className="w-3 h-3 bg-orange-500 rounded-full ml-4"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">High</span>
              <div className="w-3 h-3 bg-yellow-500 rounded-full ml-4"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Medium</span>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="Critical" 
                stackId="1" 
                stroke="#dc2626" 
                fill="#dc2626" 
                fillOpacity={0.8}
              />
              <Area 
                type="monotone" 
                dataKey="High" 
                stackId="1" 
                stroke="#ea580c" 
                fill="#ea580c" 
                fillOpacity={0.8}
              />
              <Area 
                type="monotone" 
                dataKey="Medium" 
                stackId="1" 
                stroke="#d97706" 
                fill="#d97706" 
                fillOpacity={0.8}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Incident Status Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Incident Status Distribution
          </h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={incidentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {incidentData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Top Alert Types */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Top Alert Types (Last 7 Days)
        </h3>
        
        <div className="space-y-4">
          {topAlertTypes.map((alert, index) => (
            <div key={alert.alert_type} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
                    {alert.alert_type}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Security alert type
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {alert.count}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  alerts
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}