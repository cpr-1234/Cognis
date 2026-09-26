import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [researcher, setResearcher] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('cognis_researcher_token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Clear messages helper
  const clearMessages = () => {
    setError(null);
    setSuccessMsg(null);
  };

  // Load researcher profile on app mount if token exists
  const checkAuth = useCallback(async () => {
    const savedToken = localStorage.getItem('cognis_researcher_token');
    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.getMe();
      if (response.success && response.researcher) {
        setResearcher(response.researcher);
        setToken(savedToken);
      } else {
        logout();
      }
    } catch (err) {
      console.warn('Session verification failed:', err.message);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle successful authentication
  const handleAuthSuccess = (data, successMessage = null) => {
    if (data.token) {
      localStorage.setItem('cognis_researcher_token', data.token);
      setToken(data.token);
    }
    if (data.researcher) {
      setResearcher(data.researcher);
    }
    setError(null);
    if (successMessage) {
      setSuccessMsg(successMessage);
    }
  };

  // 1. Email/Password Login
  const login = async (email, password) => {
    clearMessages();
    setIsActionLoading(true);
    try {
      const response = await authApi.login(email, password);
      handleAuthSuccess(response, 'Welcome back, Researcher!');
      return { success: true, researcher: response.researcher };
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      return { success: false, error: err.message };
    } finally {
      setIsActionLoading(false);
    }
  };

  // 2. Researcher Registration
  const register = async (researcherData) => {
    clearMessages();
    setIsActionLoading(true);
    try {
      const response = await authApi.register(researcherData);
      handleAuthSuccess(response, 'Researcher account created successfully!');
      return { success: true, researcher: response.researcher };
    } catch (err) {
      setError(err.message || 'Registration failed. Please check the provided information.');
      return { success: false, error: err.message };
    } finally {
      setIsActionLoading(false);
    }
  };

  // 3. Google OAuth Login
  const loginWithGoogle = async (credential) => {
    clearMessages();
    setIsActionLoading(true);
    try {
      const response = await authApi.googleLogin(credential);
      handleAuthSuccess(response, 'Google authentication successful!');
      return { success: true, researcher: response.researcher };
    } catch (err) {
      setError(err.message || 'Google authentication failed.');
      return { success: false, error: err.message };
    } finally {
      setIsActionLoading(false);
    }
  };

  // 4. Logout
  const logout = () => {
    localStorage.removeItem('cognis_researcher_token');
    setToken(null);
    setResearcher(null);
    clearMessages();
  };

  // 5. Update Profile
  const updateProfile = async (updateData) => {
    clearMessages();
    setIsActionLoading(true);
    try {
      const response = await authApi.updateProfile(updateData);
      if (response.success && response.researcher) {
        setResearcher(response.researcher);
        setSuccessMsg('Researcher profile updated.');
        return { success: true };
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
      return { success: false, error: err.message };
    } finally {
      setIsActionLoading(false);
    }
  };

  const value = {
    researcher,
    token,
    isAuthenticated: !!token && !!researcher,
    isLoading,
    isActionLoading,
    error,
    successMsg,
    setError,
    setSuccessMsg,
    clearMessages,
    login,
    register,
    loginWithGoogle,
    logout,
    checkAuth,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
