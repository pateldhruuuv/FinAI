import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Compass, Sparkles, TrendingUp, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

const InvestmentAdvisor = () => {
  const { user } = useContext(AuthContext);
  const [riskProfile, setRiskProfile] = useState('Moderate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rec, setRec] = useState(null);
  const [userFinancials, setUserFinancials] = useState({ age: 25, income: 50000, savings: 0 });

  // Fetch user details and latest transaction balance from dashboard endpoint on load
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const res = await axios.get('/dashboard');
        if (res.data?.status === 'success') {
          const stats = res.data.data;
          setUserFinancials({
            age: user?.age || 25,
            income: stats.monthlyIncomeBase || user?.monthlyIncome || 50000,
            savings: stats.totalSavings || 0
          });
        }
      } catch (err) {
        console.error('Failed to pre-populate financials', err);
        // Fallback to user context defaults
        if (user) {
          setUserFinancials({ age: user.age, income: user.monthlyIncome, savings: 0 });
        }
      }
    };
    fetchUserStats();
  }, [user]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRec(null);

    try {
      const res = await axios.post('/recommend-investment', {
        risk_profile: riskProfile,
      });

      if (res.data?.status === 'success') {
        setRec(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to get recommendation from AI Engine. Is the FastAPI service running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content animate-fade-in">
      <div style={styles.header}>
        <h1 style={styles.title}>AI Investment Advisor</h1>
        <p style={styles.subtitle}>
          Decision Tree classification models map your age, income, and risk profile to optimal allocations.
        </p>
      </div>

      <div className="grid-cols-3" style={styles.mainGrid}>
        
        {/* Input Form Card */}
        <div className="glass-card" style={styles.inputCard}>
          <div style={styles.cardHeader}>
            <Sparkles size={20} style={{ color: '#6366f1' }} />
            <h3 style={styles.cardTitle}>Diagnostic Parameters</h3>
          </div>

          <form onSubmit={handleGenerate}>
            {/* Auto-filled details */}
            <div style={styles.contextBox}>
              <h4 style={styles.contextTitle}>User Profile Context</h4>
              <div style={styles.contextRow}>
                <span>Age:</span>
                <strong>{userFinancials.age} Years</strong>
              </div>
              <div style={styles.contextRow}>
                <span>Income Base:</span>
                <strong>₹{userFinancials.income.toLocaleString()} / mo</strong>
              </div>
              <div style={styles.contextRow}>
                <span>Calculated Savings:</span>
                <strong>₹{userFinancials.savings.toLocaleString()}</strong>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">Select Risk Profile</label>
              <div style={styles.riskSelectContainer}>
                {['Conservative', 'Moderate', 'Aggressive'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    style={{
                      ...styles.riskBtn,
                      ...(riskProfile === level ? styles.riskBtnActive(level) : {})
                    }}
                    onClick={() => setRiskProfile(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={styles.submitBtn}
              disabled={loading}
            >
              <Compass size={18} />
              {loading ? 'Consulting Decision Tree...' : 'Generate Recommendations'}
            </button>
          </form>
        </div>

        {/* Results / Recommendation Column (2 cols width) */}
        <div style={styles.resultsCol}>
          {error && (
            <div className="alert alert-error">
              <div style={styles.alertContent}>
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            </div>
          )}

          {rec ? (
            <div className="glass-card animate-fade-in" style={styles.recCard}>
              <h2 style={styles.recCardTitle}>Your Tailored Investment Strategy</h2>
              <p style={styles.recCardSubtitle}>Generated by Decision Tree Classifier</p>

              {/* Suggestions row */}
              <div className="grid-cols-2" style={{ gap: '20px', marginBottom: '32px' }}>
                <div style={styles.suggestionBox('short')}>
                  <span style={styles.sugLabel}>Short-Term Suggestion (1-3 yrs)</span>
                  <h3 style={styles.sugValue}>{rec.shortTerm}</h3>
                  <p style={styles.sugDesc}>
                    Excellent for liquidity and preserving capital while generating moderate yields.
                  </p>
                </div>

                <div style={styles.suggestionBox('long')}>
                  <span style={styles.sugLabel}>Long-Term Suggestion (3+ yrs)</span>
                  <h3 style={styles.sugValue}>{rec.longTerm}</h3>
                  <p style={styles.sugDesc}>
                    Tailored to compound your wealth over time and outpace inflation.
                  </p>
                </div>
              </div>

              {/* Allocation bars */}
              <div>
                <h3 style={styles.allocationTitle}>Recommended Asset Allocation</h3>
                <div style={styles.allocationContainer}>
                  {Object.entries(rec.recommendedAllocations).map(([asset, pct], index) => {
                    const widthVal = pct;
                    const colors = ['#10b981', '#6366f1', '#a855f7'];
                    const color = colors[index % colors.length];

                    return (
                      <div key={asset} style={styles.allocationBarRow}>
                        <div style={styles.allocationMeta}>
                          <span style={styles.assetName}>{asset}</span>
                          <span style={{ ...styles.assetPct, color }}>{pct}</span>
                        </div>
                        <div style={styles.barBg}>
                          <div style={{ ...styles.barFill, width: widthVal, background: color }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={styles.placeholderCard}>
              <Compass size={48} style={{ color: '#64748b', marginBottom: '16px' }} />
              <h3>Awaiting Diagnostics</h3>
              <p style={{ color: '#94a3b8', marginTop: '8px' }}>
                Select a risk profile on the left and run the generator to invoke the Decision Tree ML advisor.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

const styles = {
  header: {
    marginBottom: '32px'
  },
  title: {
    fontSize: '32px',
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif'
  },
  subtitle: {
    fontSize: '15px',
    color: '#94a3b8'
  },
  mainGrid: {
    gridTemplateColumns: '1.2fr 1.8fr',
    gap: '24px'
  },
  inputCard: {
    padding: '24px'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '12px'
  },
  cardTitle: {
    fontSize: '18px',
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif'
  },
  contextBox: {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '10px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.04)'
  },
  contextTitle: {
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '12px',
    fontWeight: 600
  },
  contextRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#cbd5e1',
    marginBottom: '8px'
  },
  riskSelectContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '8px'
  },
  riskBtn: {
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    textAlign: 'center',
    fontFamily: 'Outfit, sans-serif'
  },
  riskBtnActive: (level) => {
    let color = '#6366f1';
    let bg = 'rgba(99, 102, 241, 0.1)';
    if (level === 'Conservative') {
      color = '#10b981';
      bg = 'rgba(16, 185, 129, 0.1)';
    } else if (level === 'Aggressive') {
      color = '#f43f5e';
      bg = 'rgba(244, 63, 94, 0.1)';
    }
    return {
      borderColor: color,
      color: '#ffffff',
      background: bg,
      boxShadow: `0 0 15px ${bg}`
    };
  },
  submitBtn: {
    width: '100%',
    marginTop: '24px'
  },
  resultsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  alertContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  recCard: {
    padding: '32px'
  },
  recCardTitle: {
    fontSize: '24px',
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif',
    marginBottom: '4px'
  },
  recCardSubtitle: {
    fontSize: '13px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '28px'
  },
  suggestionBox: (type) => ({
    background: type === 'short' ? 'rgba(99, 102, 241, 0.04)' : 'rgba(168, 85, 247, 0.04)',
    border: `1px solid ${type === 'short' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(168, 85, 247, 0.15)'}`,
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  }),
  sugLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  sugValue: {
    fontSize: '22px',
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif'
  },
  sugDesc: {
    fontSize: '13px',
    color: '#cbd5e1',
    lineHeight: '1.5',
    marginTop: '4px'
  },
  allocationTitle: {
    fontSize: '18px',
    color: '#ffffff',
    marginBottom: '16px',
    fontFamily: 'Outfit, sans-serif'
  },
  allocationContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  allocationBarRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  allocationMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    fontWeight: 500
  },
  assetName: {
    color: '#cbd5e1'
  },
  assetPct: {
    fontWeight: 700
  },
  barBg: {
    height: '8px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  barFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 1s cubic-bezier(0.1, 0.8, 0.2, 1)'
  },
  placeholderCard: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    textAlign: 'center',
    color: '#64748b'
  }
};

export default InvestmentAdvisor;
