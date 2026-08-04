import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const InsuranceGap = () => {
  const [formData, setFormData] = useState({
    coverageAmount: '',
    dependents: '',
    income: '',
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
        coverageAmount: parseFloat(formData.coverageAmount || 0),
        dependents: parseInt(formData.dependents || 0),
        income: parseFloat(formData.income),
      };

      const res = await axios.post('/insurance-gap', payload);
      setResult(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to analyze insurance gap');
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    if (priority === 'Critical') return '#ef4444';
    if (priority === 'High') return '#ffb59d';
    if (priority === 'Medium') return '#f59e0b';
    return '#10b981';
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
          <span className="material-symbols-outlined text-3xl text-primary-container font-bold">shield</span>
          <h1 className="font-display-hero text-3xl font-bold tracking-tight text-on-surface">Insurance Gap Analysis</h1>
        </div>
        <p className="text-sm text-on-surface-variant mt-1 m-2">Calculate your protection deficits and identify the optimal life/health coverage policies needed.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Form Panel */}
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 border border-outline-variant/40 shadow-sm space-y-5">
          <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface border-b border-outline-variant/40 pb-3">Coverage Profile</h3>

          <div className="space-y-4 font-sans text-xs">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">Annual Income (₹) *</label>
              <input
                type="number"
                name="income"
                required
                value={formData.income}
                onChange={handleChange}
                placeholder="e.g. 1000000"
                className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">Total Active Insurance Coverage (₹)</label>
              <input
                type="number"
                name="coverageAmount"
                value={formData.coverageAmount}
                onChange={handleChange}
                placeholder="Current life/health policies sum"
                className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">Number of Dependents *</label>
              <input
                type="number"
                name="dependents"
                required
                value={formData.dependents}
                onChange={handleChange}
                placeholder="e.g. 3"
                className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-container hover:bg-primary text-on-primary-container font-semibold py-3 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer text-sm mt-6 shadow-md"
          >
            {loading ? 'Analyzing Gaps...' : 'Run Gap Analysis'}
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
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Gap Summary</h3>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold tracking-wider border font-sans"
                  style={{
                    color: getPriorityColor(result.priorityLevel),
                    borderColor: getPriorityColor(result.priorityLevel),
                    background: `${getPriorityColor(result.priorityLevel)}15`
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs">shield_alert</span>
                    <span>{result.priorityLevel} Priority</span>
                  </div>
                </span>
              </div>

              <div className="grid grid-cols-2 bg-surface-container/30 border border-outline-variant/40 rounded-xl overflow-hidden divide-x divide-outline-variant/30">
                <div className="p-4 text-center">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans block mb-1">Required Protection</span>
                  <strong className="text-xl font-bold text-on-surface font-serif">₹{result.requiredCoverage.toLocaleString()}</strong>
                </div>
                <div className="p-4 text-center">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans block mb-1">Uncovered Deficit (Gap)</span>
                  <strong className="text-xl font-bold text-rose-400 font-serif">₹{result.coverageGap.toLocaleString()}</strong>
                </div>
              </div>

              <div className="space-y-3 font-serif">
                <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider">Recommendations Checklist</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-surface-container/30 border border-outline-variant/20 rounded-xl p-3.5 text-xs">
                    <span className="text-on-surface-variant font-sans">Suggested Add-On Cover Amount:</span>
                    <strong className="text-sm text-on-surface">₹{result.recommendedAdditionalCoverage.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between items-center bg-surface-container/30 border border-outline-variant/20 rounded-xl p-3.5 text-xs">
                    <span className="text-on-surface-variant font-sans">Recommended Product:</span>
                    <strong className="text-sm text-emerald-400">{result.bestInsuranceType}</strong>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-on-surface-variant/60 leading-relaxed font-serif pt-4 border-t border-outline-variant/30">
                Required protection is calculated using the 10x-15x income benchmark plus dependency multipliers to secure household liabilities.
              </p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 border border-outline-variant/40 shadow-sm text-center flex flex-col items-center justify-center min-h-[300px] border-dashed">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4 animate-pulse">shield</span>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface font-serif">Awaiting Parameters</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mt-2 font-serif leading-relaxed">
                Provide your active policies and dependents to compute your gap coverage index.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsuranceGap;
