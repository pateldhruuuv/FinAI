import React, { useState } from 'react';
import axios from 'axios';
import { Percent, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const TaxOptimizer = () => {
  const [formData, setFormData] = useState({
    annualIncome: '',
    basic: '',
    hra: '',
    specialAllowance: '',
    other: '',
    deductions80C: '',
    deductions80D: '',
    homeLoan: '',
    educationLoan: '',
    rentPaid: '',
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
        annualIncome: parseFloat(formData.annualIncome),
        salaryStructure: {
          basic: parseFloat(formData.basic || 0),
          hra: parseFloat(formData.hra || 0),
          specialAllowance: parseFloat(formData.specialAllowance || 0),
          other: parseFloat(formData.other || 0),
        },
        deductions80C: parseFloat(formData.deductions80C || 0),
        deductions80D: parseFloat(formData.deductions80D || 0),
        homeLoan: parseFloat(formData.homeLoan || 0),
        educationLoan: parseFloat(formData.educationLoan || 0),
        rentPaid: parseFloat(formData.rentPaid || 0),
      };

      const res = await axios.post('/tax-optimizer', payload);
      setResult(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to optimize tax profile');
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <Link to="/premium-dashboard" style={styles.backLink}>
          <ArrowLeft size={16} />
          Back to Hub
        </Link>
        <div style={styles.titleRow}>
          <Percent size={28} color="#6366f1" />
          <h1 style={styles.title}>AI Tax Optimization Advisor</h1>
        </div>
        <p style={styles.subtitle}>Enter your financial details to estimate taxable income and optimize your tax bracket.</p>
      </header>

      <div style={styles.container}>
        {/* Form panel */}
        <form onSubmit={handleSubmit} style={styles.formCard}>
          <h3 style={styles.sectionTitle}>Income & Deductions</h3>
          
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Annual CTC / Income (₹) *</label>
              <input type="number" name="annualIncome" required value={formData.annualIncome} onChange={handleChange} placeholder="e.g. 1200000" style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Basic Salary (₹)</label>
              <input type="number" name="basic" value={formData.basic} onChange={handleChange} placeholder="e.g. 480000" style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>HRA Received (₹)</label>
              <input type="number" name="hra" value={formData.hra} onChange={handleChange} placeholder="e.g. 180000" style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Actual Rent Paid (Annual, ₹)</label>
              <input type="number" name="rentPaid" value={formData.rentPaid} onChange={handleChange} placeholder="e.g. 144000" style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Section 80C Deductions (PPF, ELSS, ₹)</label>
              <input type="number" name="deductions80C" value={formData.deductions80C} onChange={handleChange} placeholder="Max ₹1,50,000" style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Section 80D (Health Insurance, ₹)</label>
              <input type="number" name="deductions80D" value={formData.deductions80D} onChange={handleChange} placeholder="Max ₹25,000" style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Home Loan Interest Paid (₹)</label>
              <input type="number" name="homeLoan" value={formData.homeLoan} onChange={handleChange} placeholder="Max ₹2,00000" style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Education Loan Interest Paid (₹)</label>
              <input type="number" name="educationLoan" value={formData.educationLoan} onChange={handleChange} placeholder="Section 80E" style={styles.input} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Optimizing Bracket...' : 'Calculate Tax & Optimize'}
          </button>
        </form>

        {/* Results Panel */}
        <div style={styles.resultContainer}>
          {error && <div style={styles.errorBox}>{error}</div>}
          
          {result ? (
            <div style={styles.resultCard}>
              <div style={styles.resultHeader}>
                <Sparkles size={20} color="#eab308" />
                <h3 style={styles.resultTitle}>Optimization Recommendations</h3>
              </div>

              <div style={styles.statsSummary}>
                <div style={styles.statBox}>
                  <span style={styles.statLabel}>Old Regime Tax</span>
                  <strong style={styles.statVal}>₹{result.oldTax.toLocaleString()}</strong>
                </div>
                <div style={styles.statBox}>
                  <span style={styles.statLabel}>New Regime Tax</span>
                  <strong style={styles.statVal}>₹{result.newTax.toLocaleString()}</strong>
                </div>
                <div style={{ ...styles.statBox, borderRight: 'none' }}>
                  <span style={styles.statLabel}>Possible Annual Savings</span>
                  <strong style={{ ...styles.statVal, color: '#10b981' }}>₹{result.potentialSavings.toLocaleString()}</strong>
                </div>
              </div>

              {result.taxBreakdownChart && (
                <div style={styles.chartWrapper}>
                  <img src={`data:image/png;base64,${result.taxBreakdownChart}`} alt="Tax Optimization Breakdown" style={styles.chartImg} />
                </div>
              )}

              <div style={styles.advisoryBox}>
                <h4 style={styles.adviceHeading}>Actionable Tax Optimization Checklist</h4>
                <div style={styles.suggestionsList}>
                  {result.suggestions.map((s, idx) => (
                    <div key={idx} style={styles.suggestionItem}>
                      <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
                      <span style={styles.suggestionText}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <Percent size={44} color="rgba(255, 255, 255, 0.1)" />
              <h3>Awaiting Inputs</h3>
              <p>Provide your CTC and deductions profile to view the optimization comparison charts.</p>
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
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
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
  },
  resultTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#ffffff',
  },
  statsSummary: {
    display: 'flex',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    marginBottom: '24px',
  },
  statBox: {
    flex: 1,
    padding: '16px',
    textAlign: 'center',
    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#ffffff',
  },
  chartWrapper: {
    width: '100%',
    height: '280px',
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
  suggestionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  suggestionItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  suggestionText: {
    color: '#cbd5e1',
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

export default TaxOptimizer;
