import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';
import {
  Wallet, ArrowDownRight, ArrowUpRight, Award,
  AlertTriangle, CheckCircle, RefreshCw, PlusCircle, BrainCircuit,
  Target, Plane, TrendingUp, Bell, Sparkles, PiggyBank, CreditCard,
  Calendar, Eye, Check
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dashboard Overview States
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  
  // Goal States
  const [goals, setGoals] = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalSavings, setGoalSavings] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [goalSuccessMsg, setGoalSuccessMsg] = useState('');

  // Trip Planner States
  const [tripDest, setTripDest] = useState('Paris');
  const [tripTravelers, setTripTravelers] = useState(1);
  const [tripStart, setTripStart] = useState('');
  const [tripEnd, setTripEnd] = useState('');
  const [tripBudget, setTripBudget] = useState('');
  const [tripResult, setTripResult] = useState(null);
  const [tripLoading, setTripLoading] = useState(false);

  // Debt & Subscription States
  const [debtAmount, setDebtAmount] = useState('');
  const [debtEmi, setDebtEmi] = useState('');
  const [debtResult, setDebtResult] = useState(null);
  const [debtLoading, setDebtLoading] = useState(false);
  const [subsData, setSubsData] = useState(null);
  const [subsLoading, setSubsLoading] = useState(false);

  // Emergency Fund States
  const [emergencyData, setEmergencyData] = useState(null);
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  // Retirement Planner States
  const [retCurrentAge, setRetCurrentAge] = useState('');
  const [retRetireAge, setRetRetireAge] = useState('');
  const [retSavings, setRetSavings] = useState('');
  const [retInvestment, setRetInvestment] = useState('');
  const [retResult, setRetResult] = useState(null);
  const [retLoading, setRetLoading] = useState(false);

  // Forecast & Insights States
  const [forecastData, setForecastData] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [insightsData, setInsightsData] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Notifications States
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  // AI Recommendation Engine States
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  const navigate = useNavigate();

  // ----------------------------------------------------
  // API Fetch Functions
  // ----------------------------------------------------

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

  const fetchGoals = async () => {
    setGoalsLoading(true);
    try {
      const res = await axios.get('/goals');
      if (res.data?.status === 'success') {
        setGoals(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGoalsLoading(false);
    }
  };

  const fetchEmergencyFund = async () => {
    setEmergencyLoading(true);
    try {
      const res = await axios.get('/emergency-fund');
      if (res.data?.status === 'success') {
        setEmergencyData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEmergencyLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    setSubsLoading(true);
    try {
      const res = await axios.get('/subscriptions/analyze');
      if (res.data?.status === 'success') {
        setSubsData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubsLoading(false);
    }
  };

  const fetchForecast = async () => {
    setForecastLoading(true);
    try {
      const res = await axios.post('/forecast');
      if (res.data?.status === 'success') {
        setForecastData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setForecastLoading(false);
    }
  };

  const fetchInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await axios.get('/spending-insights');
      if (res.data?.status === 'success') {
        setInsightsData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInsightsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await axios.get('/notifications');
      if (res.data?.status === 'success') {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setNotifLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    setRecLoading(true);
    try {
      const res = await axios.get('/recommendations');
      if (res.data?.status === 'success') {
        setRecommendations(res.data.data.recommendations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRecLoading(false);
    }
  };

  // Initialize Data
  useEffect(() => {
    fetchDashboardData();
    fetchEmergencyFund();
    fetchNotifications();
    fetchRecommendations();
  }, []);

  // Fetch tab-specific data when tab changes
  useEffect(() => {
    if (activeTab === 'goals') {
      fetchGoals();
    } else if (activeTab === 'debt') {
      fetchSubscriptions();
    } else if (activeTab === 'retirement') {
      fetchForecast();
      fetchInsights();
    } else if (activeTab === 'notifications') {
      fetchNotifications();
    }
  }, [activeTab]);

  // ----------------------------------------------------
  // Event Handlers
  // ----------------------------------------------------

  const runAiDiagnostics = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await axios.post('/predict-health');
      if (res.data?.status === 'success') {
        setAiResult(res.data.data);
        fetchDashboardData();
        fetchNotifications();
        fetchRecommendations();
      }
    } catch (err) {
      console.error(err);
      alert('AI Service error: Make sure the Python AI engine is running.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!goalName || !goalTarget || !goalSavings || !goalDate) {
      alert('Please fill out all goal fields');
      return;
    }
    try {
      const res = await axios.post('/goals/create', {
        goalName,
        targetAmount: goalTarget,
        currentSavings: goalSavings,
        targetDate: goalDate,
      });
      if (res.data?.status === 'success') {
        setGoalSuccessMsg(`Goal "${goalName}" successfully set!`);
        setGoalName('');
        setGoalTarget('');
        setGoalSavings('');
        setGoalDate('');
        fetchGoals();
        fetchNotifications();
        fetchEmergencyFund();
        setTimeout(() => setGoalSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create goal');
    }
  };

  const handlePlanTrip = async (e) => {
    e.preventDefault();
    if (!tripDest || !tripTravelers || !tripStart || !tripEnd || !tripBudget) {
      alert('Please fill out all trip parameters');
      return;
    }
    setTripLoading(true);
    try {
      const res = await axios.post('/trip-planner', {
        destination: tripDest,
        numberOfTravelers: tripTravelers,
        startDate: tripStart,
        endDate: tripEnd,
        budget: tripBudget,
      });
      if (res.data?.status === 'success') {
        setTripResult(res.data.data);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to evaluate trip plans');
    } finally {
      setTripLoading(false);
    }
  };

  const handleAnalyzeDebt = async (e) => {
    e.preventDefault();
    if (!debtAmount || !debtEmi) {
      alert('Please provide debt amount and EMI');
      return;
    }
    setDebtLoading(true);
    try {
      const res = await axios.post('/debt-analysis', {
        totalDebt: debtAmount,
        emiAmount: debtEmi,
      });
      if (res.data?.status === 'success') {
        setDebtResult(res.data.data);
        fetchNotifications();
        fetchRecommendations();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to analyze debt rescue plan');
    } finally {
      setDebtLoading(false);
    }
  };

  const handleCalculateRetirement = async (e) => {
    e.preventDefault();
    if (!retCurrentAge || !retRetireAge || !retSavings || !retInvestment) {
      alert('Please provide all retirement parameters');
      return;
    }
    setRetLoading(true);
    try {
      const res = await axios.post('/retirement-plan', {
        currentAge: retCurrentAge,
        retirementAge: retRetireAge,
        currentSavings: retSavings,
        monthlyInvestment: retInvestment,
      });
      if (res.data?.status === 'success') {
        setRetResult(res.data);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to calculate retirement corpus. Make sure AI Engine is running.');
    } finally {
      setRetLoading(false);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await axios.post('/notifications/read');
      fetchNotifications();
    } catch (err) {
      console.error(err);
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
  const pieData = expenseCategories.map(cat => ({ name: cat.category, value: cat.amount }));
  const barData = [{ name: 'Cash Flow', Income: totalIncome, Expenses: totalExpenses }];
  const COLORS = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
  const gaugeData = [{ value: healthScore, color: healthColor }, { value: 100 - healthScore, color: '#1f2937' }];

  // Unread notifications count
  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return (
    <div className="main-content">
      {/* Financial Cockpit Header */}
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

      {/* Interactive Tabs Menu */}
      <div style={styles.tabsContainer}>
        <button 
          style={{ ...styles.tabButton, ...(activeTab === 'overview' ? styles.activeTabButton : {}) }} 
          onClick={() => setActiveTab('overview')}
        >
          <Award size={16} /> Overview
        </button>
        <button 
          style={{ ...styles.tabButton, ...(activeTab === 'goals' ? styles.activeTabButton : {}) }} 
          onClick={() => setActiveTab('goals')}
        >
          <Target size={16} /> Goal Tracker
        </button>
        <button 
          style={{ ...styles.tabButton, ...(activeTab === 'trips' ? styles.activeTabButton : {}) }} 
          onClick={() => setActiveTab('trips')}
        >
          <Plane size={16} /> Trip Planner
        </button>
        <button 
          style={{ ...styles.tabButton, ...(activeTab === 'debt' ? styles.activeTabButton : {}) }} 
          onClick={() => setActiveTab('debt')}
        >
          <CreditCard size={16} /> Debt & Subscriptions
        </button>
        <button 
          style={{ ...styles.tabButton, ...(activeTab === 'retirement' ? styles.activeTabButton : {}) }} 
          onClick={() => setActiveTab('retirement')}
        >
          <PiggyBank size={16} /> Retirement & Forecasts
        </button>
        <button 
          style={{ ...styles.tabButton, ...(activeTab === 'notifications' ? styles.activeTabButton : {}) }} 
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={16} /> Alerts {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
        </button>
      </div>

      {/* ----------------------------------------------------
          TAB: OVERVIEW
          ---------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in">
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

          {/* Quick Metrics and Gauge Grid */}
          <div className="grid-cols-4" style={styles.statsGrid}>
            <div className="glass-card" style={styles.statCard}>
              <div style={styles.statIconContainer(true)}>
                <ArrowUpRight size={24} style={{ color: '#10b981' }} />
              </div>
              <div>
                <p style={styles.statLabel}>Total Income</p>
                <h3 style={styles.statValue}>₹{totalIncome.toLocaleString()}</h3>
              </div>
            </div>

            <div className="glass-card" style={styles.statCard}>
              <div style={styles.statIconContainer(false)}>
                <ArrowDownRight size={24} style={{ color: '#ef4444' }} />
              </div>
              <div>
                <p style={styles.statLabel}>Total Expenses</p>
                <h3 style={styles.statValue}>₹{totalExpenses.toLocaleString()}</h3>
              </div>
            </div>

            <div className="glass-card" style={styles.statCard}>
              <div style={styles.statIconContainer(totalSavings >= 0)}>
                <Wallet size={24} style={{ color: totalSavings >= 0 ? '#06b6d4' : '#ef4444' }} />
              </div>
              <div>
                <p style={styles.statLabel}>Remaining Savings</p>
                <h3 style={styles.statValue}>₹{totalSavings.toLocaleString()}</h3>
              </div>
            </div>

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

          {/* Double Column: Charts & Quick Widgets */}
          <div className="grid-cols-2" style={{ marginBottom: '32px' }}>
            {/* Recharts Pie Chart */}
            <div className="glass-card" style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Expense Breakdown by Category</h3>
              {pieData.length > 0 ? (
                <div style={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
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

            {/* Emergency Fund Widget & AI Recommendations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Emergency Fund Calculator Widget */}
              <div className="glass-card">
                <div style={styles.widgetHeader}>
                  <PiggyBank size={20} style={{ color: '#06b6d4' }} />
                  <h3 style={styles.widgetTitle}>Emergency Readiness</h3>
                </div>
                {emergencyData ? (
                  <div>
                    <div style={styles.readinessContainer}>
                      <span style={styles.readinessScore}>{emergencyData.currentEmergencyReadiness}%</span>
                      <span style={styles.readinessLabel}>Readiness Score</span>
                    </div>
                    {/* Progress Bar */}
                    <div style={styles.progressBarBg}>
                      <div style={{ ...styles.progressBarFill('#06b6d4'), width: `${emergencyData.currentEmergencyReadiness}%` }}></div>
                    </div>
                    <div style={styles.fundDetails}>
                      <div style={styles.fundRow}>
                        <span>Current Emergency Savings:</span>
                        <strong style={{ color: '#cbd5e1' }}>₹{emergencyData.currentSavings.toLocaleString()}</strong>
                      </div>
                      <div style={styles.fundRow}>
                        <span>6-Month Safety Target:</span>
                        <strong style={{ color: '#06b6d4' }}>₹{emergencyData.fund6Month.toLocaleString()}</strong>
                      </div>
                      <div style={styles.fundRow}>
                        <span>3-Month (Min) / 12-Month (Max):</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>₹{emergencyData.fund3Month.toLocaleString()} / ₹{emergencyData.fund12Month.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#64748b', fontSize: '13px' }}>Calculating safety margins...</p>
                )}
              </div>

              {/* AI Recommendation Engine Panel */}
              <div className="glass-card" style={{ flex: 1 }}>
                <div style={styles.widgetHeader}>
                  <Sparkles size={20} style={{ color: '#a855f7' }} />
                  <h3 style={styles.widgetTitle}>Smart Financial Advice</h3>
                </div>
                {recLoading ? (
                  <p style={{ color: '#94a3b8', fontSize: '13px' }}>Generating smart strategies...</p>
                ) : recommendations.length > 0 ? (
                  <ul style={styles.recommendationList}>
                    {recommendations.slice(0, 3).map((rec, idx) => (
                      <li key={idx} style={styles.recItem}>
                        <div style={styles.recDot}></div>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: '#64748b', fontSize: '13px' }}>No recommendations yet. Run diagnostics or upload data to trigger.</p>
                )}
              </div>
            </div>
          </div>

          {/* Double Column: Cashflow and Notification Center */}
          <div className="grid-cols-2" style={{ marginBottom: '32px' }}>
            {/* Income vs Expenses Bar Chart */}
            <div className="glass-card" style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Income vs. Expense</h3>
              {totalIncome > 0 || totalExpenses > 0 ? (
                <div style={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={240}>
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

            {/* Notification Center */}
            <div className="glass-card" style={styles.chartCard}>
              <div style={{ ...styles.widgetHeader, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={20} style={{ color: '#ef4444' }} />
                  <h3 style={styles.widgetTitle}>Notifications Center</h3>
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllNotificationsRead} style={styles.clearBtn}>
                    <Check size={14} /> Mark all read
                  </button>
                )}
              </div>
              <div style={styles.notifScrollBox}>
                {notifLoading ? (
                  <p style={{ color: '#94a3b8', fontSize: '13px' }}>Checking alert queues...</p>
                ) : notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notif) => (
                    <div key={notif._id} style={styles.notifCard(notif.status === 'unread')}>
                      <div style={styles.notifDot(notif.status === 'unread')}></div>
                      <div style={{ flex: 1 }}>
                        <p style={styles.notifMsg}>{notif.message}</p>
                        <span style={styles.notifDate}>{new Date(notif.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', marginTop: '60px' }}>Your financial health is stable. No alerts generated.</p>
                )}
              </div>
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
      )}

      {/* ----------------------------------------------------
          TAB: GOAL PLANNER
          ---------------------------------------------------- */}
      {activeTab === 'goals' && (
        <div className="animate-fade-in">
          <div className="grid-cols-3" style={{ alignItems: 'start' }}>
            {/* Create Goal Form */}
            <div className="glass-card" style={{ gridColumn: 'span 1' }}>
              <div style={styles.widgetHeader}>
                <Target size={20} style={{ color: '#6366f1' }} />
                <h3 style={styles.widgetTitle}>Set New Financial Goal</h3>
              </div>
              <form onSubmit={handleCreateGoal} style={{ marginTop: '16px' }}>
                {goalSuccessMsg && <div className="alert alert-success">{goalSuccessMsg}</div>}
                
                <div className="form-group">
                  <label className="form-label">Goal Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Buy Tesla, Dream House" 
                    className="form-input" 
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Amount (₹)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 1500000" 
                    className="form-input" 
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Savings (₹)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 200000" 
                    className="form-input" 
                    value={goalSavings}
                    onChange={(e) => setGoalSavings(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={goalDate}
                    onChange={(e) => setGoalDate(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
                  <PlusCircle size={16} /> Save Goal
                </button>
              </form>
            </div>

            {/* List of Goals */}
            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-card">
                <h3 style={styles.chartTitle}>Active Goals Tracker</h3>
                {goalsLoading ? (
                  <p style={{ color: '#94a3b8' }}>Recalculating goal paths...</p>
                ) : goals.length > 0 ? (
                  <div style={styles.goalsContainer}>
                    {goals.map((goal) => (
                      <div key={goal._id} style={styles.goalCard}>
                        <div style={styles.goalHeader}>
                          <div>
                            <h4 style={styles.goalNameTitle}>{goal.goalName}</h4>
                            <span style={styles.goalDeadline}>Target Date: {new Date(goal.targetDate).toLocaleDateString()}</span>
                          </div>
                          <span style={styles.probabilityBadge(goal.probability)}>
                            {goal.probability}% Achievable
                          </span>
                        </div>

                        {/* Financial figures */}
                        <div style={styles.goalValuesGrid}>
                          <div>
                            <span style={styles.goalSubLabel}>Saved / Target</span>
                            <p style={styles.goalValuesText}>₹{goal.currentSavings.toLocaleString()} / ₹{goal.targetAmount.toLocaleString()}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={styles.goalSubLabel}>Monthly Savings Needed</span>
                            <p style={styles.goalRequiredSavings}>₹{goal.monthlySavingsRequired.toLocaleString()}/mo</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                          <div style={{ ...styles.progressBarBg, flex: 1, margin: 0 }}>
                            <div style={{ ...styles.progressBarFill('#6366f1'), width: `${goal.progress}%` }}></div>
                          </div>
                          <span style={styles.progressPctText}>{goal.progress}%</span>
                        </div>

                        {/* AI Actionable Suggestion */}
                        <div style={{
                          marginTop: '16px',
                          padding: '12px',
                          borderRadius: '8px',
                          background: goal.probability < 50 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                          border: `1px solid ${goal.probability < 50 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'}`,
                          fontSize: '12.5px',
                          color: '#cbd5e1',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <Sparkles size={14} style={{ color: goal.probability < 50 ? '#ef4444' : '#10b981', flexShrink: 0 }} />
                          <span>
                            {goal.probability < 50
                              ? `Low feasibility (${goal.probability}%). Suggestion: Extend target date or SIP ₹${Math.round(goal.monthlySavingsRequired * 1.2).toLocaleString()}/mo into UTI Nifty 50 Index Fund to increase success odds.`
                              : `On Track! Suggestion: Automate a monthly transfer of ₹${goal.monthlySavingsRequired.toLocaleString()} to Unity Small Finance Bank FD at 9.0% rate or Parag Parikh Flexi Cap Fund.`
                            }
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                    <Target size={40} style={{ marginBottom: '12px' }} />
                    <p>No financial goals set. Fill in the form on the left to start planning!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB: TRIP PLANNER
          ---------------------------------------------------- */}
      {activeTab === 'trips' && (
        <div className="animate-fade-in">
          <div className="grid-cols-3" style={{ alignItems: 'start' }}>
            {/* Input fields */}
            <div className="glass-card">
              <div style={styles.widgetHeader}>
                <Plane size={20} style={{ color: '#06b6d4' }} />
                <h3 style={styles.widgetTitle}>Plan Vacation</h3>
              </div>
              <form onSubmit={handlePlanTrip} style={{ marginTop: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Destination</label>
                  <select 
                    className="form-select"
                    value={tripDest}
                    onChange={(e) => setTripDest(e.target.value)}
                  >
                    <option value="Paris">Paris (France)</option>
                    <option value="Tokyo">Tokyo (Japan)</option>
                    <option value="Goa">Goa (India)</option>
                    <option value="New York">New York (USA)</option>
                    <option value="Bali">Bali (Indonesia)</option>
                    <option value="London">London (UK)</option>
                    <option value="Switzerland">Switzerland (Custom)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Number of Travelers</label>
                  <input 
                    type="number" 
                    min="1"
                    className="form-input" 
                    value={tripTravelers}
                    onChange={(e) => setTripTravelers(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={tripStart}
                    onChange={(e) => setTripStart(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={tripEnd}
                    onChange={(e) => setTripEnd(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Trip Budget (₹)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={tripBudget}
                    onChange={(e) => setTripBudget(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-secondary" style={{ width: '100%', marginTop: '12px' }} disabled={tripLoading}>
                  {tripLoading ? 'Estimating cost...' : 'Verify Travel Safety'}
                </button>
              </form>
            </div>

            {/* Cost evaluation results */}
            <div style={{ gridColumn: 'span 2' }}>
              <div className="glass-card" style={{ minHeight: '400px' }}>
                <h3 style={styles.chartTitle}>Travel Cost Diagnostic</h3>
                {tripResult ? (
                  <div className="animate-fade-in">
                    {/* Recommendation Flag Banner */}
                    <div style={styles.tripFlagBanner(tripResult.recommendation === 'Safe To Travel')}>
                      {tripResult.recommendation === 'Safe To Travel' ? (
                        <CheckCircle size={28} style={{ color: '#10b981' }} />
                      ) : (
                        <AlertTriangle size={28} style={{ color: '#ef4444' }} />
                      )}
                      <div>
                        <h4 style={styles.tripFlagTitle}>Recommendation: {tripResult.recommendation}</h4>
                        <p style={styles.tripFlagDesc}>
                          {tripResult.recommendation === 'Safe To Travel' 
                            ? 'Your estimated cost is covered by your budget and available liquid savings margins!' 
                            : 'Travel is not recommended at this time because costs exceed your set budget or savings threshold.'}
                        </p>
                      </div>
                    </div>

                    <div style={styles.tripSummaryGrid}>
                      <div style={styles.tripSummaryCard}>
                        <span style={styles.tripSummaryLabel}>Trip Duration</span>
                        <p style={styles.tripSummaryValue}>{tripResult.days} Days</p>
                      </div>
                      <div style={styles.tripSummaryCard}>
                        <span style={styles.tripSummaryLabel}>Estimated Cost</span>
                        <p style={styles.tripSummaryValue}><span style={{ color: '#ec4899' }}>₹{tripResult.estimatedCost.toLocaleString()}</span></p>
                      </div>
                      <div style={styles.tripSummaryCard}>
                        <span style={styles.tripSummaryLabel}>Budget Remaining</span>
                        <p style={{ ...styles.tripSummaryValue, color: tripResult.budgetRemaining >= 0 ? '#10b981' : '#ef4444' }}>
                          ₹{tripResult.budgetRemaining.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* AI travel suggestion */}
                    <div style={{
                      marginTop: '20px',
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(6, 182, 212, 0.05)',
                      border: '1px solid rgba(6, 182, 212, 0.15)',
                      fontSize: '13px',
                      color: '#cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Sparkles size={14} style={{ color: '#06b6d4', flexShrink: 0 }} />
                      <span>
                        {tripResult.recommendation === 'Safe To Travel'
                          ? `Awesome choice! Travel suggestion: Lock in your accommodation 60 days ahead. Save 3.5% on FX markups by using a zero-markup travel credit card like Scapia or Niyo Global.`
                          : `Budget constraint detected. Suggestion: Look into the alternative domestic options below, or create a targeted Trip Savings Goal on the Goal Planner tab.`
                        }
                      </span>
                    </div>

                    {/* Alternative options if Not Recommended */}
                    {tripResult.affordableOptions && tripResult.affordableOptions.length > 0 && (
                      <div style={{ marginTop: '28px' }}>
                        <h4 style={{ ...styles.chartTitle, fontSize: '16px', marginBottom: '12px' }}>
                          Affordable Alternative Destinations
                        </h4>
                        <div style={styles.alternativesGrid}>
                          {tripResult.affordableOptions.map((opt, i) => (
                            <div key={i} style={styles.alternativeCard}>
                              <strong style={{ color: '#ffffff' }}>{opt.destination}</strong>
                              <span style={{ fontSize: '13px', color: '#94a3b8' }}>Est. Cost: ₹{opt.estimatedCost.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                    <Plane size={40} style={{ marginBottom: '12px' }} />
                    <p>Enter your dates and destination in the left pane to check if it's safe to travel.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB: DEBT & SUBSCRIPTIONS
          ---------------------------------------------------- */}
      {activeTab === 'debt' && (
        <div className="animate-fade-in">
          {/* Debt Rescue Planner Section */}
          <div className="grid-cols-3" style={{ alignItems: 'start', marginBottom: '32px' }}>
            {/* Form */}
            <div className="glass-card">
              <div style={styles.widgetHeader}>
                <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                <h3 style={styles.widgetTitle}>Debt Assessment Form</h3>
              </div>
              <form onSubmit={handleAnalyzeDebt} style={{ marginTop: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Total Debt Outstandings (₹)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 500000" 
                    className="form-input" 
                    value={debtAmount}
                    onChange={(e) => setDebtAmount(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly EMI Payments (₹)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 25000" 
                    className="form-input" 
                    value={debtEmi}
                    onChange={(e) => setDebtEmi(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-danger" style={{ width: '100%', marginTop: '12px' }} disabled={debtLoading}>
                  {debtLoading ? 'Analyzing debt risk...' : 'Evaluate Debt Health'}
                </button>
              </form>
            </div>

            {/* Output */}
            <div style={{ gridColumn: 'span 2' }}>
              <div className="glass-card" style={{ minHeight: '320px' }}>
                <h3 style={styles.chartTitle}>Debt Rescue Plan</h3>
                {debtResult ? (
                  <div className="animate-fade-in">
                    {/* Score Summary */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                      <div>
                        <span style={styles.statLabel}>Risk Category</span>
                        <h4 style={{ ...styles.healthRating, color: getHealthColor(debtResult.category), justifyContent: 'flex-start', fontSize: '24px', marginTop: '4px' }}>
                          {debtResult.category} Risk
                        </h4>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={styles.statLabel}>Debt Risk Score</span>
                        <h4 style={{ fontSize: '32px', color: '#ffffff', fontWeight: 800 }}>{debtResult.debtRiskScore}<span style={{ fontSize: '16px', color: '#64748b' }}>/100</span></h4>
                      </div>
                    </div>

                    {/* Progress Bar of Risk */}
                    <div style={{ ...styles.progressBarBg, marginBottom: '24px' }}>
                      <div style={{ ...styles.progressBarFill(getHealthColor(debtResult.category)), width: `${debtResult.debtRiskScore}%` }}></div>
                    </div>

                    {/* Repayment Text */}
                    <div style={styles.repaymentTextBox}>
                      <h4 style={{ color: '#ffffff', marginBottom: '8px', fontSize: '15px', fontWeight: 600 }}>Accelerated Repayment Strategy:</h4>
                      <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' }}>{debtResult.repaymentPlan}</p>
                    </div>

                    {/* Priority List */}
                    <div style={{ marginTop: '20px' }}>
                      <h4 style={{ color: '#ffffff', marginBottom: '8px', fontSize: '15px', fontWeight: 600 }}>Debt Payoff Priority Order:</h4>
                      <ul style={{ paddingLeft: '20px', color: '#94a3b8', fontSize: '13px', lineHeight: '1.8' }}>
                        {debtResult.priorityList.map((item, idx) => (
                          <li key={idx} style={{ color: idx === 0 ? '#fca5a5' : '#cbd5e1' }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                    <CreditCard size={40} style={{ marginBottom: '12px' }} />
                    <p>Enter your outstanding debt details in the form to generate risk scores and a rescue timeline.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subscription Analyzer Section */}
          <div className="glass-card">
            <div style={{ ...styles.widgetHeader, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={20} style={{ color: '#a855f7' }} />
                <h3 style={styles.chartTitle}>Subscription Leakage Analyzer</h3>
              </div>
              {subsData && (
                <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                  Total Monthly Cost: <strong style={{ color: '#ef4444' }}>₹{subsData.monthlySubscriptionCost.toLocaleString()}</strong>
                </div>
              )}
            </div>

            {subsLoading ? (
              <p style={{ color: '#94a3b8' }}>Scanning debit transactions for recurring subscription spikes...</p>
            ) : subsData ? (
              <div>
                <div style={styles.subLeakageStats}>
                  <div style={styles.leakageCard}>
                    <span>Monthly Cost</span>
                    <strong style={{ color: '#ef4444' }}>₹{subsData.monthlySubscriptionCost}</strong>
                  </div>
                  <div style={styles.leakageCard}>
                    <span>Annual Cost</span>
                    <strong>₹{subsData.yearlySubscriptionCost}</strong>
                  </div>
                  <div style={styles.leakageCard}>
                    <span>Possible Savings</span>
                    <strong style={{ color: '#10b981' }}>₹{subsData.possibleSavings}/mo</strong>
                  </div>
                </div>

                <div style={{ ...styles.tableWrapper, marginTop: '20px' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeadRow}>
                        <th style={styles.tableHeader}>Subscription Service</th>
                        <th style={styles.tableHeader}>Category</th>
                        <th style={styles.tableHeader}>Billing Interval</th>
                        <th style={styles.tableHeaderAlignRight}>Monthly Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subsData.subscriptions.map((sub, i) => (
                        <tr key={i} style={styles.tableRow}>
                          <td style={styles.tableCellBold}>{sub.name}</td>
                          <td style={styles.tableCell}>
                            <span style={styles.categoryBadge}>{sub.category}</span>
                          </td>
                          <td style={styles.tableCell}>Monthly (Automatic)</td>
                          <td style={{ ...styles.tableCellAlignRight('Debit'), color: '#ef4444' }}>
                            -₹{sub.monthlyCost.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p style={{ color: '#64748b' }}>Upload statement to scan matching subscription data.</p>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB: RETIREMENT & FORECASTS
          ---------------------------------------------------- */}
      {activeTab === 'retirement' && (
        <div className="animate-fade-in">
          {/* Retirement Planner Row */}
          <div className="grid-cols-3" style={{ alignItems: 'start', marginBottom: '32px' }}>
            <div className="glass-card">
              <div style={styles.widgetHeader}>
                <PiggyBank size={20} style={{ color: '#10b981' }} />
                <h3 style={styles.widgetTitle}>Retirement Planner</h3>
              </div>
              <form onSubmit={handleCalculateRetirement} style={{ marginTop: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Current Age (years)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 25" 
                    className="form-input" 
                    value={retCurrentAge}
                    onChange={(e) => setRetCurrentAge(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Retirement Target Age (years)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 60" 
                    className="form-input" 
                    value={retRetireAge}
                    onChange={(e) => setRetRetireAge(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Savings (₹)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 100000" 
                    className="form-input" 
                    value={retSavings}
                    onChange={(e) => setRetSavings(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Retirement Investment (₹)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 15000" 
                    className="form-input" 
                    value={retInvestment}
                    onChange={(e) => setRetInvestment(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={retLoading}>
                  {retLoading ? 'Running Scikit-learn Linear Regressor...' : 'Calculate Retirement Gap'}
                </button>
              </form>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <div className="glass-card" style={{ minHeight: '380px' }}>
                <h3 style={styles.chartTitle}>Linear Regression Projection Output</h3>
                {retResult ? (
                  <div className="animate-fade-in">
                    <div style={styles.tripSummaryGrid}>
                      <div style={styles.tripSummaryCard}>
                        <span style={styles.tripSummaryLabel}>Projected Corpus at Age {retRetireAge}</span>
                        <p style={{ ...styles.tripSummaryValue, color: '#10b981' }}>
                          ₹{Math.round(retResult.projected_corpus).toLocaleString()}
                        </p>
                      </div>
                      <div style={styles.tripSummaryCard}>
                        <span style={styles.tripSummaryLabel}>Required Corpus (Inflation Adjusted)</span>
                        <p style={styles.tripSummaryValue}>₹{Math.round(retResult.required_corpus).toLocaleString()}</p>
                      </div>
                      <div style={styles.tripSummaryCard}>
                        <span style={styles.tripSummaryLabel}>Corpus Gap Status</span>
                        <p style={{ ...styles.tripSummaryValue, color: retResult.gap_status === 'On Track' ? '#10b981' : '#ef4444' }}>
                          ₹{Math.round(Math.abs(retResult.gap)).toLocaleString()} ({retResult.gap_status})
                        </p>
                      </div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                      <h4 style={{ color: '#ffffff', fontSize: '14px', marginBottom: '8px' }}>Projected Savings Growth Path:</h4>
                      <div style={{ height: '140px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={retResult.compounded_projection.map((val, idx) => ({ Year: idx, Corpus: val }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="Year" stroke="#94a3b8" />
                            <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Corpus']} />
                            <Line type="monotone" dataKey="Corpus" stroke="#10b981" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                    <PiggyBank size={40} style={{ marginBottom: '12px' }} />
                    <p>Provide retirement values on the left and submit to project compound interest pathways using ML regression lines.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Forecasting & Spending Insights */}
          <div className="grid-cols-2">
            {/* Forecast Widget */}
            <div className="glass-card">
              <h3 style={styles.chartTitle}>Financial Forecast Graph (Linear Regression)</h3>
              {forecastLoading ? (
                <p style={{ color: '#94a3b8' }}>Fitting monthly ledger trendlines...</p>
              ) : forecastData ? (
                <div>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                    <div style={styles.leakageCard}>
                      <span>12-Month Projected Savings</span>
                      <strong style={{ color: '#10b981' }}>₹{forecastData.savings_forecast['12M'].toLocaleString()}</strong>
                    </div>
                    <div style={styles.leakageCard}>
                      <span>12-Month Projected Expenses</span>
                      <strong style={{ color: '#ef4444' }}>₹{forecastData.expenses_forecast['12M'].toLocaleString()}</strong>
                    </div>
                  </div>

                  <div style={{ height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={forecastData.historical_expenses.map((val, idx) => ({
                        Month: forecastData.months[idx],
                        Expenses: val,
                        Savings: forecastData.historical_savings[idx]
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="Month" stroke="#94a3b8" />
                        <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`]} />
                        <Legend />
                        <Line type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} />
                        <Line type="monotone" dataKey="Savings" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#64748b' }}>Forecast data not loaded.</p>
              )}
            </div>

            {/* Pandas Spending Insights Seaborn Heatmap */}
            <div className="glass-card">
              <h3 style={styles.chartTitle}>Spending Trends (Pandas EDA Heatmap)</h3>
              {insightsLoading ? (
                <p style={{ color: '#94a3b8' }}>Generating Seaborn Day-of-Week density matrix...</p>
              ) : insightsData?.heatmap ? (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                    <img 
                      src={`data:image/png;base64,${insightsData.heatmap}`} 
                      alt="Seaborn Heatmap Chart" 
                      style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }} 
                    />
                  </div>
                  <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                    <p>Highest Spending Month: <strong style={{ color: '#ef4444' }}>{insightsData.highest_month}</strong></p>
                    <p>Average Monthly Savings: <strong style={{ color: '#10b981' }}>₹{Math.round(insightsData.average_monthly_savings).toLocaleString()}</strong></p>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#64748b' }}>Insights data not loaded. Please upload standard CSV statement first.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB: SMART NOTIFICATIONS CENTER
          ---------------------------------------------------- */}
      {activeTab === 'notifications' && (
        <div className="glass-card animate-fade-in" style={{ minHeight: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
            <h3 style={styles.chartTitle}>Notifications Center ({notifications.length} Alerts)</h3>
            {unreadCount > 0 && (
              <button className="btn btn-outline" onClick={markAllNotificationsRead}>
                <Check size={16} /> Mark All as Read
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div key={notif._id} style={styles.notifPageCard(notif.status === 'unread')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <div style={styles.notifDot(notif.status === 'unread')}></div>
                    <span style={styles.notifPageType(notif.type)}>{notif.type.replace('_', ' ').toUpperCase()}</span>
                    <span style={styles.notifPageDate}>{new Date(notif.createdAt).toLocaleString()}</span>
                  </div>
                  <p style={{ color: '#cbd5e1', fontSize: '14px', paddingLeft: '18px' }}>{notif.message}</p>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '80px', color: '#64748b' }}>
                <Bell size={48} style={{ marginBottom: '16px', color: '#64748b' }} />
                <p>No new financial alerts. Your account status is healthy!</p>
              </div>
            )}
          </div>
        </div>
      )}
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
    marginBottom: '24px',
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
  tabsContainer: {
    display: 'flex',
    gap: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '0',
    marginBottom: '32px',
    overflowX: 'auto',
    scrollbarWidth: 'none',
  },
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#94a3b8',
    padding: '12px 18px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    fontFamily: 'Outfit, sans-serif'
  },
  activeTabButton: {
    color: '#6366f1',
    borderBottom: '2px solid #6366f1',
  },
  badge: {
    background: '#ef4444',
    color: '#ffffff',
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '8px',
    fontWeight: 700,
    marginLeft: '4px'
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
  },
  widgetHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '14px'
  },
  widgetTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif'
  },
  readinessContainer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    marginBottom: '10px'
  },
  readinessScore: {
    fontSize: '36px',
    fontWeight: 800,
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif'
  },
  readinessLabel: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  progressBarBg: {
    width: '100%',
    height: '8px',
    background: '#1f2937',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '16px'
  },
  progressBarFill: (color) => ({
    height: '100%',
    background: color,
    borderRadius: '4px',
    transition: 'width 0.4s ease'
  }),
  fundDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontSize: '13px',
    color: '#94a3b8'
  },
  fundRow: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  recommendationList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: 0,
    marginTop: '12px'
  },
  recItem: {
    display: 'flex',
    gap: '10px',
    fontSize: '13.5px',
    color: '#cbd5e1',
    lineHeight: '1.5'
  },
  recDot: {
    width: '6px',
    height: '6px',
    background: '#a855f7',
    borderRadius: '50%',
    marginTop: '6px',
    flexShrink: 0
  },
  clearBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: 500,
  },
  notifScrollBox: {
    maxHeight: '235px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  notifCard: (isUnread) => ({
    background: isUnread ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)',
    border: isUnread ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid rgba(255,255,255,0.04)',
    padding: '12px 14px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px'
  }),
  notifDot: (isUnread) => ({
    width: '8px',
    height: '8px',
    background: isUnread ? '#ef4444' : '#64748b',
    borderRadius: '50%',
    marginTop: '5px',
    flexShrink: 0
  }),
  notifMsg: {
    fontSize: '13px',
    color: '#cbd5e1',
    lineHeight: '1.4'
  },
  notifDate: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '4px',
    display: 'block'
  },
  goalsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  goalCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
    padding: '16px 20px',
    transition: 'all 0.2s ease',
  },
  goalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  goalNameTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif'
  },
  goalDeadline: {
    fontSize: '12px',
    color: '#64748b'
  },
  probabilityBadge: (prob) => {
    let bg = 'rgba(16, 185, 129, 0.1)';
    let text = '#a7f3d0';
    if (prob < 50) {
      bg = 'rgba(239, 68, 68, 0.1)';
      text = '#fca5a5';
    } else if (prob < 80) {
      bg = 'rgba(245, 158, 11, 0.1)';
      text = '#fde68a';
    }
    return {
      background: bg,
      color: text,
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 700,
    };
  },
  goalValuesGrid: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '12px',
    marginBottom: '4px'
  },
  goalSubLabel: {
    fontSize: '11px',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  goalValuesText: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#cbd5e1'
  },
  goalRequiredSavings: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#6366f1',
    fontFamily: 'Outfit, sans-serif'
  },
  progressPctText: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#ffffff',
    minWidth: '32px',
    textAlign: 'right'
  },
  tripFlagBanner: (isSafe) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    background: isSafe ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
    border: isSafe ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)',
    padding: '16px 20px',
    borderRadius: '12px',
    marginBottom: '24px'
  }),
  tripFlagTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '4px',
    fontFamily: 'Outfit, sans-serif'
  },
  tripFlagDesc: {
    fontSize: '13.5px',
    color: '#cbd5e1',
    lineHeight: '1.4'
  },
  tripSummaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  },
  tripSummaryCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '8px',
    padding: '14px 16px',
    textAlign: 'center'
  },
  tripSummaryLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    display: 'block',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  tripSummaryValue: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif'
  },
  alternativesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px'
  },
  alternativeCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '8px',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  repaymentTextBox: {
    background: 'rgba(99, 102, 241, 0.04)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    padding: '16px 20px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  subLeakageStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginTop: '16px'
  },
  leakageCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '8px',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '13px',
    color: '#94a3b8'
  },
  notifPageCard: (isUnread) => ({
    background: isUnread ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.01)',
    border: isUnread ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid rgba(255,255,255,0.05)',
    padding: '16px 20px',
    borderRadius: '12px'
  }),
  notifPageType: (type) => {
    let color = '#a855f7';
    if (type.includes('goal')) color = '#6366f1';
    else if (type.includes('spending')) color = '#f59e0b';
    else if (type.includes('emi') || type.includes('drop')) color = '#ef4444';
    return {
      fontSize: '11px',
      color: color,
      fontWeight: 700,
      background: 'rgba(255,255,255,0.04)',
      padding: '2px 8px',
      borderRadius: '4px'
    };
  },
  notifPageDate: {
    fontSize: '11px',
    color: '#64748b'
  }
};

export default Dashboard;
