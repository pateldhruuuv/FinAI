import React from 'react';
import { Link } from 'react-router-dom';

const Privacy = () => {
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
          <h1 className="font-display-hero text-4xl font-bold tracking-tight text-on-surface font-serif">Privacy Policy</h1>
          <p className="text-xs text-on-surface-variant mt-2 font-mono">Last updated: August 4, 2026</p>
        </header>

        <div className="glass-card rounded-2xl p-6 md:p-10 border border-outline-variant/40 shadow-xl bg-surface/50 space-y-6 text-sm leading-relaxed font-sans text-on-surface-variant">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-on-surface font-serif">1. Introduction</h2>
            <p>
              Welcome to Finmate. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-on-surface font-serif">2. Information We Collect</h2>
            <p>
              We collect personal information that you voluntarily provide to us when registering at the Services, expressing an interest in obtaining information about us or our products and Services, or otherwise contacting us.
            </p>
            <p className="bg-surface-container/40 p-4 rounded-xl border border-outline-variant/30 text-xs">
              <strong>Financial Data:</strong> We collect imported bank statement CSVs, net worth estimates, age, and monthly income parameter configurations explicitly provided to run our Machine Learning diagnostics. This data is stored securely and never sold to third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-on-surface font-serif">3. How We Use Your Information</h2>
            <p>
              We process your information for purposes based on legitimate business interests, the fulfillment of our contract with you, compliance with our legal obligations, and/or your consent. We use the information we collect or receive:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2">
              <li>To facilitate account creation and logon process.</li>
              <li>To deliver intelligent AI-powered financial advisory recommendations.</li>
              <li>To compute security scoring rating indicators through local classifier models.</li>
              <li>To process uploaded transaction histories.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-on-surface font-serif">4. Data Sharing and Consent</h2>
            <p>
              By default, all data anonymization is active. You have full ownership and toggle authority over sharing consent parameters within your account settings desk. We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-on-surface font-serif">5. Data Retention and Deletion</h2>
            <p>
              We keep your information for as long as necessary to fulfill the purposes outlined in this privacy policy unless otherwise required by law. Users have direct, unmitigated access to delete imported statements or permanently purge accounts through the Privacy Desk.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
