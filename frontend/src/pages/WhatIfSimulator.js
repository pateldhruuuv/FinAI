import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const WhatIfSimulator = () => {
  const [scenario, setScenario] = useState('salary_increase');
  const [value, setValue] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getScenarioConfig = () => {
    switch (scenario) {
      case 'salary_increase':
        return { label: 'Increase Percentage (%)', placeholder: 'e.g. 15 for 15%', min: 1, max: 100 };
      case 'job_loss':
        return { label: 'Duration of Unemployment (Months)', placeholder: 'e.g. 4', min: 1, max: 24 };
      case 'medical_emergency':
        return { label: 'Estimated Uncovered Expense (₹)', placeholder: 'e.g. 100000', min: 1000 };
      case 'marriage':
        return { label: 'Total Wedding Budget (₹)', placeholder: 'e.g. 500000', min: 10000 };
      case 'child_education':
        return { label: 'Higher Education Fees (₹)', placeholder: 'e.g. 800000', min: 10000 };
      case 'buying_house':
        return { label: 'Total House Value (₹)', placeholder: 'e.g. 5000000', min: 100000 };
      case 'buying_car':
        return { label: 'On-Road Car Price (₹)', placeholder: 'e.g. 800000', min: 50000 };
      default:
        return { label: 'Value', placeholder: 'Enter amount', min: 0 };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/what-if', {
        scenario,
        value: parseFloat(value),
      });
      setResult(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to simulate scenario');
      setLoading(false);
    }
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
          <span className="material-symbols-outlined text-3xl text-primary-container font-bold">query_stats</span>
          <h1 className="font-display-hero text-3xl font-bold tracking-tight text-on-surface">What-If Financial Simulator</h1>
        </div>
        <p className="text-sm text-on-surface-variant mt-1 m-2">Simulate major life milestones or financial emergencies to forecast impact on your savings and goals.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* Simulation Settings Card */}
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 border border-outline-variant/40 shadow-sm space-y-5">
          <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface border-b border-outline-variant/40 pb-3">Configure Scenario</h3>

          <div className="space-y-4 font-sans">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">Select Milestone / Event</label>
              <div className="relative">
                <select
                  value={scenario}
                  onChange={(e) => { setScenario(e.target.value); setValue(''); setResult(null); }}
                  className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface appearance-none focus:outline-none focus:border-primary-container"
                >
                  <option value="salary_increase">Salary Hike / Increase</option>
                  <option value="job_loss">Sudden Job Loss</option>
                  <option value="medical_emergency">Medical Emergency Expense</option>
                  <option value="marriage">Marriage Expenses</option>
                  <option value="child_education">Child Higher Education Fund</option>
                  <option value="buying_house">Buying a House (80% financed)</option>
                  <option value="buying_car">Buying a Car (80% financed)</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant pointer-events-none text-base">expand_more</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">{getScenarioConfig().label} *</label>
              <input
                type="number"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={getScenarioConfig().placeholder}
                min={getScenarioConfig().min}
                max={getScenarioConfig().max}
                className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-container hover:bg-primary text-on-primary-container font-semibold py-3 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer text-sm mt-6 shadow-md"
          >
            {loading ? 'Running Simulation...' : 'Simulate Future Impact'}
          </button>
        </form>

        {/* Forecast Card */}
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
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container text-xl">query_stats</span>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Forecasted Impact</h3>
                </div>
                <button
                  type="button"
                  onClick={() => { setValue(''); setResult(null); }}
                  className="px-3 py-1.5 border border-outline-variant rounded-full text-xs font-sans text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">refresh</span>
                  Reset
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Metric 1 */}
                <div className="bg-surface-container/30 border border-outline-variant/20 rounded-xl p-4 flex flex-col gap-1 text-left">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block font-sans">Projected Savings (3 Yrs)</span>
                  <div className="text-lg font-bold text-on-surface">₹{result.futureSavings.toLocaleString()}</div>
                  <span className="text-[9px] text-on-surface-variant/40 font-sans block mt-1">Liquid reserves forecast</span>
                </div>

                {/* Metric 2 */}
                <div className="bg-surface-container/30 border border-outline-variant/20 rounded-xl p-4 flex flex-col gap-1 text-left">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block font-sans">Liability / Debt Level</span>
                  <div className={`text-lg font-bold ${result.debt > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ₹{result.debt.toLocaleString()}
                  </div>
                  <span className="text-[9px] text-on-surface-variant/40 font-sans block mt-1">Outstanding loans/debt</span>
                </div>

                {/* Metric 3 */}
                <div className="bg-surface-container/30 border border-outline-variant/20 rounded-xl p-4 flex flex-col gap-1 text-left">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block font-sans">Goal Delay Timeline</span>
                  <div className={`text-lg font-bold ${result.goalDelayMonths > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {result.goalDelayMonths === 0 ? 'No Delay' : `${result.goalDelayMonths} Months`}
                  </div>
                  <span className="text-[9px] text-on-surface-variant/40 font-sans block mt-1">Delay on target planners</span>
                </div>

                {/* Metric 4 */}
                <div className="bg-surface-container/30 border border-outline-variant/20 rounded-xl p-4 flex flex-col gap-1 text-left">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block font-sans">Added Annual Investment</span>
                  <div className="text-lg font-bold text-primary">
                    ₹{result.investmentImpact.toLocaleString()}
                  </div>
                  <span className="text-[9px] text-on-surface-variant/40 font-sans block mt-1">Added market allocation</span>
                </div>
              </div>

              {/* Explanation note */}
              <div className="bg-primary-container/5 border border-primary-container/15 rounded-xl p-4 flex gap-3 items-start">
                <span className="material-symbols-outlined text-primary-container text-xl mt-0.5">info</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {scenario === 'salary_increase' && "Congratulations! A higher salary accelerates your net worth growth and reduces goal times, allowing you to invest 60% of your raise."}
                  {scenario === 'job_loss' && "Job loss drains your emergency buffer. We recommend cutting discretionary spending immediately and extending your emergency pool to 6+ months."}
                  {scenario === 'medical_emergency' && "Emergency costs reduce your liquid savings. If the cost exceeds your savings, it translates into high-interest debt."}
                  {scenario === 'marriage' && "Weddings require significant cash capital. We recommend saving in low-volatility debt funds 1-2 years prior to the milestone."}
                  {(scenario === 'buying_house' || scenario === 'buying_car') && "Big purchases increase your leverage and monthly EMI commitments, which reduces monthly savings and delays secondary goals."}
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 border border-outline-variant/40 shadow-sm text-center flex flex-col items-center justify-center min-h-[300px] border-dashed">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4 animate-pulse">query_stats</span>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface font-serif">Awaiting Simulation Config</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mt-2 font-serif leading-relaxed">
                Configure a scenario and click simulate to project future savings, liabilities, and delays.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatIfSimulator;
