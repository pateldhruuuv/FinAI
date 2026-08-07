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
    <div className="fixed inset-0 w-screen h-screen bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-6">
      <div className="glass-card rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden animate-fade-in w-full max-w-md border border-outline-variant/30">
        
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="font-serif text-2xl font-bold tracking-tight text-on-surface mb-2">
            Complete Your Profile
          </h2>
          <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
            To unlock the advisor calculations and financial insights, please verify your age and monthly income.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert bg-error-container/20 border-l-4 border-error text-error p-4 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant block ml-1" htmlFor="modal-age">
              Current Age
            </label>
            <div className="relative flex items-center">
              <Calendar size={18} className="absolute left-4 text-on-surface-variant/60 pointer-events-none" />
              <input
                id="modal-age"
                type="number"
                placeholder="25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-surface-container/60 border border-outline-variant rounded-xl pl-11 pr-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-sm animate-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant block ml-1" htmlFor="modal-income">
              Monthly Income (₹)
            </label>
            <div className="relative flex items-center">
              <Wallet size={18} className="absolute left-4 text-on-surface-variant/60 pointer-events-none" />
              <input
                id="modal-income"
                type="number"
                placeholder="50000"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full bg-surface-container/60 border border-outline-variant rounded-xl pl-11 pr-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-sm animate-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary-container hover:bg-primary text-on-primary-container font-semibold py-3 rounded-full transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-primary-container/20 flex items-center justify-center gap-2 cursor-pointer mt-6"
          >
            <Check size={18} />
            {submitting ? 'Saving Profile...' : 'Unlock Features'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileDataModal;
