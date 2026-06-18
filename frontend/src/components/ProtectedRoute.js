import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#030712',
        color: '#f8fafc',
        fontFamily: 'Outfit, sans-serif'
      }}>
        <div style={{
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          background: 'rgba(17, 24, 39, 0.7)',
          textAlign: 'center'
        }}>
          <h2>Loading FinPilot AI...</h2>
          <p style={{ color: '#94a3b8', marginTop: '8px' }}>Securing session...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
