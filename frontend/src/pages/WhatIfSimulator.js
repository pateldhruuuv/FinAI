import React, { useState } from 'react';
import axios from 'axios';
import { TrendingUp, ArrowLeft, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const WhatIfSimulator = () => {
  const [scenario, setScenario] = useState('salary_increase');
  const [value, setValue] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getScenarioConfig = () => {
    switch (scenario) {
      case 'salary_increase':
        return { label: 'Increase Percentage (%)', placeholder: 'e.g. 15 for 15%', min: 1, max: 100 };
      case 'job_loss':
        return { label: 'Duration of Unemployment (Months)', placeholder: 'e.g. 4', min: 1, max: 24 };
      case 'medical_emergency':
        return { label: 'Estimated Uncovered Expense (₹)', placeholder: 'e.g. 100000', min: 1000 };
      case 'marriage':
        return { label: 'Total Wedding Budget (₹)', placeholder: 'e.g. 500000', min: 10000 };
      case 'child_education':
        return { label: 'Higher Education Fees (₹)', placeholder: 'e.g. 800000', min: 10000 };
      case 'buying_house':
        return { label: 'Total House Value (₹)', placeholder: 'e.g. 5000000', min: 100000 };
      case 'buying_car':
        return { label: 'On-Road Car Price (₹)', placeholder: 'e.g. 800000', min: 50000 };
      default:
        return { label: 'Value', placeholder: 'Enter amount', min: 0 };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/what-if', {
        scenario,
        value: parseFloat(value),
      });
      setResult(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to simulate scenario');
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
          <TrendingUp size={28} color="#ec4899" />
          <h1 style={styles.title}>What-If Financial Simulator</h1>
        </div>
        <p style={styles.subtitle}>Simulate major life milestones or financial emergencies to forecast impact on your savings and goals.</p>
      </header>

      <div style={styles.container}>
        {/* Simulation Settings Card */}
        <form onSubmit={handleSubmit} style={styles.formCard}>
          <h3 style={styles.sectionTitle}>Configure Scenario</h3>
          
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Select Milestone / Event</label>
              <select 
                value={scenario} 
                onChange={(e) => { setScenario(e.target.value); setValue(''); setResult(null); }} 
                style={styles.select}
              >
                <option value="salary_increase">Salary Hike / Increase</option>
                <option value="job_loss">Sudden Job Loss</option>
                <option value="medical_emergency">Medical Emergency Expense</option>
                <option value="marriage">Marriage Expenses</option>
                <option value="child_education">Child Higher Education Fund</option>
                <option value="buying_house">Buying a House (80% financed)</option>
                <option value="buying_car">Buying a Car (80% financed)</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>{getScenarioConfig().label} *</label>
              <input 
                type="number" 
                required 
                value={value} 
                onChange={(e) => setValue(e.target.value)} 
                placeholder={getScenarioConfig().placeholder} 
                min={getScenarioConfig().min}
                max={getScenarioConfig().max}
                style={styles.input} 
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Running Simulation...' : 'Simulate Future Impact'}
          </button>
        </form>

        {/* Forecast Card */}
        <div style={styles.resultContainer}>
          {error && <div style={styles.errorBox}>{error}</div>}
          
          {result ? (
            <div style={styles.resultCard}>
              <div style={styles.resultHeader}>
                <TrendingUp size={20} color="#ec4899" />
                <h3 style={styles.resultTitle}>Forecasted Financial Impact</h3>
                <button 
                  type="button" 
                  onClick={() => { setValue(''); setResult(null); }} 
                  style={styles.resetBtn}
                >
                  <RefreshCw size={14} />
                  Reset
                </button>
              </div>

              <div style={styles.impactGrid}>
                {/* Metric 1 */}
                <div style={styles.impactCard}>
                  <span style={styles.impactLabel}>Projected Savings (3 Yrs)</span>
                  <div style={styles.impactVal}>₹{result.futureSavings.toLocaleString()}</div>
                  <span style={styles.impactSub}>Liquid reserves forecast</span>
                </div>

                {/* Metric 2 */}
                <div style={styles.impactCard}>
                  <span style={styles.impactLabel}>Liability / Debt Level</span>
                  <div style={{ ...styles.impactVal, color: result.debt > 0 ? '#ef4444' : '#10b981' }}>
                    ₹{result.debt.toLocaleString()}
                  </div>
                  <span style={styles.impactSub}>Outstanding loans/debt</span>
                </div>

                {/* Metric 3 */}
                <div style={styles.impactCard}>
                  <span style={styles.impactLabel}>Goal Delay Timeline</span>
                  <div style={{ ...styles.impactVal, color: result.goalDelayMonths > 0 ? '#f59e0b' : '#10b981' }}>
                    {result.goalDelayMonths === 0 ? 'No Delay' : `${result.goalDelayMonths} Months`}
                  </div>
                  <span style={styles.impactSub}>Delay on target planners</span>
                </div>

                {/* Metric 4 */}
                <div style={styles.impactCard}>
                  <span style={styles.impactLabel}>Added Annual Investment</span>
                  <div style={{ ...styles.impactVal, color: '#6366f1' }}>
                    ₹{result.investmentImpact.toLocaleString()}
                  </div>
                  <span style={styles.impactSub}>Added market allocation</span>
                </div>
              </div>

              <div style={styles.simulationExplanation}>
                <AlertCircle size={16} color="#ec4899" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={styles.explanationText}>
                  {scenario === 'salary_increase' && "Congratulations! A higher salary accelerates your net worth growth and reduces goal times, allowing you to invest 60% of your raise."}
                  {scenario === 'job_loss' && "Job loss drains your emergency buffer. We recommend cutting discretionary spending immediately and extending your emergency pool to 6+ months."}
                  {scenario === 'medical_emergency' && "Emergency costs reduce your liquid savings. If the cost exceeds your savings, it translates into high-interest debt."}
                  {scenario === 'marriage' && "Weddings require significant cash capital. We recommend saving in low-volatility debt funds 1-2 years prior to the milestone."}
                  {(scenario === 'buying_house' || scenario === 'buying_car') && "Big purchases increase your leverage and monthly EMI commitments, which reduces monthly savings and delays secondary goals."}
                </p>
              </div>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <TrendingUp size={44} color="rgba(255, 255, 255, 0.1)" />
              <h3>Awaiting Simulation Config</h3>
              <p>Configure a scenario and click simulate to project future savings, liabilities, and delays.</p>
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
  select: {
    padding: '12px 16px',
    borderRadius: '10px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '14px',
    fontFamily: 'Outfit, sans-serif',
    outline: 'none',
    cursor: 'pointer',
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
    background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)',
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
  },
  resultTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#ffffff',
  },
  resetBtn: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#cbd5e1',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
  },
  impactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  impactCard: {
    background: 'rgba(255, 255, 255, 0.015)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  impactLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  impactVal: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#ffffff',
  },
  impactSub: {
    fontSize: '10px',
    color: '#64748b',
  },
  simulationExplanation: {
    display: 'flex',
    gap: '10px',
    background: 'rgba(236, 72, 153, 0.05)',
    border: '1px solid rgba(236, 72, 153, 0.15)',
    borderRadius: '12px',
    padding: '16px',
  },
  explanationText: {
    fontSize: '12px',
    color: '#f9a8d4',
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

export default WhatIfSimulator;
