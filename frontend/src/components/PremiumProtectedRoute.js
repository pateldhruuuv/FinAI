import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PremiumProtectedRoute = ({ children }) => {
  const { token, user, loading, togglePremium } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-on-background font-serif">
        <div className="p-8 border border-outline-variant rounded-2xl glass-card text-center max-w-xs w-full shadow-2xl animate-pulse">
          <div className="w-12 h-12 bg-primary-container/20 border-2 border-primary rounded-xl flex items-center justify-center text-primary mx-auto mb-6 animate-spin">
            <span className="material-symbols-outlined text-2xl font-bold">verified</span>
          </div>
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">Verifying Level</h2>
          <p className="font-label-sm text-label-sm text-on-surface-variant font-sans">Reading credentials from the ledger...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !user.isPremium) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] md:pl-20 mt-16 bg-background text-on-background p-6 font-sans">
        <div className="max-w-lg w-full p-8 md:p-10 border border-outline-variant rounded-2xl glass-card text-center shadow-2xl relative overflow-hidden animate-fade-in">
          {/* Subtle glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Lock Icon */}
          <div className="w-16 h-16 rounded-full bg-primary-container/10 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-6 relative">
            <span className="absolute inset-0 rounded-full bg-primary/5 blur-md pointer-events-none"></span>
            <span className="material-symbols-outlined text-3xl font-semibold">lock</span>
          </div>

          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-3 font-serif">Unlock Premium Advisory</h2>
          <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
            This professional-tier AI advisor panel is locked. Upgrade your account to enable institutional robo-wealth algorithms, advanced simulations, and customized deductions trackers.
          </p>

          {/* Feature List */}
          <div className="text-left bg-surface-container/60 border border-outline-variant/50 rounded-xl p-5 flex flex-col gap-3 mb-8">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-lg mt-0.5">check_circle</span>
              <span className="text-sm text-on-surface-variant">
                <strong className="text-on-surface font-semibold font-serif">Tax Optimization:</strong> Maximize Section 80C, 80D, and HRA exemptions.
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-lg mt-0.5">check_circle</span>
              <span className="text-sm text-on-surface-variant">
                <strong className="text-on-surface font-semibold font-serif">Loan Advisor:</strong> Evaluate safe multi-borrowing capacities and debt schedules.
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-lg mt-0.5">check_circle</span>
              <span className="text-sm text-on-surface-variant">
                <strong className="text-on-surface font-semibold font-serif">What-If Simulator:</strong> Project long-term effects of raises, job changes, or life emergencies.
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-lg mt-0.5">check_circle</span>
              <span className="text-sm text-on-surface-variant">
                <strong className="text-on-surface font-semibold font-serif">Digital Twin:</strong> Run stability index evaluations against simulated stress tests.
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-lg mt-0.5">check_circle</span>
              <span className="text-sm text-on-surface-variant">
                <strong className="text-on-surface font-semibold font-serif">AI Financial Coach:</strong> Access context-aware advisor panels trained on your budget.
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={() => togglePremium()} 
            className="w-full py-3.5 rounded-full bg-primary text-on-primary font-bold hover:bg-primary-fixed-dim transition-all flex items-center justify-center gap-2 cursor-pointer text-label-md"
          >
            <span className="material-symbols-outlined text-lg">zap</span>
            Unlock Premium Advisory (Trial Mode)
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default PremiumProtectedRoute;
