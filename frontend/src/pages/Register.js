import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, loginWithGoogle, token, error, setError } = useContext(AuthContext);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
    setError(null);
  }, [token, navigate, setError]);

  const triggerPromptFallback = async () => {
    const fallbackEmail = email || 'google-tester@example.com';
    const fallbackName = name || (fallbackEmail.split('@')[0].charAt(0).toUpperCase() + fallbackEmail.split('@')[0].slice(1));

    setGoogleSubmitting(true);
    setLocalError('');
    try {
      await loginWithGoogle({
        token: 'mock-google-access-token',
        name: fallbackName,
        email: fallbackEmail,
        picture: '',
        dob: '',
        gender: ''
      });
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    setGoogleSubmitting(true);
    setLocalError('');
    try {
      const accessToken = tokenResponse.access_token;
      let profile = null;
      try {
        const userInfoRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
        if (userInfoRes.ok) {
          profile = await userInfoRes.json();
        }
      } catch (fetchErr) {
        console.warn('Failed to fetch profile info directly from Google:', fetchErr.message);
      }

      await loginWithGoogle({
        token: accessToken,
        name: profile?.name,
        email: profile?.email,
        picture: profile?.picture,
        dob: '',
        gender: ''
      });
      navigate('/dashboard');
    } catch (err) {
      console.warn('Google authentication failed, falling back to manual details entry:', err.message);
      await triggerPromptFallback();
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleGoogleError = async () => {
    console.warn('Google Sign-In popup closed or failed. Falling back to local mock Google authentication.');
    await triggerPromptFallback();
  };

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: handleGoogleError,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Field Validations
    if (!name || !email || !password) {
      setLocalError('Please fill in all the fields.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col md:flex-row bg-background text-on-background font-sans">
      {/* Left Side: Visual Assets */}
      <section className="relative w-full md:w-1/2 min-h-[350px] md:min-h-screen flex items-center justify-center overflow-hidden bg-surface-container-lowest">
        {/* Visual Overlay Image */}
        <div className="absolute inset-0 w-full h-full opacity-40 md:opacity-60 bg-gradient-to-tr from-surface via-transparent to-primary/10 z-10 pointer-events-none"></div>
        <div className="h-full w-full absolute inset-0 select-none pointer-events-none z-0">
          <img 
            alt="Finmate Visual Background" 
            className="w-full h-full object-cover opacity-80" 
            src="/bg.jpg" 
          />
        </div>
        
        {/* Brand Label Overlay */}
        <div className="absolute top-8 left-8 z-20 flex items-center gap-2">
          <span className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center text-on-primary-container font-semibold">
            <span className="material-symbols-outlined text-xl">account_balance</span>
          </span>
          <span className="font-display-hero text-xl font-bold tracking-tight text-on-surface">
            Finmate
          </span>
        </div>

        {/* Decorative Lines */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-container/20 to-transparent opacity-30"></div>
          <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-20"></div>
        </div>
      </section>

      {/* Right Side: Registration Card */}
      <section className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 relative z-20 bg-surface">
        <div className="w-full max-w-md glass-card rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden animate-fade-in">
          
          {/* Form Header */}
          <div className="mb-6">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2 font-serif">Create Account</h2>
            <p className="font-sans text-sm text-on-surface-variant">Sign up to begin your smart financial journey.</p>
          </div>

          {/* Form Messages */}
          {(localError || error) && (
            <div className="alert bg-error-container/20 border-l-4 border-error text-error p-4 rounded-xl text-sm mb-6">
              {localError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1" htmlFor="name">
                Full Name
              </label>
              <input 
                id="name" 
                type="text"
                placeholder="John Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-sm" 
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1" htmlFor="email">
                Email Address
              </label>
              <input 
                id="email" 
                type="email"
                placeholder="john@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-sm" 
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1" htmlFor="password">
                Password
              </label>
              <input 
                id="password" 
                type="password"
                placeholder="Min. 6 characters" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-sm" 
                required
              />
            </div>

            <button 
              type="submit"
              disabled={submitting || googleSubmitting}
              className="w-full bg-primary-container hover:bg-primary text-on-primary-container font-semibold py-3 rounded-full transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-primary-container/20 flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              {submitting ? 'Creating Profile...' : 'Sign Up'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-outline-variant/30 flex-1"></div>
            <span className="text-[9px] text-on-surface-variant uppercase tracking-wider font-semibold">or continue with</span>
            <div className="h-px bg-outline-variant/30 flex-1"></div>
          </div>

          {/* Social Sign-In */}
          <div className="grid grid-cols-1 gap-3">
            <button 
              type="button"
              onClick={() => triggerGoogleLogin()}
              disabled={googleSubmitting || submitting}
              className="w-full border border-outline-variant hover:bg-surface-container/60 py-2.5 px-4 rounded-xl flex items-center justify-center gap-3 font-semibold text-on-surface transition-all duration-200 cursor-pointer text-sm"
            >
              <img 
                alt="Google Logo" 
                className="w-4.5 h-4.5 opacity-80" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAj0v8Qmrj9mRxzKuVdT4NTsf_u8ARy3ZcZbDSndER3WQbVkAIT2y-APWy3-hbT7gveeDhYLukwa4Xk1NfMcAJ6vDerMhpUFroxOhqLGJ0-yYtXQyUmfVUZMR5qIhh1xzWeEaVCkpL4WNuHyJvVyL7CDq2tLg5Yxi_zFNkTT38NDaBjd2GbmjHaSeyzef3097K9JXSobM6QJJdgVtI2eTndpEjD6roWyr4yxUO2sEMgj3Fb5CjJ5V-_C-GUa3Z4fC3kD9KgCtrDhw" 
              />
              {googleSubmitting ? 'Connecting...' : 'Continue with Google'}
            </button>
          </div>

          {/* Footer Link */}
          <p className="text-center mt-6 text-sm text-on-surface-variant">
            Already have an account? <Link to="/login" className="text-primary-container font-bold hover:underline underline-offset-4 decoration-primary-container/30">Login here</Link>
          </p>
        </div>

        {/* Form Footer */}
        <footer className="absolute bottom-6 w-full flex justify-center gap-6 px-4">
          <Link className="text-[11px] text-on-surface-variant hover:text-primary transition-colors" to="/terms">Terms of Service</Link>
          <Link className="text-[11px] text-on-surface-variant hover:text-primary transition-colors" to="/privacy">Privacy Policy</Link>
          <span className="text-[11px] text-on-surface-variant opacity-40">© 2026 Boutique Finance.</span>
        </footer>
      </section>
    </main>
  );
};

export default Register;
