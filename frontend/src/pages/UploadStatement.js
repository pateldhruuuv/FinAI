import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet, ArrowLeft, HelpCircle } from 'lucide-react';

const UploadStatement = () => {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setMessage(null);
    if (selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
    } else {
      setMessage({
        type: 'error',
        text: 'Invalid file format. Please upload a .csv bank statement file.'
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
    setMessage(null);

    try {
      const res = await axios.post('/upload-statement', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.status === 'success') {
        setMessage({
          type: 'success',
          text: res.data.message || 'File uploaded and parsed successfully!'
        });
        setFile(null);
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2500);
      }
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Server error. Failed to parse or upload the statement.'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="main-content">
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          <ArrowLeft size={16} />
          Back to Cockpit
        </button>
        <h1 style={styles.title}>Upload Bank Statement</h1>
        <p style={styles.subtitle}>Upload a bank statement in CSV format to populate your dashboard.</p>
      </div>

      <div className="grid-cols-3" style={styles.mainGrid}>
        
        {/* Upload Form (2 cols) */}
        <div className="glass-card" style={styles.uploadCard}>
          {message && (
            <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
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
                  <FileSpreadsheet size={20} style={{ color: '#10b981' }} />
                  <span style={styles.fileName}>{file.name}</span>
                  <span style={styles.fileSize}>({(file.size / 1024).toFixed(2)} KB)</span>
                </div>
              ) : (
                <div style={styles.prompt}>
                  <p style={styles.promptMain}>Drag & Drop CSV bank statement here</p>
                  <p style={styles.promptOr}>or</p>
                  <label htmlFor="file-input" style={styles.fileSelectBtn}>
                    Browse Files
                  </label>
                  <input
                    id="file-input"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    style={styles.hiddenInput}
                  />
                </div>
              )}
            </div>

            {file && (
              <div style={styles.submitRow}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setFile(null)}
                  disabled={uploading}
                >
                  Clear Selection
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={uploading}
                >
                  {uploading ? 'Parsing Statement...' : 'Analyze Ledger'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Guidelines (1 col) */}
        <div className="glass-card" style={styles.guidelinesCard}>
          <div style={styles.guideHeader}>
            <HelpCircle size={20} style={{ color: '#6366f1' }} />
            <h3 style={styles.guideTitle}>CSV File Requirements</h3>
          </div>
          <p style={styles.guideDesc}>
            To ensure correct ledger analysis, your CSV statement must contain headers mapping to these fields:
          </p>
          <ul style={styles.guideList}>
            <li><strong>Date:</strong> YYYY-MM-DD format (e.g. 2026-01-01)</li>
            <li><strong>Description:</strong> Narrative description (e.g. Rent Payment, Zomato, Salary)</li>
            <li><strong>Category:</strong> Shopping, Food, Utilities, Rent, Salary, EMI, etc.</li>
            <li><strong>Amount:</strong> Decimal or Integer values (e.g. 500, 10000)</li>
            <li><strong>Type:</strong> Credit (deposits/income) or Debit (expenses/withdrawals)</li>
          </ul>

          <div style={styles.exampleBox}>
            <h4 style={styles.exampleTitle}>Sample Template Structure</h4>
            <pre style={styles.examplePre}>
{`Date,Description,Category,Amount,Type
2026-01-01,Salary Corp,Salary,50000,Credit
2026-01-02,Rent House,Rent,10000,Debit
2026-01-03,Zomato Food,Food,500,Debit`}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
};

const styles = {
  header: {
    marginBottom: '32px'
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
    transition: 'color var(--transition-fast)'
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
  mainGrid: {
    gridTemplateColumns: '2fr 1fr',
    gap: '24px'
  },
  uploadCard: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
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
    minHeight: '260px'
  },
  dropzoneDrag: {
    borderColor: '#6366f1',
    background: 'rgba(99, 102, 241, 0.05)',
    boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)'
  },
  dropzoneActive: {
    borderColor: '#10b981',
    background: 'rgba(16, 185, 129, 0.03)'
  },
  uploadIcon: (file) => ({
    color: file ? '#10b981' : '#64748b',
    marginBottom: '20px',
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
    fontSize: '16px',
    fontWeight: 500,
    color: '#f8fafc',
    fontFamily: 'Outfit, sans-serif'
  },
  promptOr: {
    fontSize: '13px',
    color: '#64748b',
    margin: '8px 0'
  },
  fileSelectBtn: {
    display: 'inline-block',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    color: '#f8fafc',
    padding: '8px 20px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Outfit, sans-serif'
  },
  fileDetails: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  fileName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#f8fafc'
  },
  fileSize: {
    fontSize: '13px',
    color: '#94a3b8'
  },
  submitRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px'
  },
  guidelinesCard: {
    padding: '24px'
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
    fontSize: '18px',
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif'
  },
  guideDesc: {
    fontSize: '14px',
    color: '#cbd5e1',
    marginBottom: '16px',
    lineHeight: '1.6'
  },
  guideList: {
    fontSize: '13px',
    color: '#cbd5e1',
    paddingLeft: '20px',
    lineHeight: '1.8',
    marginBottom: '24px'
  },
  exampleBox: {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.04)'
  },
  exampleTitle: {
    fontSize: '13px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px',
    fontWeight: 600
  },
  examplePre: {
    fontSize: '11px',
    color: '#06b6d4',
    fontFamily: 'Courier New, monospace',
    overflowX: 'auto',
    lineHeight: '1.5'
  }
};

export default UploadStatement;
