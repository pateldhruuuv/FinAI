import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const FinancialReports = () => {
  const [reportType, setReportType] = useState('Monthly');
  const [format, setFormat] = useState('PDF');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const res = await axios.post(
        '/financial-report',
        { reportType, format },
        { responseType: 'blob' }
      );

      const typeMap = {
        PDF: 'application/pdf',
        CSV: 'text/csv',
      };

      const blob = new Blob([res.data], { type: typeMap[format] });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `FinPilot_${reportType}_Report_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
      link.click();

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to compile and stream the requested financial report file.');
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
          <span className="material-symbols-outlined text-3xl text-primary-container font-bold m-2">file_download</span>
          <h1 className="font-display-hero text-3xl font-bold tracking-tight text-on-surface">Financial Reports Engine</h1>
        </div>
        <p className="text-sm text-on-surface-variant mt-1 m-2">Generate comprehensive, downloadable advisory reports in PDF or CSV formats.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Settings Card */}
        <form onSubmit={handleDownload} className="glass-card rounded-2xl p-6 md:p-8 border border-outline-variant/40 shadow-sm space-y-5">
          <h3 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface border-b border-outline-variant/40 pb-3">Compile Report</h3>

          <div className="space-y-4 font-sans text-xs">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">Report Scope</label>
              <div className="relative">
                <select
                  value={reportType}
                  onChange={(e) => { setReportType(e.target.value); setSuccess(false); }}
                  className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface appearance-none focus:outline-none focus:border-primary-container transition-all"
                >
                  <option value="Monthly">Monthly Performance Statement</option>
                  <option value="Quarterly">Quarterly Consolidated Audit</option>
                  <option value="Yearly">Yearly Wealth Advisory Plan</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant pointer-events-none text-base">expand_more</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1">Export File Format</label>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`flex items-center justify-center py-3 px-4 border rounded-xl cursor-pointer font-bold text-xs select-none transition-all ${format === 'PDF'
                      ? 'border-primary bg-primary/5 text-primary-container'
                      : 'border-outline-variant/60 bg-surface-container/30 text-on-surface-variant hover:border-outline-variant'
                    }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value="PDF"
                    checked={format === 'PDF'}
                    onChange={() => { setFormat('PDF'); setSuccess(false); }}
                    className="hidden"
                  />
                  <span>PDF Document</span>
                </label>

                <label
                  className={`flex items-center justify-center py-3 px-4 border rounded-xl cursor-pointer font-bold text-xs select-none transition-all ${format === 'CSV'
                      ? 'border-primary bg-primary/5 text-primary-container'
                      : 'border-outline-variant/60 bg-surface-container/30 text-on-surface-variant hover:border-outline-variant'
                    }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value="CSV"
                    checked={format === 'CSV'}
                    onChange={() => { setFormat('CSV'); setSuccess(false); }}
                    className="hidden"
                  />
                  <span>CSV Spreadsheet</span>
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-container hover:bg-primary text-on-primary-container font-semibold py-3 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer text-sm mt-6 shadow-md"
          >
            <span className="material-symbols-outlined text-md">download</span>
            {loading ? 'Compiling Ledger Metrics...' : 'Generate & Download'}
          </button>
        </form>

        {/* Info panel */}
        <div className="glass-card rounded-2xl p-6 md:p-8 border border-outline-variant/40 shadow-sm space-y-6">
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface font-serif border-b border-outline-variant/40 pb-3">Report Scope Details</h3>

          <div className="space-y-3.5 font-serif text-xs">
            <div className="flex gap-2.5 items-start text-on-surface-variant">
              <span className="material-symbols-outlined text-emerald-400 text-sm mt-0.5">check_circle</span>
              <span className="leading-relaxed">Full Expense & Category Breakdown analysis</span>
            </div>
            <div className="flex gap-2.5 items-start text-on-surface-variant">
              <span className="material-symbols-outlined text-emerald-400 text-sm mt-0.5">check_circle</span>
              <span className="leading-relaxed">Monthly net savings calculations</span>
            </div>
            <div className="flex gap-2.5 items-start text-on-surface-variant">
              <span className="material-symbols-outlined text-emerald-400 text-sm mt-0.5">check_circle</span>
              <span className="leading-relaxed">Total outstanding liabilities and loan logs</span>
            </div>
            <div className="flex gap-2.5 items-start text-on-surface-variant">
              <span className="material-symbols-outlined text-emerald-400 text-sm mt-0.5">check_circle</span>
              <span className="leading-relaxed">Investment portfolio valuations</span>
            </div>
            <div className="flex gap-2.5 items-start text-on-surface-variant">
              <span className="material-symbols-outlined text-emerald-400 text-sm mt-0.5">check_circle</span>
              <span className="leading-relaxed">AI Recommendation checklists</span>
            </div>
          </div>

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs flex items-center gap-2.5 font-serif">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>Report compiled and downloaded successfully! Check your downloads folder.</span>
            </div>
          )}

          {error && (
            <div className="bg-error-container/20 border border-error/30 text-error p-4 rounded-xl text-xs flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base">report_problem</span>
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;
