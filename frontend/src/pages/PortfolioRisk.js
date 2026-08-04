import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const PortfolioRisk = () => {
  const [formData, setFormData] = useState({
    stocks: '',
    mutualFunds: '',
    gold: '',
    fd: '',
    crypto: '',
    property: '',
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
      const payload = {
        stocks: parseFloat(formData.stocks || 0),
        mutualFunds: parseFloat(formData.mutualFunds || 0),
        gold: parseFloat(formData.gold || 0),
        fd: parseFloat(formData.fd || 0),
        crypto: parseFloat(formData.crypto || 0),
        property: parseFloat(formData.property || 0),
      };

      const res = await axios.post('/portfolio-risk', payload);
      setResult(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to analyze portfolio risk');
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score < 35) return '#10b981';
    if (score < 65) return '#ffb59d';
    return '#ef4444';
  };

  return (
    <div className="md:pl-20 mt-16 px-6 md:px-8 pt-10 md:pt-14 pb-6 md:pb-8 min-h-screen bg-background text-on-background font-sans max-w-[1600px] mx-auto animate-fade-in">

      {/* Header */}
      <header className="mb-8 border-b border-outline-variant pb-6">
        <Link to="/premium-dashboard" className="inline-flex items-center gap-2 text-xs text-on-surface-variant hover:text-on-surface font-semibold mb-4 transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Hub
        </Link>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-3xl text-primary-container font-bold">pie_chart</span>
          <h1 className="font-display-hero text-3xl font-bold tracking-tight text-on-surface">Portfolio Risk Analyzer</h1>
        </div>
        <p className="text-sm text-on-surface-variant mt-1 m-2">Analyze portfolio risk weights, diversification status, and calculate optimal asset rebalancing guidelines.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Form Panel */}
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 border border-outline-variant/40 shadow-sm space-y-5">
          <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface border-b border-outline-variant/40 pb-3">Asset Holdings (₹)</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">Direct Stocks</label>
              <input
                type="number"
                name="stocks"
                value={formData.stocks}
                onChange={handleChange}
                placeholder="e.g. 150000"
                className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">Mutual Funds (Equity/Debt)</label>
              <input
                type="number"
                name="mutualFunds"
                value={formData.mutualFunds}
                onChange={handleChange}
                placeholder="e.g. 200000"
                className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">Gold Hedging (SGB/ETF)</label>
              <input
                type="number"
                name="gold"
                value={formData.gold}
                onChange={handleChange}
                placeholder="e.g. 50000"
                className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">Fixed Deposits (FD)</label>
              <input
                type="number"
                name="fd"
                value={formData.fd}
                onChange={handleChange}
                placeholder="e.g. 100000"
                className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">Cryptocurrencies</label>
              <input
                type="number"
                name="crypto"
                value={formData.crypto}
                onChange={handleChange}
                placeholder="e.g. 20000"
                className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">Real Estate Property</label>
              <input
                type="number"
                name="property"
                value={formData.property}
                onChange={handleChange}
                placeholder="e.g. 1500000"
                className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-container hover:bg-primary text-on-primary-container font-semibold py-3 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer text-sm mt-6 shadow-md"
          >
            {loading ? 'Recalculating Portfolios...' : 'Analyze Portfolio Risk'}
          </button>
        </form>

        {/* Results Panel */}
        <div className="min-h-[400px]">
          {error && (
            <div className="bg-error-container/20 border-l-4 border-error text-error p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">report_problem</span>
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="glass-card rounded-2xl p-6 md:p-8 border border-outline-variant/40 shadow-sm space-y-6 animate-fade-in font-serif">
              <div className="flex justify-between items-center border-b border-outline-variant/40 pb-4 mb-4 flex-wrap gap-2">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Risk Analysis</h3>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold tracking-wider border font-sans"
                  style={{
                    color: getRiskColor(result.riskScore),
                    borderColor: getRiskColor(result.riskScore),
                    background: `${getRiskColor(result.riskScore)}15`
                  }}
                >
                  {result.diversification} Diversification
                </span>
              </div>

              <div className="space-y-1.5 font-sans">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Risk Score:</span>
                  <strong style={{ color: getRiskColor(result.riskScore) }}>{result.riskScore} / 100</strong>
                </div>
                <div className="bg-surface-container rounded-full h-2 overflow-hidden border border-outline-variant/20">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${result.riskScore}%`,
                      backgroundColor: getRiskColor(result.riskScore)
                    }}
                  ></div>
                </div>
              </div>

              {result.portfolioChart && (
                <div className="bg-surface-container/20 border border-outline-variant/20 rounded-xl p-4 flex justify-center max-h-72 overflow-hidden">
                  <img src={`data:image/png;base64,${result.portfolioChart}`} alt="Portfolio Pie Chart" className="w-full h-auto object-contain max-h-64" />
                </div>
              )}

              <div className="space-y-3 font-serif">
                <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider">Recommended Safe Allocations (₹)</h4>

                <div className="grid grid-cols-2 gap-4 text-xs font-serif">
                  <div className="bg-surface-container/30 border border-outline-variant/20 rounded-xl p-3">
                    <span className="text-[10px] text-on-surface-variant font-sans block mb-1">Cash & FDs:</span>
                    <strong className="text-sm text-on-surface">₹{result.safeAllocation.cashFd.toLocaleString()}</strong>
                  </div>
                  <div className="bg-surface-container/30 border border-outline-variant/20 rounded-xl p-3">
                    <span className="text-[10px] text-on-surface-variant font-sans block mb-1">Bonds & Debt:</span>
                    <strong className="text-sm text-on-surface">₹{result.safeAllocation.bondsDebt.toLocaleString()}</strong>
                  </div>
                  <div className="bg-surface-container/30 border border-outline-variant/20 rounded-xl p-3">
                    <span className="text-[10px] text-on-surface-variant font-sans block mb-1">Equity & Mutual Funds:</span>
                    <strong className="text-sm text-on-surface">₹{result.safeAllocation.equity.toLocaleString()}</strong>
                  </div>
                  <div className="bg-surface-container/30 border border-outline-variant/20 rounded-xl p-3">
                    <span className="text-[10px] text-on-surface-variant font-sans block mb-1">Gold Hedge:</span>
                    <strong className="text-sm text-on-surface">₹{result.safeAllocation.gold.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div className="border-t border-outline-variant/40 pt-4 space-y-3">
                <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider font-serif">AI Portfolio Adjustments</h4>
                <div className="space-y-2 text-xs font-serif">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-2.5 items-start bg-surface-container/20 border border-outline-variant/20 rounded-xl p-3">
                      <span className="material-symbols-outlined text-emerald-400 text-sm mt-0.5">check_circle</span>
                      <span className="text-on-surface-variant leading-relaxed">{rec}</span>
                    </div>
                  ))}
                  {result.highRiskAssets.map((hra, i) => (
                    <div key={i} className="flex gap-2.5 items-start bg-error-container/10 border border-error/20 rounded-xl p-3">
                      <span className="material-symbols-outlined text-error text-sm mt-0.5">warning</span>
                      <span className="text-error leading-relaxed">{hra}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 border border-outline-variant/40 shadow-sm text-center flex flex-col items-center justify-center min-h-[300px] border-dashed">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4 animate-pulse">pie_chart</span>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface font-serif">Awaiting Asset holdings</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mt-2 font-serif leading-relaxed">
                Input your current investments in direct stock or real estate to compute risk indexes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioRisk;
