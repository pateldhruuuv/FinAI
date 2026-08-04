import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const PurchaseAdvisor = () => {
  const [formData, setFormData] = useState({
    item: '',
    cost: '',
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
      const res = await axios.post('/purchase-advisor', {
        item: formData.item,
        cost: parseFloat(formData.cost),
      });
      setResult(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to get purchase advice');
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Buy') return '#10b981';
    if (status === 'Wait') return '#ffb59d';
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
          <span className="material-symbols-outlined text-3xl text-primary-container font-bold">payments</span>
          <h1 className="font-display-hero text-3xl font-bold tracking-tight text-on-surface">AI Purchase Affordability</h1>
        </div>
        <p className="text-sm text-on-surface-variant mt-1 m-2">Check if you can afford a major purchase without delaying active goals or draining emergency savings.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Form Panel */}
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 border border-outline-variant/40 shadow-sm space-y-5">
          <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface border-b border-outline-variant/40 pb-3">Proposed Purchase Details</h3>

          <div className="space-y-4 font-sans">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">What do you want to buy? *</label>
              <input
                type="text"
                name="item"
                required
                value={formData.item}
                onChange={handleChange}
                placeholder="e.g. iPhone 15 Pro, Sport Bike, Laptop"
                className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">Estimated Cost (₹) *</label>
              <input
                type="number"
                name="cost"
                required
                value={formData.cost}
                onChange={handleChange}
                placeholder="e.g. 120000"
                className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-container hover:bg-primary text-on-primary-container font-semibold py-3 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer text-sm mt-6 shadow-md"
          >
            {loading ? 'Evaluating Financial Impact...' : 'Evaluate Purchase Affordability'}
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
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Purchase Verdict: {formData.item}</h3>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold tracking-wider border font-sans"
                  style={{
                    color: getStatusColor(result.status),
                    borderColor: getStatusColor(result.status),
                    background: `${getStatusColor(result.status)}15`
                  }}
                >
                  {result.status}
                </span>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-surface-container/30 border border-outline-variant/30 rounded-xl">
                <div className="flex flex-col items-center justify-center border-4 rounded-full w-24 h-24 shrink-0 font-sans" style={{ borderColor: getStatusColor(result.status) }}>
                  <span className="text-2xl font-bold text-on-surface">{result.purchaseScore}</span>
                  <span className="text-[9px] text-on-surface-variant font-semibold">/100</span>
                </div>

                <div className="leading-relaxed text-sm text-on-surface-variant">
                  <p>
                    {result.status === 'Buy' && "Excellent! Your savings are sufficient and this purchase will not compromise your emergency buffer or active goals. You are cleared to proceed."}
                    {result.status === 'Wait' && "Caution: Affording this in cash right now would draw down on your emergency cushion. Consider saving for a few months or exploring refurbished alternatives."}
                    {result.status === 'Avoid' && "Warning: This purchase is highly discouraged as it exceeds your safe budget parameters and will delay key active goals or increase debt risks."}
                  </p>
                </div>
              </div>

              {/* Suggestions */}
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-3 uppercase tracking-wider font-serif">Alternative & Smart Purchase Suggestions</h4>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex justify-between items-center bg-surface-container/30 border border-outline-variant/20 rounded-xl p-3.5">
                    <span className="text-on-surface-variant font-sans">Refurbished Alternative:</span>
                    <strong className="text-sm text-on-surface">{result.suggestions.refurbishedOption}</strong>
                  </div>

                  <div className="flex justify-between items-center bg-surface-container/30 border border-outline-variant/20 rounded-xl p-3.5">
                    <span className="text-on-surface-variant font-sans">Second-Hand Estimate:</span>
                    <strong className="text-sm text-on-surface">{result.suggestions.secondHandOption}</strong>
                  </div>

                  <div className="flex justify-between items-center bg-surface-container/30 border border-outline-variant/20 rounded-xl p-3.5">
                    <span className="text-on-surface-variant font-sans">Monthly EMI Option:</span>
                    <strong className="text-sm text-on-surface">{result.suggestions.emiOption}</strong>
                  </div>

                  <div className="flex flex-col gap-2 bg-surface-container/30 border border-outline-variant/20 rounded-xl p-3.5">
                    <span className="text-on-surface-variant font-sans">Better Alternative Advice:</span>
                    <p className="text-[12px] text-primary-container leading-relaxed font-serif">{result.suggestions.betterAlternative}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 border border-outline-variant/40 shadow-sm text-center flex flex-col items-center justify-center min-h-[300px] border-dashed">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4">shopping_cart</span>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface font-serif">Awaiting Item Parameters</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mt-2 font-serif leading-relaxed">
                Submit the purchase parameters to evaluate cash reserves drainage and check secondary market rates.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseAdvisor;
