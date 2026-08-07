import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  // Chat Simulation States
  const [chatMessages, setChatMessages] = useState([
    { sender: 'assistant', text: "Your portfolio is up 12.4% this month." }
  ]);
  const [showSuggestChip, setShowSuggestChip] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  // How-It-Works Active Step State
  const [activeStep, setActiveStep] = useState(1);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  // Auto-rotate steps in the "How it works" section every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep(prev => (prev % 3) + 1);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleSuggestClick = () => {
    setShowSuggestChip(false);
    setChatMessages(prev => [...prev, { sender: 'user', text: "Should I rebalance now?" }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: "Based on current volatility, reducing equity weight by 5% and allocating to high-yield debt assets is recommended to secure gains."
        }
      ]);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background text-on-background pt-24 pb-16 relative overflow-hidden font-sans">

      {/* Background radial gradient blobs for deep premium ambiance */}
      <div className="absolute top-[5%] left-[-15%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-15%] w-[600px] h-[600px] bg-tertiary-container/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* HERO SECTION */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24 relative z-10 pt-8">

        {/* Left Column: Copy & Actions */}
        <div className="lg:col-span-6 space-y-6 text-left flex flex-col items-start">
          {/* GPT/Gemini Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary-container text-xs font-semibold uppercase tracking-wider animate-pulse">
            <span className="text-amber-400">⚡</span> Powered by personal AI
          </div>

          <h1 className="font-display-hero text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-on-surface leading-[1.1] font-serif">
            Let AI Speak <br />
            <span className="text-primary-container">to Your Money</span>
          </h1>

          <p className="text-base sm:text-lg text-on-surface-variant max-w-xl leading-relaxed font-sans">
            Connect all your financial accounts and get real-time AI-powered insights, budgeting, forecasting, and investment guidance.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-full font-label-md text-label-md bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 hover:scale-[1.03] hover:bg-primary-fixed-dim transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              Get Started
              <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
            </Link>

            <button
              onClick={() => setDemoModalOpen(true)}
              className="px-6 py-3.5 rounded-full font-label-md text-label-md bg-surface-container border border-outline-variant hover:bg-surface-container-high text-on-surface font-semibold hover:scale-[1.03] transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">play_arrow</span>
              Watch Demo
            </button>
          </div>


        </div>

        {/* Right Column: Interactive Cockpit Mockup Dashboard */}
        <div className="lg:col-span-6 relative w-full flex justify-center items-center">
          <div className="relative w-full max-w-[500px] h-[480px] select-none">

            {/* Background glowing rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] border border-outline-variant/20 rounded-full pointer-events-none z-0"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] border border-outline-variant/10 rounded-full pointer-events-none z-0"></div>

            {/* Widget 1: Balance Card (Top Left) */}
            <div className="absolute top-[20px] left-[10px] w-[210px] bg-surface/90 backdrop-blur border border-outline-variant/60 rounded-2xl p-4 shadow-xl z-20 hover:scale-105 transition-transform duration-300">
              <div className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Total Balance</div>
              <div className="text-xl font-bold text-on-surface font-serif mt-1">$84,291.50</div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold mt-1">
                <span className="material-symbols-outlined text-xs">trending_up</span>
                <span>+12.4% this month</span>
              </div>
              {/* Spline line graph representation inside SVG */}
              <div className="h-10 mt-3">
                <svg className="w-full h-full" viewBox="0 0 100 40">
                  <path
                    d="M0 35 Q20 30, 40 15 T80 20 T100 5"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Widget 2: Stability Rating Gauge (Top Right) */}
            <div className="absolute top-0 right-[10px] w-[180px] bg-surface/90 backdrop-blur border border-outline-variant/60 rounded-2xl p-4 shadow-xl z-20 hover:scale-105 transition-transform duration-300">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] uppercase font-bold text-on-surface-variant tracking-wider">Stability</span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-1.5 py-0.5 rounded font-bold">+24.8%</span>
              </div>
              <div className="text-2xl font-bold text-on-surface font-serif">92/100</div>
              <div className="text-[9px] font-semibold text-emerald-400 uppercase mt-0.5 tracking-wider">Excellent Rating</div>
              <div className="w-full bg-surface-container-high rounded-full h-1.5 mt-3 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>

            {/* Widget 3: Credit Card Mockup (Center Left Layered Behind) */}
            <div className="absolute top-[170px] left-[-30px] w-[220px] h-[130px] bg-gradient-to-br from-slate-900 to-indigo-950 border border-white/5 rounded-2xl p-4 shadow-2xl z-10 flex flex-col justify-between opacity-90 transform -rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-300">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-on-primary/75 text-lg">credit_card</span>
                <span className="text-[9px] tracking-widest text-on-primary/45 font-bold uppercase">Gold Ledger</span>
              </div>
              <div>
                <div className="text-xs text-on-primary/65 tracking-widest font-mono">**** **** **** 7731</div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-[10px] text-on-primary/80 font-bold font-serif">Alex M.</div>
                  <div className="w-6 h-6 rounded-full bg-amber-500/80 opacity-70"></div>
                </div>
              </div>
            </div>

            {/* Widget 4: FinAI Chat Assistant Window (Bottom Right - Front Focus) */}
            <div className="absolute bottom-[20px] right-[-20px] w-[270px] bg-surface border-2 border-primary-container rounded-2xl shadow-2xl z-30 overflow-hidden flex flex-col justify-between hover:scale-102 transition-transform duration-300">
              {/* Chat Header */}
              <div className="bg-primary-container/10 border-b border-outline-variant/60 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-on-primary text-xs font-bold">
                    <span className="material-symbols-outlined text-sm">forum</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">Finmate Assistant</h4>
                    <span className="text-[9px] text-emerald-400 flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
                      Online
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="p-4 space-y-3 min-h-[160px] flex flex-col justify-end text-left">
                {chatMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl text-xs max-w-[85%] font-serif leading-relaxed ${m.sender === 'assistant'
                      ? 'bg-surface-container/60 border border-outline-variant/50 self-start text-on-surface'
                      : 'bg-primary text-on-primary self-end'
                      }`}
                  >
                    {m.text}
                  </div>
                ))}

                {isTyping && (
                  <div className="bg-surface-container/60 border border-outline-variant/50 p-2.5 rounded-xl text-xs self-start text-on-surface-variant flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                )}
              </div>

              {/* Suggestion Chip Button */}
              {showSuggestChip && (
                <div className="px-4 pb-4">
                  <button
                    onClick={handleSuggestClick}
                    className="w-full bg-primary-container/10 border border-primary-container/30 hover:bg-primary-container/20 text-primary-container font-sans font-bold text-[10px] py-2 px-3 rounded-full transition-all cursor-pointer text-center"
                  >
                    Should I rebalance now?
                  </button>
                </div>
              )}
            </div>

            {/* Widget 5: Portfolio growth small indicators (Bottom Left) */}
            <div className="absolute bottom-[30px] left-[30px] bg-surface/90 border border-outline-variant/60 rounded-xl p-3 shadow-lg z-20 flex items-center gap-3 hover:scale-105 transition-transform duration-300">
              <span className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <span className="material-symbols-outlined text-sm font-bold">pie_chart</span>
              </span>
              <div className="text-left">
                <div className="text-[9px] uppercase font-bold text-on-surface-variant tracking-wider">Portfolio</div>
                <div className="text-xs font-serif font-bold text-emerald-400">+2.1%</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="max-w-[1280px] mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-y border-outline-variant/30 mb-24 relative z-10 bg-surface-container/20 rounded-3xl">
        <div className="text-center space-y-1">
          <h3 className="font-display-hero text-3xl sm:text-4xl font-bold text-on-surface font-serif">₹2.4B+</h3>
          <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Assets managed</p>
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-display-hero text-3xl sm:text-4xl font-bold text-on-surface font-serif">840K+</h3>
          <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Active users</p>
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-display-hero text-3xl sm:text-4xl font-bold text-on-surface font-serif">99.97%</h3>
          <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Uptime SLA</p>
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-display-hero text-3xl sm:text-4xl font-bold text-on-surface font-serif">4.9 ★</h3>
          <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">App Store rating</p>
        </div>
      </section>

      {/* FEATURES GRID SECTION */}
      <section className="max-w-[1280px] mx-auto px-6 md:px-12 mb-28 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] uppercase font-bold text-primary tracking-widest block font-sans">Features</span>
          <h2 className="font-headline-lg text-3xl sm:text-4xl font-bold text-on-surface font-serif">
            Everything your money needs
          </h2>
          <p className="text-sm text-on-surface-variant font-sans">
            One intelligent platform to understand, grow, and protect your wealth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "AI Financial Advisor",
              text: "Get personalized guidance from an AI that understands your unique financial situation, goals, and risk appetite.",
              icon: "account_balance",
              color: "text-indigo-400"
            },
            {
              title: "Smart Budgeting",
              text: "Automatic categorization, trend analysis, and proactive alerts so you always know where your money is going.",
              icon: "monitoring",
              color: "text-emerald-400"
            },
            {
              title: "Investment Forecasting",
              text: "Scenario-based projections powered by real-time market data and your personal financial trajectory.",
              icon: "query_stats",
              color: "text-amber-400"
            },
            {
              title: "Account Management",
              text: "Connect 10,000+ banks, brokerages, and crypto wallets in seconds with read-only secure access.",
              icon: "account_balance_wallet",
              color: "text-cyan-400"
            },
            {
              title: "Financial Goal Planner",
              text: "Set savings goals for travel, education, retirement, or purchases and receive AI-driven plans to achieve them faster.",
              icon: "security",
              color: "text-rose-400"
            },
            {
              title: "Instant Insights",
              text: "Weekly AI-generated reports, net worth tracking, and goal progress delivered to your inbox.",
              icon: "bolt",
              color: "text-pink-400"
            }
          ].map((f, idx) => (
            <div
              key={idx}
              className="glass-card rounded-2xl p-8 hover:scale-[1.03] hover:border-primary/30 transition-all duration-300 flex flex-col items-start text-left bg-surface/50 border border-outline-variant/40"
            >
              <div className="bg-primary-container/10 border border-primary/20 rounded-xl p-3.5 mb-6 text-primary flex items-center justify-center">
                <span className={`material-symbols-outlined text-2xl ${f.color}`}>{f.icon}</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-3 font-serif">
                {f.title}
              </h3>
              <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="max-w-[1280px] mx-auto px-6 md:px-12 mb-28 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] uppercase font-bold text-primary tracking-widest block font-sans">How it works</span>
          <h2 className="font-headline-lg text-3xl sm:text-4xl font-bold text-on-surface font-serif">
            Up and running in under 3 minutes
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Side: Step Items */}
          <div className="lg:col-span-6 space-y-4">
            {[
              {
                step: 1,
                title: "Connect your accounts",
                text: "Securely link your bank, brokerage, and crypto accounts via 256-bit encrypted read-only API connections."
              },
              {
                step: 2,
                title: "AI analyzes your data",
                text: "Our models classify transactions, identify patterns, and build a comprehensive picture of your financial health."
              },
              {
                step: 3,
                title: "Get actionable insights",
                text: "Chat with your AI advisor, explore dashboards, and receive personalized recommendations to hit your goals faster."
              }
            ].map(s => (
              <div
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                className={`p-6 rounded-2xl border text-left cursor-pointer transition-all duration-300 flex items-start gap-4 ${activeStep === s.step
                  ? 'bg-primary-container/10 border-primary-container shadow-md'
                  : 'bg-surface border-outline-variant/40 hover:bg-surface-container/30'
                  }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 font-serif ${activeStep === s.step
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant border border-outline-variant'
                  }`}>
                  {s.step}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-on-surface font-serif">{s.title}</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed font-sans">{s.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Side: Step Interactive Live Simulation Display */}
          <div className="lg:col-span-6 flex justify-center items-center w-full min-h-[350px]">
            <div className="w-full max-w-[480px] bg-surface-container border border-outline-variant/80 rounded-2xl p-6 shadow-2xl relative min-h-[320px] flex flex-col justify-between overflow-hidden">

              {/* Simulation Header */}
              <div className="flex justify-between items-center border-b border-outline-variant/40 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">Live ML Simulator</span>
                </div>
                <span className="text-[9px] bg-surface-container-high border border-outline-variant text-on-surface-variant font-bold px-2 py-0.5 rounded">
                  Step {activeStep} of 3
                </span>
              </div>

              {/* Simulation Screen Content depending on activeStep */}
              <div className="flex-grow flex flex-col justify-center py-4">
                {activeStep === 1 && (
                  <div className="space-y-3 text-left animate-fade-in">
                    <h4 className="text-xs font-bold text-on-surface font-serif uppercase tracking-wider mb-2">Establishing Secure Aggregations</h4>
                    {[
                      { name: "Chase Checking", status: "Connected", icon: "check_circle", color: "text-emerald-400" },
                      { name: "Robinhood Portfolio", status: "Connected", icon: "check_circle", color: "text-emerald-400" },
                      { name: "BTC / ETH (Coinbase)", status: "Encrypting Link...", icon: "sync", color: "text-primary animate-spin" }
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-surface border border-outline-variant/40 rounded-xl text-xs font-sans">
                        <span className="font-bold text-on-surface">{item.name}</span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className={`material-symbols-outlined text-sm ${item.color}`}>{item.icon}</span>
                          <span className={idx === 2 ? 'text-primary' : 'text-on-surface-variant'}>{item.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-4 text-left animate-fade-in font-serif">
                    <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2">AI Categorization Parsing</h4>
                    <div className="bg-surface border border-outline-variant/60 rounded-xl p-4 space-y-3 text-xs">
                      <div className="flex justify-between text-[10px] text-on-surface-variant border-b border-outline-variant/20 pb-2">
                        <span>TRANSACTION</span>
                        <span>CONFIDENCE</span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-on-surface font-sans">Netflix.com subscription</p>
                            <p className="text-[10px] text-emerald-400 font-bold uppercase mt-0.5">Matched: Entertainment</p>
                          </div>
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded font-bold">99%</span>
                        </div>

                        <div className="flex justify-between items-center pt-2.5 border-t border-dashed border-outline-variant/20">
                          <div>
                            <p className="font-bold text-on-surface font-sans">SWIGGY *1234 FOODS</p>
                            <p className="text-[10px] text-emerald-400 font-bold uppercase mt-0.5">Matched: Food & Dining</p>
                          </div>
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded font-bold">98%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-surface border border-outline-variant/60 rounded-xl p-4 text-left space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-on-surface-variant tracking-wider">Net Worth Portfolio</span>
                          <h4 className="text-xl font-bold font-serif text-on-surface mt-0.5">$284,931</h4>
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded font-bold">+8.2% YTD</span>
                      </div>

                      {/* Interactive breakdown bar representation */}
                      <div className="h-2 rounded-full overflow-hidden flex w-full">
                        <div className="bg-blue-400 h-full" style={{ width: '20%' }} title="Checking: 20%"></div>
                        <div className="bg-indigo-400 h-full" style={{ width: '55%' }} title="Portfolio: 55%"></div>
                        <div className="bg-emerald-400 h-full" style={{ width: '25%' }} title="Crypto: 25%"></div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[9px] pt-2 text-on-surface-variant font-sans font-bold">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block"></span>
                          <span>Chase checking</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block"></span>
                          <span>Robinhood</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                          <span>Crypto wallet</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Simulation Footer */}
              <div className="border-t border-outline-variant/40 pt-4 mt-2 text-center">
                <p className="text-[10px] text-on-surface-variant font-sans leading-normal font-semibold uppercase tracking-wider">
                  {activeStep === 1 && "Connecting secure API gateway credentials..."}
                  {activeStep === 2 && "Decision-tree classifier matching merchant logs..."}
                  {activeStep === 3 && "Insights vector mapped: Stability rating active."}
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="max-w-[1280px] mx-auto px-6 md:px-12 mb-28 relative z-10 text-center">
        <div className="max-w-xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] uppercase font-bold text-primary tracking-widest block font-sans">Loved by thousands</span>
          <h2 className="font-headline-lg text-3xl sm:text-4xl font-bold text-on-surface font-serif">
            Real results, real people
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            {
              quote: "Finmate found $340/month in subscriptions I forgot about. It gives alert for the upcoming bills and unexpected expenses.",
              name: "Sarah Chen",
              role: "Product Designer, NYC",
              letter: "S",
              color: "bg-indigo-500/10 text-indigo-400"
            },
            {
              quote: "The AI advisor walked me through rebalancing my portfolio during the dip. I made money while everyone panicked.",
              name: "Marcus Williams",
              role: "Software Engineer, Austin",
              letter: "M",
              color: "bg-emerald-500/10 text-emerald-400"
            },
            {
              quote: "Finally one dashboard for my 5 banks, 3 brokerages, and crypto. The forecasting tool is insane.",
              name: "Priya Kapoor",
              role: "Founder, London",
              letter: "P",
              color: "bg-amber-500/10 text-amber-400"
            }
          ].map((t, idx) => (
            <div key={idx} className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-md bg-surface-container/20 flex flex-col justify-between min-h-[220px] hover:scale-[1.02] transition-transform duration-300">
              <div className="space-y-4">
                {/* 5 Stars */}
                <div className="flex gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-sm filled fill-1 font-bold">star</span>
                  ))}
                </div>
                <p className="font-serif text-sm text-on-surface leading-relaxed">
                  "{t.quote}"
                </p>
              </div>

              {/* User Bio */}
              <div className="flex items-center gap-3 pt-6 border-t border-outline-variant/20 mt-6">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${t.color}`}>
                  {t.letter}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-on-surface font-sans leading-tight">{t.name}</h4>
                  <p className="text-[10px] text-on-surface-variant leading-none mt-1">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="max-w-[1000px] mx-auto px-6 mb-24 relative z-10 text-center">
        <div className="glass-card rounded-3xl p-10 md:p-14 border border-outline-variant/60 shadow-2xl relative overflow-hidden bg-surface-container-high/60 backdrop-blur-xl">
          {/* Glowing gradient blur in background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative z-10 max-w-2xl mx-auto space-y-8 flex flex-col items-center">

            {/* Stars */}
            <div className="flex gap-0.5 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="material-symbols-outlined text-sm font-bold">star</span>
              ))}
            </div>

            <div className="space-y-3">
              <h2 className="font-display-hero text-3xl sm:text-4xl md:text-5xl font-bold text-on-surface tracking-tight font-serif leading-tight">
                Your smartest financial <br /> decision starts here
              </h2>
              <p className="text-sm text-on-surface-variant font-sans max-w-md mx-auto">
                Join 840,000+ people who let AI handle the complexity of personal finance.
              </p>
            </div>

            <Link
              to="/register"
              className="px-8 py-3.5 rounded-full font-label-md text-label-md bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 hover:scale-[1.03] hover:bg-primary-fixed-dim transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              Get Started Free
              <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
            </Link>

            {/* Checkmark Features */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-[11px] font-sans font-bold text-on-surface-variant uppercase tracking-wider">
              <div className="flex items-center gap-1">
                <span className="text-primary text-xs">✓</span> No credit card required
              </div>
              <div className="flex items-center gap-1">
                <span className="text-primary text-xs">✓</span> Free 14-day trial
              </div>
              <div className="flex items-center gap-1">
                <span className="text-primary text-xs">✓</span> Cancel anytime
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="max-w-[1280px] mx-auto px-6 md:px-12 border-t border-outline-variant/30 pt-10 relative z-10 flex flex-col sm:flex-row justify-between items-center gap-6 text-xs text-on-surface-variant font-sans font-medium">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-display-hero font-bold text-sm text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-lg text-primary">account_balance</span>
            Finmate
          </Link>
          <span className="text-on-surface-variant/40">|</span>
          <span className="text-on-surface-variant/70">© 2026 Finmate, Inc.</span>
        </div>

        <div className="flex items-center gap-6 flex-wrap justify-center">
          <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
          <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
        </div>
      </footer>

      {/* WATCH DEMO POPUP MODAL */}
      {demoModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-surface-container border border-outline-variant/80 p-6 rounded-3xl shadow-2xl relative animate-fade-in font-sans">
            <button
              onClick={() => setDemoModalOpen(false)}
              className="absolute right-4 top-4 hover:bg-surface-container-high w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant cursor-pointer z-10"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface font-serif mb-4 text-left">Finmate Product Tour</h3>

            {/* Embedded mockup preview player layout */}
            <div className="w-full aspect-video rounded-xl overflow-hidden bg-black/90 border border-outline-variant/40 flex flex-col justify-center items-center p-6 text-center select-none relative">
              <div className="absolute top-[20%] left-[10%] w-[180px] bg-surface/90 border border-outline-variant/40 rounded-xl p-3 shadow-lg z-10 transform -rotate-2">
                <span className="text-[8px] uppercase tracking-wider text-on-surface-variant block mb-1">Tax Savings</span>
                <span className="text-sm font-serif font-bold text-emerald-400">₹72,500 Saved</span>
              </div>
              <div className="absolute bottom-[20%] right-[10%] w-[200px] bg-surface/90 border border-outline-variant/40 rounded-xl p-3 shadow-lg z-10 transform rotate-3">
                <span className="text-[8px] uppercase tracking-wider text-on-surface-variant block mb-1">Debt Rescue Risk</span>
                <span className="text-sm font-serif font-bold text-rose-400">Low Exposure (18%)</span>
              </div>

              <div className="z-20 max-w-sm space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary mx-auto animate-pulse">
                  <span className="material-symbols-outlined text-3xl">play_circle</span>
                </div>
                <h4 className="font-serif text-base font-bold text-on-surface">Interactive AI Advisor Dashboard Simulation</h4>
                <p className="text-xs text-on-surface-variant font-sans">Please register or log in to access the live web cockpit with real-time ML diagnostics and statement aggregators.</p>
                <div className="pt-2">
                  <Link
                    to="/register"
                    onClick={() => setDemoModalOpen(false)}
                    className="px-6 py-2 rounded-full bg-primary text-on-primary font-bold text-xs hover:bg-primary-fixed-dim transition-all cursor-pointer inline-block"
                  >
                    Open Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
