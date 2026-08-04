import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';

const Dashboard = () => {
  const { user, t } = useContext(AuthContext);
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
    fetchGoals();
    fetchEmergencyFund();
    fetchSubscriptions();
    fetchForecast();
    fetchInsights();
    fetchNotifications();
    fetchRecommendations();
  }, []);

  // ----------------------------------------------------
  // Action Handlers
  // ----------------------------------------------------

  const runAiDiagnostics = async () => {
    setAiLoading(true);
    try {
      const res = await axios.post('/ai/diagnostics');
      if (res.data?.status === 'success') {
        setAiResult(res.data.data);
        fetchDashboardData(); // Refresh summary values
      }
    } catch (err) {
      console.error(err);
      alert('Failed to execute Random Forest Classifier diagnostic.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!goalName || !goalTarget || !goalSavings || !goalDate) {
      alert('Please fill in all goal fields');
      return;
    }
    try {
      const res = await axios.post('/goals', {
        goalName,
        targetAmount: Number(goalTarget),
        currentSavings: Number(goalSavings),
        targetDate: goalDate
      });
      if (res.data?.status === 'success') {
        setGoalSuccessMsg('Goal successfully added to tracking schedule!');
        setGoalName('');
        setGoalTarget('');
        setGoalSavings('');
        setGoalDate('');
        fetchGoals();
        setTimeout(() => setGoalSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save financial goal.');
    }
  };

  const handleAnalyzeTrip = async (e) => {
    e.preventDefault();
    if (!tripDest || !tripTravelers || !tripStart || !tripEnd || !tripBudget) {
      alert('Please fill in all travel assessment parameters.');
      return;
    }
    setTripLoading(true);
    try {
      const res = await axios.post('/ai/assess-trip', {
        destination: tripDest,
        travelers: Number(tripTravelers),
        startDate: tripStart,
        endDate: tripEnd,
        budget: Number(tripBudget)
      });
      if (res.data?.status === 'success') {
        setTripResult(res.data.data);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to evaluate travel feasibility.');
    } finally {
      setTripLoading(false);
    }
  };

  const handleAnalyzeDebt = async (e) => {
    e.preventDefault();
    if (!debtAmount || !debtEmi) {
      alert('Please input total debt outstanding and monthly EMI');
      return;
    }
    setDebtLoading(true);
    try {
      const res = await axios.post('/ai/assess-debt', {
        totalDebt: Number(debtAmount),
        monthlyEmi: Number(debtEmi)
      });
      if (res.data?.status === 'success') {
        setDebtResult(res.data.data);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to evaluate debt risk profile.');
    } finally {
      setDebtLoading(false);
    }
  };

  const handleCalculateRetirement = async (e) => {
    e.preventDefault();
    if (!retCurrentAge || !retRetireAge || !retSavings || !retInvestment) {
      alert('Please fill in all retirement parameters.');
      return;
    }
    setRetLoading(true);
    try {
      const res = await axios.post('/ai/assess-retirement', {
        currentAge: Number(retCurrentAge),
        retireAge: Number(retRetireAge),
        currentSavings: Number(retSavings),
        monthlyInvestment: Number(retInvestment)
      });
      if (res.data?.status === 'success') {
        setRetResult(res.data.data);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to calculate retirement corpus paths.');
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

  const getHealthColor = (status) => {
    switch (status) {
      case 'Excellent':
      case 'Stable':
      case 'On Track':
        return '#10b981'; // Green
      case 'Good':
        return '#ffb59d'; // Primary Tint
      case 'Warning':
      case 'Moderate':
        return '#918cff'; // Tertiary
      case 'Critical':
      case 'High':
      case 'Deficit':
        return '#ef4444'; // Red
      default:
        return '#ff6b35'; // Brand orange
    }
  };

  // Loading & Error boundary rendering
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] md:pl-20 mt-16 text-on-surface font-sans">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary-container mb-4">refresh</span>
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Compiling ledger telemetry...</h2>
        <p className="text-on-surface-variant text-sm mt-1">Reading database records and fitting prediction vectors...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] md:pl-20 mt-16 text-on-surface font-sans p-6 text-center">
        <span className="material-symbols-outlined text-4xl text-error mb-4">error</span>
        <h2 className="font-headline-sm text-headline-sm font-bold text-error mb-2">Telemetry Retrieval Failure</h2>
        <p className="text-on-surface-variant text-sm max-w-md mb-6">{error}</p>
        <button onClick={fetchDashboardData} className="px-6 py-2.5 bg-surface-container border border-outline-variant hover:bg-surface-container-high text-on-surface text-sm font-bold rounded-full cursor-pointer">
          Reconnect Core
        </button>
      </div>
    );
  }

  // Destructure telemetry inputs
  const {
    totalIncome = 0,
    totalExpenses = 0,
    totalSavings = 0,
    healthScore = 0,
    healthStatus = 'Unknown',
    expenseCategories = [],
    recentTransactions = []
  } = data || {};

  const healthColor = getHealthColor(healthStatus);
  const pieData = expenseCategories.map(cat => ({ name: cat.category, value: cat.amount }));
  const barData = [{ name: 'Cash Flow', Income: totalIncome, Expenses: totalExpenses }];
  const COLORS = ['#ff6b35', '#918cff', '#ffb59d', '#10b981', '#c8c6c5', '#ef4444', '#474746'];
  const gaugeData = [{ value: healthScore, color: healthColor }, { value: 100 - healthScore, color: '#292a2a' }];

  // Unread notifications count
  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return (
    <div className="md:pl-20 mt-16 px-6 md:px-8 pt-10 md:pt-14 pb-6 md:pb-8 min-h-screen bg-background text-on-background font-sans max-w-[1600px] mx-auto">

      {/* Financial Cockpit Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-display-hero text-3xl font-bold tracking-tight text-on-surface m-2">  Financial Cockpit</h1>
          <p className="text-sm text-on-surface-variant mt-1 m-2">Real-time balances and machine-learning diagnostics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="px-5 py-2.5 rounded-full font-semibold border border-outline-variant hover:bg-surface-container-high text-on-surface flex items-center gap-2 text-sm transition-all duration-200 cursor-pointer"
            onClick={() => navigate('/upload')}
          >
            <span className="material-symbols-outlined text-lg">cloud_upload</span>
            Import CSV
          </button>
          <button
            className="px-5 py-2.5 rounded-full font-semibold bg-primary-container text-on-primary-container hover:bg-primary hover:scale-[1.02] shadow-md shadow-primary-container/10 flex items-center gap-2 text-sm transition-all duration-200 cursor-pointer"
            onClick={runAiDiagnostics}
            disabled={aiLoading}
          >
            <span className="material-symbols-outlined text-lg animate-pulse">psychology</span>
            {aiLoading ? 'Diagnostics Running...' : 'Run AI Diagnostic'}
          </button>
        </div>
      </div>

      {/* Interactive Tabs Menu */}
      <div className="flex gap-2 border-b border-outline-variant/60 pb-px mb-8 overflow-x-auto scrollbar-none">
        <button
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all duration-200 whitespace-nowrap cursor-pointer ${activeTab === 'overview'
            ? 'border-primary-container text-primary-container'
            : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="material-symbols-outlined text-lg">grid_view</span> Overview
        </button>
        <button
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all duration-200 whitespace-nowrap cursor-pointer ${activeTab === 'goals'
            ? 'border-primary-container text-primary-container'
            : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          onClick={() => setActiveTab('goals')}
        >
          <span className="material-symbols-outlined text-lg">track_changes</span> Goal Tracker
        </button>
        <button
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all duration-200 whitespace-nowrap cursor-pointer ${activeTab === 'trips'
            ? 'border-primary-container text-primary-container'
            : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          onClick={() => setActiveTab('trips')}
        >
          <span className="material-symbols-outlined text-lg">flight_takeoff</span> Trip Planner
        </button>
        <button
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all duration-200 whitespace-nowrap cursor-pointer ${activeTab === 'debt'
            ? 'border-primary-container text-primary-container'
            : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          onClick={() => setActiveTab('debt')}
        >
          <span className="material-symbols-outlined text-lg">credit_card</span> Debt & Subscriptions
        </button>
        <button
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all duration-200 whitespace-nowrap cursor-pointer ${activeTab === 'retirement'
            ? 'border-primary-container text-primary-container'
            : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          onClick={() => setActiveTab('retirement')}
        >
          <span className="material-symbols-outlined text-lg">savings</span> Retirement & Forecasts
        </button>
        <button
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all duration-200 whitespace-nowrap cursor-pointer relative ${activeTab === 'notifications'
            ? 'border-primary-container text-primary-container'
            : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          onClick={() => setActiveTab('notifications')}
        >
          <span className="material-symbols-outlined text-lg">notifications</span> Alerts
          {unreadCount > 0 && (
            <span className="absolute top-1 right-0 w-2 h-2 bg-error rounded-full animate-ping"></span>
          )}
        </button>
      </div>

      {/* ----------------------------------------------------
          TAB: OVERVIEW
          ---------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* AI Diagnostic Results Banner */}
          {aiResult && (
            <div className="glass-card border border-outline-variant/60 rounded-2xl p-6 relative overflow-hidden animate-fade-in" style={{ borderLeft: `4px solid ${getHealthColor(aiResult.prediction)}` }}>
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-2xl font-bold" style={{ color: getHealthColor(aiResult.prediction) }}>psychology</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface font-serif">
                  Random Forest Diagnostic: <span style={{ color: getHealthColor(aiResult.prediction) }}>{aiResult.prediction}</span>
                </h3>
              </div>
              <div className="text-sm text-on-surface-variant leading-relaxed">
                <p className="mb-4">Based on your age, spending density, debt index and savings buffer, the ML model predicts your health status is <strong className="text-on-surface">{aiResult.prediction}</strong>. Recommended corrective adjustments:</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {aiResult.suggestions.map((sug, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-on-surface-variant text-sm">
                      <span className="material-symbols-outlined text-sm font-bold mt-0.5" style={{ color: getHealthColor(aiResult.prediction) }}>check_circle</span>
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Quick Metrics and Gauge Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Income */}
            <div className="glass-card rounded-2xl p-6 flex items-center gap-5 border border-outline-variant/40 shadow-sm relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/5 rounded-full blur-xl pointer-events-none"></div>
              <div className="bg-primary-container/10 border border-primary-container/20 rounded-xl p-3.5 text-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl font-bold">arrow_upward</span>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase mb-1">Total Income</p>
                <h3 className="text-2xl font-bold font-serif text-on-surface">₹{totalIncome.toLocaleString()}</h3>
              </div>
            </div>

            {/* Total Expenses */}
            <div className="glass-card rounded-2xl p-6 flex items-center gap-5 border border-outline-variant/40 shadow-sm relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-error/5 rounded-full blur-xl pointer-events-none"></div>
              <div className="bg-error-container/10 border border-error-container/20 rounded-xl p-3.5 text-error flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl font-bold">arrow_downward</span>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase mb-1">Total Expenses</p>
                <h3 className="text-2xl font-bold font-serif text-on-surface">₹{totalExpenses.toLocaleString()}</h3>
              </div>
            </div>

            {/* Remaining Savings */}
            <div className="glass-card rounded-2xl p-6 flex items-center gap-5 border border-outline-variant/40 shadow-sm relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-tertiary-container/5 rounded-full blur-xl pointer-events-none"></div>
              <div className="bg-tertiary-container/10 border border-tertiary-container/20 rounded-xl p-3.5 text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl font-bold">wallet</span>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase mb-1">Savings Margin</p>
                <h3 className="text-2xl font-bold font-serif text-on-surface">₹{totalSavings.toLocaleString()}</h3>
              </div>
            </div>

            {/* Health Score Gauge */}
            <div className="glass-card rounded-2xl p-5 border border-outline-variant/40 shadow-sm flex items-center justify-between relative overflow-hidden">
              <div className="relative w-28 h-[70px] flex justify-center overflow-hidden">
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie
                      data={gaugeData}
                      cx="50%"
                      cy="100%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={45}
                      outerRadius={58}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      <Cell fill={healthColor} />
                      <Cell fill="#292a2a" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-on-surface">{healthScore}</span>
                  <span className="text-[8px] uppercase tracking-wider text-on-surface-variant font-bold">Score</span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase mb-1">Stability Rating</p>
                <h4 className="font-headline-sm text-headline-sm font-bold font-serif flex items-center justify-end gap-1.5" style={{ color: healthColor }}>
                  <span className="material-symbols-outlined text-lg">workspace_premium</span>
                  {healthStatus}
                </h4>
              </div>
            </div>
          </div>

          {/* Double Column: Charts & Quick Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recharts Pie Chart */}
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm min-h-[360px] flex flex-col">
              <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface mb-6">Expense Breakdown by Category</h3>
              <div className="flex-1 w-full min-h-[240px]">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2020', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}
                        itemStyle={{ color: '#e3e2e2', fontFamily: 'Inter', fontSize: '13px' }}
                        formatter={(value) => [`₹${value.toLocaleString()}`, 'Spent']}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', fontFamily: 'Inter' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-on-surface-variant font-serif">
                    No transactions found. Go to Statement Hub to upload records.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Summary Cash Flow and Recommendation */}
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm min-h-[360px] flex flex-col">
              <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4 mb-6">
                <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface">Cash Flow Analysis</h3>
                <span className="text-xs font-semibold text-on-surface-variant">Income vs Expense Buffer</span>
              </div>

              <div className="flex-1 w-full min-h-[160px] mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} barSize={45}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} style={{ fontSize: '11px' }} />
                    <YAxis stroke="#94a3b8" tickLine={false} style={{ fontSize: '11px' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2020', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}
                      itemStyle={{ color: '#e3e2e2', fontFamily: 'Inter', fontSize: '13px' }}
                      formatter={(value) => [`₹${value.toLocaleString()}`]}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Income" fill="#10b981" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Instant Advisory recommendations */}
              <div className="bg-surface-container/60 border border-outline-variant/40 rounded-xl p-4 flex gap-3 items-start">
                <span className="material-symbols-outlined text-primary-container text-xl mt-0.5">lightbulb</span>
                <div>
                  <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-1 font-serif">Quick Recommendation</h4>
                  <p className="text-[12px] text-on-surface-variant leading-relaxed">
                    {recommendations.length > 0
                      ? recommendations[0]
                      : "Upload your transaction ledger to calculate personalized cash flow recommendations and optimal investment targets."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions List */}
          <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4 mb-6">
              <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface">Recent Ledger Transactions</h3>
              <button onClick={() => setActiveTab('notifications')} className="text-xs text-primary-container font-semibold hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">history</span> View Alert History
              </button>
            </div>

            {recentTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/40">
                      <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Date</th>
                      <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Description</th>
                      <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Category</th>
                      <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Type</th>
                      <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.slice(0, 8).map((tx) => (
                      <tr key={tx._id} className="border-b border-outline-variant/20 hover:bg-surface-container/30 transition-colors">
                        <td className="py-3.5 px-4 text-sm text-on-surface-variant font-serif">{new Date(tx.date).toLocaleDateString()}</td>
                        <td className="py-3.5 px-4 text-sm text-on-surface font-semibold font-serif">{tx.description}</td>
                        <td className="py-3.5 px-4 text-sm">
                          <span className="px-2.5 py-1 text-xs bg-surface-container-high border border-outline-variant/40 rounded-lg text-on-surface-variant font-sans">
                            {tx.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-sm">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase inline-block ${tx.type === 'Credit'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={`py-3.5 px-4 text-sm font-bold text-right font-serif ${tx.type === 'Credit' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                          {tx.type === 'Debit' ? '-' : '+'}₹{tx.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-on-surface-variant font-serif">
                No transaction ledger active. Start by uploading a CSV statement.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB: GOAL PLANNER
          ---------------------------------------------------- */}
      {activeTab === 'goals' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in">
          {/* Create Goal Form */}
          <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm lg:col-span-1">
            <div className="flex items-center gap-3 border-b border-outline-variant/40 pb-4 mb-6">
              <span className="material-symbols-outlined text-primary text-xl">track_changes</span>
              <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface">Set New Financial Goal</h3>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              {goalSuccessMsg && (
                <div className="bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-400 p-4 rounded-xl text-xs">
                  {goalSuccessMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant block ml-1">Goal Title</label>
                <input
                  type="text"
                  placeholder="e.g. Buy Tesla, Dream House"
                  className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-sm"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant block ml-1">Target Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 1500000"
                  className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-sm"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant block ml-1">Initial / Current Savings (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 200000"
                  className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-sm"
                  value={goalSavings}
                  onChange={(e) => setGoalSavings(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant block ml-1">Deadline Date</label>
                <input
                  type="date"
                  className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-sm"
                  value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary-container hover:bg-primary text-on-primary-container font-semibold py-3 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer text-sm mt-6"
              >
                <span className="material-symbols-outlined text-md">add_task</span>
                Save Goal
              </button>
            </form>
          </div>

          {/* List of Goals */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm min-h-[300px]">
              <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface border-b border-outline-variant/40 pb-4 mb-6">Active Goals Tracker</h3>

              {goalsLoading ? (
                <p className="text-on-surface-variant text-sm font-serif">Recalculating goal paths...</p>
              ) : goals.length > 0 ? (
                <div className="space-y-5">
                  {goals.map((goal) => (
                    <div key={goal._id} className="bg-surface-container/40 border border-outline-variant/40 rounded-xl p-5 hover:border-primary/20 transition-all">
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <div>
                          <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface font-serif">{goal.goalName}</h4>
                          <span className="text-xs text-on-surface-variant font-serif">Target Date: {new Date(goal.targetDate).toLocaleDateString()}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${goal.probability < 50
                          ? 'bg-rose-500/10 text-rose-400'
                          : goal.probability < 80
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                          {goal.probability}% Achievable
                        </span>
                      </div>

                      {/* Financial figures */}
                      <div className="grid grid-cols-2 gap-4 my-4">
                        <div>
                          <span className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">Saved / Target</span>
                          <p className="text-sm font-semibold text-on-surface font-serif mt-0.5">₹{goal.currentSavings.toLocaleString()} / ₹{goal.targetAmount.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">Monthly Needed</span>
                          <p className="text-sm font-bold text-primary-container font-serif mt-0.5">₹{goal.monthlySavingsRequired.toLocaleString()}/mo</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex-1 bg-surface-container-high rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all duration-300"
                            style={{ width: `${goal.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-on-surface min-w-[32px] text-right font-serif">{goal.progress}%</span>
                      </div>

                      {/* AI Actionable Suggestion */}
                      <div className="bg-surface-container/60 border border-outline-variant/40 rounded-lg p-3 flex gap-2.5 items-start mt-4">
                        <span className="material-symbols-outlined text-primary-container text-lg mt-0.5">psychology</span>
                        <p className="text-[12.5px] text-on-surface-variant leading-relaxed font-serif">
                          {goal.probability < 50
                            ? `Low feasibility detected. Suggestion: Extend target date or redirect SIP ₹${Math.round(goal.monthlySavingsRequired * 1.2).toLocaleString()}/mo into a Nifty 50 Index Fund to increase success odds.`
                            : `On Track! Suggestion: Automate a monthly transfer of ₹${goal.monthlySavingsRequired.toLocaleString()} to Unity Small Finance Bank FD (9.0% rate) or Parag Parikh Flexi Cap Fund.`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-on-surface-variant font-serif">
                  No active savings goals found. Set up a target parameters in the form on the left.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB: TRIPS
          ---------------------------------------------------- */}
      {activeTab === 'trips' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in">
          {/* Trip form */}
          <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm lg:col-span-1">
            <div className="flex items-center gap-3 border-b border-outline-variant/40 pb-4 mb-6">
              <span className="material-symbols-outlined text-primary text-xl">flight_takeoff</span>
              <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface">Trip Budget Planner</h3>
            </div>

            <form onSubmit={handleAnalyzeTrip} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant block ml-1">Destination</label>
                <input
                  type="text"
                  placeholder="e.g. Paris, Goa, Tokyo"
                  className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-sm"
                  value={tripDest}
                  onChange={(e) => setTripDest(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant block ml-1">Travelers Count</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-sm"
                    value={tripTravelers}
                    onChange={(e) => setTripTravelers(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant block ml-1">Total Budget (₹)</label>
                  <input
                    type="number"
                    className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-sm"
                    value={tripBudget}
                    onChange={(e) => setTripBudget(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant block ml-1">Start Date</label>
                  <input
                    type="date"
                    className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-sm"
                    value={tripStart}
                    onChange={(e) => setTripStart(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant block ml-1">End Date</label>
                  <input
                    type="date"
                    className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-sm"
                    value={tripEnd}
                    onChange={(e) => setTripEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary-container hover:bg-primary text-on-primary-container font-semibold py-3 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer text-sm mt-6"
                disabled={tripLoading}
              >
                <span className="material-symbols-outlined text-md">explore</span>
                {tripLoading ? 'Running Feasibility Algorithms...' : 'Check Feasibility'}
              </button>
            </form>
          </div>

          {/* Trip planner Output */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm min-h-[350px]">
              <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface border-b border-outline-variant/40 pb-4 mb-6">Feasibility Evaluation</h3>

              {tripResult ? (
                <div className="space-y-6 animate-fade-in font-serif">
                  {/* Feasibility Alert */}
                  <div className={`p-5 rounded-xl border flex items-start gap-4 ${tripResult.recommendation === 'Safe To Travel'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}>
                    <span className="material-symbols-outlined text-2xl mt-0.5">
                      {tripResult.recommendation === 'Safe To Travel' ? 'verified' : 'warning'}
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-on-surface font-serif">
                        {tripResult.recommendation === 'Safe To Travel' ? 'Travel Approved' : 'Budget Warning'}
                      </h4>
                      <p className="text-sm text-on-surface-variant leading-relaxed mt-1 font-serif">
                        Our model predicts this trip is <strong>{tripResult.recommendation.toLowerCase()}</strong> based on your savings profile.
                      </p>
                    </div>
                  </div>

                  {/* Summary Indicators */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-surface-container/30 border border-outline-variant/40 rounded-xl p-4 text-center">
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1">Duration</span>
                      <strong className="text-lg font-bold text-on-surface font-serif">{tripResult.days} Days</strong>
                    </div>
                    <div className="bg-surface-container/30 border border-outline-variant/40 rounded-xl p-4 text-center">
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1">Estimated Cost</span>
                      <strong className="text-lg font-bold text-primary font-serif">₹{tripResult.estimatedCost.toLocaleString()}</strong>
                    </div>
                    <div className="bg-surface-container/30 border border-outline-variant/40 rounded-xl p-4 text-center">
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1">Budget Balance</span>
                      <strong className={`text-lg font-bold font-serif ${tripResult.budgetRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ₹{tripResult.budgetRemaining.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* AI Suggestion */}
                  <div className="bg-surface-container/60 border border-outline-variant/40 rounded-xl p-4 flex gap-3 items-start">
                    <span className="material-symbols-outlined text-primary-container text-xl mt-0.5">psychology</span>
                    <p className="text-sm text-on-surface-variant leading-relaxed font-serif">
                      {tripResult.recommendation === 'Safe To Travel'
                        ? `Aesthetic choice! Travel advisory: Book flight passes 60 days ahead. Minimize Forex charges by using a zero-markup travel credit card like Scapia or Niyo Global.`
                        : `Budget limitations detected. Recommendation: Review alternative domestic options below, or launch a dedicated Trip Savings Goal in the Goal Planner tab.`}
                    </p>
                  </div>

                  {/* Alternatives */}
                  {tripResult.affordableOptions && tripResult.affordableOptions.length > 0 && (
                    <div className="border-t border-outline-variant/40 pt-4">
                      <h4 className="text-sm font-bold text-on-surface mb-3 font-serif">Alternative Affordable Destinations</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-serif">
                        {tripResult.affordableOptions.map((opt, i) => (
                          <div key={i} className="bg-surface-container/30 border border-outline-variant/40 rounded-xl p-3.5 flex justify-between items-center">
                            <strong className="text-sm text-on-surface">{opt.destination}</strong>
                            <span className="text-xs text-primary">₹{opt.estimatedCost.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-16 text-center text-sm text-on-surface-variant font-serif flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3">flight</span>
                  <p>Provide date ranges and spending budgets to evaluate financial travel clearances.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB: DEBT & SUBSCRIPTIONS
          ---------------------------------------------------- */}
      {activeTab === 'debt' && (
        <div className="space-y-6 animate-fade-in">
          {/* Debt Rescue Planner Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Form */}
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm lg:col-span-1">
              <div className="flex items-center gap-3 border-b border-outline-variant/40 pb-4 mb-6">
                <span className="material-symbols-outlined text-rose-400 text-xl">warning</span>
                <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface">Debt Assessment</h3>
              </div>

              <form onSubmit={handleAnalyzeDebt} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant block ml-1">Total Outstanding Borrowing (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500000"
                    className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-sm"
                    value={debtAmount}
                    onChange={(e) => setDebtAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant block ml-1">Monthly EMIs Outflow (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 25000"
                    className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-sm"
                    value={debtEmi}
                    onChange={(e) => setDebtEmi(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-error hover:bg-rose-500 text-on-error font-semibold py-3 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer text-sm mt-6"
                  disabled={debtLoading}
                >
                  <span className="material-symbols-outlined text-md">analytics</span>
                  {debtLoading ? 'Analyzing debt risk...' : 'Evaluate Debt Health'}
                </button>
              </form>
            </div>

            {/* Output */}
            <div className="lg:col-span-2">
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm min-h-[320px]">
                <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface border-b border-outline-variant/40 pb-4 mb-6">Debt Rescue Strategy</h3>

                {debtResult ? (
                  <div className="space-y-6 animate-fade-in font-serif">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                      <div>
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block">Risk Category</span>
                        <h4 className="text-2xl font-bold font-serif mt-1" style={{ color: getHealthColor(debtResult.category) }}>
                          {debtResult.category} Risk Profile
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block">Debt Risk Index</span>
                        <h4 className="text-3xl font-bold text-on-surface font-serif mt-1">
                          {debtResult.debtRiskScore}<span className="text-sm text-on-surface-variant">/100</span>
                        </h4>
                      </div>
                    </div>

                    {/* Progress Bar of Risk */}
                    <div className="w-full bg-surface-container-high rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ backgroundColor: getHealthColor(debtResult.category), width: `${debtResult.debtRiskScore}%` }}
                      ></div>
                    </div>

                    {/* Repayment Text */}
                    <div className="bg-surface-container/60 border border-outline-variant/40 rounded-xl p-5 leading-relaxed text-sm">
                      <h4 className="text-sm font-bold text-on-surface mb-2 font-serif uppercase tracking-wider">Accelerated Repayment Strategy:</h4>
                      <p className="text-on-surface-variant font-serif">{debtResult.repaymentPlan}</p>
                    </div>

                    {/* Priority List */}
                    <div className="bg-surface-container/30 border border-outline-variant/20 rounded-xl p-4">
                      <h4 className="text-sm font-bold text-on-surface mb-3 font-serif">Recommended Debt Payoff Order:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-on-surface-variant font-serif">
                        {debtResult.priorityList.map((item, idx) => (
                          <li key={idx} className={idx === 0 ? 'text-rose-400 font-bold' : ''}>{item}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center text-sm text-on-surface-variant font-serif flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3">credit_score</span>
                    <p>Enter outstanding liabilities in the form to generate risk profiles and rescue paths.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subscription Analyzer Section */}
          <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-outline-variant/40 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary text-xl">layers</span>
                <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface">Subscription Leakage Scanner</h3>
              </div>
              {subsData && (
                <span className="text-xs font-semibold text-on-surface-variant">
                  Total Monthly Overhead: <strong className="text-rose-400">₹{subsData.monthlySubscriptionCost.toLocaleString()}</strong>
                </span>
              )}
            </div>

            {subsLoading ? (
              <p className="text-on-surface-variant text-sm font-serif">Scanning recurring cashflows for subscription signals...</p>
            ) : subsData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-surface-container/30 border border-outline-variant/40 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1">Monthly Cost</span>
                    <strong className="text-lg font-bold text-rose-400 font-serif">₹{subsData.monthlySubscriptionCost}</strong>
                  </div>
                  <div className="bg-surface-container/30 border border-outline-variant/40 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1">Annual Cost</span>
                    <strong className="text-lg font-bold text-on-surface font-serif">₹{subsData.yearlySubscriptionCost}</strong>
                  </div>
                  <div className="bg-surface-container/30 border border-outline-variant/40 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1">Cancel Suggestions</span>
                    <strong className="text-lg font-bold text-emerald-400 font-serif">₹{subsData.possibleSavings}/mo</strong>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-outline-variant/40">
                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Service</th>
                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Category</th>
                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Billing Type</th>
                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">Monthly Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subsData.subscriptions.map((sub, i) => (
                        <tr key={i} className="border-b border-outline-variant/20 hover:bg-surface-container/30 transition-colors">
                          <td className="py-3 px-4 text-sm text-on-surface font-semibold font-serif">{sub.name}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className="px-2 py-0.5 text-xs bg-surface-container-high rounded text-on-surface-variant font-sans">
                              {sub.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-on-surface-variant font-serif">Monthly (Automatic)</td>
                          <td className="py-3 px-4 text-sm text-right font-bold text-rose-400 font-serif">
                            -₹{sub.monthlyCost.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-on-surface-variant font-serif">
                No CSV statement detected. Scan operations will unlock once records are uploaded.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB: RETIREMENT & FORECASTS
          ---------------------------------------------------- */}
      {activeTab === 'retirement' && (
        <div className="space-y-6 animate-fade-in">
          {/* Retirement Planner Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm lg:col-span-1">
              <div className="flex items-center gap-3 border-b border-outline-variant/40 pb-4 mb-6">
                <span className="material-symbols-outlined text-emerald-400 text-xl">savings</span>
                <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface">Retirement Simulator</h3>
              </div>

              <form onSubmit={handleCalculateRetirement} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant block ml-1">Current Age (years)</label>
                  <input
                    type="number"
                    placeholder="e.g. 25"
                    className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-sm"
                    value={retCurrentAge}
                    onChange={(e) => setRetCurrentAge(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant block ml-1">Retirement Target Age</label>
                  <input
                    type="number"
                    placeholder="e.g. 60"
                    className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-sm"
                    value={retRetireAge}
                    onChange={(e) => setRetRetireAge(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant block ml-1">Current Balance Corpus (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 100000"
                    className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-sm"
                    value={retSavings}
                    onChange={(e) => setRetSavings(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant block ml-1">Monthly Investment Capacity (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-sm"
                    value={retInvestment}
                    onChange={(e) => setRetInvestment(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary-container hover:bg-primary text-on-primary-container font-semibold py-3 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer text-sm mt-6"
                  disabled={retLoading}
                >
                  <span className="material-symbols-outlined text-md">insights</span>
                  {retLoading ? 'Running ML Regressor...' : 'Calculate Retirement Gap'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2">
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm min-h-[380px] flex flex-col justify-between">
                <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface border-b border-outline-variant/40 pb-4 mb-6">ML Linear Regression Output</h3>

                {retResult ? (
                  <div className="space-y-6 animate-fade-in font-serif">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-surface-container/30 border border-outline-variant/40 rounded-xl p-4 text-center">
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1">Projected Corpus</span>
                        <strong className="text-base font-bold text-emerald-400 font-serif">₹{Math.round(retResult.projected_corpus).toLocaleString()}</strong>
                      </div>
                      <div className="bg-surface-container/30 border border-outline-variant/40 rounded-xl p-4 text-center">
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1">Required Corpus</span>
                        <strong className="text-base font-bold text-on-surface font-serif">₹{Math.round(retResult.required_corpus).toLocaleString()}</strong>
                      </div>
                      <div className="bg-surface-container/30 border border-outline-variant/40 rounded-xl p-4 text-center">
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1">Corpus Gap</span>
                        <strong className={`text-base font-bold font-serif ${retResult.gap_status === 'On Track' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ₹{Math.round(Math.abs(retResult.gap)).toLocaleString()} <span className="text-xs">({retResult.gap_status})</span>
                        </strong>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm font-bold text-on-surface mb-3 font-serif">Savings Accumulation Timeline:</h4>
                      <div className="w-full h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={retResult.compounded_projection.map((val, idx) => ({ Year: idx, Corpus: val }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="Year" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1f2020', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}
                              itemStyle={{ color: '#e3e2e2', fontFamily: 'Inter', fontSize: '13px' }}
                              formatter={(value) => [`₹${value.toLocaleString()}`, 'Corpus']}
                            />
                            <Line type="monotone" dataKey="Corpus" stroke="#ff6b35" strokeWidth={2.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center text-sm text-on-surface-variant font-serif flex flex-col items-center justify-center flex-1">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3">timeline</span>
                    <p>Enter saving parameters in the left pane to project compound interest lines.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Forecasting & Spending Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Forecast Widget */}
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm flex flex-col justify-between">
              <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface border-b border-outline-variant/40 pb-4 mb-6">Financial Forecast Graph</h3>

              {forecastLoading ? (
                <p className="text-on-surface-variant text-sm font-serif">Fitting monthly ledger trendlines...</p>
              ) : forecastData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-container/30 border border-outline-variant/40 rounded-xl p-4 text-center">
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1">12M Savings Forecast</span>
                      <strong className="text-base font-bold text-emerald-400 font-serif">₹{forecastData.savings_forecast['12M'].toLocaleString()}</strong>
                    </div>
                    <div className="bg-surface-container/30 border border-outline-variant/40 rounded-xl p-4 text-center">
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1">12M Expense Forecast</span>
                      <strong className="text-base font-bold text-rose-400 font-serif">₹{forecastData.expenses_forecast['12M'].toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="w-full h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={forecastData.historical_expenses.map((val, idx) => ({
                        Month: forecastData.months[idx],
                        Expenses: val,
                        Savings: forecastData.historical_savings[idx]
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="Month" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1f2020', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}
                          itemStyle={{ color: '#e3e2e2', fontFamily: 'Inter', fontSize: '13px' }}
                          formatter={(value) => [`₹${value.toLocaleString()}`]}
                        />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                        <Line type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="Savings" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-on-surface-variant font-serif">
                  Historical cashflow ledger trends not loaded.
                </div>
              )}
            </div>

            {/* Pandas Spending Insights Seaborn Heatmap */}
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm flex flex-col justify-between">
              <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface border-b border-outline-variant/40 pb-4 mb-6">Spending Density Trends (EDA Heatmap)</h3>

              {insightsLoading ? (
                <p className="text-on-surface-variant text-sm font-serif">Generating Day-of-Week density matrix...</p>
              ) : insightsData?.heatmap ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <img
                      src={`data:image/png;base64,${insightsData.heatmap}`}
                      alt="Seaborn Heatmap Chart"
                      className="max-h-[220px] mx-auto rounded-xl border border-outline-variant/40"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center font-serif text-sm">
                    <div className="bg-surface-container/30 border border-outline-variant/40 rounded-xl p-3">
                      <span className="text-[10px] text-on-surface-variant block mb-1">Peak Spend Month</span>
                      <strong className="text-on-surface text-base">{insightsData.highest_month}</strong>
                    </div>
                    <div className="bg-surface-container/30 border border-outline-variant/40 rounded-xl p-3">
                      <span className="text-[10px] text-on-surface-variant block mb-1">Avg Savings Margin</span>
                      <strong className="text-emerald-400 text-base">₹{Math.round(insightsData.average_monthly_savings).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-on-surface-variant font-serif flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3">grid_on</span>
                  <p>Insights telemetry not compiled. Upload a ledger CSV file to begin analysis.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB: SMART NOTIFICATIONS CENTER
          ---------------------------------------------------- */}
      {activeTab === 'notifications' && (
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm min-h-[450px] animate-fade-in">
          <div className="flex justify-between items-center border-b border-outline-variant/40 pb-4 mb-6">
            <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface">System Alerts Queue</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="px-4 py-2 rounded-full font-semibold border border-outline-variant hover:bg-surface-container text-on-surface flex items-center gap-2 text-xs transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">done_all</span> Mark All Read
              </button>
            )}
          </div>

          <div className="space-y-4">
            {notifications.filter(n => n.status === 'unread').length > 0 ? (
              notifications.filter(n => n.status === 'unread').map((notif) => (
                <div
                  key={notif._id}
                  className="border rounded-xl p-4 font-serif transition-all bg-error-container/10 border-error/20"
                >
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse"></span>
                    <span className="text-[10px] font-bold tracking-wider uppercase bg-surface-container-high border border-outline-variant/50 px-2 py-0.5 rounded text-primary">
                      {notif.type.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">{new Date(notif.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-on-surface leading-relaxed pl-5 font-serif">{notif.message}</p>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-sm text-on-surface-variant font-serif flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4 animate-bounce">notifications_active</span>
                <p className="max-w-xs leading-relaxed text-on-surface-variant">Your transaction ledger is stable. No alerts or credit/debit abnormalities generated.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
