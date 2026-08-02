import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import { Mail, Lock, LogIn } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login, loginWithGoogle, token, error, setError } = useContext(AuthContext);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const navigate = useNavigate();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
    // Clean up error state on load
    setError(null);
  }, [token, navigate, setError]);

  const handleGoogleSuccess = async (tokenResponse) => {
    setGoogleSubmitting(true);
    setLocalError('');
    try {
      const accessToken = tokenResponse.access_token;
      await loginWithGoogle(accessToken);
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setLocalError('Google Sign-In popup closed or failed.');
  };

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: handleGoogleError,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgBlob}></div>
      <div className="glass-card animate-fade-in" style={styles.card}>
        <h2 style={styles.title}>Welcome Back</h2>
        <p style={styles.subtitle}>Enter credentials to access your financial cockpit.</p>

        {(localError || error) && (
          <div className="alert alert-error">
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="name@example.com"
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.inputWithIcon}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={styles.submitBtn}
            disabled={submitting || googleSubmitting}
          >
            <LogIn size={18} />
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={() => triggerGoogleLogin()}
            style={{
              ...styles.googleBtn,
              ...((googleSubmitting || submitting) ? styles.disabledBtn : {})
            }}
            disabled={googleSubmitting || submitting}
          >
            <svg style={{ marginRight: '10px' }} width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8c-.2 1.1-.8 2-1.8 2.6v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.4z"/>
              <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H1v2.3C2.5 16 5.5 18 9 18z"/>
              <path fill="#FBBC05" d="M3.9 10.7c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7V5H1C.4 6.2 0 7.6 0 9s.4 2.8 1 4l2.9-2.3z"/>
              <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.4 3.4 1.3l2.6-2.6C13.4 1 11.4 0 9 0 5.5 0 2.5 2 1 5l2.9 2.3c.7-2.2 2.7-3.7 5.1-3.7z"/>
            </svg>
            {googleSubmitting ? 'Authenticating...' : 'Continue with Google'}
          </button>
        </form>

        <p style={styles.footerText}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.registerLink}>
            Create one now
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
    padding: '80px 24px 40px 24px',
    position: 'relative',
    overflow: 'hidden',
  },
  bgBlob: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    background: 'rgba(99, 102, 241, 0.12)',
    borderRadius: '50%',
    filter: 'blur(80px)',
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: '450px',
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
    marginBottom: '28px',
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
    marginTop: '24px',
  },
  registerLink: {
    color: '#6366f1',
    textDecoration: 'none',
    fontWeight: 600,
  },
  googleBtn: {
    marginTop: '16px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    backgroundColor: '#ffffff',
    color: '#1f2937',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
    fontFamily: 'Outfit, sans-serif',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  },
  disabledBtn: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};

export default Login;
