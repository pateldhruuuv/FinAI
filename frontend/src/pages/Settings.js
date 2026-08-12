import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const Settings = () => {
  const { user, setUser, token, logout, togglePremium, t } = useContext(AuthContext);
  
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
    try {
      setSubmitLoading(true);
      const res = await axios.put('/financial-profile', financialData);
      if (res.data.status === 'success') {
        setUser(res.data.user);
        showToast('Financial parameters synced successfully!');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to sync financials.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      showToast('New passwords do not match!', 'error');
      return;
    }
    try {
      setSubmitLoading(true);
      const res = await axios.put('/auth/password', {
        oldPassword: securityData.oldPassword,
        newPassword: securityData.newPassword
      });
      if (res.data.status === 'success') {
        showToast('Password credentials updated successfully!');
        setSecurityData(prev => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' }));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update credentials.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    try {
      setSubmitLoading(true);
      const updatedStatus = !securityData.enable2FA;
      const res = await axios.post('/auth/toggle-2fa', { enable2FA: updatedStatus });
      if (res.data.status === 'success') {
        setSecurityData(prev => ({ ...prev, enable2FA: updatedStatus }));
        showToast(`Two-Factor Authentication ${updatedStatus ? 'activated' : 'deactivated'}.`);
      }
    } catch (err) {
      showToast('Failed to change 2FA status.', 'error');
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
        showToast('Alert preferences updated successfully!');
      }
    } catch (err) {
      showToast('Failed to update alert parameters.', 'error');
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
        showToast('Application preferences updated successfully!');
      }
    } catch (err) {
      showToast('Failed to update workspace preferences.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleLinkAccountSubmit = async (e) => {
    e.preventDefault();
    if (!newAccount.institutionName || !newAccount.accountNumber || !newAccount.balance) {
      alert('Please fill in all details.');
      return;
    }
    try {
      setSubmitLoading(true);
      const res = await axios.post('/linked-accounts', {
        ...newAccount,
        balance: Number(newAccount.balance)
      });
      if (res.data.status === 'success') {
        showToast('Financial ledger account linked successfully!');
        setShowAddAccountModal(false);
        setNewAccount({
          accountType: 'bank',
          institutionName: '',
          accountNumber: '',
          balance: '',
          currency: 'INR',
        });
        fetchLinkedAccountsList();
      }
    } catch (err) {
      showToast('Failed to link ledger account.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm('Are you sure you want to unlink this account?')) return;
    try {
      setSubmitLoading(true);
      const res = await axios.delete(`/linked-accounts/${id}`);
      if (res.data.status === 'success') {
        showToast('Account unlinked successfully!');
        fetchLinkedAccountsList();
      }
    } catch (err) {
      showToast('Failed to unlink account.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setSubmitLoading(true);
      const res = await axios.post('/settings/reports', { 
        reportType, 
        format: reportFormat 
      }, {
        responseType: 'blob'
      });
      
      const file = new Blob([res.data], { type: reportFormat === 'PDF' ? 'application/pdf' : 'text/csv' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `Finmate_${reportType}_Report.${reportFormat.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Report generated and downloaded successfully!');
    } catch (err) {
      showToast('Failed to generate file download.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleConsent = async () => {
    try {
      setSubmitLoading(true);
      const nextConsent = !dataConsent;
      const res = await axios.put('/privacy/sharing-consent', { consent: nextConsent });
      if (res.data.status === 'success') {
        setDataConsent(nextConsent);
        showToast('Data sharing parameters updated.');
      }
    } catch (err) {
      showToast('Failed to update consent policies.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDownloadData = async () => {
    try {
      setSubmitLoading(true);
      const res = await axios.post('/privacy/download-data', {}, { responseType: 'blob' });
      
      const file = new Blob([res.data], { type: 'application/json' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `Finmate_PersonalData_Ledger.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Personal data ledger exported successfully!');
    } catch (err) {
      showToast('Failed to export personal data.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleClearStatements = async () => {
    if (!window.confirm("Are you sure you want to permanently clear all normalized transaction records? This action is irreversible.")) {
      return;
    }
    try {
      setSubmitLoading(true);
      const res = await axios.post('/privacy/delete-statements');
      if (res.data.status === 'success') {
        showToast('All transaction ledger history cleared.');
      }
    } catch (err) {
      showToast('Failed to clear transaction records.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteUserAccount = async () => {
    if (!window.confirm("CRITICAL WARNING: Are you sure you want to permanently delete your account and all associated financial records? This action is irreversible.")) {
      return;
    }
    try {
      setSubmitLoading(true);
      const res = await axios.delete('/account');
      if (res.data.status === 'success') {
        showToast('Your account was successfully deleted.');
        logout();
      }
    } catch (err) {
      showToast('Failed to delete account.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] md:pl-20 mt-16 text-on-surface font-sans">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary-container mb-4">refresh</span>
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Decrypting telemetry cockpit...</h2>
      </div>
    );
  }

  return (
    <div className="md:pl-20 mt-16 px-6 md:px-8 pt-10 md:pt-14 pb-6 md:pb-8 min-h-screen bg-background text-on-background font-sans max-w-6xl mx-auto">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-xl border shadow-xl flex items-center gap-3 animate-fade-in font-serif text-sm ${
          toast.type === 'error' ? 'bg-error-container/20 border-error/30 text-error' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          <span className="material-symbols-outlined">{toast.type === 'error' ? 'report_problem' : 'check_circle'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8 border-b border-outline-variant pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display-hero text-3xl font-bold tracking-tight text-on-surface">Account Settings</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage your boutique financial credentials and preferences.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-on-surface-variant block">Profile Health</span>
            <strong className="text-sm font-serif text-primary-container">{profileCompletion}% Complete</strong>
          </div>
          <div className="w-24 bg-surface-container rounded-full h-2 overflow-hidden border border-outline-variant/30">
            <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${profileCompletion}%` }}></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Inner Sidebar Navigation */}
        <nav className="w-full lg:w-64 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 shrink-0 border-b lg:border-b-0 border-outline-variant/40">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-semibold text-xs whitespace-nowrap lg:w-full ${
              activeTab === 'profile' 
                ? 'bg-surface-container-high text-on-surface border-l-4 border-primary shadow-sm' 
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-lg">person</span> Profile
          </button>
          
          <button 
            onClick={() => setActiveTab('financial')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-semibold text-xs whitespace-nowrap lg:w-full ${
              activeTab === 'financial' 
                ? 'bg-surface-container-high text-on-surface border-l-4 border-primary shadow-sm' 
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-lg">account_balance</span> Financial Profile
          </button>

          <button 
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-semibold text-xs whitespace-nowrap lg:w-full ${
              activeTab === 'security' 
                ? 'bg-surface-container-high text-on-surface border-l-4 border-primary shadow-sm' 
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-lg">verified_user</span> Security
          </button>

          <button 
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-semibold text-xs whitespace-nowrap lg:w-full ${
              activeTab === 'notifications' 
                ? 'bg-surface-container-high text-on-surface border-l-4 border-primary shadow-sm' 
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-lg">notifications_active</span> Notifications
          </button>

          <button 
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-semibold text-xs whitespace-nowrap lg:w-full ${
              activeTab === 'reports' 
                ? 'bg-surface-container-high text-on-surface border-l-4 border-primary shadow-sm' 
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-lg">file_download</span> Reports & Data
          </button>
        </nav>

        {/* Content Area */}
        <div className="flex-1 w-full bg-surface-container-low rounded-2xl p-6 md:p-8 border border-outline-variant shadow-xl">
          
          {/* TAB 1: PROFILE INFO */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-fade-in font-serif">
              {/* Avatar upload */}
              <div>
                <h3 className="font-headline-sm text-headline-sm mb-6 text-on-surface">Profile Picture</h3>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative group">
                    {user.profileImage ? (
                      <img 
                        className="w-24 h-24 rounded-full object-cover border-4 border-surface-container-high shadow-xl" 
                        src={user.profileImage.startsWith('http') ? user.profileImage : axios.defaults.baseURL + user.profileImage} 
                        alt={user.name} 
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-4xl border-4 border-surface-container-high shadow-xl">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <button 
                      onClick={handleImageUploadClick} 
                      className="absolute bottom-0 right-0 p-2 bg-primary text-on-primary rounded-full border border-surface-container shadow hover:scale-105 transition-all cursor-pointer"
                      disabled={submitLoading}
                    >
                      <span className="material-symbols-outlined text-sm font-bold">edit</span>
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageChange} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </div>
                  <div className="text-left font-sans">
                    <div className="flex gap-2">
                      <button 
                        onClick={handleImageUploadClick} 
                        className="px-5 py-2 bg-primary-container text-on-primary-container rounded-full text-xs font-bold hover:bg-primary transition-colors cursor-pointer"
                        disabled={submitLoading}
                      >
                        Upload Photo
                      </button>
                    </div>
                    <p className="text-on-surface-variant text-[11px] mt-2">Recommended: JPG or PNG, size under 2MB.</p>
                  </div>
                </div>
              </div>

              {/* Personal Form */}
              <form onSubmit={handleProfileSubmit} className="border-t border-outline-variant/60 pt-8 space-y-6">
                <h3 className="font-headline-sm text-headline-sm mb-6 text-on-surface">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 font-sans">
                    <label className="text-xs font-semibold text-on-surface-variant block ml-1">Full Name</label>
                    <input 
                      type="text" 
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface focus:outline-none focus:border-primary transition-all" 
                      required
                    />
                  </div>
                  
                  <div className="space-y-1.5 font-sans">
                    <label className="text-xs font-semibold text-on-surface-variant block ml-1">Email Address</label>
                    <input 
                      type="email" 
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface focus:outline-none focus:border-primary transition-all opacity-85" 
                      disabled
                    />
                  </div>

                  <div className="space-y-1.5 font-sans">
                    <label className="text-xs font-semibold text-on-surface-variant block ml-1">Phone Number</label>
                    <input 
                      type="tel" 
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. +91 9876543210"
                      className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface focus:outline-none focus:border-primary transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5 font-sans">
                    <label className="text-xs font-semibold text-on-surface-variant block ml-1">Date of Birth</label>
                    <input 
                      type="date" 
                      value={profileData.dob}
                      onChange={(e) => setProfileData(prev => ({ ...prev, dob: e.target.value }))}
                      className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface focus:outline-none focus:border-primary transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5 font-sans">
                    <label className="text-xs font-semibold text-on-surface-variant block ml-1">Gender</label>
                    <div className="relative">
                      <select 
                        value={profileData.gender}
                        onChange={(e) => setProfileData(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface appearance-none focus:outline-none focus:border-primary transition-all"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-3.5 text-on-surface-variant pointer-events-none text-lg">expand_more</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 font-sans">
                    <label className="text-xs font-semibold text-on-surface-variant block ml-1">Occupation</label>
                    <input 
                      type="text" 
                      value={profileData.occupation}
                      onChange={(e) => setProfileData(prev => ({ ...prev, occupation: e.target.value }))}
                      placeholder="e.g. Engineer, Business Analyst"
                      className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface focus:outline-none focus:border-primary transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5 font-sans md:col-span-2">
                    <label className="text-xs font-semibold text-on-surface-variant block ml-1">Permanent Address</label>
                    <input 
                      type="text" 
                      value={profileData.address}
                      onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface focus:outline-none focus:border-primary transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5 font-sans">
                    <label className="text-xs font-semibold text-on-surface-variant block ml-1">City</label>
                    <input 
                      type="text" 
                      value={profileData.city}
                      onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface focus:outline-none focus:border-primary transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5 font-sans">
                    <label className="text-xs font-semibold text-on-surface-variant block ml-1">Country</label>
                    <input 
                      type="text" 
                      value={profileData.country}
                      onChange={(e) => setProfileData(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface focus:outline-none focus:border-primary transition-all" 
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-outline-variant/40 mt-8">
                  <button 
                    type="submit" 
                    className="px-8 py-3 bg-primary-container text-on-primary-container hover:bg-primary font-sans font-bold text-xs rounded-full shadow transition-all cursor-pointer"
                    disabled={submitLoading}
                  >
                    {submitLoading ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: FINANCIAL PROFILE */}
          {activeTab === 'financial' && (
            <form onSubmit={handleFinancialSubmit} className="space-y-6 animate-fade-in font-serif">
              <h3 className="font-headline-sm text-headline-sm mb-6 text-on-surface">Financial Parameters</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 font-sans">
                  <label className="text-xs font-semibold text-on-surface-variant block ml-1">Monthly Income (₹)</label>
                  <input 
                    type="number" 
                    value={financialData.monthlyIncome}
                    onChange={(e) => setFinancialData(prev => ({ ...prev, monthlyIncome: Number(e.target.value) }))}
                    className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface focus:outline-none focus:border-primary transition-all" 
                    required
                  />
                </div>

                <div className="space-y-1.5 font-sans">
                  <label className="text-xs font-semibold text-on-surface-variant block ml-1">Monthly Expenses (₹)</label>
                  <input 
                    type="number" 
                    value={financialData.monthlyExpenses}
                    onChange={(e) => setFinancialData(prev => ({ ...prev, monthlyExpenses: Number(e.target.value) }))}
                    className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface focus:outline-none focus:border-primary transition-all" 
                    required
                  />
                </div>

                <div className="space-y-1.5 font-sans">
                  <label className="text-xs font-semibold text-on-surface-variant block ml-1">Savings Buffer (₹)</label>
                  <input 
                    type="number" 
                    value={financialData.savings}
                    onChange={(e) => setFinancialData(prev => ({ ...prev, savings: Number(e.target.value) }))}
                    className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface focus:outline-none focus:border-primary transition-all" 
                    required
                  />
                </div>

                <div className="space-y-1.5 font-sans">
                  <label className="text-xs font-semibold text-on-surface-variant block ml-1">Emergency Fund Pool (₹)</label>
                  <input 
                    type="number" 
                    value={financialData.emergencyFund}
                    onChange={(e) => setFinancialData(prev => ({ ...prev, emergencyFund: Number(e.target.value) }))}
                    className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface focus:outline-none focus:border-primary transition-all" 
                  />
                </div>

                <div className="space-y-1.5 font-sans">
                  <label className="text-xs font-semibold text-on-surface-variant block ml-1">Risk Profile Appetite</label>
                  <div className="relative">
                    <select 
                      value={financialData.riskProfile}
                      onChange={(e) => setFinancialData(prev => ({ ...prev, riskProfile: e.target.value }))}
                      className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface appearance-none focus:outline-none focus:border-primary transition-all"
                    >
                      <option value="Conservative">Conservative</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Aggressive">Aggressive</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3.5 text-on-surface-variant pointer-events-none text-lg">expand_more</span>
                  </div>
                </div>

                <div className="space-y-1.5 font-sans">
                  <label className="text-xs font-semibold text-on-surface-variant block ml-1">Investment Experience</label>
                  <div className="relative">
                    <select 
                      value={financialData.investmentExperience}
                      onChange={(e) => setFinancialData(prev => ({ ...prev, investmentExperience: e.target.value }))}
                      className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface appearance-none focus:outline-none focus:border-primary transition-all"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3.5 text-on-surface-variant pointer-events-none text-lg">expand_more</span>
                  </div>
                </div>

                <div className="space-y-1.5 font-sans">
                  <label className="text-xs font-semibold text-on-surface-variant block ml-1">Target Retirement Age</label>
                  <input 
                    type="number" 
                    value={financialData.retirementAge}
                    onChange={(e) => setFinancialData(prev => ({ ...prev, retirementAge: Number(e.target.value) }))}
                    className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface focus:outline-none focus:border-primary transition-all" 
                  />
                </div>

                <div className="space-y-1.5 font-sans">
                  <label className="text-xs font-semibold text-on-surface-variant block ml-1">Dependents Count</label>
                  <input 
                    type="number" 
                    value={financialData.dependents}
                    onChange={(e) => setFinancialData(prev => ({ ...prev, dependents: Number(e.target.value) }))}
                    className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface focus:outline-none focus:border-primary transition-all" 
                  />
                </div>

                <div className="space-y-1.5 font-sans md:col-span-2">
                  <label className="text-xs font-semibold text-on-surface-variant block ml-1">Primary Wealth Goal Description</label>
                  <input 
                    type="text" 
                    value={financialData.investmentGoal}
                    onChange={(e) => setFinancialData(prev => ({ ...prev, investmentGoal: e.target.value }))}
                    placeholder="e.g. Build retirement corpus, finance high education, generate dividend income"
                    className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface focus:outline-none focus:border-primary transition-all" 
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-outline-variant/40 mt-8">
                <button 
                  type="submit" 
                  className="px-8 py-3 bg-primary-container text-on-primary-container hover:bg-primary font-sans font-bold text-xs rounded-full shadow transition-all cursor-pointer"
                  disabled={submitLoading}
                >
                  {submitLoading ? 'Saving...' : 'Sync Financial Telemetry'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-8 animate-fade-in font-serif">
              <form onSubmit={handleSecuritySubmit} className="space-y-6">
                <h3 className="font-headline-sm text-headline-sm mb-4 text-on-surface">Change Password</h3>
                
                <div className="space-y-4">
                  <div className="space-y-1.5 font-sans">
                    <label className="text-xs font-semibold text-on-surface-variant block ml-1">Current Password</label>
                    <input 
                      type="password" 
                      value={securityData.oldPassword}
                      onChange={(e) => setSecurityData(prev => ({ ...prev, oldPassword: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface focus:outline-none focus:border-primary transition-all" 
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5 font-sans">
                      <label className="text-xs font-semibold text-on-surface-variant block ml-1">New Password</label>
                      <input 
                        type="password" 
                        value={securityData.newPassword}
                        onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Min. 6 characters"
                        className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface focus:outline-none focus:border-primary transition-all" 
                        required
                      />
                    </div>
                    <div className="space-y-1.5 font-sans">
                      <label className="text-xs font-semibold text-on-surface-variant block ml-1">Confirm Password</label>
                      <input 
                        type="password" 
                        value={securityData.confirmPassword}
                        onChange={(e) => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface focus:outline-none focus:border-primary transition-all" 
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-outline-variant/40 mt-8">
                  <button 
                    type="submit" 
                    className="px-8 py-3 bg-primary-container text-on-primary-container hover:bg-primary font-sans font-bold text-xs rounded-full shadow transition-all cursor-pointer"
                    disabled={submitLoading}
                  >
                    {submitLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>

              {/* 2FA Section */}
              <div className="border-t border-outline-variant/60 pt-8 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-on-surface mb-1">Two-Factor Authentication (2FA)</h4>
                    <p className="text-xs text-on-surface-variant font-sans max-w-md">Secure your boutique assets by adding an additional verification layer.</p>
                  </div>
                  <button 
                    onClick={handleToggle2FA}
                    className={`px-6 py-2 rounded-full font-sans font-bold text-xs transition-all cursor-pointer ${
                      securityData.enable2FA 
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {securityData.enable2FA ? 'Deactivate 2FA' : 'Activate 2FA'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleNotificationsSubmit} className="space-y-6 animate-fade-in font-serif">
              <h3 className="font-headline-sm text-headline-sm mb-4 text-on-surface">Alert Rules & Delivery Channels</h3>
              
              <div className="space-y-4 divide-y divide-outline-variant/20">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <label className="text-sm font-bold text-on-surface block">AI Diagnostics Recommendations</label>
                    <span className="text-xs text-on-surface-variant font-sans block mt-1">Receive alerts on budget corrections.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notificationsData.aiRecommendation}
                    onChange={(e) => setNotificationsData(prev => ({ ...prev, aiRecommendation: e.target.checked }))}
                    className="w-4 h-4 rounded text-primary-container focus:ring-primary-container bg-surface-container"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-outline-variant/40 mt-8">
                <button 
                  type="submit" 
                  className="px-8 py-3 bg-primary-container text-on-primary-container hover:bg-primary font-sans font-bold text-xs rounded-full shadow transition-all cursor-pointer"
                  disabled={submitLoading}
                >
                  {submitLoading ? 'Saving...' : 'Save Notification Rules'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: LINKED ACCOUNTS */}
          {activeTab === 'accounts' && (
            <div className="space-y-8 animate-fade-in font-serif">
              <div className="flex justify-between items-center border-b border-outline-variant/40 pb-4 mb-6">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Linked Banking ledgers</h3>
                <button 
                  onClick={() => setShowAddAccountModal(true)} 
                  className="px-5 py-2.5 rounded-full bg-primary-container hover:bg-primary text-on-primary-container font-sans font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow"
                >
                  <span className="material-symbols-outlined text-sm font-bold">add</span> Add Account
                </button>
              </div>

              {/* Accounts list */}
              {accountsLoading ? (
                <p className="text-on-surface-variant text-sm font-serif">Verifying synced accounts...</p>
              ) : linkedAccounts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-serif">
                  {linkedAccounts.map((acc) => (
                    <div key={acc._id} className="bg-surface-container/40 border border-outline-variant rounded-xl p-5 flex justify-between items-start hover:border-primary/20 transition-all">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-base">account_balance</span>
                          <h4 className="text-sm font-bold text-on-surface">{acc.institutionName}</h4>
                        </div>
                        <p className="text-xs text-on-surface-variant font-sans mt-2">Account: •••• {acc.accountNumber.substring(acc.accountNumber.length - 4)}</p>
                        <p className="text-base font-bold text-on-surface mt-1">₹{acc.balance.toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteAccount(acc._id)} 
                        className="p-2 text-error hover:bg-error-container/20 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-on-surface-variant font-serif">
                  No linked bank or brokerage ledgers detected. Link accounts above to start synchronizations.
                </div>
              )}

              {/* Add Account Modal */}
              {showAddAccountModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
                  <div className="w-full max-w-md bg-surface-container border border-outline-variant p-6 rounded-2xl shadow-2xl relative animate-fade-in">
                    <button 
                      onClick={() => setShowAddAccountModal(false)}
                      className="absolute right-4 top-4 hover:bg-surface-container-high w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant cursor-pointer"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                    
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-6 font-serif">Link Banking Ledger</h3>
                    
                    <form onSubmit={handleLinkAccountSubmit} className="space-y-4 font-sans">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-on-surface-variant block">Institution Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. HDFC Bank, ICICI, Zerodha"
                          value={newAccount.institutionName}
                          onChange={(e) => setNewAccount(prev => ({ ...prev, institutionName: e.target.value }))}
                          className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary transition-all"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-on-surface-variant block">Account / Folio Number</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 501002345678"
                          value={newAccount.accountNumber}
                          onChange={(e) => setNewAccount(prev => ({ ...prev, accountNumber: e.target.value }))}
                          className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary transition-all"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-on-surface-variant block">Account Type</label>
                          <div className="relative">
                            <select 
                              value={newAccount.accountType}
                              onChange={(e) => setNewAccount(prev => ({ ...prev, accountType: e.target.value }))}
                              className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-xs text-on-surface appearance-none focus:outline-none focus:border-primary transition-all"
                            >
                              <option value="bank">Bank</option>
                              <option value="credit">Credit Card</option>
                              <option value="investment">Brokerage / MF</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant pointer-events-none text-base">expand_more</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-on-surface-variant block">Available Balance (₹)</label>
                          <input 
                            type="number" 
                            placeholder="e.g. 25000"
                            value={newAccount.balance}
                            onChange={(e) => setNewAccount(prev => ({ ...prev, balance: e.target.value }))}
                            className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary transition-all"
                            required
                          />
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        className="w-full py-3 mt-6 bg-primary-container hover:bg-primary text-on-primary-container rounded-full font-bold text-xs shadow cursor-pointer transition-colors"
                        disabled={submitLoading}
                      >
                        {submitLoading ? 'Linking...' : 'Confirm Ledger Link'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PREFERENCES */}
          {activeTab === 'preferences' && (
            <form onSubmit={handlePreferencesSubmit} className="space-y-6 animate-fade-in font-serif">
              <h3 className="font-headline-sm text-headline-sm mb-4 text-on-surface">Application Workspace settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 font-sans">
                  <label className="text-xs font-semibold text-on-surface-variant block ml-1">Workspace Theme</label>
                  <div className="relative">
                    <select 
                      value={preferencesData.theme}
                      onChange={(e) => setPreferencesData(prev => ({ ...prev, theme: e.target.value }))}
                      className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface appearance-none focus:outline-none focus:border-primary transition-all"
                    >
                      <option value="dark">Boutique Dark Theme</option>
                      <option value="light">Classic Light Theme</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3.5 text-on-surface-variant pointer-events-none text-lg">expand_more</span>
                  </div>
                </div>

                <div className="space-y-1.5 font-sans">
                  <label className="text-xs font-semibold text-on-surface-variant block ml-1">Preferred Language</label>
                  <div className="relative">
                    <select 
                      value={preferencesData.language}
                      onChange={(e) => setPreferencesData(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface appearance-none focus:outline-none focus:border-primary transition-all"
                    >
                      <option value="en">English (Boutique US)</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="es">Español (Spanish)</option>
                      <option value="fr">Français (French)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3.5 text-on-surface-variant pointer-events-none text-lg">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-outline-variant/40 mt-8">
                <button 
                  type="submit" 
                  className="px-8 py-3 bg-primary-container text-on-primary-container hover:bg-primary font-sans font-bold text-xs rounded-full shadow transition-all cursor-pointer"
                  disabled={submitLoading}
                >
                  {submitLoading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 7: REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-8 animate-fade-in font-serif">
              <div className="space-y-4">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Generate Financial Report</h3>
                <p className="text-xs text-on-surface-variant font-sans max-w-md">Compile statement analysis, tax brackets, and portfolio recommendations into a clean file export.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-1.5 font-sans">
                    <label className="text-xs font-semibold text-on-surface-variant block ml-1">Report Target Area</label>
                    <div className="relative">
                      <select 
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface appearance-none focus:outline-none focus:border-primary transition-all"
                      >
                        <option value="Expense">Expense & Budgeting Breakdown</option>
                        <option value="Tax">Tax Exemption Estimations</option>
                        <option value="Investment">Investment advisory portfolios</option>
                        <option value="Full">Full Telemetry Audit Report</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-3.5 text-on-surface-variant pointer-events-none text-lg">expand_more</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 font-sans">
                    <label className="text-xs font-semibold text-on-surface-variant block ml-1">Export Format</label>
                    <div className="relative">
                      <select 
                        value={reportFormat}
                        onChange={(e) => setReportFormat(e.target.value)}
                        className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-serif text-sm text-on-surface appearance-none focus:outline-none focus:border-primary transition-all"
                      >
                        <option value="PDF">Adobe PDF (.pdf)</option>
                        <option value="CSV">Spreadsheet CSV (.csv)</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-3.5 text-on-surface-variant pointer-events-none text-lg">expand_more</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    onClick={handleGenerateReport}
                    className="px-6 py-2.5 rounded-full bg-primary-container hover:bg-primary text-on-primary-container font-sans font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all"
                    disabled={submitLoading}
                  >
                    <span className="material-symbols-outlined text-sm font-bold">file_download</span>
                    {submitLoading ? 'Generating file...' : 'Download Report'}
                  </button>
                </div>
              </div>

              {/* Privacy & Data Control Desk */}
              <div className="border-t border-outline-variant/60 pt-8 space-y-6">
                <div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-serif mb-2">Privacy & Data Control Desk</h4>
                  <p className="text-xs text-on-surface-variant font-sans max-w-md">Manage your active ledger consent preferences, download complete profile telemetry, or purge active accounts.</p>
                </div>

                <div className="space-y-4">
                  {/* Consent policy */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-surface-container/40 border border-outline-variant/40 rounded-xl p-5">
                    <div>
                      <h5 className="text-sm font-bold text-on-surface mb-1">Data Anonymization Policy</h5>
                      <p className="text-xs text-on-surface-variant font-sans max-w-sm">Anonymize financial parameters before forwarding inputs to remote ML modeling nodes.</p>
                    </div>
                    <button 
                      onClick={handleToggleConsent}
                      className={`px-5 py-2 rounded-full font-sans font-bold text-xs transition-all cursor-pointer ${
                        dataConsent 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                      }`}
                    >
                      {dataConsent ? 'Consent Active' : 'Consent Deactivated'}
                    </button>
                  </div>

                  {/* Personal Data Download */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-surface-container/40 border border-outline-variant/40 rounded-xl p-5">
                    <div>
                      <h5 className="text-sm font-bold text-on-surface mb-1">Download Personal Data Ledger</h5>
                      <p className="text-xs text-on-surface-variant font-sans max-w-sm">Download your compiled financial profiles, risk evaluations, and transaction entries as a clean JSON ledger.</p>
                    </div>
                    <button 
                      onClick={handleDownloadData}
                      className="px-5 py-2 rounded-full font-sans font-bold text-xs bg-primary-container text-on-primary-container border border-outline-variant/40 hover:bg-primary hover:text-on-primary transition-all cursor-pointer flex items-center gap-1.5"
                      disabled={submitLoading}
                    >
                      <span className="material-symbols-outlined text-sm font-bold">download</span>
                      Download JSON
                    </button>
                  </div>

                  {/* Clear Data / Account Purge */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-surface-container/40 border border-outline-variant/40 rounded-xl p-5">
                    <div>
                      <h5 className="text-sm font-bold text-on-surface mb-1">Clear Ledger Transactions</h5>
                      <p className="text-xs text-on-surface-variant font-sans max-w-sm">Purge all imported bank CSV entries and normalized cash flow histories from our database.</p>
                    </div>
                    <button 
                      onClick={handleClearStatements}
                      className="px-5 py-2 rounded-full font-sans font-bold text-xs text-error hover:bg-error-container/20 border border-error/30 transition-all cursor-pointer flex items-center gap-1.5"
                      disabled={submitLoading}
                    >
                      <span className="material-symbols-outlined text-sm font-bold">delete_sweep</span>
                      Clear Statements
                    </button>
                  </div>

                  {/* Purge Account */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-error-container/5 border border-error/20 rounded-xl p-5">
                    <div>
                      <h5 className="text-sm font-bold text-error mb-1">Purge Personal Account</h5>
                      <p className="text-xs text-on-surface-variant font-sans max-w-sm">Permanently delete your profile ledger, active sub-advisors, and security credentials.</p>
                    </div>
                    <button 
                      onClick={handleDeleteUserAccount}
                      className="px-5 py-2 rounded-full font-sans font-bold text-xs bg-error text-on-error hover:bg-red-700 transition-all cursor-pointer flex items-center gap-1.5"
                      disabled={submitLoading}
                    >
                      <span className="material-symbols-outlined text-sm font-bold">delete_forever</span>
                      Purge Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
