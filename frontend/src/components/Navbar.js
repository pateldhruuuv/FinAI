import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, togglePremium, t } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Render Horizontal Header for Public Pages (unauthenticated users)
  if (!user) {
    return (
      <header className="fixed top-0 left-0 w-full h-16 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant z-50 px-6 md:px-12 flex items-center justify-between transition-colors">
        <Link to="/" className="flex items-center gap-2 relative">
          <span className="absolute w-8 h-8 bg-primary/20 rounded-full blur-md -left-2 -top-1 pointer-events-none"></span>
          <span className="font-display-hero text-xl font-bold tracking-tight text-on-surface">
          Finmate <span className="text-primary">AI</span>
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            to="/login"
            className={`font-label-md text-label-md transition-colors ${isActive('/login') ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            {t('login')}
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 rounded-full font-label-md text-label-md bg-primary text-on-primary font-bold shadow-md hover:bg-primary-fixed-dim transition-colors"
          >
            {t('getStarted')}
          </Link>
        </div>
      </header>
    );
  }

  // Render Fixed Sidebar Layout for Logged-In Users
  return (
    <>
      {/* Fixed Left Sidebar Navigation */}
      <aside className="fixed hidden md:flex h-screen left-0 top-0 w-sidebar-width bg-surface border-r border-outline-variant flex-col items-center py-6 z-50">
        {/* Brand Logo Container */}
        <div className="mb-10">
          <Link to="/" className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center text-on-primary-container relative group hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-2xl font-bold">account_balance</span>
            <span className="absolute left-16 bg-surface-container border border-outline-variant px-3 py-1.5 rounded-md text-label-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
              Finmate Dashboard
            </span>
          </Link>
        </div>

        {/* Navigation Icons Link Dock */}
        <nav className="flex flex-col gap-5 items-center flex-1 w-full px-2">
          {/* Dashboard */}
          <Link
            to="/dashboard"
            title={t('dashboard')}
            className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${isActive('/dashboard')
                ? 'bg-primary text-on-primary'
                : 'text-secondary hover:bg-surface-container-high hover:text-on-surface'
              }`}
          >
            <span className="material-symbols-outlined text-xl">dashboard</span>
            <span className="absolute left-16 bg-surface-container border border-outline-variant px-3 py-1.5 rounded-md text-label-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
              {t('dashboard')}
            </span>
          </Link>

          {/* Statement Hub */}
          <Link
            to="/upload"
            title={t('statementHub')}
            className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${isActive('/upload')
                ? 'bg-primary text-on-primary'
                : 'text-secondary hover:bg-surface-container-high hover:text-on-surface'
              }`}
          >
            <span className="material-symbols-outlined text-xl">cloud_upload</span>
            <span className="absolute left-16 bg-surface-container border border-outline-variant px-3 py-1.5 rounded-md text-label-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
              {t('statementHub')}
            </span>
          </Link>

          {/* Investments */}
          <Link
            to="/investments"
            title={t('investments')}
            className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${isActive('/investments')
                ? 'bg-primary text-on-primary'
                : 'text-secondary hover:bg-surface-container-high hover:text-on-surface'
              }`}
          >
            <span className="material-symbols-outlined text-xl">payments</span>
            <span className="absolute left-16 bg-surface-container border border-outline-variant px-3 py-1.5 rounded-md text-label-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
              {t('investments')}
            </span>
          </Link>

          {/* Insurance */}
          <Link
            to="/insurance"
            title={t('insurance')}
            className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${isActive('/insurance')
                ? 'bg-primary text-on-primary'
                : 'text-secondary hover:bg-surface-container-high hover:text-on-surface'
              }`}
          >
            <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
            <span className="absolute left-16 bg-surface-container border border-outline-variant px-3 py-1.5 rounded-md text-label-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
              {t('insurance')}
            </span>
          </Link>

          {/* AI Assistant */}
          <Link
            to="/chatbot"
            title={t('aiAssistant')}
            className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${isActive('/chatbot')
                ? 'bg-primary text-on-primary'
                : 'text-secondary hover:bg-surface-container-high hover:text-on-surface'
              }`}
          >
            <span className="material-symbols-outlined text-xl">chat_bubble</span>
            <span className="absolute left-16 bg-surface-container border border-outline-variant px-3 py-1.5 rounded-md text-label-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
              {t('aiAssistant')}
            </span>
          </Link>

          {/* Premium Hub Link */}
          <Link
            to="/premium-dashboard"
            title={t('premiumHub')}
            className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${isActive('/premium-dashboard')
                ? 'bg-primary text-on-primary'
                : user.isPremium
                  ? 'bg-tertiary-container/20 text-tertiary border border-tertiary-container/30 hover:bg-tertiary-container/30'
                  : 'text-secondary hover:bg-surface-container-high hover:text-on-surface'
              }`}
          >
            <span className="material-symbols-outlined text-xl">
              {user.isPremium ? 'verified' : 'lock'}
            </span>
            <span className="absolute left-16 bg-surface-container border border-outline-variant px-3 py-1.5 rounded-md text-label-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
              {t('premiumHub')} {user.isPremium ? '(Unlocked)' : '(Locked)'}
            </span>
          </Link>

          {/* Settings */}
          <Link
            to="/settings"
            title={t('settings')}
            className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${isActive('/settings')
                ? 'bg-primary text-on-primary'
                : 'text-secondary hover:bg-surface-container-high hover:text-on-surface'
              }`}
          >
            <span className="material-symbols-outlined text-xl">settings</span>
            <span className="absolute left-16 bg-surface-container border border-outline-variant px-3 py-1.5 rounded-md text-label-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
              {t('settings')}
            </span>
          </Link>
        </nav>

        {/* Help & Logout Actions */}
        <div className="flex flex-col gap-4 items-center mt-auto w-full px-2">
          <button
            onClick={handleLogout}
            title={t('logout')}
            className="group relative w-12 h-12 text-error hover:bg-error-container/20 transition-colors rounded-xl flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="absolute left-16 bg-surface-container border border-outline-variant px-3 py-1.5 rounded-md text-label-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
              {t('logout')}
            </span>
          </button>
        </div>
      </aside>

      {/* Top Header Navigation Bar */}
      <header className="fixed top-0 right-0 left-0 md:left-sidebar-width h-16 bg-surface/90 backdrop-blur-xl border-b border-outline-variant z-40 px-6 flex items-center justify-between transition-all">
        {/* Left Side: Page Title or Branding */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden w-10 h-10 items-center justify-center rounded-xl hover:bg-surface-container-high text-on-surface"
          >
            <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>

          <h1 className="font-display-hero text-lg md:text-xl font-bold text-on-surface flex items-center gap-2">
            <span className="md:hidden w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center text-on-primary-container font-semibold">
              <span className="material-symbols-outlined text-lg">account_balance</span>
            </span>
            Finmate
          </h1>
        </div>

        {/* Right Side: Search, Notification, Profile Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {!user.isPremium && (
            <button
              onClick={handleTogglePremium}
              className="px-4 py-1.5 rounded-full bg-primary-container text-on-primary-container font-bold text-xs flex items-center gap-1.5 hover:scale-95 active:scale-90 transition-all cursor-pointer shadow-sm shadow-primary-container/20"
              title="Unlock Premium features"
            >
              <span className="material-symbols-outlined text-sm">zap</span>
              {t('goPremium')}
            </button>
          )}

          {/* User profile dropdown and metadata */}
          <div className="h-8 w-px bg-outline-variant mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="font-label-md text-label-md font-bold text-on-surface leading-tight">{t('hello')}, {user.name}</p>
              <p className={`font-label-sm text-[10px] uppercase font-bold tracking-wider ${user.isPremium ? 'text-primary' : 'text-on-surface-variant'}`}>
                {user.isPremium ? 'Premium Plan' : 'Free Member'}
              </p>
            </div>

            <div className="relative group">
              {user.profileImage ? (
                <img
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/40 cursor-pointer hover:ring-primary transition-all"
                  src={user.profileImage.startsWith('http') ? user.profileImage : axios.defaults.baseURL + user.profileImage}
                  alt={user.name}
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm ring-2 ring-primary/40 cursor-pointer hover:ring-primary transition-all">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-45 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute left-0 top-0 h-full w-64 bg-surface border-r border-outline-variant p-6 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <span className="font-display-hero text-xl font-bold text-on-surface">Finmate Navigation</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <nav className="flex flex-col gap-2 flex-1">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-label-md text-label-md transition-colors ${isActive('/dashboard') ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
              >
                <span className="material-symbols-outlined">dashboard</span>
                {t('dashboard')}
              </Link>
              <Link
                to="/upload"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-label-md text-label-md transition-colors ${isActive('/upload') ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
              >
                <span className="material-symbols-outlined">cloud_upload</span>
                {t('statementHub')}
              </Link>
              <Link
                to="/investments"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-label-md text-label-md transition-colors ${isActive('/investments') ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
              >
                <span className="material-symbols-outlined">payments</span>
                {t('investments')}
              </Link>
              <Link
                to="/insurance"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-label-md text-label-md transition-colors ${isActive('/insurance') ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
              >
                <span className="material-symbols-outlined">account_balance_wallet</span>
                {t('insurance')}
              </Link>
              <Link
                to="/chatbot"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-label-md text-label-md transition-colors ${isActive('/chatbot') ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
              >
                <span className="material-symbols-outlined">chat_bubble</span>
                {t('aiAssistant')}
              </Link>
              <Link
                to="/premium-dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-label-md text-label-md transition-colors ${isActive('/premium-dashboard') ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
              >
                <span className="material-symbols-outlined">{user.isPremium ? 'verified' : 'lock'}</span>
                {t('premiumHub')}
              </Link>
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-label-md text-label-md transition-colors ${isActive('/settings') ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
              >
                <span className="material-symbols-outlined">settings</span>
                {t('settings')}
              </Link>
            </nav>

            <div className="pt-4 border-t border-outline-variant mt-auto">
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 px-4 py-3 w-full rounded-xl font-label-md text-label-md text-error hover:bg-error-container/20 transition-colors"
              >
                <span className="material-symbols-outlined">logout</span>
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
