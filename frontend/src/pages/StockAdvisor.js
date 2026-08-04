import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const StockAdvisor = () => {
  const [riskProfile, setRiskProfile] = useState('Moderate');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentHorizon, setInvestmentHorizon] = useState('medium_term');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        riskProfile,
        investmentAmount: investmentAmount ? parseFloat(investmentAmount) : null,
        investmentHorizon: investmentHorizon || null,
      };

      const res = await axios.post('/recommend-stocks', payload);
      setResult(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to get stock recommendations. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="md:pl-20 mt-16 px-6 md:px-8 pt-10 md:pt-14 pb-6 md:pb-8 min-h-screen bg-background text-on-background font-sans max-w-[1600px] mx-auto animate-fade-in">

      {/* Back Link */}
      <Link to="/premium-dashboard" className="inline-flex items-center gap-2 text-xs text-on-surface-variant hover:text-on-surface font-semibold mb-4 transition-colors">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back to Premium Hub
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8 border-b border-outline-variant pb-6">
        <div className="w-12 h-12 rounded-xl bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-primary-container">
          <span className="material-symbols-outlined text-2xl font-bold">trending_up</span>
        </div>
        <div>
          <h1 className="font-display-hero text-3xl font-bold tracking-tight text-on-surface">Premium Stock Advisor</h1>
          <p className="text-sm text-on-surface-variant mt-1 m-2">
            Deterministic Indian stock recommendations scored by technicals, news sentiment, and risk profile.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form panel */}
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm lg:col-span-1 space-y-6">
          <h2 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface border-b border-outline-variant/40 pb-3">Preferences</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1 font-sans text-xs">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">Risk Profile</label>
              <div className="relative">
                <select
                  value={riskProfile}
                  onChange={(e) => setRiskProfile(e.target.value)}
                  className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface appearance-none focus:outline-none focus:border-primary transition-all"
                >
                  <option value="Conservative">Conservative (Stable Large Caps)</option>
                  <option value="Moderate">Moderate (Balanced Large Caps)</option>
                  <option value="Aggressive">Aggressive (Mid/Small Caps Growth)</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant pointer-events-none text-base">expand_more</span>
              </div>
            </div>

            <div className="space-y-1 font-sans text-xs">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">Investment Amount (INR, Optional)</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 font-serif text-sm text-on-surface-variant">₹</span>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  className="w-full bg-surface-container/60 border border-outline-variant rounded-xl pl-8 pr-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary transition-all"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-1 font-sans text-xs">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">Investment Horizon (Optional)</label>
              <div className="relative">
                <select
                  value={investmentHorizon}
                  onChange={(e) => setInvestmentHorizon(e.target.value)}
                  className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface appearance-none focus:outline-none focus:border-primary transition-all"
                >
                  <option value="short_term">Short Term (&lt; 1 year)</option>
                  <option value="medium_term">Medium Term (1-3 years)</option>
                  <option value="long_term">Long Term (3+ years)</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant pointer-events-none text-base">expand_more</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-container hover:bg-primary text-on-primary-container font-semibold py-3 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer text-sm shadow-md"
            >
              <span className="material-symbols-outlined text-md">query_stats</span>
              {loading ? 'Analyzing sentiment...' : 'Generate Recommendations'}
            </button>
          </form>
        </div>

        {/* Results panel */}
        <div className="lg:col-span-2">
          {loading && (
            <div className="glass-card rounded-2xl p-12 border border-outline-variant/40 shadow-sm text-center flex flex-col items-center justify-center min-h-[300px]">
              <span className="material-symbols-outlined text-4xl animate-spin text-primary-container mb-4">refresh</span>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Analyzing Indian Stock Market Universe...</h3>
              <p className="text-xs text-on-surface-variant mt-2 font-serif">
                Calculating technical indicators (EMA200, SMA50, RSI) and scoring news headlines via Gemini...
              </p>
            </div>
          )}

          {error && (
            <div className="bg-error-container/20 border-l-4 border-error text-error p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">report_problem</span>
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && !result && (
            <div className="glass-card rounded-2xl p-12 border border-outline-variant/40 shadow-sm text-center flex flex-col items-center justify-center min-h-[300px] border-dashed">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4 animate-pulse">monitoring</span>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface font-serif">Institutional Equity Screener</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mt-2 font-serif leading-relaxed">
                Select your risk appetite and generate quantitative stock picks explained by LLM sentiment diagnostics.
              </p>
            </div>
          )}

          {!loading && !error && result && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-outline-variant/40 pb-4 mb-4 flex-wrap gap-2">
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface font-serif">Top Picks for {riskProfile} Profile</h2>
                <span className="text-xs text-on-surface-variant font-sans">
                  Generated: {new Date(result.generated_at).toLocaleString()}
                </span>
              </div>

              <div className="space-y-4 font-serif">
                {result.recommendations?.map((stock, idx) => (
                  <div key={stock.symbol} className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm space-y-4">
                    <div className="flex justify-between items-start flex-wrap gap-4 border-b border-outline-variant/20 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-primary-container/10 border border-primary-container/20 text-primary-container px-2 py-0.5 rounded font-sans font-bold">#{idx + 1}</span>
                          <span className="text-base font-bold text-on-surface">{stock.symbol}</span>
                        </div>
                        <div className="flex items-center gap-2.5 mt-1 font-sans text-xs">
                          <span className="text-base font-bold text-on-surface font-serif">₹{stock.price ? stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : 'N/A'}</span>
                          {stock.price_change_percent !== undefined && (
                            <span className={`font-bold ${stock.price_change_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {stock.price_change_percent >= 0 ? '+' : ''}
                              {stock.price_change_percent.toFixed(2)}%
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 font-sans">
                        <div className="flex flex-col items-center bg-surface-container/60 border border-outline-variant/40 px-3 py-1 rounded-xl">
                          <span className="text-[8px] uppercase tracking-wider text-on-surface-variant">Score</span>
                          <span className="text-sm font-bold text-on-surface font-serif">{stock.score}</span>
                        </div>
                        <span className={`px-2.5 py-1.5 border rounded-xl text-[10px] font-bold ${stock.sentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            stock.sentiment === 'Negative' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                              'bg-surface-container text-on-surface-variant border-outline-variant/40'
                          }`}>
                          {stock.sentiment} Sentiment
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed">{stock.summary}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <h4 className="text-[10px] text-emerald-400 uppercase tracking-widest font-sans font-bold">Pros / Highlights</h4>
                        <ul className="space-y-1.5 text-xs text-on-surface-variant">
                          {stock.pros?.map((pro, i) => (
                            <li key={i} className="flex gap-2 items-start">
                              <span className="material-symbols-outlined text-emerald-400 text-sm mt-0.5">check_circle</span>
                              <span className="leading-relaxed">{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-[10px] text-amber-500 uppercase tracking-widest font-sans font-bold">Risks / Watchpoints</h4>
                        <ul className="space-y-1.5 text-xs text-on-surface-variant">
                          {stock.risks?.map((risk, i) => (
                            <li key={i} className="flex gap-2 items-start">
                              <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">warning</span>
                              <span className="leading-relaxed">{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockAdvisor;
