import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProfileDataModal from './ProfileDataModal';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-on-background font-serif">
        <div className="p-8 border border-outline-variant rounded-2xl glass-card text-center max-w-xs w-full shadow-2xl animate-pulse">
          {/* Subtle logo spinner */}
          <div className="w-12 h-12 bg-primary-container/20 border-2 border-primary rounded-xl flex items-center justify-center text-primary mx-auto mb-6 animate-spin">
            <span className="material-symbols-outlined text-2xl font-bold">account_balance</span>
          </div>
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">Securing Cockpit</h2>
          <p className="font-label-sm text-label-sm text-on-surface-variant font-sans">Connecting to your financial twin...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <ProfileDataModal />
      {children}
    </>
  );
};

export default ProtectedRoute;
