/**
 * Authentication Context for SOC Dashboard
 * 
 * Provides authentication state management, user session handling,
 * and role-based access control throughout the application.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

// Types for authentication system
interface User {
  id: number;
  username: string;
  email: string;
  role: 'Administrator' | 'SOC Analyst' | 'SOC Manager';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Axios configuration for API requests
const API_BASE_URL = 'http://localhost:3001/api';
axios.defaults.baseURL = API_BASE_URL;

// Authentication provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on app load
  useEffect(() => {
    const token = Cookies.get('soc-auth-token');
    const userData = Cookies.get('soc-user-data');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Clear invalid cookies
        Cookies.remove('soc-auth-token');
        Cookies.remove('soc-user-data');
      }
    }
    
    setIsLoading(false);
  }, []);

  /**
   * User login function
   * Authenticates user credentials and stores session data
   */
  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post('/auth/login', {
        username,
        password
      });

      const { token, user: userData } = response.data;

      // Store authentication data in secure cookies
      Cookies.set('soc-auth-token', token, { 
        expires: 1, // 1 day
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      Cookies.set('soc-user-data', JSON.stringify(userData), {
        expires: 1,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      // Set authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(userData);
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.error || 'Login failed. Please check your credentials.';
      throw new Error(message);
    }
  };

  /**
   * User logout function
   * Clears session data and redirects to login
   */
  const logout = () => {
    // Clear cookies and session data
    Cookies.remove('soc-auth-token');
    Cookies.remove('soc-user-data');
    
    // Remove authorization header
    delete axios.defaults.headers.common['Authorization'];
    
    setUser(null);
  };

  /**
   * Role-based access control helper
   * Checks if current user has any of the specified roles
   */
  const hasRole = (roles: string[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use authentication context
 * Throws error if used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Higher-order component for role-based route protection
 */
export function withRoleAuth(Component: React.ComponentType, allowedRoles: string[]) {
  return function AuthenticatedComponent(props: any) {
    const { hasRole, isAuthenticated } = useAuth();
    
    if (!isAuthenticated) {
      return <div>Please log in to access this feature.</div>;
    }
    
    if (!hasRole(allowedRoles)) {
      return <div>Access denied. Insufficient permissions.</div>;
    }
    
    return <Component {...props} />;
  };
}