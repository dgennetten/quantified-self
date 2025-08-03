import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  verify2FA: (email: string, code: string) => Promise<void>;
  handleOAuthToken: (token: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already authenticated on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await axios.get('http://localhost:3001/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.valid) {
        setUser(response.data.user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      }
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Try real API first
      try {
        const response = await axios.post('http://localhost:3001/api/auth/login', {
          email,
          password,
        });
        if (response.data.requires2FA) {
          return;
        }
      } catch (apiError) {
        // Use mock API if real API fails
        if (typeof window !== 'undefined' && window.MockAPI) {
          const mockResponse = await window.MockAPI.login(email, password);
          if (mockResponse.requires2FA) {
            return;
          }
        } else {
          throw new Error('No API available');
        }
      }
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const verify2FA = async (email: string, code: string) => {
    try {
      console.log('AuthContext: Sending 2FA verification request...');
      
      // Try real API first
      try {
        const response = await axios.post('http://localhost:3001/api/auth/verify-2fa', {
          email,
          code,
        });

        console.log('AuthContext: 2FA verification response:', response.data);
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setUser(user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('AuthContext: 2FA verification successful, user set:', user);
      } catch (apiError) {
        // Use mock API if real API fails
        if (typeof window !== 'undefined' && window.MockAPI) {
          console.log('AuthContext: Using mock API for 2FA verification');
          const mockResponse = await window.MockAPI.verify2FA(email, code);
          console.log('AuthContext: Mock 2FA verification response:', mockResponse);
          
          if (mockResponse.success) {
            localStorage.setItem('token', mockResponse.token);
            setUser(mockResponse.user);
            axios.defaults.headers.common['Authorization'] = `Bearer ${mockResponse.token}`;
            console.log('AuthContext: Mock 2FA verification successful, user set:', mockResponse.user);
          } else {
            throw new Error('Mock 2FA verification failed');
          }
        } else {
          throw new Error('No API available');
        }
      }
    } catch (error: any) {
      console.error('AuthContext: 2FA verification error:', error);
      throw new Error(error.message || '2FA verification failed');
    }
  };

  const handleOAuthToken = async (token: string) => {
    try {
      // Verify the token with the server
      const response = await axios.get('http://localhost:3001/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.valid) {
        localStorage.setItem('token', token);
        setUser(response.data.user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('AuthContext: OAuth token verified successfully');
      } else {
        throw new Error('Invalid OAuth token');
      }
    } catch (error: any) {
      console.error('AuthContext: OAuth token verification error:', error);
      localStorage.removeItem('token');
      throw new Error('OAuth authentication failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    verify2FA,
    handleOAuthToken,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 