import React, { useState } from 'react';
import axios from 'axios';
import { DollarSign, ArrowLeft, Zap, Info, ShieldAlert, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const PurchaseAdvisor = () => {
  const [formData, setFormData] = useState({
    item: '',
    cost: '',
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
      const res = await axios.post('/purchase-advisor', {
        item: formData.item,
        cost: parseFloat(formData.cost),
      });
      setResult(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to get purchase advice');
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Buy') return '#10b981';
    if (status === 'Wait') return '#f59e0b';
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
          <DollarSign size={28} color="#eab308" />
          <h1 style={styles.title}>AI Purchase Advisor</h1>
        </div>
        <p style={styles.subtitle}>Check if you can afford a purchase without delaying active goals or draining emergency savings.</p>
      </header>

      <div style={styles.container}>
        {/* Form Panel */}
        <form onSubmit={handleSubmit} style={styles.formCard}>
          <h3 style={styles.sectionTitle}>Proposed Purchase</h3>
          
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>What do you want to buy? *</label>
              <input type="text" name="item" required value={formData.item} onChange={handleChange} placeholder="e.g. iPhone 15 Pro, Sport Bike, Laptop" style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Estimated Cost (₹) *</label>
              <input type="number" name="cost" required value={formData.cost} onChange={handleChange} placeholder="e.g. 120000" style={styles.input} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Evaluating Financial Impact...' : 'Evaluate Purchase Affordability'}
          </button>
        </form>

        {/* Results Panel */}
        <div style={styles.resultContainer}>
          {error && <div style={styles.errorBox}>{error}</div>}
          
          {result ? (
            <div style={styles.resultCard}>
              <div style={styles.resultHeader}>
                <Sparkles size={20} color="#eab308" />
                <h3 style={styles.resultTitle}>Purchase Verdict: {formData.item}</h3>
                <span style={{ 
                  ...styles.statusBadge, 
                  color: getStatusColor(result.status), 
                  borderColor: getStatusColor(result.status),
                  background: `${getStatusColor(result.status)}15`
                }}>
                  {result.status}
                </span>
              </div>

              <div style={styles.scoreRow}>
                <div style={styles.scoreCircleWrapper}>
                  <div style={{ ...styles.scoreCircle, borderColor: getStatusColor(result.status) }}>
                    <span style={styles.scoreVal}>{result.purchaseScore}</span>
                    <span style={styles.scoreMax}>/100</span>
                  </div>
                  <span style={styles.scoreLabel}>Purchase Affordability Score</span>
                </div>
                
                <div style={styles.verdictDescription}>
                  <p style={styles.verdictText}>
                    {result.status === 'Buy' && "Excellent! Your savings are sufficient and this purchase will not compromise your emergency buffer or goals. You are cleared to proceed."}
                    {result.status === 'Wait' && "Caution: Affording this in cash right now would draw down on your emergency cushion. Consider saving for a few months or exploring refurbished alternatives."}
                    {result.status === 'Avoid' && "Warning: This purchase is highly discouraged as it exceeds your safe budget parameters and will delay key active goals or increase debt risks."}
                  </p>
                </div>
              </div>

              <div style={styles.optionsSection}>
                <h4 style={styles.optionsHeading}>Alternative & Smart Purchase Suggestions</h4>
                
                <div style={styles.optionsList}>
                  <div style={styles.optionItem}>
                    <span>Refurbished Alternative:</span>
                    <strong>{result.suggestions.refurbishedOption}</strong>
                  </div>

                  <div style={styles.optionItem}>
                    <span>Second-Hand Estimate:</span>
                    <strong>{result.suggestions.secondHandOption}</strong>
                  </div>

                  <div style={styles.optionItem}>
                    <span>Monthly EMI financing option:</span>
                    <strong>{result.suggestions.emiOption}</strong>
                  </div>

                  <div style={styles.optionItem}>
                    <span>Better Alternative advice:</span>
                    <p style={styles.optionParagraph}>{result.suggestions.betterAlternative}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <DollarSign size={44} color="rgba(255, 255, 255, 0.1)" />
              <h3>Awaiting Item & Cost</h3>
              <p>Submit item details to evaluate net worth impact, scoring, and financing alternatives.</p>
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
    background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
    color: '#000000',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(234, 179, 8, 0.3)',
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
  statusBadge: {
    marginLeft: 'auto',
    fontSize: '12px',
    fontWeight: 800,
    padding: '4px 12px',
    borderRadius: '20px',
    border: '2px solid',
  },
  scoreRow: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    padding: '20px',
    marginBottom: '24px',
  },
  scoreCircleWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  scoreCircle: {
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    border: '4px solid',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreVal: {
    fontSize: '32px',
    fontWeight: 800,
    color: '#ffffff',
  },
  scoreMax: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '12px',
  },
  scoreLabel: {
    fontSize: '10px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  verdictDescription: {
    flex: 1,
  },
  verdictText: {
    fontSize: '13px',
    lineHeight: 1.6,
    color: '#cbd5e1',
  },
  optionsSection: {
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '20px',
  },
  optionsHeading: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '16px',
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  optionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#94a3b8',
  },
  optionParagraph: {
    color: '#ffffff',
    fontSize: '12px',
    lineHeight: 1.4,
    maxWidth: '220px',
    textAlign: 'right',
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

export default PurchaseAdvisor;
