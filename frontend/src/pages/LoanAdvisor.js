import React, { useState } from 'react';
import axios from 'axios';
import { Scale, ArrowLeft, ShieldAlert, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const LoanAdvisor = () => {
  const [formData, setFormData] = useState({
    income: '',
    age: '',
    creditScore: '750',
    currentEmi: '',
    existingLoans: '',
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
        income: parseFloat(formData.income),
        age: parseInt(formData.age),
        creditScore: parseInt(formData.creditScore || 750),
        currentEmi: parseFloat(formData.currentEmi || 0),
        existingLoans: parseFloat(formData.existingLoans || 0),
      };

      const res = await axios.post('/loan-advisor', payload);
      setResult(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to analyze loan eligibility');
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    if (risk === 'Low') return '#10b981';
    if (risk === 'Medium') return '#f59e0b';
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
          <Scale size={28} color="#3b82f6" />
          <h1 style={styles.title}>Loan Eligibility Advisor</h1>
        </div>
        <p style={styles.subtitle}>Determine your multi-loan borrowing limits, safe EMI budgets, and credit risk levels.</p>
      </header>

      <div style={styles.container}>
        {/* Form Panel */}
        <form onSubmit={handleSubmit} style={styles.formCard}>
          <h3 style={styles.sectionTitle}>Borrowing Profile</h3>
          
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Monthly Income (Net, ₹) *</label>
              <input type="number" name="income" required value={formData.income} onChange={handleChange} placeholder="e.g. 80000" style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Age (Years) *</label>
              <input type="number" name="age" required value={formData.age} onChange={handleChange} placeholder="e.g. 30" style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Credit Score (Approx)</label>
              <input type="number" name="creditScore" value={formData.creditScore} onChange={handleChange} placeholder="e.g. 750 (300-900)" style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Current Monthly EMIs (₹)</label>
              <input type="number" name="currentEmi" value={formData.currentEmi} onChange={handleChange} placeholder="e.g. 15000" style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Total Existing Outstanding Loans (₹)</label>
              <input type="number" name="existingLoans" value={formData.existingLoans} onChange={handleChange} placeholder="e.g. 500000" style={styles.input} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Evaluating Eligibility...' : 'Evaluate Loan Eligibility'}
          </button>
        </form>

        {/* Results Panel */}
        <div style={styles.resultContainer}>
          {error && <div style={styles.errorBox}>{error}</div>}
          
          {result ? (
            <div style={styles.resultCard}>
              <div style={styles.resultHeader}>
                <Scale size={20} color="#3b82f6" />
                <h3 style={styles.resultTitle}>Eligible Borrowing Limits</h3>
                <span style={{ 
                  ...styles.riskBadge, 
                  color: getRiskColor(result.loanRisk), 
                  borderColor: getRiskColor(result.loanRisk),
                  background: `${getRiskColor(result.loanRisk)}15`
                }}>
                  {result.loanRisk} Risk Profile
                </span>
              </div>

              <div style={styles.emiSummary}>
                <div style={styles.emiBox}>
                  <span style={styles.emiLabel}>Safe Monthly EMI</span>
                  <strong style={{ ...styles.emiVal, color: '#10b981' }}>₹{result.safeEmi.toLocaleString()}</strong>
                  <span style={styles.emiNote}>35% of monthly income</span>
                </div>
                <div style={{ ...styles.emiBox, borderRight: 'none' }}>
                  <span style={styles.emiLabel}>Maximum Monthly EMI</span>
                  <strong style={{ ...styles.emiVal, color: '#ef4444' }}>₹{result.maximumEmi.toLocaleString()}</strong>
                  <span style={styles.emiNote}>50% of monthly income</span>
                </div>
              </div>

              <div style={styles.limitsSection}>
                <h4 style={styles.limitsHeading}>Eligible Loan Amount Breakdown</h4>
                
                <div style={styles.limitGrid}>
                  <div style={styles.limitItem}>
                    <div style={styles.limitIconCol}>
                      <div style={{ ...styles.colorDot, background: '#10b981' }}></div>
                      <span>Home Loan Limit:</span>
                    </div>
                    <strong>₹{result.breakdown.homeLoan.toLocaleString()}</strong>
                  </div>

                  <div style={styles.limitItem}>
                    <div style={styles.limitIconCol}>
                      <div style={{ ...styles.colorDot, background: '#3b82f6' }}></div>
                      <span>Car Loan Limit:</span>
                    </div>
                    <strong>₹{result.breakdown.carLoan.toLocaleString()}</strong>
                  </div>

                  <div style={styles.limitItem}>
                    <div style={styles.limitIconCol}>
                      <div style={{ ...styles.colorDot, background: '#a855f7' }}></div>
                      <span>Personal Loan Limit:</span>
                    </div>
                    <strong>₹{result.breakdown.personalLoan.toLocaleString()}</strong>
                  </div>

                  <div style={styles.limitItem}>
                    <div style={styles.limitIconCol}>
                      <div style={{ ...styles.colorDot, background: '#eab308' }}></div>
                      <span>Education Loan Limit:</span>
                    </div>
                    <strong>₹{result.breakdown.educationLoan.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div style={styles.advisoryAlert}>
                <Info size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={styles.advisoryText}>
                  {result.loanRisk === 'High' 
                    ? "WARNING: Your outstanding debts or credit history put you in a High Risk category. Clearing existing loans is highly recommended before applying for new leverage."
                    : "Safe limit values are calculated based on debt amortization formulas. Banks evaluate additional parameters such as employer reputation and job history."
                  }
                </p>
              </div>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <Scale size={44} color="rgba(255, 255, 255, 0.1)" />
              <h3>Awaiting Profile Details</h3>
              <p>Fill out your borrowing profile to view eligible limits and safe debt budgets.</p>
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
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
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
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  resultTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#ffffff',
  },
  riskBadge: {
    marginLeft: 'auto',
    fontSize: '11px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '20px',
    border: '1px solid',
  },
  emiSummary: {
    display: 'flex',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    marginBottom: '24px',
  },
  emiBox: {
    flex: 1,
    padding: '16px',
    textAlign: 'center',
    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  emiLabel: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  emiVal: {
    fontSize: '22px',
    fontWeight: 800,
  },
  emiNote: {
    fontSize: '10px',
    color: '#64748b',
  },
  limitsSection: {
    marginBottom: '24px',
  },
  limitsHeading: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '12px',
  },
  limitGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  limitItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '13px',
  },
  limitIconCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#cbd5e1',
  },
  colorDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  advisoryAlert: {
    display: 'flex',
    gap: '10px',
    background: 'rgba(59, 130, 246, 0.05)',
    border: '1px solid rgba(59, 130, 246, 0.15)',
    borderRadius: '12px',
    padding: '16px',
  },
  advisoryText: {
    fontSize: '12px',
    color: '#93c5fd',
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

export default LoanAdvisor;
