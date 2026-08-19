import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  useEffect(() => {
    // Check for existing token on mount
    const checkAuth = async () => {
      const token = localStorage.getItem('admin_token');
      const userStr = localStorage.getItem('admin_user');
      
      if (token && userStr) {
        try {
          // You could optionally verify the token with the backend here
          // For now, we trust the stored session
          setCurrentUser(JSON.parse(userStr));
        } catch (error) {
          console.error("Session verification failed", error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function calls the FastAPI backend
  const login = async (email, password) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Invalid email or password');
      }

      const data = await response.json();
      
      // Assuming backend returns { access_token: "...", user: { email: "...", role: "admin" } }
      localStorage.setItem('admin_token', data.access_token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    logout,
    BACKEND_URL // Exporting this can be helpful for other components to make API calls
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
