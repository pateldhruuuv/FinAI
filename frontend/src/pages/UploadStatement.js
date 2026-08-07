import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UploadStatement = () => {
  // Navigation & Tabs
  const navigate = useNavigate();
  const [activeHubTab, setActiveHubTab] = useState('upload');

  // File & Upload States
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState(null);
  const [parseResult, setParseResult] = useState(null);

  // Loaded Dashboard States
  const [transactions, setTransactions] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [recurringPayments, setRecurringPayments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  // Category Correction Modal States
  const [correctionModal, setCorrectionModal] = useState({ isOpen: false, transaction: null });
  const [correctedCategory, setCorrectedCategory] = useState('');
  const [correctedMerchant, setCorrectedMerchant] = useState('');
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  // Standard categories
  const CATEGORIES = [
    "Entertainment", "Food", "Shopping", "Travel", "Bills", "Insurance",
    "Investment", "Medical", "Education", "Salary", "Transfer", "ATM",
    "Fuel", "Groceries", "Utilities", "Taxes", "Miscellaneous"
  ];

  // Fetch initial data on mount
  useEffect(() => {
    fetchHubData();
  }, []);

  const fetchHubData = async () => {
    setLoadingData(true);
    try {
      const [txRes, subRes, analyticsRes] = await Promise.all([
        axios.get('/transactions'),
        axios.get('/subscriptions'),
        axios.get('/merchant-analysis')
      ]);

      if (txRes.data?.status === 'success') {
        setTransactions(txRes.data.data);
      }
      if (subRes.data?.status === 'success') {
        setSubscriptions(subRes.data.data);
      }
      if (analyticsRes.data?.status === 'success') {
        setAnalytics(analyticsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load hub data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setMessage(null);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('statement', file);

    try {
      // Simulate progress bar increments
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 350);

      const res = await axios.post('/upload-statement', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (res.data?.status === 'success') {
        setMessage({ type: 'success', text: 'Bank statement uploaded and processed successfully!' });
        setParseResult(res.data.data);

        // Sync local states with newly parsed data
        if (res.data.data.transactions) {
          fetchHubData();
        }
      }
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to parse file. Ensure format matches SBI, HDFC, ICICI Excel or CSV schemas.'
      });
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const downloadDuplicateCSV = () => {
    if (!parseResult || !parseResult.duplicate_csv) return;
    const blob = new Blob([parseResult.duplicate_csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'duplicate_transactions.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Category Correction Handling
  const openCorrectionModal = (tx) => {
    setCorrectionModal({ isOpen: true, transaction: tx });
    setCorrectedCategory(tx.category);
    setCorrectedMerchant(tx.merchant || tx.description);
  };

  const submitCorrection = async () => {
    if (!correctedCategory) return;
    setSubmittingCorrection(true);
    try {
      const res = await axios.post('/update-category', {
        transactionId: correctionModal.transaction._id,
        correctedCategory,
        merchantName: correctedMerchant
      });

      if (res.data?.status === 'success') {
        setTransactions(prev => prev.map(t =>
          t._id === correctionModal.transaction._id
            ? { ...t, category: correctedCategory, merchant: correctedMerchant, confidence: 1.0, is_unknown: false }
            : t
        ));
        setCorrectionModal({ isOpen: false, transaction: null });
        fetchHubData();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update category. Please try again.');
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const unknownTransactions = transactions.filter(t => t.is_unknown || t.confidence < 0.7);

  const getCategoryColor = (cat) => {
    const map = {
      Salary: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      Investment: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      Bills: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      Shopping: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      Entertainment: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      Groceries: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    };
    return map[cat] || 'bg-surface-container text-on-surface-variant border-outline-variant/30';
  };

  return (
    <div className="md:pl-20 mt-16 px-6 md:px-8 pt-10 md:pt-14 pb-6 md:pb-8 min-h-screen bg-background text-on-background font-sans max-w-[1600px] mx-auto animate-fade-in">

      {/* Header */}
      <div className="mb-8 border-b border-outline-variant pb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 text-xs text-on-surface-variant hover:text-on-surface font-semibold mb-4 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Cockpit
        </button>
        <h1 className="font-display-hero text-3xl font-bold tracking-tight text-on-surface m-2">Universal Transaction Hub</h1>
        <p className="text-sm text-on-surface-variant mt-1 m-2">AI-Powered Bank Statement Parser, Categorization, Subscriptions, & Financial Analytics.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-outline-variant/40 pb-2 mb-6 overflow-x-auto">
        {[
          { key: 'upload', icon: 'cloud_upload', label: 'Statement Parser' },
          { key: 'subscriptions', icon: 'calendar_month', label: 'Subscriptions' },
          { key: 'recurring', icon: 'credit_card', label: 'Recurring Expenses' },
          { key: 'analytics', icon: 'analytics', label: 'Merchant Analytics' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveHubTab(t.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeHubTab === t.key
                ? 'bg-primary-container/10 border border-primary-container/20 text-primary-container'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/40'
              }`}
          >
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeHubTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Main Upload Column (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm space-y-4">
              <h2 className="font-headline-sm text-headline-sm font-bold font-serif text-on-surface">Upload Statement</h2>
              <p className="text-xs text-on-surface-variant">Drag and drop bank statement files (CSV, Excel, PDF) from SBI, HDFC, ICICI, Axis, Kotak, etc.</p>

              {message && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 font-serif text-xs ${message.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-error-container/20 border-error/30 text-error'
                  }`}>
                  <span className="material-symbols-outlined text-sm">{message.type === 'success' ? 'check_circle' : 'report_problem'}</span>
                  <span>{message.text}</span>
                </div>
              )}

              {parseResult && parseResult.duplicate_summary && parseResult.duplicate_summary.duplicate_removed > 0 && (
                <div className="p-4 rounded-xl border bg-amber-500/10 border-amber-500/20 text-amber-400 flex flex-col gap-1.5 font-serif text-xs animate-fade-in">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                    <span className="font-bold uppercase tracking-wider">Deduplication Report</span>
                  </div>
                  <ul className="list-disc list-inside ml-6 space-y-0.5 text-on-surface-variant font-sans text-[11px]">
                    {parseResult.duplicate_summary.duplicate_removed - (parseResult.db_duplicates_removed || 0) > 0 && (
                      <li>{parseResult.duplicate_summary.duplicate_removed - (parseResult.db_duplicates_removed || 0)} duplicate rows within the statement file were removed.</li>
                    )}
                    {parseResult.db_duplicates_removed > 0 && (
                      <li>{parseResult.db_duplicates_removed} transactions were skipped because they already exist in your historical ledger records (double-upload prevention).</li>
                    )}
                  </ul>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[200px] ${dragOver
                      ? 'border-primary bg-primary/5'
                      : file
                        ? 'border-emerald-500 bg-emerald-500/5'
                        : 'border-outline-variant/60 bg-surface-container/20 hover:border-outline-variant'
                    }`}
                >
                  <span className={`material-symbols-outlined text-4xl mb-3 ${file ? 'text-emerald-400' : 'text-on-surface-variant/40'}`}>
                    {file ? 'task' : 'cloud_upload'}
                  </span>

                  {file ? (
                    <div className="flex flex-col items-center gap-1 font-serif text-xs">
                      <span className="font-bold text-on-surface">{file.name}</span>
                      <span className="text-[10px] text-on-surface-variant/60">({(file.size / 1024).toFixed(2)} KB)</span>
                    </div>
                  ) : (
                    <div className="text-xs space-y-2">
                      <p className="font-bold text-on-surface font-serif">Drag & Drop Bank Statement here</p>
                      <p className="text-on-surface-variant/40">or</p>
                      <label htmlFor="file-input" className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-full font-bold text-[10px] text-on-surface border border-outline-variant/60 cursor-pointer inline-block">
                        Browse Files
                      </label>
                      <input
                        id="file-input"
                        type="file"
                        accept=".csv,.xlsx,.xls,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                {uploading && (
                  <div className="space-y-2 font-sans text-xs">
                    <div className="flex justify-between text-on-surface-variant font-semibold">
                      <span>Parsing ledger & running AI categorizer...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="bg-surface-container rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}

                {file && !uploading && (
                  <div className="flex justify-end gap-3 font-sans">
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="px-5 py-2.5 border border-outline-variant hover:bg-surface-container/50 rounded-full text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-primary-container hover:bg-primary text-on-primary-container font-semibold rounded-full text-xs cursor-pointer shadow"
                    >
                      Analyze Ledger
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Results Metadata Section after parsing */}
            {parseResult && (
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm space-y-6 animate-fade-in font-serif">
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">AI Analysis Output Summary</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container/30 border border-outline-variant/20 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans block mb-1">Detected Bank</span>
                    <strong className="text-sm font-bold text-on-surface">{parseResult.detected_bank}</strong>
                  </div>
                  <div className="bg-surface-container/30 border border-outline-variant/20 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans block mb-1">File Format</span>
                    <strong className="text-sm font-bold text-on-surface">{parseResult.detected_format}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-surface-container/30 border border-outline-variant/20 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans block mb-1">Total Uploaded</span>
                    <strong className="text-sm font-bold text-on-surface">
                      {parseResult.duplicate_summary ? parseResult.duplicate_summary.total_uploaded : parseResult.total_transactions}
                    </strong>
                  </div>
                  <div className="bg-surface-container/30 border border-outline-variant/20 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans block mb-1">Duplicates Found</span>
                    <strong className="text-sm font-bold text-amber-500">
                      {parseResult.duplicate_summary ? parseResult.duplicate_summary.duplicate_found : 0}
                    </strong>
                  </div>
                  <div className="bg-surface-container/30 border border-outline-variant/20 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans block mb-1">Duplicates Removed</span>
                    <strong className="text-sm font-bold text-rose-500">
                      {parseResult.duplicate_summary ? parseResult.duplicate_summary.duplicate_removed : 0}
                    </strong>
                  </div>
                  <div className="bg-surface-container/30 border border-outline-variant/20 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans block mb-1">Final Used</span>
                    <strong className="text-sm font-bold text-emerald-400">
                      {parseResult.duplicate_summary ? parseResult.duplicate_summary.final_transactions : parseResult.total_transactions}
                    </strong>
                  </div>
                </div>

                {/* Detected Column Mapping */}
                <div>
                  <h4 className="text-xs font-bold text-on-surface-variant mb-2">Detected Column Mapping:</h4>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(parseResult.mapped_columns).map(([raw, std]) => (
                      <div key={raw} className="px-3 py-1.5 border border-outline-variant/40 rounded-xl bg-surface-container/20 flex items-center gap-1.5 text-[10px]">
                        <span className="font-bold text-on-surface">{raw}</span>
                        <span className="material-symbols-outlined text-[10px] text-on-surface-variant">arrow_forward</span>
                        <span className="text-primary font-bold">{std}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals Reconciliation */}
                {parseResult.validations && parseResult.validations.totals_reconciliation && (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 space-y-3 font-sans text-xs">
                    <div className="flex justify-between items-center border-b border-emerald-500/10 pb-2">
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">verified_user</span>
                        Ledger Balance Reconciled
                      </span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">100% Verified</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 font-serif text-[11px] text-on-surface-variant">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider block font-sans mb-0.5">Total Credits</span>
                        <span>Stated: ₹{parseResult.validations.totals_reconciliation.expected_credits?.toLocaleString('en-IN')}</span>
                        <span className="text-emerald-400 font-bold block">Calc: ₹{parseResult.validations.totals_reconciliation.credits_sum?.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider block font-sans mb-0.5">Total Debits</span>
                        <span>Stated: ₹{parseResult.validations.totals_reconciliation.expected_debits?.toLocaleString('en-IN')}</span>
                        <span className="text-emerald-400 font-bold block">Calc: ₹{parseResult.validations.totals_reconciliation.debits_sum?.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider block font-sans mb-0.5">Running Balance</span>
                        <span>Stated: ₹{parseResult.validations.totals_reconciliation.expected_final_balance?.toLocaleString('en-IN')}</span>
                        <span className="text-emerald-400 font-bold block">Calc: ₹{parseResult.validations.totals_reconciliation.final_balance?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                )}

                {parseResult.reward_points && parseResult.reward_points.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Reward Points Ledger</h4>
                    <div className="bg-surface-container-high/40 border border-outline-variant/40 rounded-xl p-4 text-[10px] text-on-surface-variant font-mono whitespace-pre-wrap leading-relaxed">
                      {parseResult.reward_points.join('\n')}
                    </div>
                  </div>
                )}

                {parseResult.duplicate_transactions && parseResult.duplicate_transactions.length > 0 && (
                  <div className="border-t border-outline-variant/30 pt-4 space-y-4">
                    <details className="group font-sans">
                      <summary className="flex justify-between items-center font-serif text-xs font-bold text-on-surface uppercase tracking-wider cursor-pointer select-none py-2 hover:text-primary transition-colors">
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm group-open:rotate-180 transition-transform">expand_more</span>
                          View Removed Transactions ({parseResult.duplicate_transactions.length})
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadDuplicateCSV(); }}
                          className="px-3 py-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/60 rounded-full font-bold text-[9px] text-on-surface flex items-center gap-1.5 cursor-pointer inline-block"
                        >
                          <span className="material-symbols-outlined text-[11px]">download</span>
                          Download CSV
                        </button>
                      </summary>
                      
                      <div className="overflow-x-auto pt-3 animate-fade-in">
                        <table className="w-full text-[10px] text-left border-collapse font-serif">
                          <thead>
                            <tr className="border-b border-outline-variant/40 text-on-surface-variant font-sans uppercase text-[9px] tracking-wider">
                              <th className="py-2 px-2">Original Row</th>
                              <th className="py-2 px-2">Duplicate Row</th>
                              <th className="py-2 px-2">Date</th>
                              <th className="py-2 px-2">Description</th>
                              <th className="py-2 px-2 text-right">Amount</th>
                              <th className="py-2 px-2 text-right">Type</th>
                              <th className="py-2 px-2">Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/20 text-on-surface-variant">
                            {parseResult.duplicate_transactions.map((tx, idx) => (
                              <tr key={idx} className="hover:bg-surface-container/20">
                                <td className="py-2.5 px-2 font-bold text-on-surface text-center">{tx.originalRowNumber}</td>
                                <td className="py-2.5 px-2 font-bold text-on-surface text-center">{tx.duplicateRowNumber}</td>
                                <td className="py-2.5 px-2 whitespace-nowrap">{tx.date}</td>
                                <td className="py-2.5 px-2 truncate max-w-[120px]" title={tx.description}>{tx.description}</td>
                                <td className="py-2.5 px-2 text-right font-bold text-on-surface">₹{tx.amount.toLocaleString('en-IN')}</td>
                                <td className="py-2.5 px-2 text-right">
                                  <span className={`text-[9px] font-bold ${tx.transactionType === 'Credit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {tx.transactionType}
                                  </span>
                                </td>
                                <td className="py-2.5 px-2 text-[9px] text-on-surface-variant/80 italic max-w-[120px] truncate" title={tx.reason}>{tx.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  </div>
                )}

                {/* Statement Preview Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">Parsed Ledger Preview</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant/40 text-on-surface-variant">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Description</th>
                          <th className="py-2 px-3">Merchant</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3 text-right">Amount</th>
                          <th className="py-2 px-3 text-right">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {parseResult.transactions.map((tx, idx) => (
                          <tr key={idx} className="hover:bg-surface-container/20">
                            <td className="py-3 px-3">{tx.date}</td>
                            <td className="py-3 px-3 truncate max-w-[180px]" title={tx.description}>{tx.description}</td>
                            <td className="py-3 px-3 text-on-surface">{tx.merchant}</td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 border rounded-full text-[9px] font-sans font-semibold ${getCategoryColor(tx.category)}`}>
                                {tx.category}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-on-surface">₹{tx.amount.toLocaleString('en-IN')}</td>
                            <td className="py-3 px-3 text-right">
                              <span className={`text-[10px] font-bold ${tx.transactionType === 'Credit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {tx.transactionType}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Needs Review Transactions (Category Corrections) */}
            {unknownTransactions.length > 0 && (
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3 mb-3">
                  <span className="material-symbols-outlined text-yellow-500">warning</span>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface font-serif">Needs Review ({unknownTransactions.length})</h3>
                </div>
                <p className="text-xs text-on-surface-variant font-serif">AI classified these transactions with confidence below 70%. Confirm or correct categories to retrain ML vectors.</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/40 text-on-surface-variant">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3">Suggested Merchant</th>
                        <th className="py-2 px-3">Suggested Category</th>
                        <th className="py-2 px-3 text-right">Confidence</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {unknownTransactions.map((tx) => (
                        <tr key={tx._id} className="hover:bg-surface-container/20">
                          <td className="py-3 px-3">{new Date(tx.date).toLocaleDateString()}</td>
                          <td className="py-3 px-3 truncate max-w-[180px]" title={tx.description}>{tx.description}</td>
                          <td className="py-3 px-3 font-semibold text-on-surface">{tx.merchant || 'None'}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 border rounded-full text-[9px] font-sans font-semibold ${getCategoryColor(tx.category)}`}>
                              {tx.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-sans text-amber-500 font-bold">
                            {Math.round(tx.confidence * 100)}%
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => openCorrectionModal(tx)}
                              className="px-3 py-1 rounded-full border border-outline-variant text-[10px] font-sans font-bold hover:border-primary hover:text-on-surface transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-xs">edit</span> Correct
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Guidelines Column (1 col) */}
          <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm space-y-6 lg:col-span-1">
            <div className="flex items-center gap-2.5 border-b border-outline-variant/20 pb-3">
              <span className="material-symbols-outlined text-primary text-xl">help</span>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface font-serif">Parser Guidelines</h3>
            </div>
            <p className="text-xs text-on-surface-variant font-serif leading-relaxed">
              Our AI engine automatically maps headings, removes UPI strings, extracts merchants, and guesses categories.
            </p>

            <div className="space-y-1.5 font-serif text-xs">
              <h4 className="font-bold text-on-surface">Supported Banks</h4>
              <div className="flex gap-1.5 flex-wrap">
                {['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'Canara', 'BoB'].map(b => (
                  <span key={b} className="px-2 py-0.5 border border-outline-variant/40 rounded bg-surface-container text-[10px] font-sans font-semibold">{b}</span>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 font-serif text-xs">
              <h4 className="font-bold text-on-surface">Statement Columns Mapped</h4>
              <ul className="space-y-2 list-disc list-inside text-on-surface-variant">
                <li><strong>Txn Date / Value Date</strong> → date</li>
                <li><strong>Narration / Description</strong> → description</li>
                <li><strong>Withdrawal / Debit</strong> → debit</li>
                <li><strong>Deposit / Credit</strong> → credit</li>
                <li><strong>Running Balance</strong> → balance</li>
              </ul>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-2.5 items-start text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-base mt-0.5">info</span>
              <span className="leading-relaxed">We support uploading CSV, Excel (.xlsx), and statement PDFs directly. All numbers are normalized.</span>
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeHubTab === 'subscriptions' && (
        <div className="space-y-6 animate-fade-in font-serif">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-2xl p-5 border border-outline-variant/40 shadow-sm text-center">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans block mb-1">Active Subscriptions</span>
              <span className="text-2xl font-bold text-on-surface font-serif">{subscriptions.length}</span>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-outline-variant/40 shadow-sm text-center">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans block mb-1">Monthly Cost</span>
              <span className="text-2xl font-bold text-rose-400 font-serif">₹{subscriptions.reduce((acc, curr) => acc + curr.monthlyCost, 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-outline-variant/40 shadow-sm text-center">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans block mb-1">Annual Outflow</span>
              <span className="text-2xl font-bold text-rose-400 font-serif">₹{subscriptions.reduce((acc, curr) => acc + curr.annualCost, 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm space-y-4">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Detected Subscriptions</h3>
            <p className="text-xs text-on-surface-variant -mt-2">Automatically identified recurring digital services (Netflix, Spotify, Amazon, Adobe, etc.).</p>

            {subscriptions.length === 0 ? (
              <div className="py-12 border border-dashed border-outline-variant/20 rounded-xl text-center text-xs text-on-surface-variant">No active subscriptions detected. Try uploading an updated bank statement.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/40 text-on-surface-variant">
                      <th className="py-2.5 px-3">Brand</th>
                      <th className="py-2.5 px-3">Billing Cycle</th>
                      <th className="py-2.5 px-3 text-right">Monthly Price</th>
                      <th className="py-2.5 px-3 text-right">Annual Price</th>
                      <th className="py-2.5 px-3 text-right">Next Renewal Date</th>
                      <th className="py-2.5 px-3 text-right">Total Spending</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {subscriptions.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-surface-container/20">
                        <td className="py-3 px-3 text-on-surface"><strong>{sub.name}</strong></td>
                        <td className="py-3 px-3 font-sans text-on-surface-variant">{sub.frequency}</td>
                        <td className="py-3 px-3 text-right font-serif">₹{sub.monthlyCost.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3 text-right font-serif">₹{sub.annualCost.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3 text-right font-sans text-on-surface-variant">{new Date(sub.renewalDate).toLocaleDateString()}</td>
                        <td className="py-3 px-3 text-right font-bold text-on-surface font-serif">₹{sub.totalSubscriptionSpending.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recurring Tab */}
      {activeHubTab === 'recurring' && (
        <div className="space-y-6 animate-fade-in font-serif">
          <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm space-y-4">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Recurring Payments Dashboard</h3>
            <p className="text-xs text-on-surface-variant -mt-2">Tracks standard monthly commitments like salaries, house rents, loan EMIs, utility bills, and insurance premiums.</p>

            {transactions.length === 0 ? (
              <div className="py-12 border border-dashed border-outline-variant/20 rounded-xl text-center text-xs text-on-surface-variant">No transactions available to analyze. Please upload a bank statement first.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/40 text-on-surface-variant">
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Payment Type</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-right">Frequency</th>
                      <th className="py-2.5 px-3 text-right">Last Paid</th>
                      <th className="py-2.5 px-3 text-right">Estimated Next Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {transactions
                      .filter(t => {
                        const dl = t.description.toLowerCase();
                        const ml = (t.merchant || '').toLowerCase();
                        return (
                          dl.includes('emi') || dl.includes('loan') || dl.includes('rent') || dl.includes('salary') ||
                          dl.includes('insurance') || dl.includes('lic') || dl.includes('electricity') || dl.includes('jio') ||
                          dl.includes('airtel') || dl.includes('broadband') || dl.includes('water') || dl.includes('gas') ||
                          ml.includes('emi') || ml.includes('loan') || ml.includes('rent') || ml.includes('salary')
                        );
                      })
                      .reduce((acc, curr) => {
                        const name = curr.merchant || curr.description;
                        const cleanName = name.split('/')[0].split('-')[0].trim();
                        const existing = acc.find(x => x.name === cleanName);
                        if (!existing) {
                          acc.push({
                            name: cleanName,
                            category: curr.category,
                            amount: curr.amount,
                            type: curr.transactionType === 'Credit' ? 'Salary Credit' :
                              (curr.category === 'Bills' ? 'EMI / Bill Payment' : 'Rental / Transfer'),
                            lastPaid: new Date(curr.date),
                          });
                        } else {
                          const currDate = new Date(curr.date);
                          if (currDate > existing.lastPaid) {
                            existing.lastPaid = currDate;
                            existing.amount = curr.amount;
                          }
                        }
                        return acc;
                      }, [])
                      .map((rec, idx) => {
                        const nextDue = new Date(rec.lastPaid);
                        nextDue.setDate(nextDue.getDate() + 30);
                        return (
                          <tr key={idx} className="hover:bg-surface-container/20">
                            <td className="py-3 px-3 text-on-surface"><strong>{rec.name}</strong></td>
                            <td className="py-3 px-3 font-sans text-on-surface-variant">{rec.type}</td>
                            <td className="py-3 px-3 text-right font-bold text-on-surface font-serif">₹{rec.amount.toLocaleString('en-IN')}</td>
                            <td className="py-3 px-3 text-right font-sans text-on-surface-variant">Monthly</td>
                            <td className="py-3 px-3 text-right font-sans text-on-surface-variant">{rec.lastPaid.toLocaleDateString()}</td>
                            <td className="py-3 px-3 text-right">
                              <span className="px-2 py-0.5 border border-primary/20 bg-primary/10 rounded-full text-[9px] font-sans font-semibold text-primary-container">{nextDue.toLocaleDateString()}</span>
                            </td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeHubTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in font-serif">
          {analytics ? (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-card rounded-2xl p-5 border border-outline-variant/40 shadow-sm text-center">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans block mb-1">Total Inflow</span>
                  <strong className="text-xl font-bold text-emerald-400 font-serif">₹{analytics.total_income.toLocaleString('en-IN')}</strong>
                </div>
                <div className="glass-card rounded-2xl p-5 border border-outline-variant/40 shadow-sm text-center">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans block mb-1">Total Outflow</span>
                  <strong className="text-xl font-bold text-rose-400 font-serif">₹{analytics.total_expenses.toLocaleString('en-IN')}</strong>
                </div>
                <div className="glass-card rounded-2xl p-5 border border-outline-variant/40 shadow-sm text-center">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans block mb-1">Net Savings</span>
                  <strong className="text-xl font-bold text-primary font-serif">₹{analytics.total_savings.toLocaleString('en-IN')}</strong>
                </div>
                <div className="glass-card rounded-2xl p-5 border border-outline-variant/40 shadow-sm text-center">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans block mb-1">Avg Daily Spend</span>
                  <strong className="text-xl font-bold text-on-surface font-serif">₹{analytics.avg_daily_spend.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {/* Matplotlib Charts Row */}
              {analytics.charts && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {analytics.charts.category_pie && (
                    <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm">
                      <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-4">Expense Categorization Breakdown</h4>
                      <img
                        src={`data:image/png;base64,${analytics.charts.category_pie}`}
                        alt="Category Pie Chart"
                        className="w-full max-h-72 object-contain"
                      />
                    </div>
                  )}
                  {analytics.charts.cash_flow_bar && (
                    <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm">
                      <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-4">Monthly Inflow vs Outflow</h4>
                      <img
                        src={`data:image/png;base64,${analytics.charts.cash_flow_bar}`}
                        alt="Cash Flow Bar Chart"
                        className="w-full max-h-72 object-contain"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Aggregation tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Merchants */}
                <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider">Top 5 Merchants</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant/40 text-on-surface-variant">
                          <th className="py-2.5 px-3">Merchant</th>
                          <th className="py-2.5 px-3 text-right">Spending</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {analytics.top_merchants.map((m, idx) => (
                          <tr key={idx} className="hover:bg-surface-container/20">
                            <td className="py-3 px-3 text-on-surface"><strong>{m.merchant}</strong></td>
                            <td className="py-3 px-3 text-right font-bold text-on-surface font-serif">₹{m.amount.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Categories */}
                <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider">Top 5 Categories</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant/40 text-on-surface-variant">
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3 text-right">Spending</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {analytics.top_categories.map((c, idx) => (
                          <tr key={idx} className="hover:bg-surface-container/20">
                            <td className="py-3 px-3 text-on-surface"><strong>{c.category}</strong></td>
                            <td className="py-3 px-3 text-right font-bold text-on-surface font-serif">₹{c.amount.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 border border-dashed border-outline-variant/20 rounded-xl text-center text-xs text-on-surface-variant">No expense analytics found. Try uploading a bank statement.</div>
          )}
        </div>
      )}

      {/* Category Correction Modal */}
      {correctionModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container border border-outline-variant p-6 rounded-2xl shadow-2xl relative animate-fade-in font-serif">
            <button
              onClick={() => setCorrectionModal({ isOpen: false, transaction: null })}
              className="absolute right-4 top-4 hover:bg-surface-container-high w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">Correct Transaction Category</h3>
            <p className="text-xs text-on-surface-variant mb-6 font-serif">Correcting the category helps retrain our Naive Bayes/Random Forest classifier models for future statements.</p>

            <div className="space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-on-surface-variant block">Raw Description</label>
                <div className="bg-surface border border-outline-variant/60 rounded-xl p-3 text-on-surface font-mono break-all">{correctionModal.transaction.description}</div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-on-surface-variant block">Merchant Name</label>
                <input
                  type="text"
                  value={correctedMerchant}
                  onChange={(e) => setCorrectedMerchant(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-all"
                  placeholder="Enter merchant brand (e.g. Netflix)"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-on-surface-variant block">Correct Category</label>
                <div className="relative">
                  <select
                    value={correctedCategory}
                    onChange={(e) => setCorrectedCategory(e.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-on-surface appearance-none focus:outline-none focus:border-primary transition-all"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant pointer-events-none text-base">expand_more</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/40 mt-6">
                <button
                  onClick={() => setCorrectionModal({ isOpen: false, transaction: null })}
                  className="px-4 py-2 border border-outline-variant hover:bg-surface-container/50 rounded-full font-bold cursor-pointer"
                  disabled={submittingCorrection}
                >
                  Cancel
                </button>
                <button
                  onClick={submitCorrection}
                  className="px-5 py-2 bg-primary text-on-primary rounded-full font-bold cursor-pointer"
                  disabled={submittingCorrection}
                >
                  {submittingCorrection ? 'Saving...' : 'Confirm Category'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadStatement;
