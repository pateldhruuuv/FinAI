import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Calendar, Wallet, Check } from 'lucide-react';

const ProfileDataModal = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const [age, setAge] = useState('');
  const [income, setIncome] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal is only active if user is logged in but missing Age or Income
  const isMissingData = user && (!user.age || !user.monthlyIncome);

  if (!isMissingData) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!age || !income) {
      setError('Please provide both age and monthly income.');
      return;
    }

    if (parseInt(age) < 18) {
      setError('Age must be at least 18.');
      return;
    }

    if (parseFloat(income) < 0) {
      setError('Monthly income cannot be negative.');
      return;
    }

    setSubmitting(true);
    try {
      await updateProfile(parseInt(age), parseFloat(income));
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div className="glass-card animate-fade-in" style={styles.modal}>
        <h2 style={styles.title}>Complete Your Profile</h2>
        <p style={styles.subtitle}>
          To unlock the advisor calculations and financial insights, please verify your age and monthly income.
        </p>

        {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="modal-age">Current Age</label>
            <div style={styles.inputWrapper}>
              <Calendar size={18} style={styles.inputIcon} />
              <input
                id="modal-age"
                type="number"
                className="form-input"
                placeholder="25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                style={styles.inputWithIcon}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="modal-income">Monthly Income (₹)</label>
            <div style={styles.inputWrapper}>
              <Wallet size={18} style={styles.inputIcon} />
              <input
                id="modal-income"
                type="number"
                className="form-input"
                placeholder="50000"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                style={styles.inputWithIcon}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={styles.submitBtn}
            disabled={submitting}
          >
            <Check size={18} />
            {submitting ? 'Saving Profile...' : 'Unlock Features'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(3, 7, 18, 0.85)',
    backdropFilter: 'blur(10px)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px',
  },
  modal: {
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  title: {
    fontSize: '22px',
    marginBottom: '8px',
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 700,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '13px',
    color: '#94a3b8',
    marginBottom: '20px',
    lineHeight: '1.5',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: '#64748b',
    pointerEvents: 'none',
  },
  inputWithIcon: {
    paddingLeft: '44px',
    width: '100%',
  },
  submitBtn: {
    marginTop: '12px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
};

export default ProfileDataModal;
