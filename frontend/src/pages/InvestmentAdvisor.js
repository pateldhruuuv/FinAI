import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const InvestmentAdvisor = () => {
  const { user } = useContext(AuthContext);
  const [riskProfile, setRiskProfile] = useState('Moderate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rec, setRec] = useState(null);
  const [userFinancials, setUserFinancials] = useState({ age: 25, income: 50000, savings: 0 });

  // Fetch user details and latest transaction balance on load
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const res = await axios.get('/dashboard');
        if (res.data?.status === 'success') {
          const stats = res.data.data;
          setUserFinancials({
            age: user?.age || 25,
            income: stats.monthlyIncomeBase || user?.monthlyIncome || 50000,
            savings: stats.totalSavings || 0
          });
        }
      } catch (err) {
        console.error('Failed to pre-populate financials', err);
        if (user) {
          setUserFinancials({ age: user.age, income: user.monthlyIncome, savings: 0 });
        }
      }
    };
    fetchUserStats();
  }, [user]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRec(null);

    try {
      const res = await axios.post('/recommend-investment', {
        risk_profile: riskProfile,
      });

      if (res.data?.status === 'success') {
        setRec(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to get recommendation from AI Engine. Is the FastAPI service running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="md:pl-20 mt-16 px-6 md:px-8 pt-10 md:pt-14 pb-6 md:pb-8 min-h-screen bg-background text-on-background font-sans max-w-[1600px] mx-auto animate-fade-in">

      {/* Header */}
      <div className="mb-8 border-b border-outline-variant pb-6">
        <h1 className="font-display-hero text-3xl font-bold tracking-tight text-on-surface m-2">AI Investment Advisor</h1>
        <p className="text-sm text-on-surface-variant mt-1 m-2">
          Decision Tree classification models map your age, income, and risk profile to optimal allocations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Input Form Card */}
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm lg:col-span-1">
          <div className="flex items-center gap-3 border-b border-outline-variant/40 pb-4 mb-6">
            <span className="material-symbols-outlined text-primary text-xl">psychology</span>
            <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface">Diagnostic Parameters</h3>
          </div>

          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Auto-filled details */}
            <div className="bg-surface-container/40 border border-outline-variant/40 rounded-xl p-4 space-y-2.5 font-serif text-xs">
              <h4 className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold font-sans mb-1">User Profile Context</h4>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Age:</span>
                <strong className="text-on-surface">{userFinancials.age} Years</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Income Base:</span>
                <strong className="text-on-surface">₹{userFinancials.income.toLocaleString()} / mo</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Calculated Savings:</span>
                <strong className="text-on-surface">₹{userFinancials.savings.toLocaleString()}</strong>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">Select Risk Appetite</label>
              <div className="grid grid-cols-3 gap-2">
                {['Conservative', 'Moderate', 'Aggressive'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setRiskProfile(level)}
                    className={`py-2 px-3 rounded-full text-xs font-bold transition-all cursor-pointer border ${riskProfile === level
                        ? level === 'Conservative'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                          : level === 'Moderate'
                            ? 'bg-primary-container/10 border-primary-container text-primary-container'
                            : 'bg-rose-500/10 border-rose-500 text-rose-400'
                        : 'bg-surface border-outline-variant hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                      }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary-container hover:bg-primary text-on-primary-container font-semibold py-3 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer text-sm mt-6"
              disabled={loading}
            >
              <span className="material-symbols-outlined text-md">compass_calibration</span>
              {loading ? 'Consulting Decision Tree...' : 'Generate Recommendations'}
            </button>
          </form>
        </div>

        {/* Results / Recommendation Column (2 cols width) */}
        <div className="lg:col-span-2">
          {error && (
            <div className="bg-error-container/20 border-l-4 border-error text-error p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">report_problem</span>
              <span>{error}</span>
            </div>
          )}

          {rec ? (
            <div className="glass-card rounded-2xl p-6 md:p-8 border border-outline-variant/40 shadow-sm space-y-8 animate-fade-in">
              <div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1 font-serif">Your Tailored Investment Strategy</h2>
                <p className="text-xs text-on-surface-variant">Generated by Decision Tree Classifier</p>
              </div>

              {/* Suggestions row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-serif">
                <div className="bg-surface-container/30 border border-outline-variant/60 rounded-xl p-5 relative overflow-hidden">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1">Short-Term Strategy (1-3 yrs)</span>
                  <h3 className="text-lg font-bold text-on-surface mb-2">{rec.shortTerm}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Designed to preserve capital while generating stable, high yields with absolute liquidity.
                  </p>
                </div>

                <div className="bg-surface-container/30 border border-outline-variant/60 rounded-xl p-5 relative overflow-hidden">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1">Long-Term Strategy (3+ yrs)</span>
                  <h3 className="text-lg font-bold text-primary mb-2">{rec.longTerm}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Configured to compound your wealth over market cycles and outpace inflation hedges.
                  </p>
                </div>
              </div>

              {/* Allocation bars */}
              <div className="border-t border-outline-variant/40 pt-6">
                <h3 className="text-sm font-bold text-on-surface mb-4 font-serif uppercase tracking-wider">Recommended Asset Allocation</h3>
                <div className="space-y-4">
                  {Object.entries(rec.recommendedAllocations).map(([asset, pct], index) => {
                    const widthVal = pct;
                    const colors = ['#ff6b35', '#918cff', '#10b981'];
                    const color = colors[index % colors.length];

                    return (
                      <div key={asset} className="space-y-1 font-sans">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-on-surface">{asset}</span>
                          <span className="font-bold font-serif text-sm" style={{ color }}>{pct}</span>
                        </div>
                        <div className="bg-surface-container-high rounded-full h-2 overflow-hidden border border-outline-variant/10">
                          <div className="h-full rounded-full transition-all" style={{ width: widthVal, background: color }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SEBI Market Insights */}
              {rec.suggestions && rec.suggestions.length > 0 && (
                <div className="border-t border-outline-variant/40 pt-6 font-serif">
                  <h3 className="text-sm font-bold text-on-surface mb-3 font-serif uppercase tracking-wider">Regulatory Trends & Risk Check</h3>
                  <ul className="list-disc list-inside space-y-2 text-xs text-on-surface-variant leading-relaxed">
                    {rec.suggestions.map((sug, i) => (
                      <li key={i}>{sug}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Passive Income Strategies */}
              {rec.passiveIncomeStrategies && rec.passiveIncomeStrategies.length > 0 && (
                <div className="border-t border-outline-variant/40 pt-6 font-serif">
                  <h3 className="text-sm font-bold text-on-surface mb-3 font-serif uppercase tracking-wider">Passive Yield Recommendations</h3>
                  <ul className="list-disc list-inside space-y-2 text-xs text-on-surface-variant leading-relaxed">
                    {rec.passiveIncomeStrategies.map((strat, i) => (
                      <li key={i}>{strat}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Live Investment Products */}
              {rec.concreteOptions && (
                <div className="border-t border-outline-variant/40 pt-6 font-serif">
                  <h3 className="text-sm font-bold text-on-surface mb-1 uppercase tracking-wider">Live Investment Opportunities</h3>
                  <p className="text-xs text-on-surface-variant mb-4">Top-performing retail instruments synced with recent indices:</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* FDs */}
                    <div className="bg-surface-container/30 border border-outline-variant/40 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider border-b border-outline-variant/20 pb-2">Cash & FDs</h4>
                      {rec.concreteOptions.Cash_FD?.map((fd, i) => (
                        <div key={i} className="bg-surface-container-high/30 p-2.5 rounded border border-outline-variant/20 text-xs">
                          <strong className="text-on-surface block truncate">{fd.name}</strong>
                          <div className="flex justify-between items-center text-[10px] text-on-surface-variant mt-1.5 font-sans">
                            <span>Rate: <strong className="text-emerald-400">{fd.rate}</strong></span>
                            <span>{fd.type}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bonds */}
                    <div className="bg-surface-container/30 border border-outline-variant/40 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider border-b border-outline-variant/20 pb-2">Bonds & Debt</h4>
                      {rec.concreteOptions.Bonds_Debt?.map((bond, i) => (
                        <div key={i} className="bg-surface-container-high/30 p-2.5 rounded border border-outline-variant/20 text-xs">
                          <strong className="text-on-surface block truncate">{bond.name}</strong>
                          <div className="flex justify-between items-center text-[10px] text-on-surface-variant mt-1.5 font-sans">
                            <span>Yield: <strong className="text-primary">{bond.yield}</strong></span>
                            <span>{bond.type}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Equities */}
                    <div className="bg-surface-container/30 border border-outline-variant/40 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider border-b border-outline-variant/20 pb-2">Equities & ETFs</h4>
                      {rec.concreteOptions.Equities?.map((eq, i) => (
                        <div key={i} className="bg-surface-container-high/30 p-2.5 rounded border border-outline-variant/20 text-xs">
                          <strong className="text-on-surface block truncate">{eq.name}</strong>
                          <div className="flex justify-between items-center text-[10px] text-on-surface-variant mt-1.5 font-sans">
                            {eq.expense_ratio && <span>ER: <strong>{eq.expense_ratio}</strong></span>}
                            <span>{eq.type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 border border-outline-variant/40 shadow-sm text-center flex flex-col items-center justify-center min-h-[300px]">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4 animate-pulse">compass_calibration</span>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface font-serif">Awaiting Parameter Submission</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mt-2 font-serif leading-relaxed">
                Select your risk category in the parameter form and request consultations to invoke decision tree classifiers.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default InvestmentAdvisor;
