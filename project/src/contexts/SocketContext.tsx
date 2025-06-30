/**
 * WebSocket Context for Real-time Data
 * 
 * Manages WebSocket connection for real-time dashboard updates.
 * Handles connection state, event subscriptions, and automatic reconnection.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribeToAlerts: (callback: (alert: any) => void) => void;
  unsubscribeFromAlerts: (callback: (alert: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize WebSocket connection
      const newSocket = io('http://localhost:3001', {
        transports: ['websocket'],
        upgrade: false
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('✅ WebSocket connected for real-time updates');
        setIsConnected(true);
        
        // Join role-specific room for targeted updates
        newSocket.emit('join-role', user.role);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ WebSocket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setIsConnected(false);
      });

      setSocket(newSocket);

      // Cleanup on unmount or authentication change
      return () => {
        newSocket.close();
      };
    } else {
      // Close connection if user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, user]);

  /**
   * Subscribe to real-time alert notifications
   */
  const subscribeToAlerts = (callback: (alert: any) => void) => {
    if (socket) {
      socket.on('new-alert', callback);
    }
  };

  /**
   * Unsubscribe from alert notifications
   */
  const unsubscribeFromAlerts = (callback: (alert: any) => void) => {
    if (socket) {
      socket.off('new-alert', callback);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    subscribeToAlerts,
    unsubscribeFromAlerts
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}