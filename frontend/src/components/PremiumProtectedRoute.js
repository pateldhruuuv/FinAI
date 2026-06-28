import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Lock, Zap, CheckCircle2 } from 'lucide-react';

const PremiumProtectedRoute = ({ children }) => {
  const { token, user, loading, togglePremium } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingBox}>
          <h2>Loading Premium Advisory...</h2>
          <p style={{ color: '#94a3b8', marginTop: '8px' }}>Verifying subscription status...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !user.isPremium) {
    return (
      <div style={styles.lockedContainer}>
        <div style={styles.lockedBox}>
          <div style={styles.iconGlowContainer}>
            <div style={styles.iconGlow}></div>
            <Lock size={44} color="#eab308" style={styles.lockIcon} />
          </div>
          
          <h1 style={styles.title}>Unlock Premium Advisory</h1>
          <p style={styles.description}>
            This premium AI-powered advisor tool is locked. Upgrade your plan to get institutional-grade financial guidance.
          </p>

          <div style={styles.featuresList}>
            <div style={styles.featureItem}>
              <CheckCircle2 size={16} color="#10b981" />
              <span><strong>Tax Optimization:</strong> Maximize 80C/80D HRA deductions</span>
            </div>
            <div style={styles.featureItem}>
              <CheckCircle2 size={16} color="#10b981" />
              <span><strong>Loan Advisor:</strong> Calculate safe multi-loan eligibility</span>
            </div>
            <div style={styles.featureItem}>
              <CheckCircle2 size={16} color="#10b981" />
              <span><strong>What-If Simulator:</strong> Project salary hikes or emergencies</span>
            </div>
            <div style={styles.featureItem}>
              <CheckCircle2 size={16} color="#10b981" />
              <span><strong>Digital Twin:</strong> Access financial age & risk personalities</span>
            </div>
            <div style={styles.featureItem}>
              <CheckCircle2 size={16} color="#10b981" />
              <span><strong>AI Financial Coach:</strong> Contextual real-time chat helper</span>
            </div>
          </div>

          <button onClick={() => togglePremium()} style={styles.upgradeBtn}>
            <Zap size={18} />
            Unlock Premium Advisory (Trial Mode)
          </button>
        </div>
      </div>
    );
  }

  return children;
};

const styles = {
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#030712',
    color: '#f8fafc',
    fontFamily: 'Outfit, sans-serif',
  },
  loadingBox: {
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    background: 'rgba(17, 24, 39, 0.7)',
    textAlign: 'center',
  },
  lockedContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 64px)',
    marginTop: '64px',
    backgroundColor: '#030712',
    color: '#f8fafc',
    fontFamily: 'Outfit, sans-serif',
    padding: '24px',
  },
  lockedBox: {
    maxWidth: '520px',
    width: '100%',
    padding: '40px',
    border: '1px solid rgba(234, 179, 8, 0.25)',
    borderRadius: '24px',
    background: 'rgba(17, 24, 39, 0.45)',
    backdropFilter: 'blur(24px)',
    textAlign: 'center',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(234, 179, 8, 0.03)',
  },
  iconGlowContainer: {
    position: 'relative',
    display: 'inline-block',
    marginBottom: '20px',
  },
  iconGlow: {
    position: 'absolute',
    width: '60px',
    height: '60px',
    background: 'rgba(234, 179, 8, 0.3)',
    borderRadius: '50%',
    filter: 'blur(15px)',
    left: '-8px',
    top: '-8px',
    zIndex: 0,
  },
  lockIcon: {
    position: 'relative',
    zIndex: 1,
  },
  title: {
    fontSize: '26px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    marginBottom: '12px',
    color: '#ffffff',
  },
  description: {
    color: '#94a3b8',
    fontSize: '14px',
    lineHeight: 1.6,
    marginBottom: '28px',
  },
  featuresList: {
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '32px',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: '#cbd5e1',
  },
  upgradeBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '14px 20px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
    color: '#000000',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(234, 179, 8, 0.3)',
  },
};

export default PremiumProtectedRoute;
