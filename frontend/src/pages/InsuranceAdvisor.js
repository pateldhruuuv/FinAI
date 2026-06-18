import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ShieldAlert, ShieldCheck, Heart, AlertTriangle, Coins, RefreshCw } from 'lucide-react';

const InsuranceAdvisor = () => {
  const { user } = useContext(AuthContext);
  const [dependents, setDependents] = useState(0);
  const [maritalStatus, setMaritalStatus] = useState('Single');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rec, setRec] = useState(null);
  const [userFinancials, setUserFinancials] = useState({ age: 25, income: 50000 });

  // Fetch user info for baseline display
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const res = await axios.get('/dashboard');
        if (res.data?.status === 'success') {
          const stats = res.data.data;
          setUserFinancials({
            age: user?.age || 25,
            income: stats.monthlyIncomeBase || user?.monthlyIncome || 50000,
          });
        }
      } catch (err) {
        console.error('Failed to pre-populate financials', err);
        if (user) {
          setUserFinancials({ age: user.age, income: user.monthlyIncome });
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
      const res = await axios.post('/recommend-insurance', {
        dependents: parseInt(dependents),
        marital_status: maritalStatus,
      });

      if (res.data?.status === 'success') {
        setRec(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch recommendations. Make sure the Python AI engine is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content animate-fade-in">
      <div style={styles.header}>
        <h1 style={styles.title}>AI Insurance Advisor</h1>
        <p style={styles.subtitle}>
          Decision Tree and regressive rules estimate protection gaps and suggested coverages.
        </p>
      </div>

      <div className="grid-cols-3" style={styles.mainGrid}>
        
        {/* Input Form (1.2 cols) */}
        <div className="glass-card" style={styles.inputCard}>
          <div style={styles.cardHeader}>
            <Heart size={20} style={{ color: '#10b981' }} />
            <h3 style={styles.cardTitle}>Demographics Context</h3>
          </div>

          <form onSubmit={handleGenerate}>
            {/* Context Box */}
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
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label" htmlFor="marital">Marital Status</label>
              <select
                id="marital"
                className="form-select"
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="dependents">Number of Dependents</label>
              <input
                id="dependents"
                type="number"
                min="0"
                max="15"
                className="form-input"
                value={dependents}
                onChange={(e) => setDependents(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-secondary"
              style={styles.submitBtn}
              disabled={loading}
            >
              <ShieldCheck size={18} />
              {loading ? 'Analyzing Risks...' : 'Evaluate Insurance Options'}
            </button>
          </form>
        </div>

        {/* Results (1.8 cols) */}
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
              <h2 style={styles.recCardTitle}>Risk Management Analysis</h2>
              <p style={styles.recCardSubtitle}>Synthesized Protection Portfolio Recommendations</p>

              {/* Coverage Amount Badge */}
              <div style={styles.coverageBox}>
                <Coins size={36} style={{ color: '#06b6d4' }} />
                <div>
                  <span style={styles.coverageLabel}>Suggested Overall Term/Life Coverage</span>
                  <h2 style={styles.coverageVal}>₹{rec.suggestedCoverageAmount.toLocaleString()}</h2>
                </div>
              </div>

              {/* Recommended Policies list */}
              <div style={styles.policiesSection}>
                <h3 style={styles.sectionTitle}>Recommended Coverage Products</h3>
                <div style={styles.policyList}>
                  {rec.recommendationsSummary.map((policy, idx) => (
                    <div key={idx} style={styles.policyItem}>
                      <ShieldCheck size={18} style={styles.policyIcon} />
                      <span style={styles.policyText}>{policy}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security info disclaimer */}
              <div style={styles.disclaimerBox}>
                <ShieldAlert size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <p style={styles.disclaimerText}>
                  This recommendation is computed utilizing rule-based margins and regression trees mapping to 15x your annual income plus buffers for dependents. Always consult a certified insurance expert prior to final purchasing.
                </p>
              </div>

            </div>
          ) : (
            <div className="glass-card" style={styles.placeholderCard}>
              <ShieldAlert size={48} style={{ color: '#64748b', marginBottom: '16px' }} />
              <h3>Awaiting Diagnostics</h3>
              <p style={{ color: '#94a3b8', marginTop: '8px' }}>
                Fill in your dependents count and marital status on the left and run analysis to invoke the ML insurance advisor.
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
  coverageBox: {
    background: 'rgba(6, 182, 212, 0.05)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '32px'
  },
  coverageLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: '4px'
  },
  coverageVal: {
    fontSize: '32px',
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 800,
    lineHeight: 1
  },
  policiesSection: {
    marginBottom: '28px'
  },
  sectionTitle: {
    fontSize: '16px',
    color: '#ffffff',
    marginBottom: '16px',
    fontFamily: 'Outfit, sans-serif'
  },
  policyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  policyItem: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  policyIcon: {
    color: '#10b981',
    flexShrink: 0
  },
  policyText: {
    fontSize: '14px',
    color: '#cbd5e1'
  },
  disclaimerBox: {
    background: 'rgba(245, 158, 11, 0.03)',
    border: '1px solid rgba(245, 158, 11, 0.1)',
    borderRadius: '8px',
    padding: '14px 16px',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start'
  },
  disclaimerText: {
    fontSize: '12px',
    color: '#d97706',
    lineHeight: '1.6'
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

export default InsuranceAdvisor;
