import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet, ArrowLeft, 
  HelpCircle, Layers, Calendar, CreditCard, PieChart, TrendingUp, Info, 
  ArrowUpRight, ArrowDownRight, Edit2, Check, RefreshCw 
} from 'lucide-react';

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
        // Extract recurring payments if returned in analytics
        if (analyticsRes.data.data?.monthly_cash_flow) {
          // Fetch recurring payments separately
          const recRes = await axios.get('/dashboard'); // dashboard returns recurring EMI/Income stats
          // Let's query db directly via backend for recurring expenses
          const recurringDbRes = await axios.get('/transactions'); // we can also derive recurring payments
        }
      }
      
      // Let's make an explicit call for recurring transactions
      const dashboardRes = await axios.get('/dashboard');
      if (dashboardRes.data?.status === 'success') {
        // Derive recurring list or fetch directly.
        // Let's populate some default mockup or fetch from backend collections.
        // Wait, backend statementController saves recurring transactions to DB, let's pull them!
        // We will fetch them by loading from the normalized transactions.
      }
      
      // Let's fetch recurring transactions directly from MongoDB via an endpoint or dashboard helper
      // We will implement recurring transactions load by calling getTransactions or similar, but
      // actually statementController writes to RecurringTransactions model. Let's make sure we fetch it.
      // Wait, we didn't add GET /recurring-payments to the backend router. Let's pull recurring details
      // from normalized transactions, or we can just fetch all and filter in frontend.
      // Wait, we can implement client-side fallback or filter, and we can query `/transactions` and see.
      // Actually, since we created the model RecurringTransactions, let's fetch it. Wait, the prompt lists
      // GET /subscriptions, GET /transactions, GET /merchant-analysis, GET /expense-summary.
      // We can use GET /expense-summary to get recurring costs!
      const summaryRes = await axios.get('/expense-summary');
      if (summaryRes.data?.status === 'success') {
        // The summary statistics contains cash flow and analysis.
      }
    } catch (err) {
      console.error('Failed to load hub data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setMessage(null);
    const validTypes = ['.csv', '.xlsx', '.xls', '.pdf'];
    const hasValidExt = validTypes.some(ext => selectedFile.name.toLowerCase().endsWith(ext));
    
    if (hasValidExt) {
      setFile(selectedFile);
    } else {
      setMessage({
        type: 'error',
        text: 'Invalid file format. Please upload a .csv, .xlsx, or .pdf statement.'
      });
      setFile(null);
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
      validateAndSetFile(droppedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file to upload first.' });
      return;
    }

    const formData = new FormData();
    formData.append('statement', file);

    setUploading(true);
    setUploadProgress(15);
    setMessage(null);
    setParseResult(null);

    // Simulate progress upload bar
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 400);

    try {
      const res = await axios.post('/upload-statement', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (res.data?.status === 'success') {
        setMessage({
          type: 'success',
          text: res.data.message || 'Bank statement uploaded and categorized successfully!'
        });
        setParseResult(res.data.data);
        setFile(null);
        
        // Refresh local data
        fetchHubData();
      }
    } catch (err) {
      clearInterval(progressInterval);
      console.error(err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to parse the statement. Check column headers or formatting.'
      });
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
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
        // Update local state
        setTransactions(prev => prev.map(t => 
          t._id === correctionModal.transaction._id 
            ? { ...t, category: correctedCategory, merchant: correctedMerchant, confidence: 1.0, is_unknown: false } 
            : t
        ));
        
        // Hide modal
        setCorrectionModal({ isOpen: false, transaction: null });
        
        // Reload analytics
        fetchHubData();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update category. Please try again.');
    } finally {
      setSubmittingCorrection(false);
    }
  };

  // Derive unknown transactions that need review
  const unknownTransactions = transactions.filter(t => t.is_unknown || t.confidence < 0.7);

  return (
    <div className="main-content" style={styles.pageContainer}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          <ArrowLeft size={16} />
          Back to Cockpit
        </button>
        <h1 style={styles.title}>Universal Transaction Hub</h1>
        <p style={styles.subtitle}>AI-Powered Bank Statement Parser, Categorization, Subscriptions, & Financial Analytics.</p>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <button 
          onClick={() => setActiveHubTab('upload')} 
          style={{ ...styles.tabBtn, ...(activeHubTab === 'upload' ? styles.activeTabBtn : {}) }}
        >
          <UploadCloud size={16} />
          Statement Parser
        </button>
        <button 
          onClick={() => setActiveHubTab('subscriptions')} 
          style={{ ...styles.tabBtn, ...(activeHubTab === 'subscriptions' ? styles.activeTabBtn : {}) }}
        >
          <Calendar size={16} />
          Subscriptions
        </button>
        <button 
          onClick={() => setActiveHubTab('recurring')} 
          style={{ ...styles.tabBtn, ...(activeHubTab === 'recurring' ? styles.activeTabBtn : {}) }}
        >
          <CreditCard size={16} />
          Recurring Expenses
        </button>
        <button 
          onClick={() => setActiveHubTab('analytics')} 
          style={{ ...styles.tabBtn, ...(activeHubTab === 'analytics' ? styles.activeTabBtn : {}) }}
        >
          <PieChart size={16} />
          Merchant Analytics
        </button>
      </div>

      {/* Tab Contents */}
      {activeHubTab === 'upload' && (
        <div className="grid-cols-3" style={styles.mainGrid}>
          {/* Main Upload Column (2 cols) */}
          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card" style={styles.card}>
              <h2 style={styles.cardTitle}>Upload Statement</h2>
              <p style={styles.cardDesc}>Drag and drop bank statement files (CSV, Excel, PDF) from SBI, HDFC, ICICI, Axis, Kotak, etc.</p>
              
              {message && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={styles.alert}>
                  <div style={styles.alertContent}>
                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                    <span>{message.text}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div
                  style={{
                    ...styles.dropzone,
                    ...(dragOver ? styles.dropzoneDrag : {}),
                    ...(file ? styles.dropzoneActive : {})
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <UploadCloud size={48} style={styles.uploadIcon(file)} />
                  {file ? (
                    <div style={styles.fileDetails}>
                      <FileSpreadsheet size={24} style={{ color: '#10b981' }} />
                      <span style={styles.fileName}>{file.name}</span>
                      <span style={styles.fileSize}>({(file.size / 1024).toFixed(2)} KB)</span>
                    </div>
                  ) : (
                    <div style={styles.prompt}>
                      <p style={styles.promptMain}>Drag & Drop Bank Statement here</p>
                      <p style={styles.promptOr}>or</p>
                      <label htmlFor="file-input" style={styles.fileSelectBtn}>
                        Browse Files
                      </label>
                      <input
                        id="file-input"
                        type="file"
                        accept=".csv,.xlsx,.xls,.pdf"
                        onChange={handleFileChange}
                        style={styles.hiddenInput}
                      />
                    </div>
                  )}
                </div>

                {uploading && (
                  <div style={styles.progressContainer}>
                    <div style={styles.progressTextRow}>
                      <span>Parsing ledger & running AI categorizer...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div style={styles.progressBarBg}>
                      <div style={styles.progressBarFill(uploadProgress)}></div>
                    </div>
                  </div>
                )}

                {file && !uploading && (
                  <div style={styles.submitRow}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setFile(null)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Analyze Ledger
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Results Metadata Section after parsing */}
            {parseResult && (
              <div className="glass-card animate-fade-in" style={styles.card}>
                <h3 style={styles.resultsTitle}>AI Analysis Output Summary</h3>
                
                <div className="grid-cols-3" style={styles.metaStatsGrid}>
                  <div style={styles.metaStatCard}>
                    <span style={styles.metaStatLabel}>Detected Bank</span>
                    <span style={styles.metaStatVal}>{parseResult.detected_bank}</span>
                  </div>
                  <div style={styles.metaStatCard}>
                    <span style={styles.metaStatLabel}>File Format</span>
                    <span style={styles.metaStatVal}>{parseResult.detected_format}</span>
                  </div>
                  <div style={styles.metaStatCard}>
                    <span style={styles.metaStatLabel}>Total Transactions</span>
                    <span style={styles.metaStatVal}>{parseResult.total_transactions}</span>
                  </div>
                </div>

                {/* Detected Column Mapping */}
                <h4 style={styles.subTitle}>Detected Columns</h4>
                <div style={styles.columnsBadgeList}>
                  {Object.entries(parseResult.mapped_columns).map(([raw, std]) => (
                    <div key={raw} style={styles.columnBadge}>
                      <span style={styles.badgeRaw}>{raw}</span>
                      <span style={styles.badgeArrow}>→</span>
                      <span style={styles.badgeStd}>{std}</span>
                    </div>
                  ))}
                </div>

                {/* Standard Chartered Metadata, Validations and Rewards */}
                {parseResult.metadata && (
                  <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                    <h4 style={styles.subTitle}>Standard Chartered Account Profile</h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '15px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={styles.metaStatLabel}>Customer Name</span>
                        <span style={styles.metaStatVal}>{parseResult.metadata.customer_name}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={styles.metaStatLabel}>Account Number</span>
                        <span style={styles.metaStatVal}>{parseResult.metadata.account_no}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={styles.metaStatLabel}>Account Type</span>
                        <span style={styles.metaStatVal}>{parseResult.metadata.account_type}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={styles.metaStatLabel}>Branch</span>
                        <span style={styles.metaStatVal}>{parseResult.metadata.branch}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={styles.metaStatLabel}>IFSC Code</span>
                        <span style={styles.metaStatVal}>{parseResult.metadata.ifsc}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={styles.metaStatLabel}>MICR Code</span>
                        <span style={styles.metaStatVal}>{parseResult.metadata.micr}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={styles.metaStatLabel}>Nominee Registered</span>
                        <span style={styles.metaStatVal}>{parseResult.metadata.nominee_registered}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={styles.metaStatLabel}>Statement Date</span>
                        <span style={styles.metaStatVal}>{parseResult.metadata.statement_date}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1' }}>
                        <span style={styles.metaStatLabel}>Branch Address</span>
                        <span style={{ ...styles.metaStatVal, fontSize: '14px', fontWeight: 'normal' }}>{parseResult.metadata.branch_address}</span>
                      </div>
                    </div>
                  </div>
                )}

                {parseResult.validations && (
                  <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                    <h4 style={styles.subTitle}>Statement Reconciliation Audit</h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '15px'
                    }}>
                      <div style={styles.metaStatCard}>
                        <span style={styles.metaStatLabel}>Opening Balance Integrity</span>
                        <span style={{
                          color: parseResult.validations.opening_balance_match.pass ? '#10b981' : '#f87171',
                          fontWeight: 'bold',
                          fontSize: '15px',
                          marginTop: '4px'
                        }}>
                          {parseResult.validations.opening_balance_match.pass ? '✓ Stated Matches Actual' : '✗ Audit Discrepancy'}
                        </span>
                      </div>
                      <div style={styles.metaStatCard}>
                        <span style={styles.metaStatLabel}>Running Balance Audit</span>
                        <span style={{
                          color: parseResult.validations.running_balances_match.pass ? '#10b981' : '#f87171',
                          fontWeight: 'bold',
                          fontSize: '15px',
                          marginTop: '4px'
                        }}>
                          {parseResult.validations.running_balances_match.pass ? '✓ Verified (All Rows Pass)' : '✗ Discrepancy Found'}
                        </span>
                      </div>
                      <div style={{ ...styles.metaStatCard, gridColumn: '1 / -1' }}>
                        <span style={styles.metaStatLabel}>Ledger Total Summaries Reconciliation</span>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          marginTop: '8px',
                          fontSize: '13px',
                          color: '#cbd5e1',
                          gap: '10px'
                        }}>
                          <div>
                            <span style={{ color: '#94a3b8' }}>Stated Credits:</span> ₹{parseResult.validations.totals_reconciliation.expected_credits?.toLocaleString('en-IN')}
                            <span style={{ marginLeft: '10px', color: '#10b981', fontWeight: 600 }}>Calculated:</span> ₹{parseResult.validations.totals_reconciliation.credits_sum?.toLocaleString('en-IN')}
                          </div>
                          <div>
                            <span style={{ color: '#94a3b8' }}>Stated Debits:</span> ₹{parseResult.validations.totals_reconciliation.expected_debits?.toLocaleString('en-IN')}
                            <span style={{ marginLeft: '10px', color: '#10b981', fontWeight: 600 }}>Calculated:</span> ₹{parseResult.validations.totals_reconciliation.debits_sum?.toLocaleString('en-IN')}
                          </div>
                          <div>
                            <span style={{ color: '#94a3b8' }}>Final Balance:</span> ₹{parseResult.validations.totals_reconciliation.expected_final_balance?.toLocaleString('en-IN')}
                            <span style={{ marginLeft: '10px', color: '#10b981', fontWeight: 600 }}>Calculated:</span> ₹{parseResult.validations.totals_reconciliation.final_balance?.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {parseResult.reward_points && parseResult.reward_points.length > 0 && (
                  <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                    <h4 style={styles.subTitle}>Reward Points Ledger</h4>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      fontSize: '12px',
                      color: '#94a3b8',
                      lineHeight: '1.6'
                    }}>
                      {parseResult.reward_points.join('\n')}
                    </div>
                  </div>
                )}

                {/* Statement Preview Table */}
                <h4 style={styles.subTitle}>Parsed Ledger Preview</h4>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tr}>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Description</th>
                        <th style={styles.th}>Merchant</th>
                        <th style={styles.th}>Category</th>
                        <th style={styles.th}>Amount</th>
                        <th style={styles.th}>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.transactions.map((tx, idx) => (
                        <tr key={idx} style={styles.tr}>
                          <td style={styles.td}>{tx.date}</td>
                          <td style={styles.td} title={tx.description}>{tx.description.slice(0, 30)}...</td>
                          <td style={styles.td}>{tx.merchant}</td>
                          <td style={styles.td}>
                            <span style={styles.categoryTag(tx.category)}>{tx.category}</span>
                          </td>
                          <td style={styles.td}>₹{tx.amount.toLocaleString('en-IN')}</td>
                          <td style={styles.td}>
                            <span style={tx.transactionType === 'Credit' ? styles.creditText : styles.debitText}>
                              {tx.transactionType}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Needs Review Transactions (Category Corrections) */}
            {unknownTransactions.length > 0 && (
              <div className="glass-card" style={styles.card}>
                <div style={styles.reviewHeader}>
                  <AlertTriangle size={20} color="#eab308" />
                  <h3 style={styles.reviewTitle}>Needs Review ({unknownTransactions.length})</h3>
                </div>
                <p style={styles.cardDesc}>AI classified these transactions with confidence below 70%. Please confirm or correct them to improve future classification accuracy.</p>
                
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tr}>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Description</th>
                        <th style={styles.th}>Suggested Merchant</th>
                        <th style={styles.th}>Suggested Category</th>
                        <th style={styles.th}>Confidence</th>
                        <th style={styles.th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unknownTransactions.map((tx) => (
                        <tr key={tx._id} style={styles.tr}>
                          <td style={styles.td}>{new Date(tx.date).toLocaleDateString()}</td>
                          <td style={styles.td} title={tx.description}>{tx.description.slice(0, 35)}...</td>
                          <td style={styles.td}>{tx.merchant || 'None'}</td>
                          <td style={styles.td}>
                            <span style={styles.categoryTag(tx.category)}>{tx.category}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.confidenceText(tx.confidence)}>
                              {Math.round(tx.confidence * 100)}%
                            </span>
                          </td>
                          <td style={styles.td}>
                            <button 
                              onClick={() => openCorrectionModal(tx)}
                              className="btn btn-outline"
                              style={styles.correctBtn}
                            >
                              <Edit2 size={12} />
                              Correct
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
          <div className="glass-card" style={styles.guidelinesCard}>
            <div style={styles.guideHeader}>
              <HelpCircle size={20} style={{ color: '#6366f1' }} />
              <h3 style={styles.guideTitle}>Parser Guidelines</h3>
            </div>
            <p style={styles.guideDesc}>
              Our AI engine automatically maps headings, removes UPI strings, extracts merchants, and guesses categories.
            </p>
            <h4 style={styles.guideSub}>Supported Banks</h4>
            <div style={styles.bankGrid}>
              {['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'Canara', 'BoB'].map(b => (
                <span key={b} style={styles.bankBadge}>{b}</span>
              ))}
            </div>
            
            <h4 style={styles.guideSub}>Statement Columns Mapped</h4>
            <ul style={styles.guideList}>
              <li><strong>Txn Date / Value Date</strong> → date</li>
              <li><strong>Narration / Description</strong> → description</li>
              <li><strong>Withdrawal / Debit</strong> → debit</li>
              <li><strong>Deposit / Credit</strong> → credit</li>
              <li><strong>Balance / Running Bal</strong> → balance</li>
            </ul>

            <div style={styles.helpBox}>
              <Info size={16} style={{ color: '#6366f1', flexShrink: 0 }} />
              <span>We support uploading CSV, Excel (.xlsx), and statement PDFs directly. All numbers are normalized.</span>
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeHubTab === 'subscriptions' && (
        <div style={styles.tabContentContainer}>
          {/* Metrics Row */}
          <div className="grid-cols-3" style={styles.metricsGrid}>
            <div className="glass-card" style={styles.metricCard}>
              <span style={styles.metaStatLabel}>Active Subscriptions</span>
              <span style={styles.metricValue}>{subscriptions.length}</span>
            </div>
            <div className="glass-card" style={styles.metricCard}>
              <span style={styles.metaStatLabel}>Monthly Cost</span>
              <span style={styles.metricValue}>₹{subscriptions.reduce((acc, curr) => acc + curr.monthlyCost, 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="glass-card" style={styles.metricCard}>
              <span style={styles.metaStatLabel}>Annual Cost</span>
              <span style={styles.metricValue}>₹{subscriptions.reduce((acc, curr) => acc + curr.annualCost, 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="glass-card" style={styles.card}>
            <h3 style={styles.resultsTitle}>Detected Subscriptions</h3>
            <p style={styles.cardDesc}>Automatically identified recurring digital services (Netflix, Spotify, Amazon, Adobe, etc.).</p>
            
            {subscriptions.length === 0 ? (
              <div style={styles.emptyState}>No active subscriptions detected. Try uploading an updated bank statement.</div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tr}>
                      <th style={styles.th}>Brand</th>
                      <th style={styles.th}>Billing Cycle</th>
                      <th style={styles.th}>Monthly Price</th>
                      <th style={styles.th}>Annual Price</th>
                      <th style={styles.th}>Next Renewal Date</th>
                      <th style={styles.th}>Total Spending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub, idx) => (
                      <tr key={idx} style={styles.tr}>
                        <td style={styles.td}><strong>{sub.name}</strong></td>
                        <td style={styles.td}>{sub.frequency}</td>
                        <td style={styles.td}>₹{sub.monthlyCost.toLocaleString('en-IN')}</td>
                        <td style={styles.td}>₹{sub.annualCost.toLocaleString('en-IN')}</td>
                        <td style={styles.td}>{new Date(sub.renewalDate).toLocaleDateString()}</td>
                        <td style={styles.td}>₹{sub.totalSubscriptionSpending.toLocaleString('en-IN')}</td>
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
        <div style={styles.tabContentContainer}>
          <div className="glass-card" style={styles.card}>
            <h3 style={styles.resultsTitle}>Recurring Payments Dashboard</h3>
            <p style={styles.cardDesc}>Tracks standard monthly commitments like salaries, house rents, loan EMIs, utility bills, and insurance premiums.</p>
            
            {transactions.length === 0 ? (
              <div style={styles.emptyState}>No transactions available to analyze. Please upload a bank statement first.</div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tr}>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Payment Type</th>
                      <th style={styles.th}>Amount</th>
                      <th style={styles.th}>Frequency</th>
                      <th style={styles.th}>Last Paid</th>
                      <th style={styles.th}>Estimated Next Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Filter transactions to show recurring payments */}
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
                      // Group and display distinct recurring items
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
                          // Keep the most recent payment date
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
                          <tr key={idx} style={styles.tr}>
                            <td style={styles.td}><strong>{rec.name}</strong></td>
                            <td style={styles.td}>{rec.type}</td>
                            <td style={styles.td}>₹{rec.amount.toLocaleString('en-IN')}</td>
                            <td style={styles.td}>Monthly</td>
                            <td style={styles.td}>{rec.lastPaid.toLocaleDateString()}</td>
                            <td style={styles.td}>
                              <span style={styles.dueDateBadge}>{nextDue.toLocaleDateString()}</span>
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
        <div style={styles.tabContentContainer}>
          {analytics ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Stats Cards */}
              <div className="grid-cols-4" style={styles.metricsGrid}>
                <div className="glass-card" style={styles.metricCard}>
                  <span style={styles.metaStatLabel}>Total Inflow</span>
                  <span style={{ ...styles.metricValue, color: '#10b981' }}>₹{analytics.total_income.toLocaleString('en-IN')}</span>
                </div>
                <div className="glass-card" style={styles.metricCard}>
                  <span style={styles.metaStatLabel}>Total Outflow</span>
                  <span style={{ ...styles.metricValue, color: '#ef4444' }}>₹{analytics.total_expenses.toLocaleString('en-IN')}</span>
                </div>
                <div className="glass-card" style={styles.metricCard}>
                  <span style={styles.metaStatLabel}>Net Savings</span>
                  <span style={{ ...styles.metricValue, color: '#6366f1' }}>₹{analytics.total_savings.toLocaleString('en-IN')}</span>
                </div>
                <div className="glass-card" style={styles.metricCard}>
                  <span style={styles.metaStatLabel}>Avg Daily Spend</span>
                  <span style={styles.metricValue}>₹{analytics.avg_daily_spend.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Matplotlib Charts Row */}
              {analytics.charts && (
                <div className="grid-cols-2" style={styles.chartsGrid}>
                  {analytics.charts.category_pie && (
                    <div className="glass-card" style={styles.chartCard}>
                      <h4 style={styles.chartTitle}>Expense Categorization Breakdown</h4>
                      <img 
                        src={`data:image/png;base64,${analytics.charts.category_pie}`} 
                        alt="Category Pie Chart" 
                        style={styles.chartImage}
                      />
                    </div>
                  )}
                  {analytics.charts.cash_flow_bar && (
                    <div className="glass-card" style={styles.chartCard}>
                      <h4 style={styles.chartTitle}>Monthly Inflow vs Outflow</h4>
                      <img 
                        src={`data:image/png;base64,${analytics.charts.cash_flow_bar}`} 
                        alt="Cash Flow Bar Chart" 
                        style={styles.chartImage}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Aggregation tables */}
              <div className="grid-cols-2" style={styles.chartsGrid}>
                {/* Top Merchants */}
                <div className="glass-card" style={styles.card}>
                  <h4 style={styles.resultsTitle}>Top 5 Merchants</h4>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr style={styles.tr}>
                          <th style={styles.th}>Merchant</th>
                          <th style={styles.th}>Spending</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.top_merchants.map((m, idx) => (
                          <tr key={idx} style={styles.tr}>
                            <td style={styles.td}><strong>{m.merchant}</strong></td>
                            <td style={styles.td}>₹{m.amount.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Categories */}
                <div className="glass-card" style={styles.card}>
                  <h4 style={styles.resultsTitle}>Top 5 Categories</h4>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr style={styles.tr}>
                          <th style={styles.th}>Category</th>
                          <th style={styles.th}>Spending</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.top_categories.map((c, idx) => (
                          <tr key={idx} style={styles.tr}>
                            <td style={styles.td}><strong>{c.category}</strong></td>
                            <td style={styles.td}>₹{c.amount.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.emptyState}>No expense analytics found. Try uploading a bank statement.</div>
          )}
        </div>
      )}

      {/* Category Correction Modal */}
      {correctionModal.isOpen && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-fade-in" style={styles.modalCard}>
            <h3 style={styles.modalTitle}>Correct Transaction Category</h3>
            <p style={styles.modalDesc}>Correcting the category helps retrain our Naive Bayes Naive/Random Forest classifier models for future statements.</p>
            
            <div style={styles.modalInputGroup}>
              <label style={styles.modalLabel}>Raw Description</label>
              <div style={styles.modalValue}>{correctionModal.transaction.description}</div>
            </div>

            <div style={styles.modalInputGroup}>
              <label style={styles.modalLabel}>Merchant Name</label>
              <input 
                type="text" 
                value={correctedMerchant} 
                onChange={(e) => setCorrectedMerchant(e.target.value)} 
                style={styles.modalInput}
                placeholder="Enter merchant brand (e.g. Netflix)"
              />
            </div>

            <div style={styles.modalInputGroup}>
              <label style={styles.modalLabel}>Correct Category</label>
              <select 
                value={correctedCategory} 
                onChange={(e) => setCorrectedCategory(e.target.value)} 
                style={styles.modalSelect}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div style={styles.modalActions}>
              <button 
                onClick={() => setCorrectionModal({ isOpen: false, transaction: null })}
                className="btn btn-outline"
                disabled={submittingCorrection}
              >
                Cancel
              </button>
              <button 
                onClick={submitCorrection}
                className="btn btn-primary"
                disabled={submittingCorrection}
              >
                {submittingCorrection ? 'Saving...' : 'Confirm Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  pageContainer: {
    paddingBottom: '60px'
  },
  header: {
    marginBottom: '24px'
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    marginBottom: '16px',
    padding: '4px 0',
    transition: 'color 0.2s ease'
  },
  title: {
    fontSize: '32px',
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif'
  },
  subtitle: {
    fontSize: '15px',
    color: '#94a3b8'
  },
  tabsContainer: {
    display: 'flex',
    gap: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '12px',
    marginBottom: '24px'
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    fontFamily: 'Outfit, sans-serif'
  },
  activeTabBtn: {
    color: '#ffffff',
    background: 'rgba(255, 255, 255, 0.08)',
    boxShadow: '0 0 10px rgba(255, 255, 255, 0.02)'
  },
  mainGrid: {
    gridTemplateColumns: '2fr 1fr',
    gap: '24px'
  },
  card: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '8px',
    fontFamily: 'Outfit, sans-serif'
  },
  cardDesc: {
    fontSize: '14px',
    color: '#94a3b8',
    marginBottom: '20px'
  },
  alert: {
    marginBottom: '20px'
  },
  alertContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  dropzone: {
    border: '2px dashed rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
    padding: '40px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    background: 'rgba(255, 255, 255, 0.01)',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '220px'
  },
  dropzoneDrag: {
    borderColor: '#6366f1',
    background: 'rgba(99, 102, 241, 0.05)',
  },
  dropzoneActive: {
    borderColor: '#10b981',
    background: 'rgba(16, 185, 129, 0.03)'
  },
  uploadIcon: (file) => ({
    color: file ? '#10b981' : '#64748b',
    marginBottom: '16px',
    transition: 'color 0.2s ease'
  }),
  hiddenInput: {
    display: 'none'
  },
  prompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  promptMain: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#f8fafc',
    fontFamily: 'Outfit, sans-serif'
  },
  promptOr: {
    fontSize: '13px',
    color: '#64748b',
    margin: '6px 0'
  },
  fileSelectBtn: {
    display: 'inline-block',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    color: '#f8fafc',
    padding: '6px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Outfit, sans-serif'
  },
  fileDetails: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px'
  },
  fileName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#f8fafc'
  },
  fileSize: {
    fontSize: '13px',
    color: '#94a3b8'
  },
  progressContainer: {
    marginTop: '20px'
  },
  progressTextRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#cbd5e1',
    marginBottom: '8px'
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  progressBarFill: (progress) => ({
    width: `${progress}%`,
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)',
    transition: 'width 0.3s ease'
  }),
  submitRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px'
  },
  resultsTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '16px',
    fontFamily: 'Outfit, sans-serif'
  },
  subTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    marginTop: '20px',
    marginBottom: '12px',
    fontFamily: 'Outfit, sans-serif',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  metaStatsGrid: {
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '20px'
  },
  metaStatCard: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    padding: '12px 16px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  metaStatLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  metaStatVal: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif'
  },
  columnsBadgeList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '20px'
  },
  columnBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(99, 102, 241, 0.08)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px'
  },
  badgeRaw: {
    color: '#cbd5e1'
  },
  badgeArrow: {
    color: '#6366f1',
    fontWeight: 'bold'
  },
  badgeStd: {
    color: '#10b981',
    fontWeight: 600
  },
  tableWrapper: {
    overflowX: 'auto',
    width: '100%',
    maxHeight: '400px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '8px',
    background: 'rgba(0, 0, 0, 0.15)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
    textAlign: 'left'
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    '&:last-child': {
      borderBottom: 'none'
    }
  },
  th: {
    padding: '12px 16px',
    color: '#94a3b8',
    fontWeight: 600,
    fontFamily: 'Outfit, sans-serif',
    background: 'rgba(255, 255, 255, 0.02)'
  },
  td: {
    padding: '12px 16px',
    color: '#cbd5e1'
  },
  creditText: {
    color: '#10b981',
    fontWeight: 600
  },
  debitText: {
    color: '#f87171',
    fontWeight: 600
  },
  categoryTag: (cat) => {
    let color = '#94a3b8';
    let bg = 'rgba(148, 163, 184, 0.1)';
    if (cat === 'Salary') { color = '#10b981'; bg = 'rgba(16, 185, 129, 0.1)'; }
    else if (cat === 'Food') { color = '#f59e0b'; bg = 'rgba(245, 158, 11, 0.1)'; }
    else if (cat === 'Entertainment') { color = '#ec4899'; bg = 'rgba(236, 72, 153, 0.1)'; }
    else if (cat === 'Shopping') { color = '#a855f7'; bg = 'rgba(168, 85, 247, 0.1)'; }
    else if (cat === 'Travel') { color = '#3b82f6'; bg = 'rgba(59, 130, 246, 0.1)'; }
    
    return {
      color,
      background: bg,
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 600,
      display: 'inline-block'
    };
  },
  confidenceText: (conf) => ({
    color: conf >= 0.7 ? '#10b981' : '#eab308',
    fontWeight: 600
  }),
  correctBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    padding: '4px 8px',
    height: 'auto'
  },
  reviewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px'
  },
  reviewTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#eab308',
    fontFamily: 'Outfit, sans-serif'
  },
  guidelinesCard: {
    padding: '24px',
    alignSelf: 'start'
  },
  guideHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '12px'
  },
  guideTitle: {
    fontSize: '16px',
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif'
  },
  guideDesc: {
    fontSize: '13px',
    color: '#cbd5e1',
    lineHeight: '1.6',
    marginBottom: '16px'
  },
  guideSub: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: '16px',
    marginBottom: '8px'
  },
  bankGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '16px'
  },
  bankBadge: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#cbd5e1'
  },
  guideList: {
    fontSize: '12px',
    color: '#cbd5e1',
    paddingLeft: '16px',
    lineHeight: '1.8'
  },
  helpBox: {
    display: 'flex',
    gap: '10px',
    background: 'rgba(99, 102, 241, 0.05)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '20px',
    fontSize: '12px',
    color: '#cbd5e1',
    lineHeight: '1.5'
  },
  tabContentContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  metricsGrid: {
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px'
  },
  metricCard: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  metricValue: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif'
  },
  dueDateBadge: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#94a3b8',
    fontSize: '14px'
  },
  chartsGrid: {
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px'
  },
  chartCard: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '16px',
    fontFamily: 'Outfit, sans-serif'
  },
  chartImage: {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '8px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000
  },
  modalCard: {
    width: '100%',
    maxWidth: '450px',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif'
  },
  modalDesc: {
    fontSize: '13px',
    color: '#94a3b8',
    lineHeight: '1.5'
  },
  modalInputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  modalLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  modalValue: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '10px 14px',
    borderRadius: '6px',
    color: '#cbd5e1',
    fontSize: '13px',
    wordBreak: 'break-all'
  },
  modalInput: {
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '6px',
    padding: '10px 14px',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit'
  },
  modalSelect: {
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '6px',
    padding: '10px 14px',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px'
  }
};

export default UploadStatement;
