import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  DollarSign, 
  TrendingUp, 
  Percent, 
  ShieldAlert, 
  ShieldCheck, 
  HelpCircle, 
  UserCheck, 
  Scale, 
  LineChart, 
  PieChart, 
  FileText, 
  MessageSquare,
  Award,
  ChevronRight,
  TrendingDown
} from 'lucide-react';

const PremiumDashboard = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPremiumData = async () => {
      try {
        const res = await axios.get('/premium-dashboard');
        setData(res.data.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load premium dashboard data');
        setLoading(false);
      }
    };
    fetchPremiumData();
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <h2>Compiling Premium Advisors...</h2>
        <p style={{ color: '#94a3b8', marginTop: '6px' }}>Reading Digital Twin and rendering portfolio weights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h3>Advisory Compilation Error</h3>
        <p style={{ color: '#fca5a5', marginTop: '8px' }}>{error}</p>
        <button onClick={() => window.location.reload()} style={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  const {
    netWorth,
    portfolioAllocation,
    goalsProgress,
    taxSavings,
    loanEligibility,
    purchaseScore,
    digitalTwin,
    plots
  } = data;

  return (
    <div style={styles.page}>
      {/* Premium Hub Header */}
      <header style={styles.header}>
        <div>
          <div style={styles.badgeRow}>
            <span style={styles.premiumPill}>PREMIUM ADVISORY PANEL</span>
          </div>
          <h1 style={styles.title}>FinPilot Digital Twin & Hub</h1>
          <p style={styles.subtitle}>Institutional robo-wealth insights tailored for {user.name}.</p>
        </div>
        <div style={styles.twinHeaderCard}>
          <Award size={24} color="#eab308" />
          <div>
            <div style={styles.twinMetaTitle}>Digital Twin Stability Score</div>
            <div style={styles.twinMetaVal}>{digitalTwin?.stabilityScore || 70} / 100</div>
          </div>
        </div>
      </header>

      <div style={styles.layout}>
        {/* Sidebar Nav */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarTitle}>PREMIUM TOOLS</div>
          <nav style={styles.sideNav}>
            <Link to="/tax-optimizer" style={styles.navLink}>
              <Percent size={18} color="#6366f1" />
              <span>Tax Optimizer</span>
              <ChevronRight size={14} style={styles.navArrow} />
            </Link>
            <Link to="/loan-advisor" style={styles.navLink}>
              <Scale size={18} color="#3b82f6" />
              <span>Loan Advisor</span>
              <ChevronRight size={14} style={styles.navArrow} />
            </Link>
            <Link to="/insurance-gap" style={styles.navLink}>
              <ShieldCheck size={18} color="#10b981" />
              <span>Insurance Gap</span>
              <ChevronRight size={14} style={styles.navArrow} />
            </Link>
            <Link to="/purchase-advisor" style={styles.navLink}>
              <DollarSign size={18} color="#eab308" />
              <span>Purchase Advisor</span>
              <ChevronRight size={14} style={styles.navArrow} />
            </Link>
            <Link to="/what-if" style={styles.navLink}>
              <TrendingUp size={18} color="#ec4899" />
              <span>What-If Simulator</span>
              <ChevronRight size={14} style={styles.navArrow} />
            </Link>
            <Link to="/portfolio-risk" style={styles.navLink}>
              <PieChart size={18} color="#f97316" />
              <span>Portfolio Risk</span>
              <ChevronRight size={14} style={styles.navArrow} />
            </Link>
            <Link to="/financial-coach" style={styles.navLink}>
              <MessageSquare size={18} color="#a855f7" />
              <span>AI Financial Coach</span>
              <ChevronRight size={14} style={styles.navArrow} />
            </Link>
            <Link to="/digital-twin" style={styles.navLink}>
              <UserCheck size={18} color="#06b6d4" />
              <span>Digital Twin Profile</span>
              <ChevronRight size={14} style={styles.navArrow} />
            </Link>
            <Link to="/reports" style={styles.navLink}>
              <FileText size={18} color="#94a3b8" />
              <span>Financial Reports</span>
              <ChevronRight size={14} style={styles.navArrow} />
            </Link>
          </nav>
        </aside>

        {/* Widgets Grid */}
        <main style={styles.grid}>
          {/* Card 1: Net Worth overview */}
          <div style={{ ...styles.card, gridColumn: 'span 2' }}>
            <div style={styles.cardHeader}>
              <div style={styles.cardIconTitle}>
                <DollarSign size={20} color="#10b981" />
                <h3 style={styles.cardTitle}>Net Worth Overview</h3>
              </div>
              <span style={styles.cardStatusPositive}>Calculated Live</span>
            </div>
            <div style={styles.nwAmount}>₹{netWorth ? netWorth.toLocaleString() : '---'}</div>
            <p style={styles.cardDesc}>
              Total Assets (accumulated savings and portfolio) minus total liabilities.
            </p>
            {plots?.net_worth_trend && (
              <div style={styles.plotBox}>
                <img src={`data:image/png;base64,${plots.net_worth_trend}`} alt="Net Worth Trend" style={styles.plotImg} />
              </div>
            )}
          </div>

          {/* Card 2: Digital Twin Traits */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardIconTitle}>
                <UserCheck size={20} color="#06b6d4" />
                <h3 style={styles.cardTitle}>Digital Twin</h3>
              </div>
              <Link to="/digital-twin" style={styles.cardActionLink}>View Twin</Link>
            </div>
            <div style={styles.twinStats}>
              <div style={styles.twinStatItem}>
                <span style={styles.twinLabel}>Financial Age:</span>
                <span style={styles.twinVal}>{digitalTwin?.financialAge || user.age} yrs</span>
              </div>
              <div style={styles.twinStatItem}>
                <span style={styles.twinLabel}>Risk Profile:</span>
                <span style={styles.twinVal}>{digitalTwin?.riskLevel || 'Moderate'}</span>
              </div>
              <div style={styles.twinStatItem}>
                <span style={styles.twinLabel}>Savings Trait:</span>
                <span style={styles.twinValDetail}>{digitalTwin?.savingsPersonality || 'Balanced'}</span>
              </div>
              <div style={styles.twinStatItem}>
                <span style={styles.twinLabel}>Investment:</span>
                <span style={styles.twinValDetail}>{digitalTwin?.investmentPersonality || 'Rebalancer'}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Portfolio Allocation */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardIconTitle}>
                <PieChart size={20} color="#f97316" />
                <h3 style={styles.cardTitle}>Portfolio Weights</h3>
              </div>
              <Link to="/portfolio-risk" style={styles.cardActionLink}>Analyze</Link>
            </div>
            {plots?.portfolio_pie ? (
              <div style={styles.plotBoxCompact}>
                <img src={`data:image/png;base64,${plots.portfolio_pie}`} alt="Portfolio Pie" style={styles.plotImg} />
              </div>
            ) : (
              <div style={styles.emptyState}>
                <p>No asset portfolio registered.</p>
                <Link to="/portfolio-risk" style={styles.setupBtn}>Set up Portfolio</Link>
              </div>
            )}
          </div>

          {/* Card 4: Tax Optimization */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardIconTitle}>
                <Percent size={20} color="#6366f1" />
                <h3 style={styles.cardTitle}>Tax Optimization</h3>
              </div>
              <Link to="/tax-optimizer" style={styles.cardActionLink}>Optimize</Link>
            </div>
            {taxSavings ? (
              <div style={styles.taxWidget}>
                <div style={styles.taxSavingsAmount}>₹{taxSavings.potentialSavings.toLocaleString()}</div>
                <div style={styles.taxSavingsLabel}>Possible Annual Tax Savings</div>
                {plots?.tax_breakdown && (
                  <div style={styles.plotBoxCompact}>
                    <img src={`data:image/png;base64,${plots.tax_breakdown}`} alt="Tax Breakdown" style={styles.plotImg} />
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <p>Tax optimizer profile not created yet.</p>
                <Link to="/tax-optimizer" style={styles.setupBtn}>Run Estimator</Link>
              </div>
            )}
          </div>

          {/* Card 5: Loan Advisor */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardIconTitle}>
                <Scale size={20} color="#3b82f6" />
                <h3 style={styles.cardTitle}>Loan Advisor</h3>
              </div>
              <Link to="/loan-advisor" style={styles.cardActionLink}>Limits</Link>
            </div>
            {loanEligibility ? (
              <div style={styles.loanWidget}>
                <div style={styles.loanEligAmount}>₹{loanEligibility.eligibleAmount.toLocaleString()}</div>
                <div style={styles.loanEligLabel}>Maximum Safe Home Loan</div>
                <div style={styles.loanRates}>
                  <div style={styles.loanRateItem}>
                    <span>Safe Monthly EMI Limit:</span>
                    <strong>₹{loanEligibility.safeEmi.toLocaleString()}</strong>
                  </div>
                  <div style={styles.loanRateItem}>
                    <span>Absolute Max EMI Limit:</span>
                    <strong>₹{loanEligibility.maxEmi.toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.emptyState}>
                <p>No loan eligibility check recorded.</p>
                <Link to="/loan-advisor" style={styles.setupBtn}>Evaluate Limits</Link>
              </div>
            )}
          </div>

          {/* Card 6: Goal Progress Summary */}
          <div style={{ ...styles.card, gridColumn: 'span 2' }}>
            <div style={styles.cardHeader}>
              <div style={styles.cardIconTitle}>
                <TrendingUp size={20} color="#8b5cf6" />
                <h3 style={styles.cardTitle}>Active Goals Status</h3>
              </div>
              <Link to="/dashboard" style={styles.cardActionLink}>Planners</Link>
            </div>
            {goalsProgress && goalsProgress.length > 0 ? (
              <div style={styles.goalsWidget}>
                <p style={styles.goalsWidgetText}>
                  Your primary financial goals are on track. Maintain monthly allocations to meet target timelines.
                </p>
                {plots?.goal_progress ? (
                  <div style={styles.plotBoxCompact}>
                    <img src={`data:image/png;base64,${plots.goal_progress}`} alt="Goals Progress" style={styles.plotImg} />
                  </div>
                ) : (
                  <div style={styles.progressBars}>
                    {goalsProgress.slice(0, 3).map((g, idx) => (
                      <div key={idx} style={styles.progressBarItem}>
                        <div style={styles.progressBarHeader}>
                          <span>{g.name}</span>
                          <strong>{g.progress}%</strong>
                        </div>
                        <div style={styles.progressBg}>
                          <div style={{ ...styles.progressFill, width: `${g.progress}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <p>No active goals found in the planners.</p>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>Create goals on the core dashboard.</span>
              </div>
            )}
          </div>
        </main>
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
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#030712',
    color: '#f8fafc',
    fontFamily: 'Outfit, sans-serif',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#030712',
    color: '#fca5a5',
    fontFamily: 'Outfit, sans-serif',
    padding: '24px',
  },
  retryBtn: {
    marginTop: '16px',
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  header: {
    maxWidth: '1200px',
    margin: '0 auto 32px auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
  },
  badgeRow: {
    marginBottom: '8px',
  },
  premiumPill: {
    background: 'rgba(234, 179, 8, 0.15)',
    color: '#fef08a',
    border: '1px solid rgba(234, 179, 8, 0.3)',
    fontSize: '11px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '20px',
    letterSpacing: '0.05em',
  },
  title: {
    fontSize: '32px',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    color: '#ffffff',
  },
  subtitle: {
    color: '#cbd5e1',
    marginTop: '6px',
    fontSize: '15px',
  },
  twinHeaderCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'rgba(17, 24, 39, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '16px 20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  },
  twinMetaTitle: {
    fontSize: '11px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  twinMetaVal: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#ffffff',
    marginTop: '2px',
  },
  layout: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    gap: '32px',
  },
  sidebar: {
    background: 'rgba(17, 24, 39, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '24px 16px',
    height: 'fit-content',
  },
  sidebarTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#94a3b8',
    letterSpacing: '0.05em',
    marginBottom: '16px',
    paddingLeft: '12px',
  },
  sideNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#cbd5e1',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    padding: '10px 12px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  navArrow: {
    marginLeft: 'auto',
    opacity: 0.5,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
  },
  card: {
    background: 'rgba(17, 24, 39, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  cardIconTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#ffffff',
  },
  cardStatusPositive: {
    fontSize: '11px',
    color: '#10b981',
    fontWeight: 600,
    background: 'rgba(16, 185, 129, 0.1)',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  cardActionLink: {
    fontSize: '12px',
    color: '#6366f1',
    textDecoration: 'none',
    fontWeight: 600,
  },
  nwAmount: {
    fontSize: '36px',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-0.02em',
    marginBottom: '8px',
  },
  cardDesc: {
    color: '#94a3b8',
    fontSize: '13px',
    lineHeight: 1.5,
    marginBottom: '16px',
  },
  plotBox: {
    width: '100%',
    height: '240px',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#1f2937',
  },
  plotBoxCompact: {
    width: '100%',
    height: '180px',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#1f2937',
    marginTop: 'auto',
  },
  plotImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  twinStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  twinStatItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  twinLabel: {
    color: '#94a3b8',
  },
  twinVal: {
    fontWeight: 700,
    color: '#06b6d4',
  },
  twinValDetail: {
    fontWeight: 600,
    color: '#ffffff',
    fontSize: '12px',
    maxWidth: '140px',
    textAlign: 'right',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 0',
    textAlign: 'center',
    flexGrow: 1,
  },
  setupBtn: {
    marginTop: '12px',
    padding: '8px 16px',
    background: 'rgba(99, 102, 241, 0.1)',
    color: '#818cf8',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    textDecoration: 'none',
  },
  taxWidget: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
  },
  taxSavingsAmount: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#a5b4fc',
    marginBottom: '2px',
  },
  taxSavingsLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    marginBottom: '16px',
  },
  loanWidget: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
  },
  loanEligAmount: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#93c5fd',
    marginBottom: '2px',
  },
  loanEligLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    marginBottom: '16px',
  },
  loanRates: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: 'auto',
  },
  loanRateItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  goalsWidget: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
  },
  goalsWidgetText: {
    color: '#cbd5e1',
    fontSize: '13px',
    lineHeight: 1.5,
    marginBottom: '16px',
  },
  progressBars: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  progressBarItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  progressBarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#e2e8f0',
  },
  progressBg: {
    height: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: '4px',
  },
};

export default PremiumDashboard;
