import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const loadUserFromStorage = useCallback(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
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

  const login = async (username, password) => {
    setError(null);
    try {
      const response = await axiosInstance.post('/token/', { username, password });
      const { access, refresh } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      // Fetch user profile
      const profileResponse = await axiosInstance.get('/users/me/', {
        headers: { Authorization: `Bearer ${access}` },
      });
      const userData = profileResponse.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
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
      const response = await axiosInstance.post('/users/register/', formData);
      return { success: true, data: response.data };
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Error al registrarse. Intenta de nuevo.';
      if (data) {
        const firstKey = Object.keys(data)[0];
        if (Array.isArray(data[firstKey])) {
          msg = data[firstKey][0];
        } else if (typeof data[firstKey] === 'string') {
          msg = data[firstKey];
        }
      }
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const isAdmin = user?.role === 'admin' || user?.is_staff === true;
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
