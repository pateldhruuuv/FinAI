import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const FinancialTwin = () => {
  const [twin, setTwin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTwin = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/premium-dashboard');
      setTwin(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch Digital Twin profile data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTwin();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] md:pl-20 mt-16 text-on-surface font-sans">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary-container mb-4">refresh</span>
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Materializing Digital Twin...</h2>
        <p className="text-xs text-on-surface-variant mt-2 font-serif">Fitting personality profiles and outstanding liabilities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] md:pl-20 mt-16 text-error font-sans p-6">
        <span className="material-symbols-outlined text-4xl text-error mb-4">report_problem</span>
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Twin Sync Error</h3>
        <p className="text-xs text-on-surface-variant mt-2 font-serif">{error}</p>
        <button onClick={fetchTwin} className="mt-4 px-5 py-2 border border-outline-variant hover:bg-surface-container rounded-full text-xs font-semibold cursor-pointer">Retry</button>
      </div>
    );
  }

  const { digitalTwin, portfolioAllocation, netWorth, loanEligibility } = twin;

  return (
    <div className="md:pl-20 mt-16 px-6 md:px-8 pt-10 md:pt-14 pb-6 md:pb-8 min-h-screen bg-background text-on-background font-sans max-w-[1600px] mx-auto animate-fade-in">

      {/* Header */}
      <header className="mb-8 border-b border-outline-variant pb-6">
        <Link to="/premium-dashboard" className="inline-flex items-center gap-2 text-xs text-on-surface-variant hover:text-on-surface font-semibold mb-4 transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Hub
        </Link>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-3xl text-primary-container font-bold m-2">person_search</span>
          <h1 className="font-display-hero text-3xl font-bold tracking-tight text-on-surface">Financial Digital Twin</h1>
        </div>
        <p className="text-sm text-on-surface-variant mt-1 m-2">Explore your contextual profile mapping: your stability score, financial age, and money personality traits.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Profile Card */}
        <div className="glass-card rounded-2xl p-6 md:p-8 border border-outline-variant/40 shadow-sm relative overflow-hidden flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-primary-container mb-4">
            <span className="material-symbols-outlined text-3xl font-bold">person</span>
          </div>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface font-serif mb-1">{twin.digitalTwin?.savingsPersonality || 'Balanced Saver'}</h2>
          <span className="px-3.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold tracking-wider font-sans mb-6">
            Stability Index: {digitalTwin?.stabilityScore || 75} / 100
          </span>

          <div className="grid grid-cols-2 gap-4 w-full font-serif text-xs text-left">
            <div className="bg-surface-container/30 border border-outline-variant/20 rounded-xl p-4 flex flex-col gap-1">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans font-bold">Financial Age</span>
              <strong className="text-sm text-on-surface">{digitalTwin?.financialAge || 28} Years</strong>
              <span className="text-[9px] text-on-surface-variant/40 font-sans mt-0.5">Based on asset/debt ratios</span>
            </div>

            <div className="bg-surface-container/30 border border-outline-variant/20 rounded-xl p-4 flex flex-col gap-1">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans font-bold">Risk Tolerance</span>
              <strong className="text-sm text-primary">{digitalTwin?.riskLevel || 'Moderate'}</strong>
              <span className="text-[9px] text-on-surface-variant/40 font-sans mt-0.5">Portfolio volatility index</span>
            </div>

            <div className="bg-surface-container/30 border border-outline-variant/20 rounded-xl p-4 flex flex-col gap-1">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans font-bold">Savings Trait</span>
              <strong className="text-sm text-on-surface">{digitalTwin?.savingsPersonality || 'Balanced'}</strong>
              <span className="text-[9px] text-on-surface-variant/40 font-sans mt-0.5">Income vs saving speed</span>
            </div>

            <div className="bg-surface-container/30 border border-outline-variant/20 rounded-xl p-4 flex flex-col gap-1">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans font-bold">Investment Trait</span>
              <strong className="text-sm text-on-surface">{digitalTwin?.investmentPersonality || 'Rebalancer'}</strong>
              <span className="text-[9px] text-on-surface-variant/40 font-sans mt-0.5">Asset distribution profile</span>
            </div>
          </div>
        </div>

        {/* Ledger breakdown card */}
        <div className="glass-card rounded-2xl p-6 md:p-8 border border-outline-variant/40 shadow-sm space-y-6">
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface font-serif">Digital Twin Balance Sheet</h3>

          <div className="space-y-6 font-serif text-xs">
            {/* Assets */}
            <div className="space-y-2">
              <h4 className="font-bold text-emerald-400 uppercase tracking-wider font-serif">Identified Assets</h4>
              <div className="space-y-2 font-sans">
                <div className="flex justify-between items-center bg-surface-container/30 border border-outline-variant/20 rounded-xl p-3">
                  <span className="text-on-surface-variant">Stock Equities:</span>
                  <strong className="text-on-surface font-serif">₹{portfolioAllocation?.stocks?.toLocaleString() || '0'}</strong>
                </div>
                <div className="flex justify-between items-center bg-surface-container/30 border border-outline-variant/20 rounded-xl p-3">
                  <span className="text-on-surface-variant">Mutual Funds:</span>
                  <strong className="text-on-surface font-serif">₹{portfolioAllocation?.mutualFunds?.toLocaleString() || '0'}</strong>
                </div>
                <div className="flex justify-between items-center bg-surface-container/30 border border-outline-variant/20 rounded-xl p-3">
                  <span className="text-on-surface-variant">Fixed Deposits:</span>
                  <strong className="text-on-surface font-serif">₹{portfolioAllocation?.fd?.toLocaleString() || '0'}</strong>
                </div>
                <div className="flex justify-between items-center bg-surface-container/30 border border-outline-variant/20 rounded-xl p-3">
                  <span className="text-on-surface-variant">Gold Hedge:</span>
                  <strong className="text-on-surface font-serif">₹{portfolioAllocation?.gold?.toLocaleString() || '0'}</strong>
                </div>
                <div className="flex justify-between items-center bg-surface-container/30 border border-outline-variant/20 rounded-xl p-3">
                  <span className="text-on-surface-variant">Real Estate Property:</span>
                  <strong className="text-on-surface font-serif">₹{portfolioAllocation?.property?.toLocaleString() || '0'}</strong>
                </div>
              </div>
            </div>

            {/* Liabilities */}
            <div className="space-y-2">
              <h4 className="font-bold text-rose-400 uppercase tracking-wider font-serif">Identified Liabilities</h4>
              <div className="space-y-2 font-sans">
                <div className="flex justify-between items-center bg-surface-container/30 border border-outline-variant/20 rounded-xl p-3">
                  <span className="text-on-surface-variant">Monthly EMIs / Outstandings:</span>
                  <strong className="text-on-surface font-serif">₹{twin.loanEligibility ? (twin.loanEligibility.maxEmi * 0.1).toLocaleString() : '₹12,000'}</strong>
                </div>
                <div className="flex justify-between items-center bg-surface-container/30 border border-outline-variant/20 rounded-xl p-3">
                  <span className="text-on-surface-variant">Estimated Outstanding Loans:</span>
                  <strong className="text-on-surface font-serif">₹{loanEligibility ? (loanEligibility.maxEmi * 15).toLocaleString() : '₹1,50,000'}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center p-4 bg-surface-container/40 border border-outline-variant rounded-xl font-serif text-sm">
            <span className="text-on-surface font-bold">Total Net Worth Status:</span>
            <strong className="text-emerald-400 font-bold">₹{netWorth ? netWorth.toLocaleString() : '---'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialTwin;
