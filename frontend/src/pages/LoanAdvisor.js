import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const LoanAdvisor = () => {
  const [formData, setFormData] = useState({
    income: '',
    age: '',
    creditScore: '750',
    currentEmi: '',
    existingLoans: '',
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
        income: parseFloat(formData.income),
        age: parseInt(formData.age),
        creditScore: parseInt(formData.creditScore || 750),
        currentEmi: parseFloat(formData.currentEmi || 0),
        existingLoans: parseFloat(formData.existingLoans || 0),
      };

      const res = await axios.post('/loan-advisor', payload);
      const apiData = res.data.data;
      setResult({
        creditRiskLevel: apiData.loanRisk,
        maxSafeEmi: apiData.maximumEmi,
        additionalEmiBuffer: Math.max(apiData.maximumEmi - payload.currentEmi, 0),
        eligibleLimits: apiData.breakdown || {},
      });
      setLoading(false);
    } catch (err) {

      console.error(err);
      setError(err.response?.data?.message || 'Failed to analyze loan eligibility');
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    if (risk === 'Low') return '#10b981';
    if (risk === 'Medium') return '#ffb59d';
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
          <span className="material-symbols-outlined text-3xl text-primary-container font-bold">scale</span>
          <h1 className="font-display-hero text-3xl font-bold tracking-tight text-on-surface">Loan Eligibility Advisor</h1>
        </div>
        <p className="text-sm text-on-surface-variant mt-1 m-2">Determine your multi-loan borrowing limits, safe EMI budgets, and credit risk levels.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* Form Panel */}
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 border border-outline-variant/40 shadow-sm space-y-5">
          <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface border-b border-outline-variant/40 pb-3">Borrowing Profile Parameters</h3>

          <div className="space-y-4 font-sans">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">Net Monthly Income (₹) *</label>
              <input
                type="number"
                name="income"
                required
                value={formData.income}
                onChange={handleChange}
                placeholder="e.g. 80000"
                className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">Current Age (Years) *</label>
              <input
                type="number"
                name="age"
                required
                value={formData.age}
                onChange={handleChange}
                placeholder="e.g. 30"
                className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">Credit Score (300 - 900)</label>
              <input
                type="number"
                name="creditScore"
                value={formData.creditScore}
                onChange={handleChange}
                placeholder="e.g. 750"
                className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">Current Monthly EMI Commitments (₹)</label>
              <input
                type="number"
                name="currentEmi"
                value={formData.currentEmi}
                onChange={handleChange}
                placeholder="e.g. 15000"
                className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">Total Outstanding Loans Principal (₹)</label>
              <input
                type="number"
                name="existingLoans"
                value={formData.existingLoans}
                onChange={handleChange}
                placeholder="e.g. 500000"
                className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary-container hover:bg-primary text-on-primary-container font-semibold py-3 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer text-sm mt-6 shadow-md"
            disabled={loading}
          >
            <span className="material-symbols-outlined text-md">scale</span>
            {loading ? 'Evaluating Borrowing Capacity...' : 'Evaluate Borrowing Capacity'}
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
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Eligibility Diagnosis</h3>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold tracking-wider border"
                  style={{
                    borderColor: getRiskColor(result.creditRiskLevel),
                    color: getRiskColor(result.creditRiskLevel),
                    backgroundColor: `${getRiskColor(result.creditRiskLevel)}15`
                  }}
                >
                  {result.creditRiskLevel} Risk Profile
                </span>
              </div>

              {/* EMI Box */}
              <div className="grid grid-cols-2 bg-surface-container/30 border border-outline-variant/40 rounded-xl overflow-hidden divide-x divide-outline-variant/30">
                <div className="p-4 text-center">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1">Max Safe EMI Budget</span>
                  <strong className="text-xl font-bold text-emerald-400 font-serif">₹{Math.round(result.maxSafeEmi).toLocaleString()}</strong>
                  <span className="text-[9px] text-on-surface-variant/40 font-sans block mt-1">Based on FOIR 50%</span>
                </div>
                <div className="p-4 text-center">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1">Available EMI Buffer</span>
                  <strong className={`text-xl font-bold font-serif ${result.additionalEmiBuffer > 0 ? 'text-primary' : 'text-rose-400'}`}>
                    ₹{Math.round(result.additionalEmiBuffer).toLocaleString()}
                  </strong>
                  <span className="text-[9px] text-on-surface-variant/40 font-sans block mt-1">Free capacity</span>
                </div>
              </div>

              {/* Limits list */}
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-3 uppercase tracking-wider font-serif">Eligible Borrowing Caps</h4>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  {Object.entries(result.eligibleLimits).map(([type, limit], index) => {
                    const colors = ['#ff6b35', '#918cff', '#10b981'];
                    const color = colors[index % colors.length];

                    return (
                      <div key={type} className="flex justify-between items-center bg-surface-container/30 border border-outline-variant/20 rounded-xl p-3.5">
                        <div className="flex items-center gap-2.5 text-on-surface font-sans">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                          <span>{type.replace(/([A-Z])/g, ' $1').trim()} Limit</span>
                        </div>
                        <strong className="text-sm font-bold font-serif">₹{Math.round(limit).toLocaleString()}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Advisory note */}
              <div className="bg-primary-container/5 border border-primary-container/15 rounded-xl p-4 flex gap-3 items-start">
                <span className="material-symbols-outlined text-primary-container text-xl mt-0.5">psychology</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {result.additionalEmiBuffer > 0
                    ? `Safe margin is available. Suggestion: Maintain credit score by limiting credit inquiries. Ensure total EMI remains under 40% of net income for high financial stability.`
                    : `Debt-to-income margin is tight or over limit. Suggestion: Focus on paying off high-interest outstanding balances first before locking in new loan EMI vectors.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 border border-outline-variant/40 shadow-sm text-center flex flex-col items-center justify-center min-h-[300px] border-dashed">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4">account_balance_wallet</span>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface font-serif">Awaiting Inputs</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mt-2 font-serif leading-relaxed">
                Provide your income base and liability structures to evaluate multi-loan safety caps.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoanAdvisor;
