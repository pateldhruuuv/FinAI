import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

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
      <div className="flex flex-col items-center justify-center min-h-[80vh] md:pl-20 mt-16 text-on-surface font-sans">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary-container mb-4">refresh</span>
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Compiling Premium Advisors...</h2>
        <p className="text-xs text-on-surface-variant mt-2 font-serif">Reading Digital Twin and rendering portfolio weights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] md:pl-20 mt-16 text-error font-sans p-6">
        <span className="material-symbols-outlined text-4xl text-error mb-4">report_problem</span>
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Advisory Compilation Error</h3>
        <p className="text-xs text-on-surface-variant mt-2 font-serif">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-5 py-2 border border-outline-variant hover:bg-surface-container rounded-full text-xs font-semibold cursor-pointer">Retry</button>
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
    <div className="md:pl-20 mt-16 px-6 md:px-8 pt-10 md:pt-14 pb-6 md:pb-8 min-h-screen bg-background text-on-background font-sans max-w-[1600px] mx-auto animate-fade-in">

      {/* Header */}
      <header className="mb-8 border-b border-outline-variant pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="mb-2">
            <span className="bg-primary/10 border border-primary/20 text-primary-container text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider m-2">Premium Advisory Hub</span>
          </div>
          <h1 className="font-display-hero text-3xl font-bold tracking-tight text-on-surface m-2">Finmate Digital Twin & Hub</h1>
          <p className="text-sm text-on-surface-variant mt-1 m-2">Institutional robo-wealth insights tailored for {user.name}.</p>
        </div>

        <div className="flex items-center gap-3 bg-surface-container/40 border border-outline-variant/40 p-4 rounded-xl font-serif">
          <span className="material-symbols-outlined text-amber-400 text-3xl">workspace_premium</span>
          <div className="text-left">
            <div className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans font-bold">Stability Index</div>
            <div className="text-base font-bold text-on-surface font-serif mt-0.5">{digitalTwin?.stabilityScore || 70} / 100</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Nav */}
        <aside className="lg:col-span-1 bg-surface border border-outline-variant rounded-2xl p-4 space-y-4">
          <div className="text-[10px] font-bold text-primary uppercase tracking-widest pl-2">Premium Tools</div>
          <nav className="flex flex-col gap-1">
            {[
              { to: '/tax-optimizer', icon: 'percent', label: 'Tax Optimizer', color: 'text-indigo-400' },
              { to: '/loan-advisor', icon: 'scale', label: 'Loan Advisor', color: 'text-blue-400' },
              { to: '/insurance-gap', icon: 'shield', label: 'Insurance Gap', color: 'text-emerald-400' },
              { to: '/purchase-advisor', icon: 'payments', label: 'Purchase Advisor', color: 'text-amber-400' },
              { to: '/what-if', icon: 'query_stats', label: 'What-If Simulator', color: 'text-pink-400' },
              { to: '/portfolio-risk', icon: 'pie_chart', label: 'Portfolio Risk', color: 'text-orange-400' },
              { to: '/stock-advisor', icon: 'trending_up', label: 'Stock Advisor', color: 'text-emerald-400' },
              { to: '/financial-coach', icon: 'forum', label: 'AI Financial Coach', color: 'text-purple-400' },
              { to: '/digital-twin', icon: 'person_search', label: 'Digital Twin Profile', color: 'text-cyan-400' },
              { to: '/reports', icon: 'file_download', label: 'Financial Reports', color: 'text-slate-400' }
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`material-symbols-outlined text-lg ${link.color}`}>{link.icon}</span>
                  <span>{link.label}</span>
                </div>
                <span className="material-symbols-outlined text-sm font-bold opacity-40">chevron_right</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Widgets Grid */}
        <main className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Card 1: Net Worth overview */}
          <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm md:col-span-2 space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3 font-serif">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-lg">monetization_on</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Net Worth Overview</h3>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-sans font-bold">Calculated Live</span>
            </div>

            <div className="text-3xl font-bold text-on-surface font-serif">₹{netWorth ? netWorth.toLocaleString() : '---'}</div>
            <p className="text-xs text-on-surface-variant font-serif">
              Total Assets (accumulated savings and portfolio) minus total liabilities.
            </p>
            {plots?.net_worth_trend && (
              <div className="bg-surface-container/20 border border-outline-variant/20 rounded-xl p-4 flex justify-center max-h-72 overflow-hidden">
                <img src={`data:image/png;base64,${plots.net_worth_trend}`} alt="Net Worth Trend" className="w-full h-auto object-contain max-h-64" />
              </div>
            )}
          </div>

          {/* Card 2: Digital Twin Traits */}
          <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3 font-serif">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400 text-lg">person_search</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Digital Twin</h3>
              </div>
              <Link to="/digital-twin" className="text-xs font-sans text-primary hover:underline">View Details</Link>
            </div>

            <div className="space-y-2.5 font-serif text-xs">
              <div className="flex justify-between border-b border-outline-variant/25 pb-1">
                <span className="text-on-surface-variant">Financial Age:</span>
                <span className="text-on-surface font-bold font-sans">{digitalTwin?.financialAge || user.age} Years</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/25 pb-1">
                <span className="text-on-surface-variant">Risk Appetite:</span>
                <span className="text-on-surface font-bold font-sans">{digitalTwin?.riskLevel || 'Moderate'}</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/25 pb-1">
                <span className="text-on-surface-variant">Savings Trait:</span>
                <span className="text-on-surface font-bold">{digitalTwin?.savingsPersonality || 'Balanced'}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-on-surface-variant">Investment Type:</span>
                <span className="text-on-surface font-bold">{digitalTwin?.investmentPersonality || 'Rebalancer'}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Portfolio Allocation */}
          <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3 font-serif">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-400 text-lg">pie_chart</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Portfolio Allocation</h3>
              </div>
              <Link to="/portfolio-risk" className="text-xs font-sans text-primary hover:underline">Analyze</Link>
            </div>

            {plots?.portfolio_pie ? (
              <div className="bg-surface-container/20 border border-outline-variant/20 rounded-xl p-2 flex justify-center max-h-48 overflow-hidden">
                <img src={`data:image/png;base64,${plots.portfolio_pie}`} alt="Portfolio Pie" className="w-full h-auto object-contain max-h-40" />
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-on-surface-variant/50 flex flex-col items-center justify-center space-y-3 font-serif">
                <p>No asset portfolio registered.</p>
                <Link to="/portfolio-risk" className="px-4 py-1.5 bg-primary-container text-on-primary-container font-sans font-bold text-[10px] rounded-full uppercase cursor-pointer">Set up Portfolio</Link>
              </div>
            )}
          </div>

          {/* Card 4: Tax Optimization */}
          <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3 font-serif">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-lg">percent</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Tax Optimization</h3>
              </div>
              <Link to="/tax-optimizer" className="text-xs font-sans text-primary hover:underline">Optimize</Link>
            </div>

            {taxSavings ? (
              <div className="space-y-3 font-serif text-center">
                <div className="text-2xl font-bold text-emerald-400">₹{taxSavings.potentialSavings.toLocaleString()}</div>
                <div className="text-[10px] text-on-surface-variant uppercase tracking-wider font-sans font-semibold">Possible Annual Tax Savings</div>
                {plots?.tax_breakdown && (
                  <div className="bg-surface-container/20 border border-outline-variant/20 rounded-xl p-2 flex justify-center max-h-44 overflow-hidden mt-1">
                    <img src={`data:image/png;base64,${plots.tax_breakdown}`} alt="Tax Breakdown" className="w-full h-auto object-contain max-h-36" />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-on-surface-variant/50 flex flex-col items-center justify-center space-y-3 font-serif">
                <p>Tax optimizer profile not created yet.</p>
                <Link to="/tax-optimizer" className="px-4 py-1.5 bg-primary-container text-on-primary-container font-sans font-bold text-[10px] rounded-full uppercase cursor-pointer">Run Estimator</Link>
              </div>
            )}
          </div>

          {/* Card 5: Loan Advisor */}
          <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3 font-serif">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400 text-lg">scale</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Loan Advisor</h3>
              </div>
              <Link to="/loan-advisor" className="text-xs font-sans text-primary hover:underline">Limits</Link>
            </div>

            {loanEligibility ? (
              <div className="space-y-4 font-serif text-xs">
                <div className="text-center mb-1">
                  <div className="text-xl font-bold text-on-surface">₹{loanEligibility.eligibleAmount.toLocaleString()}</div>
                  <span className="text-[9px] text-on-surface-variant uppercase tracking-wider font-sans font-semibold block mt-0.5">Maximum Safe Home Loan</span>
                </div>
                <div className="space-y-2 border-t border-outline-variant/20 pt-3">
                  <div className="flex justify-between font-sans">
                    <span className="text-on-surface-variant">Safe Monthly EMI Limit:</span>
                    <strong className="text-on-surface">₹{loanEligibility.safeEmi.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between font-sans">
                    <span className="text-on-surface-variant">Absolute Max EMI Limit:</span>
                    <strong className="text-rose-400">₹{loanEligibility.maxEmi.toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-on-surface-variant/50 flex flex-col items-center justify-center space-y-3 font-serif">
                <p>No loan eligibility check recorded.</p>
                <Link to="/loan-advisor" className="px-4 py-1.5 bg-primary-container text-on-primary-container font-sans font-bold text-[10px] rounded-full uppercase cursor-pointer">Evaluate Limits</Link>
              </div>
            )}
          </div>

          {/* Card 6: Goal Progress Summary */}
          <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm md:col-span-2 space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3 font-serif">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-400 text-lg">trending_up</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Active Goals Status</h3>
              </div>
              <Link to="/dashboard" className="text-xs font-sans text-primary hover:underline">Planners</Link>
            </div>

            {goalsProgress && goalsProgress.length > 0 ? (
              <div className="space-y-4">
                <p className="text-xs text-on-surface-variant font-serif">
                  Your primary financial goals are on track. Maintain monthly allocations to meet target timelines.
                </p>
                {plots?.goal_progress ? (
                  <div className="bg-surface-container/20 border border-outline-variant/20 rounded-xl p-2 flex justify-center max-h-48 overflow-hidden">
                    <img src={`data:image/png;base64,${plots.goal_progress}`} alt="Goals Progress" className="w-full h-auto object-contain max-h-40" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {goalsProgress.slice(0, 3).map((g, idx) => (
                      <div key={idx} className="bg-surface-container/20 border border-outline-variant/20 rounded-xl p-3.5 space-y-2">
                        <div className="flex justify-between text-xs font-semibold font-serif">
                          <span className="text-on-surface-variant truncate max-w-[120px]">{g.name}</span>
                          <strong className="text-primary font-sans">{g.progress}%</strong>
                        </div>
                        <div className="bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                          <div className="bg-primary h-full transition-all" style={{ width: `${g.progress}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-on-surface-variant/50 flex flex-col items-center justify-center space-y-2 font-serif">
                <p>No active goals found in the planners.</p>
                <span className="text-[10px] text-on-surface-variant/40 font-sans">Create goals on the core dashboard.</span>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PremiumDashboard;
