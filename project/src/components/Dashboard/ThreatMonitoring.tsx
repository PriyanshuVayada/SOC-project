/**
 * Threat Monitoring Component
 * 
 * Real-time threat monitoring dashboard with live event stream,
 * geographical threat mapping, and advanced filtering capabilities.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, Download, Search, Eye, MapPin, 
  AlertTriangle, Shield, RefreshCw, Globe2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import axios from 'axios';
import { useSocket } from '../../contexts/SocketContext';
import { format } from 'date-fns';

// Define alert interface
interface Alert {
  id: number;
  alert_type: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  source_ip: string;
  destination_ip: string;
  source_port?: number;
  destination_port?: number;
  protocol?: string;
  description: string;
  status: string;
  created_at: string;
  country_code?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

interface GeoThreat {
  country_code: string;
  city: string;
  latitude: number;
  longitude: number;
  alert_count: number;
  max_severity: string;
  latest_alert: string;
}

// Custom map icons for different threat levels
const createThreatIcon = (severity: string, count: number) => {
  const color = severity === 'Critical' ? '#dc2626' : 
                severity === 'High' ? '#ea580c' : 
                severity === 'Medium' ? '#d97706' : 
                severity === 'Low' ? '#65a30d' : '#2563eb';
  
  const size = Math.min(Math.max(count * 2 + 20, 20), 40);
  
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="${color}" opacity="0.8" stroke="#fff" stroke-width="3"/>
        <text x="50" y="60" text-anchor="middle" fill="white" font-size="24" font-weight="bold">${count}</text>
      </svg>
    `)}`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

export function ThreatMonitoring() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [geoThreats, setGeoThreats] = useState<GeoThreat[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [realTimeCount, setRealTimeCount] = useState(0);
  
  // Filters state
  const [filters, setFilters] = useState({
    severity: '',
    alertType: '',
    sourceIp: '',
    destinationIp: '',
    timeRange: '24',
    search: ''
  });

  const { subscribeToAlerts, unsubscribeFromAlerts } = useSocket();

  // Fetch alerts with filters
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });
      
      const response = await axios.get(`/alerts?${params.toString()}`);
      setAlerts(response.data.alerts);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch geographical threat data
  const fetchGeoThreats = useCallback(async () => {
    try {
      const response = await axios.get('/threats/geographic');
      setGeoThreats(response.data);
    } catch (error) {
      console.error('Failed to fetch geo threats:', error);
    }
  }, []);

  // Real-time alert handler
  const handleNewAlert = useCallback((newAlert: Alert) => {
    setAlerts(prev => [newAlert, ...prev.slice(0, 49)]); // Keep last 50 alerts
    setRealTimeCount(prev => prev + 1);
    
    // Update geo threats if the alert has location data
    if (newAlert.latitude && newAlert.longitude) {
      fetchGeoThreats();
    }
  }, [fetchGeoThreats]);

  // Initialize data and real-time subscriptions
  useEffect(() => {
    fetchAlerts();
    fetchGeoThreats();
    
    subscribeToAlerts(handleNewAlert);
    
    return () => {
      unsubscribeFromAlerts(handleNewAlert);
    };
  }, [fetchAlerts, fetchGeoThreats, handleNewAlert, subscribeToAlerts, unsubscribeFromAlerts]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      severity: '',
      alertType: '',
      sourceIp: '',
      destinationIp: '',
      timeRange: '24',
      search: ''
    });
  };

  // Export alerts as CSV
  const exportAlerts = () => {
    const csvData = alerts.map(alert => ({
      ID: alert.id,
      Type: alert.alert_type,
      Severity: alert.severity,
      'Source IP': alert.source_ip,
      'Destination IP': alert.destination_ip,
      Description: alert.description,
      Status: alert.status,
      'Created At': format(new Date(alert.created_at), 'yyyy-MM-dd HH:mm:ss')
    }));
    
    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threat-alerts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'High': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'Medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'Low': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'Informational': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Threat Monitoring
            </h1>
            {realTimeCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm font-medium"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                +{realTimeCount} new alerts
              </motion.div>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time security event monitoring and threat intelligence
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportAlerts}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </motion.button>
        </div>
      </div>

      {/* Filters Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Filter className="w-5 h-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filters
            </span>
          </div>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Clear All
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Severity Filter */}
          <select
            value={filters.severity}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="Informational">Informational</option>
          </select>
          
          {/* Time Range Filter */}
          <select
            value={filters.timeRange}
            onChange={(e) => handleFilterChange('timeRange', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1">Last Hour</option>
            <option value="6">Last 6 Hours</option>
            <option value="24">Last 24 Hours</option>
            <option value="168">Last Week</option>
          </select>
          
          {/* Source IP Filter */}
          <input
            type="text"
            placeholder="Source IP"
            value={filters.sourceIp}
            onChange={(e) => handleFilterChange('sourceIp', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {/* Destination IP Filter */}
          <input
            type="text"
            placeholder="Destination IP"
            value={filters.destinationIp}
            onChange={(e) => handleFilterChange('destinationIp', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Event Stream */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Live Event Stream
                  </h3>
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm font-medium">Live</span>
                </div>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center">
                  <RefreshCw className="w-6 h-6 text-gray-400 mx-auto mb-2 animate-spin" />
                  <p className="text-gray-500 dark:text-gray-400">Loading alerts...</p>
                </div>
              ) : alerts.length === 0 ? (
                <div className="p-6 text-center">
                  <AlertTriangle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No alerts found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  <AnimatePresence>
                    {alerts.map((alert) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => setSelectedAlert(alert)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                                {alert.severity}
                              </span>
                              <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                                {alert.alert_type}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {alert.description}
                            </p>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                              <span>{alert.source_ip} → {alert.destination_ip}</span>
                              <span>{format(new Date(alert.created_at), 'HH:mm:ss')}</span>
                            </div>
                          </div>
                          <Eye className="w-4 h-4 text-gray-400 ml-2" />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Geographical Threat Map */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Globe2 className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Threat Geography
                </h3>
              </div>
            </div>
            
            <div className="h-96">
              <MapContainer
                center={[20, 0]}
                zoom={2}
                className="h-full w-full rounded-b-lg"
                style={{ background: '#1f2937' }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                {geoThreats.map((threat, index) => (
                  <Marker
                    key={index}
                    position={[threat.latitude, threat.longitude]}
                    icon={createThreatIcon(threat.max_severity, threat.alert_count)}
                  >
                    <Popup>
                      <div className="p-2">
                        <h4 className="font-semibold">{threat.city}, {threat.country_code}</h4>
                        <p className="text-sm">Alerts: {threat.alert_count}</p>
                        <p className="text-sm">Max Severity: {threat.max_severity}</p>
                        <p className="text-sm">Latest: {format(new Date(threat.latest_alert), 'HH:mm:ss')}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Alert Detail Modal */}
      <AnimatePresence>
        {selectedAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedAlert(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Alert Details
                </h3>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">ID</label>
                    <p className="text-gray-900 dark:text-white">{selectedAlert.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</label>
                    <p className="text-gray-900 dark:text-white">{selectedAlert.alert_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Severity</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(selectedAlert.severity)}`}>
                      {selectedAlert.severity}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                    <p className="text-gray-900 dark:text-white">{selectedAlert.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Source IP</label>
                    <p className="text-gray-900 dark:text-white font-mono">{selectedAlert.source_ip}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Destination IP</label>
                    <p className="text-gray-900 dark:text-white font-mono">{selectedAlert.destination_ip}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Protocol</label>
                    <p className="text-gray-900 dark:text-white">{selectedAlert.protocol || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                    <p className="text-gray-900 dark:text-white">
                      {format(new Date(selectedAlert.created_at), 'yyyy-MM-dd HH:mm:ss')}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                  <p className="text-gray-900 dark:text-white mt-1">{selectedAlert.description}</p>
                </div>
                
                {selectedAlert.city && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</label>
                    <p className="text-gray-900 dark:text-white">{selectedAlert.city}, {selectedAlert.country_code}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}