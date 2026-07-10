import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Landmark, Compass, ShieldAlert, MessageSquare, LogOut, LayoutDashboard, UploadCloud, Lock, Zap } from 'lucide-react';

const Navbar = () => {
  const { user, logout, togglePremium } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTogglePremium = async () => {
    try {
      await togglePremium();
    } catch (err) {
      console.error('Failed to toggle premium:', err);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logoContainer}>
          <span style={styles.logoGlow}></span>
          <span style={styles.logoText}>FinPilot <span style={styles.logoAccent}>AI</span></span>
        </Link>

        <div style={styles.links}>
          {user ? (
            <>
              <Link to="/dashboard" style={{ ...styles.link, ...(isActive('/dashboard') ? styles.activeLink : {}) }}>
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
              <Link to="/upload" style={{ ...styles.link, ...(isActive('/upload') ? styles.activeLink : {}) }}>
                <UploadCloud size={18} />
                Upload CSV
              </Link>
              <Link to="/investments" style={{ ...styles.link, ...(isActive('/investments') ? styles.activeLink : {}) }}>
                <Compass size={18} />
                Investments
              </Link>
              <Link to="/insurance" style={{ ...styles.link, ...(isActive('/insurance') ? styles.activeLink : {}) }}>
                <ShieldAlert size={18} />
                Insurance
              </Link>
              <Link to="/chatbot" style={{ ...styles.link, ...(isActive('/chatbot') ? styles.activeLink : {}) }}>
                <MessageSquare size={18} />
                AI Assistant
              </Link>
              
              {/* Premium Hub Link */}
              <Link 
                to="/premium-dashboard" 
                style={{ 
                  ...styles.link, 
                  ...(isActive('/premium-dashboard') ? styles.activeLink : {}),
                  ...(user.isPremium ? styles.premiumLink : styles.lockedLink)
                }}
              >
                {user.isPremium ? <Zap size={18} color="#eab308" /> : <Lock size={18} color="#94a3b8" />}
                Premium Hub
              </Link>
              
              <div style={styles.userSection}>
                <div style={styles.userInfo}>
                  <span style={styles.userName}>Hello, {user.name}</span>
                  <span style={user.isPremium ? styles.premiumBadge : styles.freeBadge}>
                    {user.isPremium ? 'PREMIUM' : 'FREE'}
                  </span>
                </div>
                
                {!user.isPremium && (
                  <button 
                    onClick={handleTogglePremium} 
                    style={{
                      ...styles.toggleBtn,
                      ...styles.upgradeBtn
                    }}
                    title="Upgrade to Premium tier"
                  >
                    Go Premium
                  </button>
                )}

                <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" style={{ ...styles.link, ...(isActive('/login') ? styles.activeLink : {}) }}>Login</Link>
              <Link to="/register" style={{ ...styles.link, ...(isActive('/register') ? styles.btnLink : {}) }}>Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '64px',
    background: 'rgba(3, 7, 18, 0.75)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    position: 'relative',
  },
  logoText: {
    fontSize: '22px',
    fontWeight: 800,
    fontFamily: 'Outfit, sans-serif',
    color: '#ffffff',
    letterSpacing: '-0.03em',
  },
  logoAccent: {
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  logoGlow: {
    position: 'absolute',
    width: '40px',
    height: '40px',
    background: 'rgba(99, 102, 241, 0.3)',
    borderRadius: '50%',
    filter: 'blur(20px)',
    left: '-10px',
    top: '-5px',
    pointerEvents: 'none',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    padding: '8px 12px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    fontFamily: 'Outfit, sans-serif',
  },
  activeLink: {
    color: '#ffffff',
    background: 'rgba(255, 255, 255, 0.05)',
    borderBottom: '2px solid #6366f1',
    borderRadius: '8px 8px 0 0',
  },
  premiumLink: {
    color: '#fef08a',
    background: 'rgba(234, 179, 8, 0.05)',
    border: '1px solid rgba(234, 179, 8, 0.2)',
  },
  lockedLink: {
    opacity: 0.8,
  },
  btnLink: {
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 600,
    padding: '8px 16px',
    borderRadius: '8px',
    boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)',
    transition: 'all 0.2s ease',
    fontFamily: 'Outfit, sans-serif',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginLeft: '16px',
    paddingLeft: '16px',
    borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
  },
  userName: {
    fontSize: '14px',
    color: '#f8fafc',
    fontWeight: 500,
    fontFamily: 'Outfit, sans-serif',
  },
  freeBadge: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#94a3b8',
    background: 'rgba(148, 163, 184, 0.15)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'Outfit, sans-serif',
    marginTop: '2px',
  },
  premiumBadge: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#10b981',
    background: 'rgba(16, 185, 129, 0.15)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'Outfit, sans-serif',
    marginTop: '2px',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  toggleBtn: {
    fontSize: '12px',
    fontWeight: 600,
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    fontFamily: 'Outfit, sans-serif',
  },
  upgradeBtn: {
    background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
    color: '#000000',
    boxShadow: '0 0 10px rgba(234, 179, 8, 0.2)',
  },
  downgradeBtn: {
    background: 'rgba(255, 255, 255, 0.08)',
    color: '#cbd5e1',
    border: '1px solid rgba(255, 255, 255, 0.15)',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'transparent',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
};

export default Navbar;
