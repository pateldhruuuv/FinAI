import React, { useState } from 'react';
import axios from 'axios';
import { PieChart, ArrowLeft, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const PortfolioRisk = () => {
  const [formData, setFormData] = useState({
    stocks: '',
    mutualFunds: '',
    gold: '',
    fd: '',
    crypto: '',
    property: '',
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        stocks: parseFloat(formData.stocks || 0),
        mutualFunds: parseFloat(formData.mutualFunds || 0),
        gold: parseFloat(formData.gold || 0),
        fd: parseFloat(formData.fd || 0),
        crypto: parseFloat(formData.crypto || 0),
        property: parseFloat(formData.property || 0),
      };

      const res = await axios.post('/portfolio-risk', payload);
      setResult(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to analyze portfolio risk');
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score < 35) return '#10b981';
    if (score < 65) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <Link to="/premium-dashboard" style={styles.backLink}>
          <ArrowLeft size={16} />
          Back to Hub
        </Link>
        <div style={styles.titleRow}>
          <PieChart size={28} color="#f97316" />
          <h1 style={styles.title}>Portfolio Risk Analyzer</h1>
        </div>
        <p style={styles.subtitle}>Analyze portfolio risk weights, diversification status, and calculate optimal asset rebalancing guidelines.</p>
      </header>

      <div style={styles.container}>
        {/* Form Panel */}
        <form onSubmit={handleSubmit} style={styles.formCard}>
          <h3 style={styles.sectionTitle}>Asset Holdings (₹)</h3>
          
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Direct Stocks</label>
              <input type="number" name="stocks" value={formData.stocks} onChange={handleChange} placeholder="e.g. 150000" style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Equity / Debt Mutual Funds</label>
              <input type="number" name="mutualFunds" value={formData.mutualFunds} onChange={handleChange} placeholder="e.g. 200000" style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Gold (Physical/ETF/SGB)</label>
              <input type="number" name="gold" value={formData.gold} onChange={handleChange} placeholder="e.g. 50000" style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Fixed Deposits (FD/RD)</label>
              <input type="number" name="fd" value={formData.fd} onChange={handleChange} placeholder="e.g. 100000" style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Cryptocurrencies</label>
              <input type="number" name="crypto" value={formData.crypto} onChange={handleChange} placeholder="e.g. 20000" style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Real Estate Property</label>
              <input type="number" name="property" value={formData.property} onChange={handleChange} placeholder="e.g. 1500000" style={styles.input} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Recalculating Portfolios...' : 'Analyze Portfolio Risk'}
          </button>
        </form>

        {/* Results Panel */}
        <div style={styles.resultContainer}>
          {error && <div style={styles.errorBox}>{error}</div>}
          
          {result ? (
            <div style={styles.resultCard}>
              <div style={styles.resultHeader}>
                <PieChart size={20} color="#f97316" />
                <h3 style={styles.resultTitle}>Risk Analysis</h3>
                <span style={{ 
                  ...styles.divBadge, 
                  color: getRiskColor(result.riskScore),
                  borderColor: getRiskColor(result.riskScore),
                  background: `${getRiskColor(result.riskScore)}15`
                }}>
                  {result.diversification} Diversification
                </span>
              </div>

              <div style={styles.riskMeter}>
                <div style={styles.meterText}>
                  <span>Risk Score:</span>
                  <strong style={{ color: getRiskColor(result.riskScore) }}>{result.riskScore} / 100</strong>
                </div>
                <div style={styles.meterBg}>
                  <div style={{ 
                    ...styles.meterFill, 
                    width: `${result.riskScore}%`,
                    background: getRiskColor(result.riskScore)
                  }}></div>
                </div>
              </div>

              {result.portfolioChart && (
                <div style={styles.chartWrapper}>
                  <img src={`data:image/png;base64,${result.portfolioChart}`} alt="Portfolio Pie Chart" style={styles.chartImg} />
                </div>
              )}

              <div style={styles.rebalancingSection}>
                <h4 style={styles.rebalHeading}>Recommended Safe Allocations (₹)</h4>
                
                <div style={styles.rebalGrid}>
                  <div style={styles.rebalItem}>
                    <span>Cash & FDs:</span>
                    <strong>₹{result.safeAllocation.cashFd.toLocaleString()}</strong>
                  </div>
                  <div style={styles.rebalItem}>
                    <span>Bonds & Debt Funds:</span>
                    <strong>₹{result.safeAllocation.bondsDebt.toLocaleString()}</strong>
                  </div>
                  <div style={styles.rebalItem}>
                    <span>Equity & Mutual Funds:</span>
                    <strong>₹{result.safeAllocation.equity.toLocaleString()}</strong>
                  </div>
                  <div style={styles.rebalItem}>
                    <span>Gold Hedge:</span>
                    <strong>₹{result.safeAllocation.gold.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div style={styles.advisoryBox}>
                <h4 style={styles.adviceHeading}>AI Portfolio Adjustments</h4>
                <div style={styles.advicesList}>
                  {result.recommendations.map((rec, i) => (
                    <div key={i} style={styles.adviceItem}>
                      <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
                      <span>{rec}</span>
                    </div>
                  ))}
                  {result.highRiskAssets.map((hra, i) => (
                    <div key={i} style={styles.warnItem}>
                      <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                      <span>{hra}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <PieChart size={44} color="rgba(255, 255, 255, 0.1)" />
              <h3>Awaiting Asset Inventory</h3>
              <p>Input your active allocations to calculate your risk index and view portfolio pie charts.</p>
            </div>
          )}
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
    gridTemplateColumns: '1fr 1.2fr',
    gap: '32px',
    alignItems: 'start',
  },
  formCard: {
    background: 'rgba(17, 24, 39, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '20px',
    color: '#ffffff',
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#94a3b8',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '10px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '14px',
    fontFamily: 'Outfit, sans-serif',
    outline: 'none',
  },
  submitBtn: {
    marginTop: '24px',
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)',
  },
  resultContainer: {
    minHeight: '400px',
  },
  errorBox: {
    padding: '16px',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  resultCard: {
    background: 'rgba(17, 24, 39, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  resultTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#ffffff',
  },
  divBadge: {
    marginLeft: 'auto',
    fontSize: '11px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '20px',
    border: '1px solid',
  },
  riskMeter: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '24px',
  },
  meterText: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#cbd5e1',
  },
  meterBg: {
    height: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: '4px',
  },
  chartWrapper: {
    width: '100%',
    height: '260px',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#1f2937',
    marginBottom: '24px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  chartImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  rebalancingSection: {
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px',
  },
  rebalHeading: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#ffffff',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '8px',
    marginBottom: '10px',
  },
  rebalGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  rebalItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '12px',
    color: '#94a3b8',
  },
  advisoryBox: {
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '20px',
  },
  adviceHeading: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '12px',
  },
  advicesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  adviceItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    fontSize: '13px',
    color: '#cbd5e1',
    lineHeight: 1.5,
  },
  warnItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    fontSize: '13px',
    color: '#fca5a5',
    lineHeight: 1.5,
  },
  emptyState: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    padding: '60px 40px',
    border: '2px dashed rgba(255, 255, 255, 0.06)',
    borderRadius: '20px',
  },
};

export default PortfolioRisk;
