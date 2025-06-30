/**
 * Dashboard Sidebar Navigation
 * 
 * Provides main navigation for all dashboard sections with role-based access control.
 * Features collapsible design and active state management.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Shield, AlertTriangle, FileText, 
  Server, Settings, Users, BookOpen, BarChart3,
  ChevronLeft, ChevronRight, Target
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavigationItem {
  id: string;
  name: string;
  icon: React.ElementType;
  path: string;
  roles?: string[];
  badge?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'overview',
    name: 'Security Overview',
    icon: LayoutDashboard,
    path: '/dashboard/overview'
  },
  {
    id: 'monitoring',
    name: 'Threat Monitoring',
    icon: Shield,
    path: '/dashboard/monitoring',
    badge: 'LIVE'
  },
  {
    id: 'incidents',
    name: 'Incident Response',
    icon: AlertTriangle,
    path: '/dashboard/incidents'
  },
  {
    id: 'analytics',
    name: 'Security Analytics',
    icon: BarChart3,
    path: '/dashboard/analytics'
  },
  {
    id: 'assets',
    name: 'Asset Management',
    icon: Server,
    path: '/dashboard/assets'
  },
  {
    id: 'playbooks',
    name: 'Response Playbooks',
    icon: BookOpen,
    path: '/dashboard/playbooks'
  },
  {
    id: 'compliance',
    name: 'Compliance',
    icon: FileText,
    path: '/dashboard/compliance'
  },
  {
    id: 'threat-intel',
    name: 'Threat Intelligence',
    icon: Target,
    path: '/dashboard/threat-intel'
  },
  {
    id: 'users',
    name: 'User Management',
    icon: Users,
    path: '/dashboard/users',
    roles: ['Administrator']
  },
  {
    id: 'settings',
    name: 'System Settings',
    icon: Settings,
    path: '/dashboard/settings',
    roles: ['Administrator', 'SOC Manager']
  }
];

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { hasRole } = useAuth();

  // Filter navigation items based on user role
  const filteredItems = navigationItems.filter(item => 
    !item.roles || hasRole(item.roles)
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full"
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            Navigation
          </motion.h2>
        )}
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </motion.button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02, x: isCollapsed ? 0 : 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSectionChange(item.id)}
              className={`
                relative w-full flex items-center px-3 py-3 rounded-lg text-left transition-all duration-200
                ${isActive 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }
              `}
            >
              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"
                />
              )}
              
              {/* Icon */}
              <Icon className={`
                w-5 h-5 flex-shrink-0
                ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}
                ${isCollapsed ? 'mx-auto' : 'mr-3'}
              `} />
              
              {/* Label and Badge */}
              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {item.name}
                  </span>
                  
                  {item.badge && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                    >
                      {item.badge}
                    </motion.span>
                  )}
                </div>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-900 dark:text-white mb-1">
              System Status
            </div>
            <div className="flex items-center text-xs text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              All systems operational
            </div>
          </div>
        </motion.div>
      )}
    </motion.aside>
  );
}