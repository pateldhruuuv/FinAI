import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
  Wallet, ArrowDownRight, ArrowUpRight, Award,
  AlertTriangle, CheckCircle, RefreshCw, PlusCircle, BrainCircuit
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/dashboard');
      if (res.data?.status === 'success') {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const runAiDiagnostics = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await axios.post('/predict-health');
      if (res.data?.status === 'success') {
        setAiResult(res.data.data);
        // Refresh dashboard data as healthStatus/Score might have been updated/persisted
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
      alert('AI Service error: Make sure the Python AI engine is running.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <RefreshCw className="animate-spin" size={40} style={{ color: '#6366f1' }} />
        <p style={{ marginTop: '16px', color: '#94a3b8' }}>Analyzing financial ledgers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content" style={{ textAlign: 'center', paddingTop: '120px' }}>
        <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <AlertTriangle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
          <h2 style={{ marginBottom: '12px' }}>Dashboard Load Error</h2>
          <p style={{ color: '#94a3b8', marginBottom: '24px' }}>{error}</p>
          <button className="btn btn-primary" onClick={fetchDashboardData}>Try Again</button>
        </div>
      </div>
    );
  }

  // Fallback defaults
  const {
    totalIncome = 0,
    totalExpenses = 0,
    totalSavings = 0,
    healthScore = 0,
    healthStatus = 'Average',
    expenseCategories = [],
    recentTransactions = []
  } = data || {};

  // Color matching for health levels
  const getHealthColor = (status) => {
    switch (status) {
      case 'Excellent': return '#10b981'; // Emerald
      case 'Good': return '#06b6d4'; // Cyan
      case 'Average': return '#f59e0b'; // Amber
      case 'Critical': return '#ef4444'; // Rose
      default: return '#94a3b8';
    }
  };

  const healthColor = getHealthColor(healthStatus);

  // Recharts Chart Configs
  const pieData = expenseCategories.map(cat => ({
    name: cat.category,
    value: cat.amount
  }));

  const barData = [
    {
      name: 'Cash Flow',
      Income: totalIncome,
      Expenses: totalExpenses
    }
  ];

  const COLORS = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  // Gauge data for the health score
  const gaugeData = [
    { value: healthScore, color: healthColor },
    { value: 100 - healthScore, color: '#1f2937' }
  ];

  return (
    <div className="main-content">
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>Financial Cockpit</h1>
          <p style={styles.pageSubtitle}>Real-time summaries and machine-learning diagnostics.</p>
        </div>
        <div style={styles.actions}>
          <button className="btn btn-outline" onClick={() => navigate('/upload')}>
            <PlusCircle size={18} />
            Import CSV
          </button>
          <button className="btn btn-primary" onClick={runAiDiagnostics} disabled={aiLoading}>
            <BrainCircuit size={18} />
            {aiLoading ? 'Diagnostics Running...' : 'Run AI Diagnostic'}
          </button>
        </div>
      </div>

      {/* AI Diagnostic Results Banner */}
      {aiResult && (
        <div className="glass-card animate-fade-in" style={{ ...styles.aiBanner, borderLeftColor: getHealthColor(aiResult.prediction) }}>
          <div style={styles.aiHeader}>
            <BrainCircuit size={24} style={{ color: getHealthColor(aiResult.prediction) }} />
            <h3 style={styles.aiTitle}>
              Random Forest Classifier Output: <span style={{ color: getHealthColor(aiResult.prediction) }}>{aiResult.prediction}</span>
            </h3>
          </div>
          <div style={styles.aiContent}>
            <p style={styles.aiDesc}>Based on your metrics (Age, Income, Expenses, Savings, Debt), the ML model predicts your financial state is <strong>{aiResult.prediction}</strong>. Recommended actions:</p>
            <ul style={styles.suggestionList}>
              {aiResult.suggestions.map((sug, i) => (
                <li key={i} style={styles.suggestionItem}>
                  <CheckCircle size={14} style={styles.bulletIcon} />
                  {sug}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid-cols-4" style={styles.statsGrid}>
        
        {/* Income Card */}
        <div className="glass-card" style={styles.statCard}>
          <div style={styles.statIconContainer(true)}>
            <ArrowUpRight size={24} style={{ color: '#10b981' }} />
          </div>
          <div>
            <p style={styles.statLabel}>Total Income</p>
            <h3 style={styles.statValue}>₹{totalIncome.toLocaleString()}</h3>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="glass-card" style={styles.statCard}>
          <div style={styles.statIconContainer(false)}>
            <ArrowDownRight size={24} style={{ color: '#ef4444' }} />
          </div>
          <div>
            <p style={styles.statLabel}>Total Expenses</p>
            <h3 style={styles.statValue}>₹{totalExpenses.toLocaleString()}</h3>
          </div>
        </div>

        {/* Savings Card */}
        <div className="glass-card" style={styles.statCard}>
          <div style={styles.statIconContainer(totalSavings >= 0)}>
            <Wallet size={24} style={{ color: totalSavings >= 0 ? '#06b6d4' : '#ef4444' }} />
          </div>
          <div>
            <p style={styles.statLabel}>Remaining Savings</p>
            <h3 style={styles.statValue}>₹{totalSavings.toLocaleString()}</h3>
          </div>
        </div>

        {/* Health Score Card */}
        <div className="glass-card" style={styles.healthCard}>
          <div style={styles.gaugeWrapper}>
            <ResponsiveContainer width="100%" height={100}>
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={0}
                  dataKey="value"
                >
                  <Cell fill={healthColor} />
                  <Cell fill="#1f2937" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={styles.gaugeCenterText}>
              <span style={styles.gaugeScore}>{healthScore}</span>
              <span style={styles.gaugeLabel}>Score</span>
            </div>
          </div>
          <div style={styles.healthInfo}>
            <p style={styles.statLabel}>Health Rating</p>
            <h4 style={{ ...styles.healthRating, color: healthColor }}>
              <Award size={18} style={{ marginRight: '6px' }} />
              {healthStatus}
            </h4>
          </div>
        </div>

      </div>

      {/* Charts Section */}
      <div className="grid-cols-2" style={styles.chartsGrid}>
        
        {/* Expenses Breakdown (Pie Chart) */}
        <div className="glass-card" style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Expense Breakdown by Category</h3>
          {pieData.length > 0 ? (
            <div style={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={styles.chartTooltip}
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Spent']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={styles.noDataPlaceholder}>
              <p>No transaction data. Upload a bank statement to render the chart.</p>
            </div>
          )}
        </div>

        {/* Cash Flow Comparison (Bar Chart) */}
        <div className="glass-card" style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Income vs. Expense</h3>
          {totalIncome > 0 || totalExpenses > 0 ? (
            <div style={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} barSize={60}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={styles.chartTooltip}
                    formatter={(value) => [`₹${value.toLocaleString()}`]}
                  />
                  <Legend />
                  <Bar dataKey="Income" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={styles.noDataPlaceholder}>
              <p>No transaction data. Upload a bank statement to render the chart.</p>
            </div>
          )}
        </div>

      </div>

      {/* Recent Transactions List */}
      <div className="glass-card" style={styles.transactionsCard}>
        <h3 style={styles.chartTitle}>Recent Ledger Transactions</h3>
        {recentTransactions.length > 0 ? (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeadRow}>
                  <th style={styles.tableHeader}>Date</th>
                  <th style={styles.tableHeader}>Description</th>
                  <th style={styles.tableHeader}>Category</th>
                  <th style={styles.tableHeader}>Type</th>
                  <th style={styles.tableHeaderAlignRight}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx._id} style={styles.tableRow}>
                    <td style={styles.tableCell}>{new Date(tx.date).toLocaleDateString()}</td>
                    <td style={styles.tableCellBold}>{tx.description}</td>
                    <td style={styles.tableCell}><span style={styles.categoryBadge}>{tx.category}</span></td>
                    <td style={styles.tableCell}>
                      <span style={styles.typeBadge(tx.type)}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={styles.tableCellAlignRight(tx.type)}>
                      {tx.type === 'Debit' ? '-' : '+'}₹{tx.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.noTransactionsPlaceholder}>
            <p>No transactions available. Start by uploading a CSV bank statement.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '80vh',
    backgroundColor: '#030712'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  pageTitle: {
    fontSize: '32px',
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif'
  },
  pageSubtitle: {
    fontSize: '15px',
    color: '#94a3b8'
  },
  actions: {
    display: 'flex',
    gap: '12px'
  },
  statsGrid: {
    marginBottom: '32px'
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  statIconContainer: (isPositive) => ({
    background: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
    borderRadius: '12px',
    padding: '12px',
  }),
  statLabel: {
    fontSize: '13px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '4px'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif'
  },
  healthCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
  },
  gaugeWrapper: {
    position: 'relative',
    width: '120px',
    height: '75px',
    display: 'flex',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  gaugeCenterText: {
    position: 'absolute',
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  gaugeScore: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#ffffff',
    lineHeight: 1
  },
  gaugeLabel: {
    fontSize: '9px',
    textTransform: 'uppercase',
    color: '#94a3b8',
    letterSpacing: '0.05em'
  },
  healthInfo: {
    textAlign: 'right'
  },
  healthRating: {
    fontSize: '18px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    fontFamily: 'Outfit, sans-serif'
  },
  chartsGrid: {
    marginBottom: '32px'
  },
  chartCard: {
    minHeight: '340px'
  },
  chartTitle: {
    fontSize: '18px',
    color: '#ffffff',
    marginBottom: '20px',
    fontFamily: 'Outfit, sans-serif'
  },
  chartWrapper: {
    width: '100%'
  },
  chartTooltip: {
    background: '#111827',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#f8fafc',
    fontFamily: 'Inter, sans-serif'
  },
  noDataPlaceholder: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '240px',
    color: '#64748b',
    fontSize: '14px',
    textAlign: 'center',
    padding: '24px'
  },
  transactionsCard: {
    padding: '24px'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  tableHeadRow: {
    borderBottom: '1px solid rgba(255,255,255,0.08)'
  },
  tableHeader: {
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  tableHeaderAlignRight: {
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: 'right'
  },
  tableRow: {
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    transition: 'background var(--transition-fast)'
  },
  tableCell: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#cbd5e1'
  },
  tableCellBold: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#f8fafc',
    fontWeight: 500
  },
  categoryBadge: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#94a3b8',
    border: '1px solid rgba(255, 255, 255, 0.04)'
  },
  typeBadge: (type) => ({
    background: type === 'Credit' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
    color: type === 'Credit' ? '#a7f3d0' : '#fca5a5',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  }),
  tableCellAlignRight: (type) => ({
    padding: '14px 16px',
    fontSize: '14px',
    fontWeight: 600,
    textAlign: 'right',
    color: type === 'Credit' ? '#10b981' : '#f43f5e'
  }),
  noTransactionsPlaceholder: {
    textAlign: 'center',
    padding: '40px',
    color: '#64748b',
    fontSize: '14px'
  },
  aiBanner: {
    marginBottom: '32px',
    borderLeft: '4px solid #6366f1',
    animation: 'fadeIn 0.5s ease'
  },
  aiHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px'
  },
  aiTitle: {
    fontSize: '18px',
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif'
  },
  aiContent: {
    fontSize: '14px',
    color: '#cbd5e1',
    lineHeight: '1.6'
  },
  aiDesc: {
    marginBottom: '12px'
  },
  suggestionList: {
    listStyleType: 'none',
    padding: 0
  },
  suggestionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    color: '#cbd5e1'
  },
  bulletIcon: {
    color: '#10b981',
    flexShrink: 0
  }
};

export default Dashboard;
