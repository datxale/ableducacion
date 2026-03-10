import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axios';

const AuthContext = createContext(null);
const IMPERSONATION_ORIGINAL_TOKEN_KEY = 'impersonation_original_access_token';
const IMPERSONATION_ORIGINAL_USER_KEY = 'impersonation_original_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isImpersonating, setIsImpersonating] = useState(false);

  const applySession = useCallback((accessToken, userData) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem(IMPERSONATION_ORIGINAL_TOKEN_KEY);
    localStorage.removeItem(IMPERSONATION_ORIGINAL_USER_KEY);
    setUser(null);
    setIsImpersonating(false);
  }, []);

  const loadUserFromStorage = useCallback(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    const originalToken = localStorage.getItem(IMPERSONATION_ORIGINAL_TOKEN_KEY);
    setIsImpersonating(!!originalToken);

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        logout();
      }
    }
    setLoading(false);
  }, [logout]);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  useEffect(() => {
    if (!user) return undefined;

    const sendHeartbeat = async () => {
      try {
        await axiosInstance.post('/auth/heartbeat');
      } catch (err) {
        // Ignore heartbeat errors; auth interceptor handles hard auth failures.
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data;
      localStorage.removeItem(IMPERSONATION_ORIGINAL_TOKEN_KEY);
      localStorage.removeItem(IMPERSONATION_ORIGINAL_USER_KEY);
      setIsImpersonating(false);
      applySession(access_token, userData);
      return { success: true, user: userData };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Credenciales incorrectas. Intenta de nuevo.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (formData) => {
    setError(null);
    try {
      const response = await axiosInstance.post('/auth/register', formData);
      return { success: true, data: response.data };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al registrarse. Intenta de nuevo.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const beginImpersonation = async (targetUserId) => {
    setError(null);
    try {
      const originalTokenExists = localStorage.getItem(IMPERSONATION_ORIGINAL_TOKEN_KEY);
      if (!originalTokenExists) {
        const currentToken = localStorage.getItem('access_token');
        const currentUser = localStorage.getItem('user');
        if (currentToken && currentUser) {
          localStorage.setItem(IMPERSONATION_ORIGINAL_TOKEN_KEY, currentToken);
          localStorage.setItem(IMPERSONATION_ORIGINAL_USER_KEY, currentUser);
        }
      }

      const response = await axiosInstance.post(`/auth/impersonate/${targetUserId}`);
      const { access_token, user: userData } = response.data;
      applySession(access_token, userData);
      setIsImpersonating(true);
      return { success: true, user: userData };
    } catch (err) {
      const msg = err.response?.data?.detail || 'No se pudo iniciar impersonaci\u00f3n.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const stopImpersonation = useCallback(() => {
    const originalToken = localStorage.getItem(IMPERSONATION_ORIGINAL_TOKEN_KEY);
    const originalUserRaw = localStorage.getItem(IMPERSONATION_ORIGINAL_USER_KEY);

    if (!originalToken || !originalUserRaw) {
      return { success: false, error: 'No hay impersonaci\u00f3n activa.' };
    }

    try {
      const originalUser = JSON.parse(originalUserRaw);
      localStorage.setItem('access_token', originalToken);
      localStorage.setItem('user', JSON.stringify(originalUser));
      localStorage.removeItem(IMPERSONATION_ORIGINAL_TOKEN_KEY);
      localStorage.removeItem(IMPERSONATION_ORIGINAL_USER_KEY);
      setUser(originalUser);
      setIsImpersonating(false);
      setError(null);
      return { success: true, user: originalUser };
    } catch (e) {
      logout();
      return { success: false, error: 'No se pudo restaurar la sesi\u00f3n original.' };
    }
  }, [logout]);

  const isAdmin = user?.role === 'admin';
  const isDocente = user?.role === 'docente';
  const isEstudiante = user?.role === 'estudiante';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        register,
        updateUser,
        beginImpersonation,
        stopImpersonation,
        isImpersonating,
        isAdmin,
        isDocente,
        isEstudiante,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
