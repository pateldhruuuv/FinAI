import React from 'react';
import { Link } from 'react-router-dom';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background text-on-background pt-32 pb-20 relative overflow-hidden font-sans">
      {/* Background radial gradient blobs for deep premium ambiance */}
      <div className="absolute top-[5%] left-[-15%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-15%] w-[600px] h-[600px] bg-tertiary-container/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-[800px] mx-auto px-6 relative z-10 space-y-8 text-left">
        <Link to="/" className="inline-flex items-center gap-2 text-xs text-on-surface-variant hover:text-on-surface font-semibold mb-4 transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Home
        </Link>

        <header className="border-b border-outline-variant pb-6">
          <h1 className="font-display-hero text-4xl font-bold tracking-tight text-on-surface font-serif">Terms of Service</h1>
          <p className="text-xs text-on-surface-variant mt-2 font-mono">Last updated: August 4, 2026</p>
        </header>

        <div className="glass-card rounded-2xl p-6 md:p-10 border border-outline-variant/40 shadow-xl bg-surface/50 space-y-6 text-sm leading-relaxed font-sans text-on-surface-variant">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-on-surface font-serif">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Finmate services, websites, and applications, you agree to be bound by these Terms of Service. If you do not agree to all of the terms and conditions, you must not access or use our services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-on-surface font-serif">2. Services Offered</h2>
            <p>
              Finmate offers a personal finance dashboard with AI-driven analytics, budgeting, tax optimization simulations, loan eligibility assessments, and investment/insurance gap calculations.
            </p>
            <p className="bg-amber-500/10 text-amber-400 border border-amber-500/20 p-4 rounded-xl text-xs font-serif leading-relaxed">
              <strong>Disclaimer:</strong> The AI advisory components represent diagnostic calculations based on mathematical decision trees and random forest classifier models. Finmate does NOT act as a registered SEBI investment advisor. All metrics and suggestions are for educational simulation purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-on-surface font-serif">3. User Accounts</h2>
            <p>
              When you create an account, you must provide information that is accurate, complete, and current. Failure to do so constitutes a breach of the Terms. You are responsible for safeguarding the credentials you use to access the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-on-surface font-serif">4. Imported Ledgers and CSVs</h2>
            <p>
              Users are solely responsible for the validity, structure, and integrity of the bank statements uploaded to the Universal Transaction Hub. Finmate is not responsible for errors arising from modified formats or inaccurate raw bank values.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-on-surface font-serif">5. Termination</h2>
            <p>
              We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation a breach of the Terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
