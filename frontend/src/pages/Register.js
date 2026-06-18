import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Lock, Calendar, Wallet, UserPlus } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, token, error, setError } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
    setError(null);
  }, [token, navigate, setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Field Validations
    if (!name || !email || !password || !age || !monthlyIncome) {
      setLocalError('Please fill in all the fields.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    if (parseInt(age) < 18) {
      setLocalError('You must be 18 years or older to register.');
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, password, parseInt(age), parseFloat(monthlyIncome));
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgBlob}></div>
      <div className="glass-card animate-fade-in" style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.subtitle}>Sign up to begin your smart financial journey.</p>

        {(localError || error) && (
          <div className="alert alert-error">
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <div style={styles.inputWrapper}>
              <User size={18} style={styles.inputIcon} />
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.inputWithIcon}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.inputWithIcon}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.inputWithIcon}
              />
            </div>
          </div>

          <div className="grid-cols-2" style={{ gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="age">Age</label>
              <div style={styles.inputWrapper}>
                <Calendar size={18} style={styles.inputIcon} />
                <input
                  id="age"
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
              <label className="form-label" htmlFor="monthlyIncome">Income (Monthly)</label>
              <div style={styles.inputWrapper}>
                <Wallet size={18} style={styles.inputIcon} />
                <input
                  id="monthlyIncome"
                  type="number"
                  className="form-input"
                  placeholder="50000"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  style={styles.inputWithIcon}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={styles.submitBtn}
            disabled={submitting}
          >
            <UserPlus size={18} />
            {submitting ? 'Creating Profile...' : 'Sign Up'}
          </button>
        </form>

        <p style={styles.footerText}>
          Already have an account?{' '}
          <Link to="/login" style={styles.loginLink}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#030712',
    padding: '100px 24px 40px 24px',
    position: 'relative',
    overflow: 'hidden',
  },
  bgBlob: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    background: 'rgba(168, 85, 247, 0.12)',
    borderRadius: '50%',
    filter: 'blur(80px)',
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: '500px',
    zIndex: 10,
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
  },
  title: {
    fontSize: '28px',
    textAlign: 'center',
    marginBottom: '8px',
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif',
  },
  subtitle: {
    fontSize: '14px',
    textAlign: 'center',
    color: '#94a3b8',
    marginBottom: '24px',
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
  },
  submitBtn: {
    marginTop: '10px',
    width: '100%',
  },
  footerText: {
    fontSize: '14px',
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: '20px',
  },
  loginLink: {
    color: '#6366f1',
    textDecoration: 'none',
    fontWeight: 600,
  },
};

export default Register;
