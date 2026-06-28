import React, { useState } from 'react';
import axios from 'axios';
import { FileText, ArrowLeft, Download, CheckCircle2, AlertCircle } from 'lucide-react';
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
    <div style={styles.page}>
      <header style={styles.header}>
        <Link to="/premium-dashboard" style={styles.backLink}>
          <ArrowLeft size={16} />
          Back to Hub
        </Link>
        <div style={styles.titleRow}>
          <FileText size={28} color="#94a3b8" />
          <h1 style={styles.title}>Financial Reports Engine</h1>
        </div>
        <p style={styles.subtitle}>Generate comprehensive, downloadable advisory reports in PDF or CSV formats.</p>
      </header>

      <div style={styles.container}>
        {/* Settings Card */}
        <form onSubmit={handleDownload} style={styles.formCard}>
          <h3 style={styles.sectionTitle}>Compile Report Parameters</h3>
          
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Report Scope</label>
              <select 
                value={reportType} 
                onChange={(e) => { setReportType(e.target.value); setSuccess(false); }} 
                style={styles.select}
              >
                <option value="Monthly">Monthly Performance Statement</option>
                <option value="Quarterly">Quarterly Consolidated Audit</option>
                <option value="Yearly">Yearly Wealth Advisory Plan</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Export File Format</label>
              <div style={styles.formatSelectors}>
                <label style={{ 
                  ...styles.formatLabel, 
                  border: format === 'PDF' ? '2px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: format === 'PDF' ? 'rgba(99, 102, 241, 0.08)' : 'transparent'
                }}>
                  <input 
                    type="radio" 
                    name="format" 
                    value="PDF" 
                    checked={format === 'PDF'} 
                    onChange={() => { setFormat('PDF'); setSuccess(false); }}
                    style={styles.hiddenRadio}
                  />
                  <span>PDF Document</span>
                </label>
                
                <label style={{ 
                  ...styles.formatLabel, 
                  border: format === 'CSV' ? '2px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: format === 'CSV' ? 'rgba(99, 102, 241, 0.08)' : 'transparent'
                }}>
                  <input 
                    type="radio" 
                    name="format" 
                    value="CSV" 
                    checked={format === 'CSV'} 
                    onChange={() => { setFormat('CSV'); setSuccess(false); }}
                    style={styles.hiddenRadio}
                  />
                  <span>CSV Spreadsheet</span>
                </label>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            <Download size={16} />
            {loading ? 'Compiling Ledger Metrics...' : 'Generate & Download Report'}
          </button>
        </form>

        {/* Info panel */}
        <div style={styles.infoCard}>
          <h3 style={styles.sectionTitle}>Report Includes</h3>
          
          <div style={styles.includesList}>
            <div style={styles.includeItem}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>Full Expense & Category Breakdown analysis</span>
            </div>
            <div style={styles.includeItem}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>Monthly net savings calculations</span>
            </div>
            <div style={styles.includeItem}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>Total outstanding liabilities and loan logs</span>
            </div>
            <div style={styles.includeItem}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>Investment portfolio valuations</span>
            </div>
            <div style={styles.includeItem}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>AI Recommendation checklists</span>
            </div>
          </div>

          {success && (
            <div style={styles.successBox}>
              <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
              <span>Report compiled and downloaded successfully! Check your browser downloads folder.</span>
            </div>
          )}

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    marginTop: '64px',
    backgroundColor: '#030712',
    color: '#f8fafc',
    fontFamily: 'Outfit, sans-serif',
    padding: '40px 24px',
  },
  header: {
    maxWidth: '1200px',
    margin: '0 auto 32px auto',
  },
  backLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '16px',
    width: 'fit-content',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#ffffff',
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: '14px',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '32px',
    alignItems: 'start',
  },
  formCard: {
    background: 'rgba(17, 24, 39, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '20px',
    color: '#ffffff',
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#94a3b8',
  },
  select: {
    padding: '12px 16px',
    borderRadius: '10px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '14px',
    fontFamily: 'Outfit, sans-serif',
    outline: 'none',
    cursor: 'pointer',
  },
  formatSelectors: {
    display: 'flex',
    gap: '16px',
  },
  formatLabel: {
    flex: 1,
    padding: '16px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    transition: 'all 0.2s ease',
  },
  hiddenRadio: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '28px',
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
  },
  infoCard: {
    background: 'rgba(17, 24, 39, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
  },
  includesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginBottom: '24px',
  },
  includeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: '#cbd5e1',
  },
  successBox: {
    display: 'flex',
    gap: '10px',
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '10px',
    padding: '12px',
    fontSize: '12px',
    color: '#a7f3d0',
    lineHeight: 1.4,
  },
  errorBox: {
    display: 'flex',
    gap: '10px',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '10px',
    padding: '12px',
    fontSize: '12px',
    color: '#fca5a5',
    lineHeight: 1.4,
  },
};

export default FinancialReports;
