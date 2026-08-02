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

  // Persist user context updates to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  // Apply theme class dynamically to html element
  useEffect(() => {
    if (user && user.theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [user]);

  const translations = {
    en: {
      dashboard: "Dashboard",
      statementHub: "Statement Hub",
      investments: "Investments",
      insurance: "Insurance",
      aiAssistant: "AI Assistant",
      premiumHub: "Premium Hub",
      settings: "Settings",
      logout: "Logout",
      login: "Login",
      getStarted: "Get Started",
      hello: "Hello",
      goPremium: "Go Premium"
    },
    hi: {
      dashboard: "डैशबोर्ड",
      statementHub: "स्टेटमेंट हब",
      investments: "निवेश",
      insurance: "बीमा",
      aiAssistant: "एआई सहायक",
      premiumHub: "प्रीमियम हब",
      settings: "सेटिंग्स",
      logout: "लॉगआउट",
      login: "लॉगिन",
      getStarted: "शुरू करें",
      hello: "नमस्ते",
      goPremium: "प्रीमियम बनें"
    },
    es: {
      dashboard: "Tablero",
      statementHub: "Centro de Declaraciones",
      investments: "Inversiones",
      insurance: "Seguro",
      aiAssistant: "Asistente de IA",
      premiumHub: "Centro Premium",
      settings: "Ajustes",
      logout: "Cerrar sesión",
      login: "Iniciar sesión",
      getStarted: "Empezar",
      hello: "Hola",
      goPremium: "Hacerse Premium"
    },
    fr: {
      dashboard: "Tableau de bord",
      statementHub: "Centre de Déclarations",
      investments: "Investissements",
      insurance: "Assurance",
      aiAssistant: "Assistant IA",
      premiumHub: "Premium Hub",
      settings: "Paramètres",
      logout: "Se déconnecter",
      login: "Connexion",
      getStarted: "Commencer",
      hello: "Bonjour",
      goPremium: "Devenir Premium"
    }
  };

  const t = (key) => {
    const lang = user?.language || 'en';
    const langTranslations = translations[lang] || translations.en;
    return langTranslations[key] || translations.en[key] || key;
  };

  // Register User
  const register = async (name, email, password, age, monthlyIncome) => {
    setError(null);
    try {
      const payload = { name, email, password };
      if (age !== undefined && age !== null && age !== '') payload.age = age;
      if (monthlyIncome !== undefined && monthlyIncome !== null && monthlyIncome !== '') payload.monthlyIncome = monthlyIncome;

      const res = await axios.post('/auth/register', payload);

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

  // Update User Profile
  const updateProfile = async (age, monthlyIncome) => {
    setError(null);
    try {
      const res = await axios.put('/auth/profile', { age, monthlyIncome });
      const updatedUser = res.data.user;

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update profile';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Login with Google
  const loginWithGoogle = async (googleData) => {
    setError(null);
    try {
      const payload = typeof googleData === 'string' ? { token: googleData } : googleData;
      const res = await axios.post('/auth/google', payload);
      const { token: userToken, user: userData } = res.data;

      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));

      axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
      setToken(userToken);
      setUser(userData);
      return true;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Google Authentication failed';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Logout User
  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (err) {
      console.warn('Backend logout call failed:', err.message);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      setToken(null);
      setUser(null);
      setError(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        loading,
        error,
        register,
        login,
        loginWithGoogle,
        logout,
        togglePremium,
        updateProfile,
        setError,
        t,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
