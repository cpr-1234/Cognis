import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [researcher, setResearcher] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('cognis_researcher_token') || null);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const clearMessages = () => {
    setError(null);
    setSuccessMsg(null);
  };

  // Helper to format user object so both friend's code (user.first_name) and our code (researcher.name) work
  const formatUser = (data) => {
    if (!data) return null;
    return {
      ...data,
      id: data._id || data.id,
      first_name: data.first_name || data.name,
      name: data.name || data.first_name,
      role: data.role || 'researcher',
    };
  };

  // Load researcher session on mount if token exists
  const checkAuth = useCallback(async () => {
    const savedToken = localStorage.getItem('cognis_researcher_token');
    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.getMe();
      if (response.success && response.researcher) {
        const formatted = formatUser(response.researcher);
        setResearcher(formatted);
        setToken(savedToken);
      } else {
        logout();
      }
    } catch (err) {
      console.warn('Session verification failed:', err.message);
      logout();
    } finally {
      setLoading(false);
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
      const formatted = formatUser(data.researcher);
      setResearcher(formatted);
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
      return { success: true, researcher: formatUser(response.researcher) };
    } catch (err) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      return { success: false, error: msg };
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
      return { success: true, researcher: formatUser(response.researcher) };
    } catch (err) {
      const msg = err.message || 'Registration failed. Please check the provided information.';
      setError(msg);
      return { success: false, error: msg };
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
      return { success: true, researcher: formatUser(response.researcher) };
    } catch (err) {
      const msg = err.message || 'Google authentication failed.';
      setError(msg);
      return { success: false, error: msg };
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
        const formatted = formatUser(response.researcher);
        setResearcher(formatted);
        setSuccessMsg('Researcher profile updated.');
        return { success: true };
      }
    } catch (err) {
      const msg = err.message || 'Failed to update profile.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsActionLoading(false);
    }
  };

  const value = {
    user: researcher, // Friendly alias for friend's components
    researcher,
    token,
    isAuthenticated: !!token && !!researcher,
    loading, // Friendly alias for friend's components
    isLoading: loading,
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
