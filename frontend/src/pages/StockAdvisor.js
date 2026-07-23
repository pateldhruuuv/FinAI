import React, { useState } from 'react';
import axios from 'axios';
import { TrendingUp, ArrowLeft, AlertTriangle, Sparkles, CheckCircle2, DollarSign, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const StockAdvisor = () => {
  const [riskProfile, setRiskProfile] = useState('Moderate');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentHorizon, setInvestmentHorizon] = useState('medium_term');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        riskProfile,
        investmentAmount: investmentAmount ? parseFloat(investmentAmount) : null,
        investmentHorizon: investmentHorizon || null,
      };

      const res = await axios.post('/recommend-stocks', payload);
      setResult(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to get stock recommendations. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <Link to="/premium-dashboard" style={styles.backLink}>
        <ArrowLeft size={16} />
        Back to Premium Hub
      </Link>

      <div style={styles.header}>
        <div style={styles.iconContainer}>
          <TrendingUp size={32} color="#10b981" />
        </div>
        <div>
          <h1 style={styles.title}>Premium Stock Advisor</h1>
          <p style={styles.subtitle}>
            Deterministic Indian stock recommendations scored by technicals, news sentiment, and risk profile.
          </p>
        </div>
      </div>

      <div style={styles.container}>
        {/* Form panel */}
        <div style={styles.formCard}>
          <h2 style={styles.sectionTitle}>Preferences</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Risk Profile</label>
              <select
                value={riskProfile}
                onChange={(e) => setRiskProfile(e.target.value)}
                style={styles.select}
              >
                <option value="Conservative">Conservative (Low volatility, stable large caps)</option>
                <option value="Moderate">Moderate (Balanced exposure, growth large caps)</option>
                <option value="Aggressive">Aggressive (High growth, mid/small caps potential)</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Investment Amount (INR, Optional)</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>₹</span>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  style={styles.inputWithIcon}
                  min="0"
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Investment Horizon (Optional)</label>
              <select
                value={investmentHorizon}
                onChange={(e) => setInvestmentHorizon(e.target.value)}
                style={styles.select}
              >
                <option value="short_term">Short Term (&lt; 1 year)</option>
                <option value="medium_term">Medium Term (1-3 years)</option>
                <option value="long_term">Long Term (3+ years)</option>
              </select>
            </div>

            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'Analyzing Stocks & Sentiment...' : 'Generate Recommendations'}
            </button>
          </form>
        </div>

        {/* Results panel */}
        <div style={styles.resultsCard}>
          {loading && (
            <div style={styles.loadingBox}>
              <div style={styles.spinner}></div>
              <h3>Analyzing Indian Stock Market Universe...</h3>
              <p style={{ color: '#94a3b8', marginTop: '8px', fontSize: '14px' }}>
                Calculating technical indicators (EMA200, SMA50, RSI) and scoring news headlines via Gemini...
              </p>
            </div>
          )}

          {error && (
            <div style={styles.errorBox}>
              <AlertTriangle size={24} color="#ef4444" />
              <div>
                <h4>Recommendation Error</h4>
                <p style={{ color: '#fca5a5', marginTop: '4px', fontSize: '14px' }}>{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && !result && (
            <div style={styles.emptyBox}>
              <Sparkles size={40} color="#6366f1" />
              <h3>Institutional Equity Screener</h3>
              <p style={{ color: '#94a3b8', marginTop: '12px', fontSize: '14px', maxWidth: '400px' }}>
                Select your risk appetite and generate quantitative stock picks explained by LLM sentiment diagnostics.
              </p>
            </div>
          )}

          {!loading && !error && result && (
            <div>
              <div style={styles.resultsHeader}>
                <h2 style={styles.sectionTitle}>Top Picks for {riskProfile} Profile</h2>
                <span style={styles.dateLabel}>
                  Generated: {new Date(result.generated_at).toLocaleString()}
                </span>
              </div>

              <div style={styles.stocksList}>
                {result.recommendations?.map((stock, idx) => (
                  <div key={stock.symbol} style={styles.stockCard}>
                    <div style={styles.stockHeader}>
                      <div>
                        <div style={styles.stockSymbolRow}>
                          <span style={styles.stockNumber}>#{idx + 1}</span>
                          <span style={styles.stockSymbol}>{stock.symbol}</span>
                        </div>
                        <div style={styles.stockPriceRow}>
                          <span style={styles.stockPrice}>₹{stock.price ? stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : 'N/A'}</span>
                          {stock.price_change_percent !== undefined && (
                            <span style={stock.price_change_percent >= 0 ? styles.positiveChange : styles.negativeChange}>
                              {stock.price_change_percent >= 0 ? '+' : ''}
                              {stock.price_change_percent.toFixed(2)}%
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={styles.stockBadges}>
                        <div style={styles.scoreBadge}>
                          <span style={styles.scoreLabel}>Score</span>
                          <span style={styles.scoreVal}>{stock.score}</span>
                        </div>
                        <span style={
                          stock.sentiment === 'Positive' ? styles.sentimentPositive :
                          stock.sentiment === 'Negative' ? styles.sentimentNegative :
                          styles.sentimentNeutral
                        }>
                          {stock.sentiment} Sentiment
                        </span>
                      </div>
                    </div>

                    <p style={styles.stockSummary}>{stock.summary}</p>

                    <div style={styles.prosRisksGrid}>
                      <div style={styles.prosColumn}>
                        <h4 style={styles.columnTitle}>Pros / Highlights</h4>
                        <ul style={styles.list}>
                          {stock.pros?.map((pro, i) => (
                            <li key={i} style={styles.proItem}>
                              <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0 }} />
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div style={styles.risksColumn}>
                        <h4 style={styles.columnTitle}>Risks / Watchpoints</h4>
                        <ul style={styles.list}>
                          {stock.risks?.map((risk, i) => (
                            <li key={i} style={styles.riskItem}>
                              <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    padding: '80px 24px 40px 24px',
    backgroundColor: '#030712',
    minHeight: '100vh',
    color: '#f8fafc',
    fontFamily: 'Inter, sans-serif',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '14px',
    marginBottom: '24px',
    transition: 'color 0.2s',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '32px',
  },
  iconContainer: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    fontFamily: 'Outfit, sans-serif',
    color: '#f8fafc',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '15px',
    marginTop: '4px',
  },
  container: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '32px',
    alignItems: 'start',
  },
  formCard: {
    background: 'rgba(17, 24, 39, 0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '24px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    fontFamily: 'Outfit, sans-serif',
    color: '#f8fafc',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#94a3b8',
  },
  select: {
    width: '100%',
    padding: '12px',
    background: '#111827',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: '#94a3b8',
    fontSize: '16px',
  },
  inputWithIcon: {
    width: '100%',
    padding: '12px 12px 12px 28px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
  },
  submitBtn: {
    padding: '14px',
    background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'filter 0.2s',
  },
  resultsCard: {
    background: 'rgba(17, 24, 39, 0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '28px',
    minHeight: '400px',
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '60px 20px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(16, 185, 129, 0.1)',
    borderTop: '3px solid #10b981',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  errorBox: {
    display: 'flex',
    gap: '16px',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    borderRadius: '12px',
    padding: '20px',
  },
  emptyBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '80px 20px',
  },
  resultsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    paddingBottom: '16px',
    marginBottom: '24px',
  },
  dateLabel: {
    color: '#64748b',
    fontSize: '13px',
  },
  stocksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  stockCard: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '12px',
    padding: '24px',
  },
  stockHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  stockSymbolRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  stockNumber: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: '18px',
  },
  stockSymbol: {
    fontWeight: '700',
    fontSize: '20px',
    fontFamily: 'Outfit, sans-serif',
  },
  stockPriceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '4px',
  },
  stockPrice: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#f8fafc',
  },
  positiveChange: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: '14px',
  },
  negativeChange: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: '14px',
  },
  stockBadges: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px',
  },
  scoreBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '6px',
    padding: '4px 10px',
    gap: '6px',
  },
  scoreLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  scoreVal: {
    fontWeight: '700',
    color: '#a855f7',
    fontSize: '14px',
  },
  sentimentPositive: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    color: '#a7f3d0',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
  },
  sentimentNegative: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#fca5a5',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
  },
  sentimentNeutral: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#cbd5e1',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
  },
  stockSummary: {
    color: '#cbd5e1',
    fontSize: '15px',
    lineHeight: '1.6',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    paddingBottom: '16px',
    marginBottom: '16px',
  },
  prosRisksGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  columnTitle: {
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: 'Outfit, sans-serif',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: '12px',
  },
  list: {
    listStyleType: 'none',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  proItem: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
    fontSize: '14px',
    color: '#a7f3d0',
  },
  riskItem: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
    fontSize: '14px',
    color: '#fde047',
  },
};

export default StockAdvisor;
