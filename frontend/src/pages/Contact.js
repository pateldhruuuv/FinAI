import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate API contact request
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background text-on-background pt-32 pb-20 relative overflow-hidden font-sans">
      {/* Background radial gradient blobs for deep premium ambiance */}
      <div className="absolute top-[5%] left-[-15%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-15%] w-[600px] h-[600px] bg-tertiary-container/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-[1000px] mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start text-left">
        
        {/* Left Column: Heading and Support Metadata */}
        <div className="lg:col-span-5 space-y-6">
          <Link to="/" className="inline-flex items-center gap-2 text-xs text-on-surface-variant hover:text-on-surface font-semibold mb-4 transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Home
          </Link>

          <header className="space-y-3">
            <h1 className="font-display-hero text-4xl font-bold tracking-tight text-on-surface font-serif">Contact Desk</h1>
            <p className="text-sm text-on-surface-variant leading-relaxed font-sans">
              Have questions regarding our AI wealth simulators, statement aggregations, or professional plans? Get in touch with our support desk.
            </p>
          </header>

          <div className="space-y-4 pt-6 border-t border-outline-variant/30 font-serif text-xs text-on-surface-variant">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-lg mt-0.5">mail</span>
              <div>
                <h4 className="font-bold text-on-surface">Email Address</h4>
                <p className="mt-1 font-sans">support@finmate.com</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-lg mt-0.5">location_on</span>
              <div>
                <h4 className="font-bold text-on-surface">Headquarters</h4>
                <p className="mt-1 font-sans">12th Floor, Cyber Hub, Gurugram, India</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-lg mt-0.5">schedule</span>
              <div>
                <h4 className="font-bold text-on-surface">Support Hours</h4>
                <p className="mt-1 font-sans">Monday - Friday, 9:00 AM - 6:00 PM IST</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Form */}
        <div className="lg:col-span-7 w-full">
          <div className="glass-card rounded-2xl p-6 md:p-8 border border-outline-variant/40 shadow-xl bg-surface/50">
            {success ? (
              <div className="text-center py-10 space-y-4 animate-fade-in font-serif">
                <span className="material-symbols-outlined text-5xl text-emerald-400 animate-bounce">check_circle</span>
                <h3 className="font-bold text-lg text-on-surface">Message Dispatched</h3>
                <p className="text-xs text-on-surface-variant max-w-xs mx-auto font-sans leading-relaxed">
                  Your inquiry has been successfully sent. A portfolio team member will respond within 24 business hours.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="px-6 py-2 rounded-full border border-outline-variant text-xs hover:bg-surface-container font-sans font-bold transition-all cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider block ml-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name"
                    className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider block ml-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider block ml-1">Subject</label>
                  <div className="relative">
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface appearance-none focus:outline-none focus:border-primary transition-all"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Billing / Premium Upgrade">Billing / Premium Upgrade</option>
                      <option value="ML Model Troubleshooting">ML Model Troubleshooting</option>
                      <option value="Data & Privacy Request">Data & Privacy Request</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant pointer-events-none text-lg">expand_more</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider block ml-1">Message Content</label>
                  <textarea
                    required
                    rows="4"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type message..."
                    className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary transition-all resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-primary-fixed-dim text-on-primary font-bold py-3 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md mt-6"
                >
                  <span className="material-symbols-outlined text-sm font-bold">send</span>
                  {submitting ? 'Dispatching Message...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
