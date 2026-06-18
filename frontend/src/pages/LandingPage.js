import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, ShieldCheck, HeartPulse, LineChart, FileSpreadsheet } from 'lucide-react';

const LandingPage = () => {
  return (
    <div style={styles.container}>
      {/* Background decorations */}
      <div style={styles.bgBlob1}></div>
      <div style={styles.bgBlob2}></div>

      {/* Hero Section */}
      <section style={styles.heroSection} className="animate-fade-in">
        <h1 style={styles.heroTitle}>
          Your Smart Personal <br />
          <span style={styles.gradientText}>Financial Advisor</span>
        </h1>
        <p style={styles.heroSubtitle}>
          FinPilot AI uses machine learning to analyze your transactions, compute your Financial Health Score, and provide personalized investment and insurance recommendation systems.
        </p>
        <div style={styles.ctaButtons}>
          <Link to="/register" style={styles.primaryCta}>
            Get Started Free
            <ArrowRight size={18} />
          </Link>
          <Link to="/login" style={styles.secondaryCta}>
            Access Dashboard
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section style={styles.featuresSection}>
        <h2 style={styles.featuresTitle}>Powered by Intelligent Machine Learning</h2>
        <div className="grid-cols-3" style={styles.featuresGrid}>
          
          <div className="glass-card glass-card-interactive" style={styles.featureCard}>
            <div style={styles.iconContainerPrimary}>
              <FileSpreadsheet size={24} style={styles.iconPrimary} />
            </div>
            <h3 style={styles.cardTitle}>Statement Analysis</h3>
            <p style={styles.cardDesc}>
              Upload your raw bank statement CSV and witness our parser structure your income and expense streams immediately.
            </p>
          </div>

          <div className="glass-card glass-card-interactive" style={styles.featureCard}>
            <div style={styles.iconContainerPrimary}>
              <HeartPulse size={24} style={styles.iconPrimary} />
            </div>
            <h3 style={styles.cardTitle}>Health Diagnostics</h3>
            <p style={styles.cardDesc}>
              Evaluate your financial health score utilizing our Random Forest classifier, measuring savings and debt metrics.
            </p>
          </div>

          <div className="glass-card glass-card-interactive" style={styles.featureCard}>
            <div style={styles.iconContainerPrimary}>
              <Compass size={24} style={styles.iconPrimary} />
            </div>
            <h3 style={styles.cardTitle}>Smart Investment</h3>
            <p style={styles.cardDesc}>
              Leverage Decision Tree algorithms to receive customized short-term and long-term investment allocation strategies.
            </p>
          </div>

          <div className="glass-card glass-card-interactive" style={styles.featureCard}>
            <div style={styles.iconContainerSecondary}>
              <ShieldCheck size={24} style={styles.iconSecondary} />
            </div>
            <h3 style={styles.cardTitle}>Insurance Planning</h3>
            <p style={styles.cardDesc}>
              Compute necessary coverages for medical, accident, and term plans based on demographics and marital context.
            </p>
          </div>

          <div className="glass-card glass-card-interactive" style={styles.featureCard}>
            <div style={styles.iconContainerSecondary}>
              <LineChart size={24} style={styles.iconSecondary} />
            </div>
            <h3 style={styles.cardTitle}>Real-time Dashboard</h3>
            <p style={styles.cardDesc}>
              Visualize financial habits via responsive charts representing income margins, expense classes, and savings profiles.
            </p>
          </div>

          <div className="glass-card glass-card-interactive" style={styles.featureCard}>
            <div style={styles.iconContainerSecondary}>
              <ArrowRight size={24} style={styles.iconSecondary} />
            </div>
            <h3 style={styles.cardTitle}>AI Financial Chatbot</h3>
            <p style={styles.cardDesc}>
              Interact with our context-aware rule-based assistant to clarify queries on saving practices and asset classes.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
    paddingTop: '120px',
    paddingBottom: '80px',
    backgroundColor: '#030712',
  },
  bgBlob1: {
    position: 'absolute',
    top: '10%',
    left: '-10%',
    width: '450px',
    height: '450px',
    background: 'rgba(99, 102, 241, 0.15)',
    borderRadius: '50%',
    filter: 'blur(100px)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  bgBlob2: {
    position: 'absolute',
    bottom: '10%',
    right: '-10%',
    width: '450px',
    height: '450px',
    background: 'rgba(168, 85, 247, 0.12)',
    borderRadius: '50%',
    filter: 'blur(100px)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  heroSection: {
    maxWidth: '850px',
    margin: '0 auto 80px auto',
    textAlign: 'center',
    padding: '0 24px',
    zIndex: 10,
    position: 'relative',
  },
  heroTitle: {
    fontSize: '60px',
    lineHeight: '1.15',
    fontWeight: 800,
    color: '#f8fafc',
    marginBottom: '24px',
    fontFamily: 'Outfit, sans-serif',
    letterSpacing: '-0.04em',
  },
  gradientText: {
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: '18px',
    color: '#94a3b8',
    marginBottom: '40px',
    lineHeight: '1.6',
    fontWeight: 400,
  },
  ctaButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  primaryCta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '16px',
    padding: '14px 28px',
    borderRadius: '8px',
    boxShadow: '0 0 20px rgba(99, 102, 241, 0.35)',
    transition: 'all 0.2s ease',
    fontFamily: 'Outfit, sans-serif',
  },
  secondaryCta: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#f8fafc',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '16px',
    padding: '14px 28px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    fontFamily: 'Outfit, sans-serif',
  },
  featuresSection: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 24px',
    zIndex: 10,
    position: 'relative',
  },
  featuresTitle: {
    fontSize: '32px',
    textAlign: 'center',
    marginBottom: '48px',
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif',
  },
  featuresGrid: {
    display: 'grid',
    gap: '24px',
  },
  featureCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
  },
  iconContainerPrimary: {
    background: 'rgba(99, 102, 241, 0.1)',
    borderRadius: '12px',
    padding: '12px',
    marginBottom: '20px',
  },
  iconPrimary: {
    color: '#6366f1',
  },
  iconContainerSecondary: {
    background: 'rgba(16, 185, 129, 0.1)',
    borderRadius: '12px',
    padding: '12px',
    marginBottom: '20px',
  },
  iconSecondary: {
    color: '#10b981',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#f8fafc',
    marginBottom: '10px',
    fontFamily: 'Outfit, sans-serif',
  },
  cardDesc: {
    fontSize: '14px',
    color: '#94a3b8',
    lineHeight: '1.6',
  },
};

export default LandingPage;
