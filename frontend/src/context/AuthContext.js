import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

// Set default URL for Axios
axios.defaults.baseURL = 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load token and user from localStorage on startup
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Attach token to axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  // Register User
  const register = async (name, email, password, age, monthlyIncome) => {
    setError(null);
    try {
      const res = await axios.post('/auth/register', {
        name,
        email,
        password,
        age,
        monthlyIncome,
      });

      const { token: userToken, user: userData } = res.data;

      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));

      axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
      setToken(userToken);
      setUser(userData);
      return true;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Login User
  const login = async (email, password) => {
    setError(null);
    try {
      const res = await axios.post('/auth/login', { email, password });
      const { token: userToken, user: userData } = res.data;

      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));

      axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
      setToken(userToken);
      setUser(userData);
      return true;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid credentials';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Toggle Premium Status
  const togglePremium = async () => {
    setError(null);
    try {
      const res = await axios.post('/auth/toggle-premium');
      const updatedUser = res.data.user;

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser.isPremium;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to toggle premium';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Logout User
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        register,
        login,
        logout,
        togglePremium,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
