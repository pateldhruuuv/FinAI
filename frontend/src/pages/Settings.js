import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { 
  User as UserIcon, Wallet, Shield, Bell, Settings as SettingsIcon, 
  Award, Landmark, Eye, FileText, Camera, Plus, Trash, RefreshCw, 
  Download, Check, Loader, Lock, Mail, Phone, Calendar, MapPin, 
  UserCheck, AlertTriangle, HelpCircle, EyeOff, ShieldCheck, Laptop, 
  Smartphone, LogOut, CheckCircle2, ChevronRight, X
} from 'lucide-react';

const Settings = () => {
  const { user, setUser, token, logout, togglePremium } = useContext(AuthContext);
  
  // Navigation & Active Tab
  const [activeTab, setActiveTab] = useState('profile');
  
  // State variables for profile and completion
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    country: '',
    occupation: '',
  });
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [profileLoading, setProfileLoading] = useState(true);

  // Financial Profile state
  const [financialData, setFinancialData] = useState({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savings: 0,
    emergencyFund: 0,
    riskProfile: 'Moderate',
    investmentExperience: 'Intermediate',
    investmentGoal: '',
    retirementAge: 60,
    dependents: 0,
  });

  // Security state
  const [securityData, setSecurityData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    enable2FA: false,
  });

  // Notification state
  const [notificationsData, setNotificationsData] = useState({
    email: true,
    sms: true,
    investmentAlerts: true,
    billReminders: true,
    subscriptionRenewal: true,
    goalAchievement: true,
    marketNews: true,
    aiRecommendation: true,
  });

  // Preferences state
  const [preferencesData, setPreferencesData] = useState({
    theme: 'dark',
    language: 'en',
    currency: 'INR',
    dashboardLayout: 'grid',
    defaultLandingPage: 'dashboard',
  });

  // Linked Accounts state
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    accountType: 'bank',
    institutionName: '',
    accountNumber: '',
    balance: '',
    currency: 'INR',
  });

  // Data & Reports state
  const [reportType, setReportType] = useState('Expense');
  const [reportFormat, setReportFormat] = useState('PDF');
  const [dataConsent, setDataConsent] = useState(true);

  // General Status states
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }
  const fileInputRef = useRef(null);

  // Trigger toast notification helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch settings profile on load
  const fetchSettingsProfile = async () => {
    if (!token) return;
    try {
      setProfileLoading(true);
      const res = await axios.get('/profile');
      if (res.data.status === 'success') {
        const u = res.data.user;
        setUser(u); // sync global context
        setProfileData({
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          dob: u.dob ? u.dob.substring(0, 10) : '',
          gender: u.gender || '',
          address: u.address || '',
          city: u.city || '',
          state: u.state || '',
          country: u.country || '',
          occupation: u.occupation || '',
        });
        setProfileCompletion(res.data.profileCompletion || 0);

        setFinancialData({
          monthlyIncome: u.monthlyIncome || 0,
          monthlyExpenses: u.monthlyExpenses || 0,
          savings: u.savings || 0,
          emergencyFund: u.emergencyFund || 0,
          riskProfile: u.riskProfile || 'Moderate',
          investmentExperience: u.investmentExperience || 'Intermediate',
          investmentGoal: u.investmentGoal || '',
          retirementAge: u.retirementAge || 60,
          dependents: u.dependents || 0,
        });

        setNotificationsData({
          email: u.notifications?.email ?? true,
          sms: u.notifications?.sms ?? true,
          investmentAlerts: u.notifications?.investmentAlerts ?? true,
          billReminders: u.notifications?.billReminders ?? true,
          subscriptionRenewal: u.notifications?.subscriptionRenewal ?? true,
          goalAchievement: u.notifications?.goalAchievement ?? true,
          marketNews: u.notifications?.marketNews ?? true,
          aiRecommendation: u.notifications?.aiRecommendation ?? true,
        });

        setPreferencesData({
          theme: u.theme || 'dark',
          language: u.language || 'en',
          currency: u.currency || 'INR',
          dashboardLayout: u.dashboardLayout || 'grid',
          defaultLandingPage: u.defaultLandingPage || 'dashboard',
        });

        setDataConsent(u.dataSharingConsent ?? true);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load profile settings.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  // Fetch linked accounts
  const fetchLinkedAccountsList = async () => {
    try {
      setAccountsLoading(true);
      const res = await axios.get('/linked-accounts');
      if (res.data.status === 'success') {
        setLinkedAccounts(res.data.accounts || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load linked accounts.', 'error');
    } finally {
      setAccountsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsProfile();
    fetchLinkedAccountsList();
  }, [token]);

  // Handle image upload
  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Only image files are allowed!', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size cannot exceed 2MB!', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      setSubmitLoading(true);
      const res = await axios.post('/upload-profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.status === 'success') {
        setUser(res.data.user);
        setProfileCompletion(res.data.profileCompletion || 0);
        showToast('Profile photo updated successfully!');
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to upload image.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Form submit handlers
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.name.trim()) {
      showToast('Full name is required.', 'error');
      return;
    }
    try {
      setSubmitLoading(true);
      const res = await axios.put('/profile', profileData);
      if (res.data.status === 'success') {
        setUser(res.data.user);
        setProfileCompletion(res.data.profileCompletion || 0);
        showToast('Personal profile saved successfully!');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating profile.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleFinancialSubmit = async (e) => {
    e.preventDefault();
    if (financialData.monthlyIncome < 0 || financialData.monthlyExpenses < 0 || financialData.savings < 0) {
      showToast('Financial figures cannot be negative.', 'error');
      return;
    }
    try {
      setSubmitLoading(true);
      const res = await axios.put('/financial-profile', financialData);
      if (res.data.status === 'success') {
        setUser(res.data.user);
        showToast('Financial profile saved and recommendations updated.');
      }
    } catch (err) {
      showToast('Error updating financial settings.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    const isGoogleUser = user && user.provider === 'google';
    if ((!isGoogleUser && !securityData.oldPassword) || !securityData.newPassword) {
      showToast(isGoogleUser ? 'Please enter a new password.' : 'Please enter both old and new passwords.', 'error');
      return;
    }
    if (securityData.newPassword !== securityData.confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    try {
      setSubmitLoading(true);
      const res = await axios.put('/security/change-password', {
        oldPassword: securityData.oldPassword,
        newPassword: securityData.newPassword
      });
      if (res.data.status === 'success') {
        showToast('Password changed successfully.');
        setSecurityData({ oldPassword: '', newPassword: '', confirmPassword: '', enable2FA: securityData.enable2FA });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitLoading(true);
      const res = await axios.put('/preferences', preferencesData);
      if (res.data.status === 'success') {
        setUser(res.data.user);
        showToast('Preferences updated successfully.');
      }
    } catch (err) {
      showToast('Failed to update preferences.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleNotificationsSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitLoading(true);
      const res = await axios.put('/notifications', notificationsData);
      if (res.data.status === 'success') {
        setUser(res.data.user);
        showToast('Notifications toggled successfully.');
      }
    } catch (err) {
      showToast('Failed to save notification toggles.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Add Account
  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!newAccount.institutionName.trim() || !newAccount.accountNumber.trim() || newAccount.balance === '') {
      showToast('Please fill out all fields.', 'error');
      return;
    }
    try {
      setSubmitLoading(true);
      const res = await axios.post('/linked-accounts', newAccount);
      if (res.data.status === 'success') {
        setLinkedAccounts([...linkedAccounts, res.data.account]);
        setShowAddAccountModal(false);
        setNewAccount({ accountType: 'bank', institutionName: '', accountNumber: '', balance: '', currency: 'INR' });
        showToast('Account connected successfully.');
      }
    } catch (err) {
      showToast('Failed to connect financial account.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Remove Account
  const handleRemoveAccount = async (id) => {
    if (!window.confirm('Are you sure you want to unlink this account?')) return;
    try {
      const res = await axios.delete(`/linked-accounts/${id}`);
      if (res.data.status === 'success') {
        setLinkedAccounts(linkedAccounts.filter(a => a._id !== id));
        showToast('Account disconnected.');
      }
    } catch (err) {
      showToast('Failed to disconnect account.', 'error');
    }
  };

  // Refresh Linked Accounts
  const handleRefreshAccounts = async () => {
    try {
      setAccountsLoading(true);
      const res = await axios.post('/linked-accounts/refresh');
      if (res.data.status === 'success') {
        setLinkedAccounts(res.data.accounts);
        showToast('Accounts refreshed successfully.');
      }
    } catch (err) {
      showToast('Refresh failed.', 'error');
    } finally {
      setAccountsLoading(false);
    }
  };

  // Privacy: Sharing consent toggle
  const handleSharingConsent = async (val) => {
    try {
      setDataConsent(val);
      const res = await axios.put('/privacy/sharing-consent', { consent: val });
      if (res.data.status === 'success') {
        showToast(`Data sharing ${val ? 'enabled' : 'disabled'}.`);
      }
    } catch (err) {
      showToast('Failed to change consent settings.', 'error');
    }
  };

  // Download personal JSON
  const handleDownloadPersonalData = async () => {
    try {
      const res = await axios.post('/privacy/download-data', {}, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `FinPilot_UserData_${user._id}.json`;
      link.click();
      showToast('Personal data exported.');
    } catch (err) {
      showToast('Export failed.', 'error');
    }
  };

  // Clear statements
  const handleDeleteStatements = async () => {
    if (!window.confirm('CRITICAL: This will permanently delete all your uploaded statements and normalized transaction ledger records. This cannot be undone. Proceed?')) return;
    try {
      setSubmitLoading(true);
      const res = await axios.post('/privacy/delete-statements');
      if (res.data.status === 'success') {
        showToast('Statement databases cleared.');
      }
    } catch (err) {
      showToast('Failed to clear statements.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Delete user account
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('DANGER: This will permanently delete your account and all associated personal and financial records. This cannot be undone. Are you absolutely sure?');
    if (!confirmed) return;
    const doubleConfirmed = window.prompt('Type DELETE to permanently erase your profile and records:');
    if (doubleConfirmed !== 'DELETE') {
      showToast('Account deletion cancelled.', 'error');
      return;
    }

    try {
      setSubmitLoading(true);
      const res = await axios.delete('/account');
      if (res.data.status === 'success') {
        alert('Your account has been deleted successfully.');
        logout();
      }
    } catch (err) {
      showToast('Failed to delete account.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Upgrade Plan
  const handleUpgradeToPremium = async () => {
    try {
      setSubmitLoading(true);
      const isPremiumNow = await togglePremium();
      showToast(isPremiumNow ? 'Welcome to Premium Membership!' : 'Membership status altered.');
      fetchSettingsProfile();
    } catch (err) {
      showToast('Upgrade failed.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Settings report download
  const handleReportDownload = async (e) => {
    e.preventDefault();
    try {
      setSubmitLoading(true);
      const res = await axios.post('/settings/reports', {
        reportType,
        format: reportFormat
      }, { responseType: 'blob' });

      const typeMap = {
        PDF: 'application/pdf',
        CSV: 'text/csv'
      };

      const blob = new Blob([res.data], { type: typeMap[reportFormat] });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `FinPilot_${reportType}_Report_${new Date().toISOString().split('T')[0]}.${reportFormat.toLowerCase()}`;
      link.click();
      showToast(`${reportType} report download started.`);
    } catch (err) {
      console.error(err);
      showToast('Failed to compile report.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div style={styles.loaderContainer}>
        <Loader className="animate-spin" size={40} color="#6366f1" />
        <span style={{ marginTop: '16px', color: '#94a3b8' }}>Loading settings...</span>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {toast && (
        <div style={{
          ...styles.toast,
          background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          border: toast.type === 'success' ? '1px solid #10b981' : '1px solid #ef4444'
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div style={styles.header}>
        <h1 style={styles.title}>Account Settings</h1>
        <p style={styles.subtitle}>Configure preferences, linked banking databases, privacy consents, and profile indicators.</p>
      </div>

      <div style={styles.container}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.completionCard}>
            <div style={styles.completionRow}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>Profile Completion</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#6366f1' }}>{profileCompletion}%</span>
            </div>
            <div style={styles.progressBarBg}>
              <div style={{ ...styles.progressBarFill, width: `${profileCompletion}%` }}></div>
            </div>
          </div>

          <nav style={styles.navMenu}>
            {[
              { id: 'profile', label: 'Profile', icon: UserIcon },
              { id: 'financial', label: 'Financial Profile', icon: Wallet },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'premium', label: 'Premium Membership', icon: Award },
              { id: 'linked', label: 'Linked Accounts', icon: Landmark },
              { id: 'privacy', label: 'Privacy', icon: Lock },
              { id: 'reports', label: 'Data & Reports', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    ...styles.navBtn,
                    background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                    borderLeft: isSelected ? '3px solid #6366f1' : '3px solid transparent',
                    color: isSelected ? '#ffffff' : '#94a3b8',
                    fontWeight: isSelected ? 700 : 500
                  }}
                >
                  <Icon size={18} style={{ opacity: isSelected ? 1 : 0.7 }} />
                  <span>{tab.label}</span>
                  {isSelected && <ChevronRight size={14} style={styles.chevron} />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Pane */}
        <main className="glass-card animate-fade-in" style={styles.contentPane}>
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit}>
              <h2 style={styles.sectionHeader}>Profile Details</h2>
              <p style={styles.sectionSubtitle}>View, update, and manage your personal biological and occupational parameters.</p>
              
              <div style={styles.profileImageSection}>
                <div style={styles.avatarWrapper}>
                  {user?.profileImage ? (
                    <img 
                      src={user.profileImage.startsWith('http') ? user.profileImage : axios.defaults.baseURL + user.profileImage} 
                      alt={user.name} 
                      style={styles.avatarImg} 
                    />
                  ) : (
                    <div style={styles.avatarFallback}>
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <button type="button" onClick={handleImageUploadClick} style={styles.cameraBtn} title="Upload Profile Picture">
                    <Camera size={14} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                    style={{ display: 'none' }} 
                    accept="image/*" 
                  />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', color: '#ffffff' }}>Profile Picture</h4>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>PNG, JPG or GIF. Max 2MB.</p>
                </div>
              </div>

              <div style={styles.grid}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div style={styles.inputWrapper}>
                    <UserIcon size={16} style={styles.inputIcon} />
                    <input 
                      type="text" 
                      className="form-input" 
                      style={styles.inputWithIcon}
                      value={profileData.name} 
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} 
                      placeholder="Dhruv Patel"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div style={styles.inputWrapper}>
                    <Mail size={16} style={styles.inputIcon} />
                    <input 
                      type="email" 
                      className="form-input" 
                      style={{ ...styles.inputWithIcon, opacity: 0.6, cursor: 'not-allowed' }}
                      value={profileData.email} 
                      disabled
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <div style={styles.inputWrapper}>
                    <Phone size={16} style={styles.inputIcon} />
                    <input 
                      type="tel" 
                      className="form-input" 
                      style={styles.inputWithIcon}
                      value={profileData.phone} 
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} 
                      placeholder="+91 9988776655"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <div style={styles.inputWrapper}>
                    <Calendar size={16} style={styles.inputIcon} />
                    <input 
                      type="date" 
                      className="form-input" 
                      style={styles.inputWithIcon}
                      value={profileData.dob} 
                      onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select 
                    className="form-select"
                    value={profileData.gender} 
                    onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer Not to Say">Prefer Not to Say</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Occupation</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={profileData.occupation} 
                    onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })} 
                    placeholder="Software Engineer"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">Street Address</label>
                <div style={styles.inputWrapper}>
                  <MapPin size={16} style={styles.inputIcon} />
                  <input 
                    type="text" 
                    className="form-input" 
                    style={styles.inputWithIcon}
                    value={profileData.address} 
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })} 
                    placeholder="123 Financial Hub, Tech Park"
                  />
                </div>
              </div>

              <div style={styles.grid}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={profileData.city} 
                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })} 
                    placeholder="Mumbai"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">State</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={profileData.state} 
                    onChange={(e) => setProfileData({ ...profileData, state: e.target.value })} 
                    placeholder="Maharashtra"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={profileData.country} 
                    onChange={(e) => setProfileData({ ...profileData, country: e.target.value })} 
                    placeholder="India"
                  />
                </div>
              </div>

              <button type="submit" disabled={submitLoading} className="btn btn-primary" style={styles.submitBtn}>
                {submitLoading ? <Loader className="animate-spin" size={16} /> : <Check size={16} />}
                <span>Save Profile Changes</span>
              </button>
            </form>
          )}

          {/* FINANCIAL PROFILE TAB */}
          {activeTab === 'financial' && (
            <form onSubmit={handleFinancialSubmit}>
              <h2 style={styles.sectionHeader}>Financial Configuration</h2>
              <p style={styles.sectionSubtitle}>Define income, expenses, risk parameters, and objectives. AI suggestions dynamically recalibrate.</p>
              
              <div style={styles.grid}>
                <div className="form-group">
                  <label className="form-label">Monthly Income (₹)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={financialData.monthlyIncome} 
                    onChange={(e) => setFinancialData({ ...financialData, monthlyIncome: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Monthly Expenses (₹)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={financialData.monthlyExpenses} 
                    onChange={(e) => setFinancialData({ ...financialData, monthlyExpenses: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Savings Valuation (₹)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={financialData.savings} 
                    onChange={(e) => setFinancialData({ ...financialData, savings: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Emergency Fund Buffer (₹)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={financialData.emergencyFund} 
                    onChange={(e) => setFinancialData({ ...financialData, emergencyFund: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Risk Profile Index</label>
                  <select 
                    className="form-select"
                    value={financialData.riskProfile}
                    onChange={(e) => setFinancialData({ ...financialData, riskProfile: e.target.value })}
                  >
                    <option value="Conservative">Conservative (Low Volatility)</option>
                    <option value="Moderate">Moderate (Balanced)</option>
                    <option value="Aggressive">Aggressive (High Yield / Stock intensive)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Investment Experience</label>
                  <select 
                    className="form-select"
                    value={financialData.investmentExperience}
                    onChange={(e) => setFinancialData({ ...financialData, investmentExperience: e.target.value })}
                  >
                    <option value="Beginner">Beginner / Novice</option>
                    <option value="Intermediate">Intermediate / Confident</option>
                    <option value="Expert">Expert / Asset Manager</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Retirement Target Age</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={financialData.retirementAge} 
                    onChange={(e) => setFinancialData({ ...financialData, retirementAge: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Family Dependents Count</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={financialData.dependents} 
                    onChange={(e) => setFinancialData({ ...financialData, dependents: e.target.value })} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Primary Financial Objective</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={financialData.investmentGoal} 
                  onChange={(e) => setFinancialData({ ...financialData, investmentGoal: e.target.value })} 
                  placeholder="Buy a home in 5 years, Retirement corpus of 5 Crore"
                />
              </div>

              <button type="submit" disabled={submitLoading} className="btn btn-primary" style={styles.submitBtn}>
                {submitLoading ? <Loader className="animate-spin" size={16} /> : <Check size={16} />}
                <span>Recalculate AI Portfolio & Save</span>
              </button>
            </form>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div>
              <h2 style={styles.sectionHeader}>Security Settings</h2>
              <p style={styles.sectionSubtitle}>Manage account passwords, toggle two-factor authentication, and monitor login activity.</p>
              
              <form onSubmit={handleSecuritySubmit} style={{ marginBottom: '32px' }}>
                <h3 style={styles.subHeading}>Change Account Password</h3>
                
                <div style={styles.grid}>
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      value={securityData.oldPassword} 
                      onChange={(e) => setSecurityData({ ...securityData, oldPassword: e.target.value })} 
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      value={securityData.newPassword} 
                      onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })} 
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      value={securityData.confirmPassword} 
                      onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })} 
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button type="submit" disabled={submitLoading} className="btn btn-primary" style={styles.submitBtn}>
                  {submitLoading ? <Loader className="animate-spin" size={16} /> : <Check size={16} />}
                  <span>Change Password</span>
                </button>
              </form>

              <hr style={styles.divider} />

              <div style={{ marginBottom: '32px' }}>
                <h3 style={styles.subHeading}>Simulated Security Enhancements</h3>
                <div style={styles.securityRow}>
                  <div>
                    <h4 style={{ fontSize: '14px', color: '#ffffff' }}>Two-Factor Authentication (2FA)</h4>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Secure logins with one-time verification codes sent to mobile.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setSecurityData({ ...securityData, enable2FA: !securityData.enable2FA });
                      showToast(`Two-Factor Authentication ${!securityData.enable2FA ? 'enabled' : 'disabled'}!`);
                    }}
                    style={{
                      ...styles.toggleBtn,
                      background: securityData.enable2FA ? '#10b981' : '#475569'
                    }}
                  >
                    <div style={{
                      ...styles.toggleDot,
                      transform: securityData.enable2FA ? 'translateX(18px)' : 'translateX(0px)'
                    }} />
                  </button>
                </div>
              </div>

              <hr style={styles.divider} />

              <div>
                <h3 style={styles.subHeading}>Active Login Sessions & Devices</h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>Manage current device sessions linked to your financial context.</p>
                
                <div style={styles.deviceList}>
                  <div style={styles.deviceItem}>
                    <Laptop size={20} color="#6366f1" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Vite React Browser Client (Current)</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>IP: 192.168.1.100 • Mumbai, India</div>
                    </div>
                    <span style={styles.activeBadge}>Active</span>
                  </div>

                  <div style={styles.deviceItem}>
                    <Smartphone size={20} color="#cbd5e1" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>iPhone 15 Mobile Coach App</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>IP: 103.220.44.15 • Mumbai, India</div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>2 hours ago</span>
                  </div>
                </div>

                <button 
                  onClick={() => showToast('Logged out from all alternate devices.')} 
                  className="btn btn-outline" 
                  style={{ marginTop: '16px', gap: '8px', fontSize: '13px', padding: '8px 16px' }}
                >
                  <LogOut size={14} />
                  <span>Logout From All Devices</span>
                </button>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleNotificationsSubmit}>
              <h2 style={styles.sectionHeader}>Notification Toggles</h2>
              <p style={styles.sectionSubtitle}>Turn on or off notifications across advisory and analysis modules.</p>
              
              <div style={styles.settingsList}>
                {[
                  { key: 'investmentAlerts', title: 'Investment Alerts', desc: 'Market rebalancing alerts and index entry notifications.' },
                  { key: 'billReminders', title: 'Bill Reminders', desc: 'Monthly subscription scans and scheduled bill reminder logs.' },
                  { key: 'subscriptionRenewal', title: 'Subscription Renewal Alerts', desc: 'Advance warnings regarding recurring auto-debit payments.' },
                  { key: 'goalAchievement', title: 'Goal Achievement Notifications', desc: 'Progress milestones reached within savings target timelines.' },
                  { key: 'marketNews', title: 'Market News & Indices', desc: 'Bi-weekly SEBI updates and market trend insights.' },
                  { key: 'aiRecommendation', title: 'AI Recommendation Alerts', desc: 'Diagnosis checks prompting profile updates or advisory insights.' }
                ].map((item) => (
                  <div key={item.key} style={styles.settingToggleItem}>
                    <div style={{ flex: 1, paddingRight: '16px' }}>
                      <h4 style={{ fontSize: '14px', color: '#ffffff', fontWeight: 600 }}>{item.title}</h4>
                      <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.4 }}>{item.desc}</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setNotificationsData({ ...notificationsData, [item.key]: !notificationsData[item.key] })}
                      style={{
                        ...styles.toggleBtn,
                        background: notificationsData[item.key] ? '#6366f1' : '#475569'
                      }}
                    >
                      <div style={{
                        ...styles.toggleDot,
                        transform: notificationsData[item.key] ? 'translateX(18px)' : 'translateX(0px)'
                      }} />
                    </button>
                  </div>
                ))}
              </div>

              <button type="submit" disabled={submitLoading} className="btn btn-primary" style={styles.submitBtn}>
                {submitLoading ? <Loader className="animate-spin" size={16} /> : <Check size={16} />}
                <span>Save Notification Preferences</span>
              </button>
            </form>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === 'preferences' && (
            <form onSubmit={handlePreferencesSubmit}>
              <h2 style={styles.sectionHeader}>Preferences</h2>
              <p style={styles.sectionSubtitle}>Customize localization parameters, default dashboard layouts, and system appearance.</p>
              
              <div style={styles.grid}>
                <div className="form-group">
                  <label className="form-label">Preferred Theme</label>
                  <select 
                    className="form-select"
                    value={preferencesData.theme}
                    onChange={(e) => setPreferencesData({ ...preferencesData, theme: e.target.value })}
                  >
                    <option value="dark">Dark Theme (Neon / Glassmorphism)</option>
                    <option value="light">Light Theme (Minimalist Clean)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Base Currency</label>
                  <select 
                    className="form-select"
                    value={preferencesData.currency}
                    onChange={(e) => setPreferencesData({ ...preferencesData, currency: e.target.value })}
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Primary Language</label>
                  <select 
                    className="form-select"
                    value={preferencesData.language}
                    onChange={(e) => setPreferencesData({ ...preferencesData, language: e.target.value })}
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Dashboard View Layout</label>
                  <select 
                    className="form-select"
                    value={preferencesData.dashboardLayout}
                    onChange={(e) => setPreferencesData({ ...preferencesData, dashboardLayout: e.target.value })}
                  >
                    <option value="grid">Grid (Compact Widgets)</option>
                    <option value="list">List (Linear Rows)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Default Landing Page</label>
                  <select 
                    className="form-select"
                    value={preferencesData.defaultLandingPage}
                    onChange={(e) => setPreferencesData({ ...preferencesData, defaultLandingPage: e.target.value })}
                  >
                    <option value="dashboard">Financial Dashboard</option>
                    <option value="premium-hub">Premium Advisory Hub</option>
                    <option value="statements">Statement Upload Hub</option>
                    <option value="assistant">AI Conversational Coach</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={submitLoading} className="btn btn-primary" style={styles.submitBtn}>
                {submitLoading ? <Loader className="animate-spin" size={16} /> : <Check size={16} />}
                <span>Save Localization Settings</span>
              </button>
            </form>
          )}

          {/* PREMIUM MEMBERSHIP TAB */}
          {activeTab === 'premium' && (
            <div>
              <h2 style={styles.sectionHeader}>Premium Membership</h2>
              <p style={styles.sectionSubtitle}>View subscription tiers, manage renewal cycles, and toggle feature packages.</p>
              
              <div style={{
                ...styles.premiumStatusCard,
                background: user?.isPremium 
                  ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(202, 138, 4, 0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                border: user?.isPremium ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{
                      ...styles.badge,
                      background: user?.isPremium ? 'rgba(234, 179, 8, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                      color: user?.isPremium ? '#fef08a' : '#94a3b8'
                    }}>
                      {user?.isPremium ? 'PRO MEMBER' : 'FREE TIER'}
                    </span>
                    <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginTop: '12px' }}>
                      {user?.isPremium ? 'FinPilot Premium Suite' : 'FinPilot Basic'}
                    </h3>
                  </div>
                  <Award size={40} color={user?.isPremium ? '#eab308' : '#94a3b8'} />
                </div>
                
                <div style={{ marginTop: '24px' }}>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>Status</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', marginTop: '2px' }}>
                    {user?.isPremium ? 'Active (Rolling Monthly Renewal)' : 'Free tier (Upgradable anytime)'}
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>Renewal Date</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', marginTop: '2px' }}>
                    {user?.isPremium 
                      ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString() 
                      : 'N/A'}
                  </div>
                </div>

                <button 
                  onClick={handleUpgradeToPremium} 
                  disabled={submitLoading}
                  style={{
                    ...styles.upgradeButton,
                    background: user?.isPremium ? 'transparent' : 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                    border: user?.isPremium ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
                    color: user?.isPremium ? '#cbd5e1' : '#000000'
                  }}
                >
                  {user?.isPremium ? 'Downgrade to Free (Testing)' : 'Upgrade to Premium (Instant Access)'}
                </button>
              </div>

              <div style={{ marginTop: '28px' }}>
                <h4 style={{ fontSize: '15px', color: '#ffffff', fontWeight: 700, marginBottom: '16px' }}>Premium Benefits Checklist:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {[
                    'Tax Regime Optimization Advisor',
                    'Annuity Loan borrowing limits',
                    'Insurance Deficit Gap Index',
                    'What-If Milestone simulator',
                    'Interactive Portfolio Risk Rebalancing',
                    'Full PDF/CSV Ledger report downloads',
                    'Real-time SEBI Market suggestions',
                    'Interactive AI Coach chatbot'
                  ].map((benefit, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                      <CheckCircle2 size={16} color="#10b981" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LINKED ACCOUNTS TAB */}
          {activeTab === 'linked' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <h2 style={styles.sectionHeader}>Linked Accounts</h2>
                  <p style={styles.sectionSubtitle}>View connected banking ledgers and investment profiles.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleRefreshAccounts} disabled={accountsLoading} style={styles.refreshBtn} title="Refresh Feeds">
                    <RefreshCw size={14} className={accountsLoading ? 'animate-spin' : ''} />
                    <span>Sync</span>
                  </button>
                  <button onClick={() => setShowAddAccountModal(true)} style={styles.addAccountBtn}>
                    <Plus size={14} />
                    <span>Link</span>
                  </button>
                </div>
              </div>

              {accountsLoading && linkedAccounts.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  <Loader className="animate-spin" size={24} color="#6366f1" />
                  <p style={{ marginTop: '12px' }}>Syncing connected ledgers...</p>
                </div>
              ) : linkedAccounts.length === 0 ? (
                <div style={styles.emptyAccountsCard}>
                  <Landmark size={48} color="#64748b" />
                  <h3 style={{ fontSize: '16px', color: '#ffffff', marginTop: '16px' }}>No Linked Accounts</h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px', maxWidth: '300px' }}>
                    Connect bank, investment or insurance accounts to import balances dynamically.
                  </p>
                  <button onClick={() => setShowAddAccountModal(true)} className="btn btn-primary" style={{ marginTop: '16px', fontSize: '13px', padding: '8px 16px' }}>
                    <Plus size={14} />
                    <span>Link Your First Account</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {['bank', 'investment', 'insurance'].map((type) => {
                    const typeAccounts = linkedAccounts.filter(a => a.accountType === type);
                    if (typeAccounts.length === 0) return null;
                    return (
                      <div key={type}>
                        <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.05em' }}>
                          {type === 'bank' ? 'Bank Accounts' : type === 'investment' ? 'Investments / Portfolios' : 'Insurance Policies'}
                        </h4>
                        <div style={styles.accountsGrid}>
                          {typeAccounts.map((account) => (
                            <div key={account._id} style={styles.accountCard}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <h5 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>{account.institutionName}</h5>
                                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Num: {account.accountNumber}</p>
                                </div>
                                <button onClick={() => handleRemoveAccount(account._id)} style={styles.unlinkBtn} title="Unlink Account">
                                  <Trash size={14} />
                                </button>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                <span style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }}>
                                  {account.currency === 'INR' ? '₹' : '$'}{account.balance.toLocaleString()}
                                </span>
                                <span style={{ fontSize: '10px', color: '#64748b' }}>
                                  Refreshed: {new Date(account.lastRefreshed).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PRIVACY TAB */}
          {activeTab === 'privacy' && (
            <div>
              <h2 style={styles.sectionHeader}>Privacy & Consent Settings</h2>
              <p style={styles.sectionSubtitle}>Manage data sharing consents, download a personal ledger dump, or delete statements.</p>
              
              <div style={{ marginBottom: '32px' }}>
                <h3 style={styles.subHeading}>Consent Preferences</h3>
                <div style={styles.settingToggleItem}>
                  <div style={{ flex: 1, paddingRight: '16px' }}>
                    <h4 style={{ fontSize: '14px', color: '#ffffff', fontWeight: 600 }}>Enable AI Data Analysis Sharing</h4>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.4 }}>
                      Allow FinPilot to process uploaded transaction statements anonymously to improve classification.
                    </p>
                  </div>
                  <button 
                    onClick={() => handleSharingConsent(!dataConsent)}
                    style={{
                      ...styles.toggleBtn,
                      background: dataConsent ? '#6366f1' : '#475569'
                    }}
                  >
                    <div style={{
                      ...styles.toggleDot,
                      transform: dataConsent ? 'translateX(18px)' : 'translateX(0px)'
                    }} />
                  </button>
                </div>
              </div>

              <hr style={styles.divider} />

              <div style={{ marginBottom: '32px' }}>
                <h3 style={styles.subHeading}>Download Personal Data</h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
                  In compliance with privacy policies, export a full JSON dump of your profile details, portfolios, goals, and transaction ledgers.
                </p>
                <button onClick={handleDownloadPersonalData} className="btn btn-outline" style={{ gap: '8px', fontSize: '13px', padding: '8px 16px' }}>
                  <Download size={14} />
                  <span>Download Personal Data (JSON)</span>
                </button>
              </div>

              <hr style={styles.divider} />

              <div style={{ marginBottom: '32px' }}>
                <h3 style={styles.subHeading}>Reset Upload Data</h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
                  Wipe out all uploaded bank statements, transaction databases, and EMI schedules. Profile parameters remain.
                </p>
                <button onClick={handleDeleteStatements} disabled={submitLoading} className="btn btn-danger" style={{ gap: '8px', fontSize: '13px', padding: '8px 16px' }}>
                  <Trash size={14} />
                  <span>Clear Uploaded Statements</span>
                </button>
              </div>

              <hr style={styles.divider} />

              <div>
                <h3 style={{ ...styles.subHeading, color: '#f87171' }}>Permanently Delete Account</h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
                  Permanently erase your login credentials and all data from our servers. This cannot be undone.
                </p>
                <button onClick={handleDeleteAccount} className="btn btn-danger" style={{ gap: '8px', fontSize: '13px', padding: '8px 16px', background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' }}>
                  <AlertTriangle size={14} />
                  <span>Delete My Account</span>
                </button>
              </div>
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
            <form onSubmit={handleReportDownload}>
              <h2 style={styles.sectionHeader}>Compile Advisory Reports</h2>
              <p style={styles.sectionSubtitle}>Download structured CSV files or PDF brochures covering your assets, risk metrics, and tax regimes.</p>
              
              <div style={styles.grid}>
                <div className="form-group">
                  <label className="form-label">Report Category</label>
                  <select 
                    className="form-select"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <option value="Expense">Expense & Category Outflows</option>
                    <option value="Investment">Investment Portfolio Allocation</option>
                    <option value="Insurance">Insurance Coverage Gap Audit</option>
                    <option value="Tax">Tax Optimization (Old vs New Regime)</option>
                    <option value="Health">Financial Health Index Diagnostic</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Format Style</label>
                  <select 
                    className="form-select"
                    value={reportFormat}
                    onChange={(e) => setReportFormat(e.target.value)}
                  >
                    <option value="PDF">PDF Brochure Document</option>
                    <option value="CSV">CSV Spreadsheet File</option>
                  </select>
                </div>
              </div>

              <div style={styles.reportIncludesCard}>
                <h4 style={{ fontSize: '14px', color: '#ffffff', fontWeight: 700, marginBottom: '10px' }}>What this report compiles:</h4>
                <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {reportType === 'Expense' && 'A categorization index mapping transactions, detailing total inflow/outflow metrics, and calculating savings rates.'}
                  {reportType === 'Investment' && 'Portfolio holdings breakdown, asset allocations ratios, and risk-indexed suggestions for rebalancing.'}
                  {reportType === 'Insurance' && 'Coverage gaps calculations, recommended policies list, and dependents-based protection buffer diagnostics.'}
                  {reportType === 'Tax' && 'Gross annual tax liabilities comparisons, deductions (80C, 80D) utilization audits, and optimal regime switch advice.'}
                  {reportType === 'Health' && 'Financial health scores diagnostics, safety margins analysis, and priority budgets action items checklist.'}
                </p>
              </div>

              <button type="submit" disabled={submitLoading} className="btn btn-primary" style={styles.submitBtn}>
                {submitLoading ? <Loader className="animate-spin" size={16} /> : <Download size={16} />}
                <span>Generate & Download Report</span>
              </button>
            </form>
          )}
        </main>
      </div>

      {/* Linked Account Modal */}
      {showAddAccountModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-fade-in" style={styles.modal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>Link Financial Account</h3>
              <button onClick={() => setShowAddAccountModal(false)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAccount}>
              <div className="form-group">
                <label className="form-label">Account Category</label>
                <select 
                  className="form-select"
                  value={newAccount.accountType}
                  onChange={(e) => setNewAccount({ ...newAccount, accountType: e.target.value })}
                >
                  <option value="bank">Bank / Checking Account</option>
                  <option value="investment">Investments (Stocks / Mutual Funds / FD)</option>
                  <option value="insurance">Insurance Policy</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Institution / Provider Name</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. SBI, HDFC, LIC, Zerodha"
                  value={newAccount.institutionName}
                  onChange={(e) => setNewAccount({ ...newAccount, institutionName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account / Policy Number</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. 100022998877"
                  value={newAccount.accountNumber}
                  onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Current Balance / Valuation</label>
                <input 
                  type="number" 
                  className="form-input"
                  placeholder="e.g. 50000"
                  value={newAccount.balance}
                  onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Base Currency</label>
                <select 
                  className="form-select"
                  value={newAccount.currency}
                  onChange={(e) => setNewAccount({ ...newAccount, currency: e.target.value })}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <button type="submit" disabled={submitLoading} className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                {submitLoading ? <Loader className="animate-spin" size={16} /> : <Check size={16} />}
                <span>Link Financial Feed</span>
              </button>
            </form>
          </div>
        </div>
      )}
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
    position: 'relative'
  },
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#030712'
  },
  toast: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    zIndex: 9999,
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
    animation: 'fadeIn 0.3s ease forwards'
  },
  header: {
    maxWidth: '1200px',
    margin: '0 auto 32px auto'
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#ffffff'
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: '14px',
    marginTop: '6px'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: '32px',
    alignItems: 'start'
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  completionCard: {
    background: 'rgba(17, 24, 39, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '20px'
  },
  completionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
    borderRadius: '3px',
    transition: 'width 0.4s ease'
  },
  navMenu: {
    background: 'rgba(17, 24, 39, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 20px',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    position: 'relative'
  },
  chevron: {
    position: 'absolute',
    right: '20px'
  },
  contentPane: {
    padding: '36px',
    minHeight: '500px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)'
  },
  sectionHeader: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#ffffff'
  },
  sectionSubtitle: {
    fontSize: '13px',
    color: '#94a3b8',
    marginTop: '6px',
    marginBottom: '28px'
  },
  profileImageSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '28px'
  },
  avatarWrapper: {
    position: 'relative',
    width: '72px',
    height: '72px'
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(99, 102, 241, 0.5)'
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid rgba(255, 255, 255, 0.1)'
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    background: '#6366f1',
    border: 'none',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    transition: 'background-color 0.2s'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: '#64748b',
    pointerEvents: 'none'
  },
  inputWithIcon: {
    paddingLeft: '44px',
    width: '100%'
  },
  submitBtn: {
    marginTop: '24px',
    width: 'fit-content',
    gap: '8px',
    fontSize: '14px',
    padding: '12px 24px'
  },
  divider: {
    border: 'none',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    margin: '24px 0'
  },
  subHeading: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '16px'
  },
  securityRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '16px 20px'
  },
  toggleBtn: {
    width: '42px',
    height: '24px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    padding: '3px',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.2s ease'
  },
  toggleDot: {
    width: '18px',
    height: '18px',
    background: '#ffffff',
    borderRadius: '50%',
    boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
    transition: 'transform 0.2s ease'
  },
  deviceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  deviceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '14px 20px'
  },
  activeBadge: {
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#10b981',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '6px'
  },
  settingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  settingToggleItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '16px 20px'
  },
  premiumStatusCard: {
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)'
  },
  badge: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    padding: '4px 8px',
    borderRadius: '6px'
  },
  upgradeButton: {
    marginTop: '28px',
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#cbd5e1',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600
  },
  addAccountBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    border: 'none',
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 700
  },
  emptyAccountsCard: {
    background: 'rgba(17, 24, 39, 0.3)',
    border: '1px dashed rgba(255, 255, 255, 0.15)',
    borderRadius: '16px',
    padding: '48px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  accountsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '20px'
  },
  accountCard: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '20px'
  },
  unlinkBtn: {
    background: 'transparent',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    opacity: 0.6,
    transition: 'opacity 0.2s',
    padding: '4px'
  },
  refreshAccountBtn: {
    background: 'transparent',
    border: 'none',
    color: '#3b82f6',
    cursor: 'pointer',
    padding: '4px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(3, 7, 18, 0.85)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: '24px'
  },
  modal: {
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.08)'
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer'
  },
  reportIncludesCard: {
    background: 'rgba(99, 102, 241, 0.04)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    borderRadius: '12px',
    padding: '16px',
    margin: '16px 0 24px 0'
  }
};

export default Settings;
