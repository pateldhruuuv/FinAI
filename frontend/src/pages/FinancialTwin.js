import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserCheck, ArrowLeft, Award, Shield, Key, Landmark, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const FinancialTwin = () => {
  const [twin, setTwin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTwin = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/premium-dashboard');
      setTwin(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch Digital Twin profile data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTwin();
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <h2>Materializing Digital Twin...</h2>
        <p style={{ color: '#94a3b8', marginTop: '6px' }}>Fitting personality profiles and outstanding liabilities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h3>Twin Sync Error</h3>
        <p style={{ color: '#fca5a5', marginTop: '8px' }}>{error}</p>
        <button onClick={fetchTwin} style={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  const { digitalTwin, portfolioAllocation, netWorth, loanEligibility } = twin;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <Link to="/premium-dashboard" style={styles.backLink}>
          <ArrowLeft size={16} />
          Back to Hub
        </Link>
        <div style={styles.titleRow}>
          <UserCheck size={28} color="#06b6d4" />
          <h1 style={styles.title}>Financial Digital Twin</h1>
        </div>
        <p style={styles.subtitle}>Explore your contextual profile mapping: your stability score, financial age, and money personality traits.</p>
      </header>

      <div style={styles.container}>
        {/* Profile Card */}
        <div style={styles.twinCard}>
          <div style={styles.twinHeader}>
            <div style={styles.glowBg}></div>
            <Award size={36} color="#06b6d4" style={styles.avatarIcon} />
            <h2 style={styles.twinTitle}>{twin.digitalTwin?.savingsPersonality || 'Balanced Saver'}</h2>
            <span style={styles.stabilityVal}>Stability Score: {digitalTwin?.stabilityScore || 75}/100</span>
          </div>

          <div style={styles.traitGrid}>
            <div style={styles.traitBox}>
              <span style={styles.traitLabel}>Financial Age</span>
              <strong style={styles.traitValText}>{digitalTwin?.financialAge || 28} Years</strong>
              <span style={styles.traitSub}>Based on asset/debt ratios</span>
            </div>

            <div style={styles.traitBox}>
              <span style={styles.traitLabel}>Risk tolerance</span>
              <strong style={{ ...styles.traitValText, color: '#eab308' }}>{digitalTwin?.riskLevel || 'Moderate'}</strong>
              <span style={styles.traitSub}>Portfolio volatility index</span>
            </div>

            <div style={styles.traitBox}>
              <span style={styles.traitLabel}>Savings trait</span>
              <strong style={styles.traitValTextDetail}>{digitalTwin?.savingsPersonality || 'Balanced'}</strong>
              <span style={styles.traitSub}>Income vs saving speed</span>
            </div>

            <div style={styles.traitBox}>
              <span style={styles.traitLabel}>Investment Trait</span>
              <strong style={styles.traitValTextDetail}>{digitalTwin?.investmentPersonality || 'Rebalancer'}</strong>
              <span style={styles.traitSub}>Asset distribution profile</span>
            </div>
          </div>
        </div>

        {/* Ledger breakdown card */}
        <div style={styles.ledgerCard}>
          <h3 style={styles.ledgerTitle}>Digital Twin Balance Sheet</h3>

          <div style={styles.ledgerList}>
            {/* Assets */}
            <div style={styles.ledgerSection}>
              <h4 style={{ ...styles.ledgerSecHeader, color: '#10b981' }}>Identified Assets</h4>
              <div style={styles.ledgerItem}>
                <span>Stock Equities:</span>
                <strong>₹{portfolioAllocation?.stocks?.toLocaleString() || '0'}</strong>
              </div>
              <div style={styles.ledgerItem}>
                <span>Mutual Funds:</span>
                <strong>₹{portfolioAllocation?.mutualFunds?.toLocaleString() || '0'}</strong>
              </div>
              <div style={styles.ledgerItem}>
                <span>Fixed Deposits:</span>
                <strong>₹{portfolioAllocation?.fd?.toLocaleString() || '0'}</strong>
              </div>
              <div style={styles.ledgerItem}>
                <span>Gold Hedge:</span>
                <strong>₹{portfolioAllocation?.gold?.toLocaleString() || '0'}</strong>
              </div>
              <div style={styles.ledgerItem}>
                <span>Property:</span>
                <strong>₹{portfolioAllocation?.property?.toLocaleString() || '0'}</strong>
              </div>
            </div>

            {/* Liabilities */}
            <div style={styles.ledgerSection}>
              <h4 style={{ ...styles.ledgerSecHeader, color: '#ef4444' }}>Identified Liabilities</h4>
              <div style={styles.ledgerItem}>
                <span>Monthly EMIs / Outstandings:</span>
                <strong>₹{twin.loanEligibility ? (twin.loanEligibility.maxEmi * 0.1).toLocaleString() : '₹12,000'}</strong>
              </div>
              <div style={styles.ledgerItem}>
                <span>Estimated Outstanding Loans:</span>
                <strong>₹{loanEligibility ? (loanEligibility.maxEmi * 15).toLocaleString() : '₹1,50,000'}</strong>
              </div>
            </div>
          </div>

          <div style={styles.netWorthSummary}>
            <span>Net Worth Status:</span>
            <strong>₹{netWorth ? netWorth.toLocaleString() : '---'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    marginTop: '64px',
    backgroundColor: '#030712',
    color: '#f8fafc',
    fontFamily: 'Outfit, sans-serif',
    padding: '40px 24px',
  },
  header: {
    maxWidth: '1200px',
    margin: '0 auto 32px auto',
  },
  backLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '16px',
    width: 'fit-content',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#ffffff',
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: '14px',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '32px',
    alignItems: 'start',
  },
  twinCard: {
    background: 'rgba(17, 24, 39, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    padding: '40px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.25)',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  twinHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '32px',
  },
  glowBg: {
    position: 'absolute',
    width: '120px',
    height: '120px',
    background: 'rgba(6, 182, 212, 0.15)',
    borderRadius: '50%',
    filter: 'blur(30px)',
    top: '20px',
    zIndex: 0,
  },
  avatarIcon: {
    position: 'relative',
    zIndex: 1,
    marginBottom: '16px',
  },
  twinTitle: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#ffffff',
    marginBottom: '6px',
  },
  stabilityVal: {
    fontSize: '12px',
    color: '#06b6d4',
    background: 'rgba(6, 182, 212, 0.12)',
    padding: '4px 12px',
    borderRadius: '20px',
    fontWeight: 700,
    border: '1px solid rgba(6, 182, 212, 0.25)',
  },
  traitGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  traitBox: {
    background: 'rgba(255, 255, 255, 0.015)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  traitLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  traitValText: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#ffffff',
  },
  traitValTextDetail: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#cbd5e1',
    textAlign: 'center',
  },
  traitSub: {
    fontSize: '10px',
    color: '#64748b',
  },
  ledgerCard: {
    background: 'rgba(17, 24, 39, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    padding: '32px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
  },
  ledgerTitle: {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '20px',
    color: '#ffffff',
  },
  ledgerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginBottom: '24px',
  },
  ledgerSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  ledgerSecHeader: {
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '4px',
  },
  ledgerItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#cbd5e1',
    paddingBottom: '6px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
  },
  netWorthSummary: {
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '15px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#030712',
    color: '#f8fafc',
    fontFamily: 'Outfit, sans-serif',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#030712',
    color: '#fca5a5',
    fontFamily: 'Outfit, sans-serif',
    padding: '24px',
  },
  retryBtn: {
    marginTop: '16px',
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};

export default FinancialTwin;
