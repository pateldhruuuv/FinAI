import React, { useState } from 'react';
import axios from 'axios';
import { ShieldCheck, ArrowLeft, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const InsuranceGap = () => {
  const [formData, setFormData] = useState({
    coverageAmount: '',
    dependents: '',
    income: '',
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
        coverageAmount: parseFloat(formData.coverageAmount || 0),
        dependents: parseInt(formData.dependents || 0),
        income: parseFloat(formData.income),
      };

      const res = await axios.post('/insurance-gap', payload);
      setResult(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to analyze insurance gap');
      setLoading(false);
    }
  };

  const getPriorityDetails = (priority) => {
    if (priority === 'Critical') return { color: '#ef4444', icon: <AlertOctagon size={16} /> };
    if (priority === 'High') return { color: '#f97316', icon: <AlertTriangle size={16} /> };
    if (priority === 'Medium') return { color: '#eab308', icon: <HelpCircle size={16} /> };
    return { color: '#10b981', icon: <ShieldCheck size={16} /> };
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <Link to="/premium-dashboard" style={styles.backLink}>
          <ArrowLeft size={16} />
          Back to Hub
        </Link>
        <div style={styles.titleRow}>
          <ShieldCheck size={28} color="#10b981" />
          <h1 style={styles.title}>Insurance Gap Analysis</h1>
        </div>
        <p style={styles.subtitle}>Calculate your protection deficits and identify the optimal life/health coverage policies needed.</p>
      </header>

      <div style={styles.container}>
        {/* Form Panel */}
        <form onSubmit={handleSubmit} style={styles.formCard}>
          <h3 style={styles.sectionTitle}>Coverage Profile</h3>
          
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Annual Income (₹) *</label>
              <input type="number" name="income" required value={formData.income} onChange={handleChange} placeholder="e.g. 1000000" style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Total Active Insurance Coverage (₹)</label>
              <input type="number" name="coverageAmount" value={formData.coverageAmount} onChange={handleChange} placeholder="Current life/health policies sum" style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Number of Dependents *</label>
              <input type="number" name="dependents" required value={formData.dependents} onChange={handleChange} placeholder="e.g. 3" style={styles.input} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Analyzing Gaps...' : 'Run Gap Analysis'}
          </button>
        </form>

        {/* Results Panel */}
        <div style={styles.resultContainer}>
          {error && <div style={styles.errorBox}>{error}</div>}
          
          {result ? (
            <div style={styles.resultCard}>
              <div style={styles.resultHeader}>
                <ShieldCheck size={20} color="#10b981" />
                <h3 style={styles.resultTitle}>Gap Summary</h3>
                <span style={{ 
                  ...styles.priorityBadge, 
                  color: getPriorityDetails(result.priorityLevel).color, 
                  borderColor: getPriorityDetails(result.priorityLevel).color,
                  background: `${getPriorityDetails(result.priorityLevel).color}15`
                }}>
                  <div style={styles.badgeFlex}>
                    {getPriorityDetails(result.priorityLevel).icon}
                    <span>{result.priorityLevel} Priority</span>
                  </div>
                </span>
              </div>

              <div style={styles.gapSummary}>
                <div style={styles.gapBox}>
                  <span style={styles.gapLabel}>Required Protection</span>
                  <strong style={{ ...styles.gapVal, color: '#ffffff' }}>₹{result.requiredCoverage.toLocaleString()}</strong>
                </div>
                <div style={{ ...styles.gapBox, borderRight: 'none' }}>
                  <span style={styles.gapLabel}>Uncovered Deficit (Gap)</span>
                  <strong style={{ ...styles.gapVal, color: '#f43f5e' }}>₹{result.coverageGap.toLocaleString()}</strong>
                </div>
              </div>

              <div style={styles.recSection}>
                <h4 style={styles.recHeading}>Recommendations Checklist</h4>
                <div style={styles.recItem}>
                  <span>Suggested Add-On Cover Amount:</span>
                  <strong>₹{result.recommendedAdditionalCoverage.toLocaleString()}</strong>
                </div>
                <div style={styles.recItem}>
                  <span>Recommended Product:</span>
                  <strong style={{ color: '#10b981' }}>{result.bestInsuranceType}</strong>
                </div>
              </div>

              <p style={styles.footerNote}>
                Required protection is calculated using the 10x-15x income benchmark plus dependency multipliers to secure household liabilities.
              </p>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <ShieldCheck size={44} color="rgba(255, 255, 255, 0.1)" />
              <h3>Awaiting Insurance Parameters</h3>
              <p>Fill out your active policies and dependents to compute your gap coverage index.</p>
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
    background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
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
  priorityBadge: {
    marginLeft: 'auto',
    fontSize: '11px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '20px',
    border: '1px solid',
  },
  badgeFlex: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  gapSummary: {
    display: 'flex',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    marginBottom: '24px',
  },
  gapBox: {
    flex: 1,
    padding: '16px',
    textAlign: 'center',
    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  gapLabel: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  gapVal: {
    fontSize: '20px',
    fontWeight: 800,
  },
  recSection: {
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  recHeading: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#ffffff',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '8px',
    marginBottom: '4px',
  },
  recItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#cbd5e1',
  },
  footerNote: {
    fontSize: '11px',
    color: '#64748b',
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

export default InsuranceGap;
