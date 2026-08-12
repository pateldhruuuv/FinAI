import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const InsuranceAdvisor = () => {
  const { user } = useContext(AuthContext);
  const [dependents, setDependents] = useState(0);
  const [maritalStatus, setMaritalStatus] = useState('Single');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rec, setRec] = useState(null);
  const [userFinancials, setUserFinancials] = useState({ age: 25, income: 50000 });

  // Fetch user info for baseline display
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const res = await axios.get('/dashboard');
        if (res.data?.status === 'success') {
          const stats = res.data.data;
          setUserFinancials({
            age: user?.age || 25,
            income: stats.monthlyIncomeBase || user?.monthlyIncome || 50000,
          });
        }
      } catch (err) {
        console.error('Failed to pre-populate financials', err);
        if (user) {
          setUserFinancials({ age: user.age, income: user.monthlyIncome });
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
      const res = await axios.post('/recommend-insurance', {
        dependents: parseInt(dependents),
        marital_status: maritalStatus,
      });

      if (res.data?.status === 'success') {
        setRec(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch recommendations. Make sure the Python AI engine is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="md:pl-20 mt-16 px-6 md:px-8 pt-10 md:pt-14 pb-6 md:pb-8 min-h-screen bg-background text-on-background font-sans max-w-[1600px] mx-auto animate-fade-in">

      {/* Header */}
      <div className="mb-8 border-b border-outline-variant pb-6">
        <h1 className="font-display-hero text-3xl font-bold tracking-tight text-on-surface m-2">AI Insurance Advisor</h1>
        <p className="text-sm text-on-surface-variant mt-1 m-2">
          Decision Tree and regressive rules estimate protection gaps and suggested coverages.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Input Form (lg:col-span-1) */}
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm lg:col-span-1 space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/40 pb-4">
            <span className="material-symbols-outlined text-emerald-400 text-xl">shield</span>
            <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface">Demographics Context</h3>
          </div>

          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Context Box */}
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
            </div>

            <div className="space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant block ml-1" htmlFor="marital">Marital Status</label>
                <div className="relative">
                  <select
                    id="marital"
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface appearance-none focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant pointer-events-none text-base">expand_more</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant block ml-1" htmlFor="dependents">Number of Dependents</label>
                <input
                  id="dependents"
                  type="number"
                  min="0"
                  max="15"
                  value={dependents}
                  onChange={(e) => setDependents(e.target.value)}
                  className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary-container hover:bg-primary text-on-primary-container font-semibold py-3 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer text-sm shadow-md"
              disabled={loading}
            >
              <span className="material-symbols-outlined text-md">shield</span>
              {loading ? 'Analyzing Risks...' : 'Evaluate Insurance Options'}
            </button>
          </form>
        </div>

        {/* Results (lg:col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-error-container/20 border-l-4 border-error text-error p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">report_problem</span>
              <span>{error}</span>
            </div>
          )}

          {rec ? (
            <div className="glass-card rounded-2xl p-6 md:p-8 border border-outline-variant/40 shadow-sm space-y-6 animate-fade-in font-serif">
              <div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">Risk Management Analysis</h2>
                <p className="text-xs text-on-surface-variant">Synthesized Protection Portfolio Recommendations</p>
              </div>

              {/* Coverage Amount Badge */}
              <div className="flex items-center gap-5 p-5 bg-surface-container/30 border border-outline-variant/30 rounded-xl">
                <span className="material-symbols-outlined text-primary text-4xl">payments</span>
                <div>
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans font-bold block mb-1">Suggested Overall Term/Life Coverage</span>
                  <h2 className="text-2xl font-bold text-emerald-400 font-serif">₹{rec.suggestedCoverageAmount.toLocaleString()}</h2>
                </div>
              </div>

              {/* Recommended Policies list */}
              <div className="border-t border-outline-variant/40 pt-5">
                <h3 className="text-sm font-bold text-on-surface mb-3 uppercase tracking-wider">Recommended Coverage Products</h3>
                <div className="space-y-2">
                  {rec.recommendationsSummary.map((policy, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start bg-surface-container/20 border border-outline-variant/20 rounded-xl p-3.5 text-xs text-on-surface-variant font-serif">
                      <span className="material-symbols-outlined text-emerald-400 text-sm mt-0.5">check_circle</span>
                      <span className="leading-relaxed">{policy}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Partner Policies */}
              {rec.concreteOptions && (
                <div className="border-t border-outline-variant/40 pt-5">
                  <h3 className="text-sm font-bold text-on-surface mb-1 uppercase tracking-wider">Live Partner Opportunities</h3>
                  <p className="text-xs text-on-surface-variant mb-4 font-serif leading-relaxed">
                    Top recommended plans and providers in India based on Claims Settlement Ratios (CSR) and restore features:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Term Insurance */}
                    <div className="bg-surface-container/30 border border-outline-variant/40 rounded-xl p-4 space-y-3 text-xs">
                      <h4 className="font-bold text-on-surface uppercase tracking-wider border-b border-outline-variant/20 pb-2">Term Life Policies</h4>
                      {rec.concreteOptions.Term_Life?.map((term, i) => (
                        <div key={i} className="bg-surface-container-high/30 p-2.5 rounded border border-outline-variant/20">
                          <strong className="text-on-surface block truncate">{term.provider}</strong>
                          <div className="flex justify-between items-center text-[10px] text-on-surface-variant mt-1.5 font-sans">
                            <span>CSR: <strong className="text-emerald-400">{term.claim_ratio}</strong></span>
                            <span>{term.key_feature}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Health Insurance */}
                    <div className="bg-surface-container/30 border border-outline-variant/40 rounded-xl p-4 space-y-3 text-xs">
                      <h4 className="font-bold text-on-surface uppercase tracking-wider border-b border-outline-variant/20 pb-2">Health Plans</h4>
                      {rec.concreteOptions.Health_Insurance?.map((health, i) => (
                        <div key={i} className="bg-surface-container-high/30 p-2.5 rounded border border-outline-variant/20">
                          <strong className="text-on-surface block truncate">{health.plan}</strong>
                          <div className="flex justify-between items-center text-[10px] text-on-surface-variant mt-1.5 font-sans">
                            <span>Sum Insured: <strong className="text-primary">{health.sum_insured}</strong></span>
                            <span>{health.key_feature}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Security info disclaimer */}
              <div className="bg-primary-container/5 border border-primary-container/15 rounded-xl p-4 flex gap-3 items-start text-xs">
                <span className="material-symbols-outlined text-amber-500 text-xl mt-0.5">warning</span>
                <p className="text-on-surface-variant leading-relaxed font-serif">
                  This recommendation is computed utilizing rule-based margins and regression trees mapping to 15x your annual income plus buffers for dependents. Always consult a certified insurance expert prior to final purchasing.
                </p>
              </div>

            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 border border-outline-variant/40 shadow-sm text-center flex flex-col items-center justify-center min-h-[300px] border-dashed">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4">shield</span>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface font-serif">Awaiting Parameter Diagnostics</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mt-2 font-serif leading-relaxed">
                Provide dependents parameters to check your protection pool values and check CSR providers ratios.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default InsuranceAdvisor;
