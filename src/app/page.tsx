'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Sparkles, 
  ArrowRight,
  Mail,
  User,
  Zap,
  Shield,
  Layers,
  MapPin,
  Clock,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  EyeOff,
  Star,
  Activity,
  DollarSign,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function Home() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Interactive preview widget states for auto-animation
  const [activeStep, setActiveStep] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(84);

  // Auto-animate the interactive preview widget steps
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        const next = (prev + 1) % 4;
        if (next === 2) {
          setConfirmedCount((c) => c + 1);
        }
        return next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!name || !email) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        setMessage(data.message || 'Successfully joined the waitlist!');
        setName('');
        setEmail('');
      } else {
        setError(data.error || 'Failed to join waitlist.');
      }
    } catch (err) {
      setLoading(false);
      setError('Connection error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#02050a] text-[#f1f5f9] font-sans overflow-x-hidden selection:bg-[#06b6d4]/30 selection:text-white relative">
      
      {/* Inject Custom High-End Animations */}
      <style jsx global>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes floatOrb {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
          100% { transform: translateY(0px) scale(1); }
        }
        @keyframes scanEffect {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animated-gradient-text {
          background-size: 200% auto;
          animation: gradientShift 5s ease infinite;
        }
        .floating-orb-cyan {
          animation: floatOrb 8s ease-in-out infinite;
        }
        .floating-orb-violet {
          animation: floatOrb 10s ease-in-out infinite;
          animation-delay: 1.5s;
        }
        .scanning-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.4), transparent);
          transform: translateX(-100%);
          transition: 0.6s;
        }
        .scanning-btn:hover::after {
          animation: scanEffect 1.2s infinite;
        }
      `}</style>

      {/* Cyberpunk Neon Glow Spheres */}
      <div className="absolute top-[-15%] left-[-15%] w-[60vw] h-[60vw] bg-[#06b6d4]/8 blur-[140px] rounded-full pointer-events-none z-0 floating-orb-cyan"></div>
      <div className="absolute top-[35%] right-[-15%] w-[55vw] h-[55vw] bg-[#8b5cf6]/6 blur-[150px] rounded-full pointer-events-none z-0 floating-orb-violet"></div>
      <div className="absolute bottom-[-15%] left-[15%] w-[45vw] h-[45vw] bg-[#06b6d4]/5 blur-[130px] rounded-full pointer-events-none z-0 floating-orb-cyan"></div>

      {/* Header */}
      <header className="border-b border-[#0f172a]/80 px-4 sm:px-6 py-4 bg-[#02050a]/90 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="bg-[#06b6d4] text-[#02050a] p-2.5 rounded-xl shadow-lg shadow-[#06b6d4]/20 transition-all duration-300 group-hover:rotate-[12deg] group-hover:scale-105">
              <Calendar className="w-5.5 h-5.5" />
            </div>
            <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-white via-[#f1f5f9] to-[#94a3b8] bg-clip-text text-transparent">
              Reserveze
            </span>
          </div>
          
          <Link 
            href="/login" 
            className="bg-[#0f172a]/90 hover:bg-[#1e293b] border border-[#06b6d4]/30 hover:border-[#06b6d4]/80 text-[#06b6d4] hover:text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-1.5 shadow-md shadow-[#06b6d4]/5 hover:scale-[1.03]"
          >
            <span>Merchant Portal</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-28">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Form & Heading */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#06b6d4]/10 border border-[#06b6d4]/20 text-[10px] font-black uppercase tracking-widest text-[#06b6d4] mb-2 shadow-inner">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Elite Scheduling System</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-white">
              Automate Business Bookings & <br/>
              <span className="bg-gradient-to-r from-[#06b6d4] via-[#38bdf8] to-[#8b5cf6] bg-clip-text text-transparent animated-gradient-text">
                Schedule Effortlessly.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#94a3b8] max-w-xl mx-auto lg:mx-0 leading-relaxed">
              The high-tech operating hub custom-built for scaling brands. Sync team availabilities, reduce notification expenses via smart cascades, and configure branch access limits with ease.
            </p>

            {/* Registration Card */}
            <div className="max-w-md mx-auto lg:mx-0 bg-[#0f172a]/30 border border-[#06b6d4]/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden transition-all hover:border-[#06b6d4]/25">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6]"></div>
              
              <h3 className="font-extrabold text-lg text-white mb-1.5 flex items-center justify-center lg:justify-start gap-2">
                Join Waitlist
                <Star className="w-4 h-4 text-[#06b6d4] fill-[#06b6d4] animate-pulse" />
              </h3>
              <p className="text-xs text-[#94a3b8] mb-6">Enter details for early access registration & premium benefits.</p>

              <form onSubmit={handleJoinWaitlist} className="space-y-4">
                
                {message && (
                  <div className="bg-[#10b981]/10 border border-[#10b981]/25 text-[#10b981] p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 text-left animate-in fade-in duration-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{message}</span>
                  </div>
                )}

                {error && (
                  <div className="bg-error/10 border border-error/20 text-error p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 text-left animate-in fade-in duration-300">
                    <Shield className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black uppercase text-[#94a3b8] tracking-wider">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 w-3.5 h-3.5 text-[#475569]" />
                      <input
                        type="text"
                        required
                        disabled={loading}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Mercer"
                        className="w-full text-xs bg-[#02050a]/80 text-white rounded-xl pl-9 pr-4 py-3 border border-[#1e293b] focus:outline-none focus:border-[#06b6d4] transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black uppercase text-[#94a3b8] tracking-wider">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-3.5 h-3.5 text-[#475569]" />
                      <input
                        type="email"
                        required
                        disabled={loading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full text-xs bg-[#02050a]/80 text-white rounded-xl pl-9 pr-4 py-3 border border-[#1e293b] focus:outline-none focus:border-[#06b6d4] transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#06b6d4] to-[#0891b2] hover:from-[#0891b2] hover:to-[#0e7490] text-[#02050a] font-black py-3.5 rounded-xl text-xs transition-all duration-300 shadow-lg shadow-[#06b6d4]/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 scanning-btn relative overflow-hidden"
                >
                  {loading ? (
                    <span>Registering...</span>
                  ) : (
                    <>
                      <span>Join Exclusive Waitlist</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>

          {/* Right Column: Live Simulator */}
          <div className="lg:col-span-5 relative w-full max-w-md mx-auto">
            
            {/* Ambient Cyan/Violet Backlight */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#06b6d4]/20 to-[#8b5cf6]/20 blur-[50px] rounded-2xl pointer-events-none scale-90 z-0"></div>

            <div className="relative z-10 w-full bg-[#080d1a] border border-[#06b6d4]/20 rounded-2xl p-5 shadow-2xl overflow-hidden transition-all duration-300 hover:border-[#06b6d4]/40">
              
              {/* Header Visual */}
              <div className="flex items-center justify-between pb-3 border-b border-[#0f172a] mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                </div>
                <span className="text-[10px] text-[#475569] font-mono">vanguard-salon/booking</span>
              </div>

              {/* Simulation Status Card */}
              <div className="bg-[#0f172a] p-4 rounded-xl border border-[#06b6d4]/10 flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#06b6d4]/10 text-[#06b6d4] flex items-center justify-center font-bold">
                    <Activity className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-white">Live Booking Engine</h4>
                    <p className="text-[9px] text-[#94a3b8]">Simulated Client Flows</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-[#06b6d4] bg-[#06b6d4]/10 px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#06b6d4]/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4] animate-ping"></span>
                  <span>Active</span>
                </span>
              </div>

              {/* Animated Progress Steps */}
              <div className="space-y-3.5">
                
                {/* Step 1 */}
                <div className={`p-3 rounded-lg border transition-all duration-300 flex items-center justify-between ${
                  activeStep === 0 ? 'bg-[#06b6d4]/10 border-[#06b6d4]/40 scale-[1.02]' : 'bg-transparent border-[#0f172a] opacity-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-[#06b6d4]">01</span>
                    <span className="text-xs text-white font-bold">Client Selects Service</span>
                  </div>
                  <span className="text-[9px] text-[#94a3b8] italic">Haircut & Styling</span>
                </div>

                {/* Step 2 */}
                <div className={`p-3 rounded-lg border transition-all duration-300 flex items-center justify-between ${
                  activeStep === 1 ? 'bg-[#06b6d4]/10 border-[#06b6d4]/40 scale-[1.02]' : 'bg-transparent border-[#0f172a] opacity-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-[#06b6d4]">02</span>
                    <span className="text-xs text-white font-bold">Timezone Slot Picking</span>
                  </div>
                  <span className="text-[9px] text-[#94a3b8] italic">Jul 16, 2:30 PM</span>
                </div>

                {/* Step 3 */}
                <div className={`p-3 rounded-lg border transition-all duration-300 flex items-center justify-between ${
                  activeStep === 2 ? 'bg-[#06b6d4]/10 border-[#06b6d4]/40 scale-[1.02]' : 'bg-transparent border-[#0f172a] opacity-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-[#06b6d4]">03</span>
                    <span className="text-xs text-white font-bold">Budget Confirm Cascade</span>
                  </div>
                  <span className="text-[9px] text-[#06b6d4] font-black">Free Email Sent</span>
                </div>

                {/* Step 4 */}
                <div className={`p-3 rounded-lg border transition-all duration-300 flex items-center justify-between ${
                  activeStep === 3 ? 'bg-[#06b6d4]/10 border-[#06b6d4]/40 scale-[1.02]' : 'bg-transparent border-[#0f172a] opacity-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-[#06b6d4]">04</span>
                    <span className="text-xs text-white font-bold">Stripe Verification</span>
                  </div>
                  <span className="text-[9px] text-emerald-500 font-bold">Credits Synced</span>
                </div>

              </div>

              {/* Dynamic Bottom Badge */}
              <div className="mt-5 border-t border-[#0f172a] pt-4 flex items-center justify-between text-[10px] text-[#94a3b8]">
                <span>Total Bookings Confirmed</span>
                <span className="font-extrabold text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                  {confirmedCount}
                </span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* How to Use Section */}
      <section id="how-to-use" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#0f172a] relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-[#06b6d4] font-black uppercase tracking-wider text-xs">Easy Setup Flow</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">How to Use Reserveze</h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            Reserveze streamlines your operations in four simple steps. Follow this guide to launch your bookings dashboard.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Step 1 */}
          <div className="bg-[#070b14] border border-[#0f172a] rounded-2xl p-6 relative overflow-hidden group hover:border-[#06b6d4]/30 hover:-translate-y-1.5 transition-all duration-300 shadow-md">
            <div className="absolute top-4 right-4 text-4xl font-black text-[#0f172a] group-hover:text-[#06b6d4]/10 select-none transition-colors">01</div>
            <div className="bg-[#06b6d4]/10 text-[#06b6d4] w-11 h-11 rounded-xl flex items-center justify-center mb-6">
              <Zap className="w-5.5 h-5.5" />
            </div>
            <h3 className="font-bold text-base text-white mb-2">Register Brand</h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Create a merchant profile and fill in your brand details (logo, contact, and category).
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-[#070b14] border border-[#0f172a] rounded-2xl p-6 relative overflow-hidden group hover:border-[#06b6d4]/30 hover:-translate-y-1.5 transition-all duration-300 shadow-md">
            <div className="absolute top-4 right-4 text-4xl font-black text-[#0f172a] group-hover:text-[#06b6d4]/10 select-none transition-colors">02</div>
            <div className="bg-[#06b6d4]/10 text-[#06b6d4] w-11 h-11 rounded-xl flex items-center justify-center mb-6">
              <Layers className="w-5.5 h-5.5" />
            </div>
            <h3 className="font-bold text-base text-white mb-2">Define Services</h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Configure your service library, pricing, session durations, and advance scheduling rules.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-[#070b14] border border-[#0f172a] rounded-2xl p-6 relative overflow-hidden group hover:border-[#06b6d4]/30 hover:-translate-y-1.5 transition-all duration-300 shadow-md">
            <div className="absolute top-4 right-4 text-4xl font-black text-[#0f172a] group-hover:text-[#06b6d4]/10 select-none transition-colors">03</div>
            <div className="bg-[#06b6d4]/10 text-[#06b6d4] w-11 h-11 rounded-xl flex items-center justify-center mb-6">
              <Lock className="w-5.5 h-5.5" />
            </div>
            <h3 className="font-bold text-base text-white mb-2">Configure Staff</h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Invite branch managers. Block sensitive areas (billing/notifications) automatically.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-[#070b14] border border-[#0f172a] rounded-2xl p-6 relative overflow-hidden group hover:border-[#06b6d4]/30 hover:-translate-y-1.5 transition-all duration-300 shadow-md">
            <div className="absolute top-4 right-4 text-4xl font-black text-[#0f172a] group-hover:text-[#06b6d4]/10 select-none transition-colors">04</div>
            <div className="bg-[#06b6d4]/10 text-[#06b6d4] w-11 h-11 rounded-xl flex items-center justify-center mb-6">
              <MapPin className="w-5.5 h-5.5" />
            </div>
            <h3 className="font-bold text-base text-white mb-2">Share Widget</h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Publish your scheduling URL. Customers book via timezone-aware calendars instantly.
            </p>
          </div>

        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#0f172a] relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-[#06b6d4] font-black uppercase tracking-wider text-xs">Core Value Offerings</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Features of Reserveze</h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            Reserveze is packed with business-driven capabilities designed to optimize booking conversions and slash operational communication overheads.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Feature 1: Notification Engine */}
          <div className="bg-[#070b14]/70 border border-[#0f172a] rounded-2xl p-6 hover:border-[#06b6d4]/30 hover:bg-[#080e1b]/70 transition-all duration-300 shadow-lg relative group">
            <div className="bg-[#06b6d4]/10 text-[#06b6d4] w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105">
              <Mail className="w-5.5 h-5.5" />
            </div>
            <h3 className="font-extrabold text-base text-white mb-2.5">Budget-First Notification Cascades</h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Saves up to 80% on communication billing. Reminders automatically prioritize free confirmation emails and dynamic tracking portals, only triggering paid SMS/WhatsApp fallbacks if the client remains unconfirmed.
            </p>
          </div>

          {/* Feature 2: Multi-location */}
          <div className="bg-[#070b14]/70 border border-[#0f172a] rounded-2xl p-6 hover:border-[#06b6d4]/30 hover:bg-[#080e1b]/70 transition-all duration-300 shadow-lg relative group">
            <div className="bg-[#06b6d4]/10 text-[#06b6d4] w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105">
              <MapPin className="w-5.5 h-5.5" />
            </div>
            <h3 className="font-extrabold text-base text-white mb-2.5">Multi-Location Branch Orchestration</h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Effortlessly scale locations. Configure independent calendar views, localized timezone definitions, shift schedules, and branch parameters under a unified merchant dashboard.
            </p>
          </div>

          {/* Feature 3: Roles */}
          <div className="bg-[#070b14]/70 border border-[#0f172a] rounded-2xl p-6 hover:border-[#06b6d4]/30 hover:bg-[#080e1b]/70 transition-all duration-300 shadow-lg relative group">
            <div className="bg-[#06b6d4]/10 text-[#06b6d4] w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105">
              <EyeOff className="w-5.5 h-5.5" />
            </div>
            <h3 className="font-extrabold text-base text-white mb-2.5">Granular Role Privacy Protection</h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Strict panel access boundaries. Branch managers and staff members can look up shift bookings but are completely restricted from viewing business-wide financials, global configurations, or notification budgets.
            </p>
          </div>

          {/* Feature 4: Passwords */}
          <div className="bg-[#070b14]/70 border border-[#0f172a] rounded-2xl p-6 hover:border-[#06b6d4]/30 hover:bg-[#080e1b]/70 transition-all duration-300 shadow-lg relative group">
            <div className="bg-[#06b6d4]/10 text-[#06b6d4] w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105">
              <Lock className="w-5.5 h-5.5" />
            </div>
            <h3 className="font-extrabold text-base text-white mb-2.5">First-Login Password Enforcer</h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Enforce enterprise-grade credentials. Staff members invited with temporary passwords are met with a secure, non-dismissible change password pop-up to update their credentials on their very first log in.
            </p>
          </div>

          {/* Feature 5: Checkout */}
          <div className="bg-[#070b14]/70 border border-[#0f172a] rounded-2xl p-6 hover:border-[#06b6d4]/30 hover:bg-[#080e1b]/70 transition-all duration-300 shadow-lg relative group">
            <div className="bg-[#06b6d4]/10 text-[#06b6d4] w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105">
              <DollarSign className="w-5.5 h-5.5" />
            </div>
            <h3 className="font-extrabold text-base text-white mb-2.5">Simulated Stripe Billing Ledgers</h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Seamlessly upgrade plans. A fully simulated mock billing pipeline that handles credit checkout top-ups with atomic database credits credit-ups and comprehensive transaction ledger history list view.
            </p>
          </div>

          {/* Feature 6: Timezones */}
          <div className="bg-[#070b14]/70 border border-[#0f172a] rounded-2xl p-6 hover:border-[#06b6d4]/30 hover:bg-[#080e1b]/70 transition-all duration-300 shadow-lg relative group">
            <div className="bg-[#06b6d4]/10 text-[#06b6d4] w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105">
              <Clock className="w-5.5 h-5.5" />
            </div>
            <h3 className="font-extrabold text-base text-white mb-2.5">Timezone-Aware Customer Portal</h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Prevent booking confusion. Clients view slots translated to their local timezone while bookings register in the branch’s native schedule. Rescheduling cooldowns protect merchants from booking spam.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#0f172a] py-12 px-4 sm:px-6 bg-[#010306] relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#06b6d4] text-[#02050a] p-1.5 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm text-white">Reserveze</span>
          </div>
          <span className="text-[10px] text-[#475569] text-center md:text-left">&copy; 2026 Reserveze SaaS. Powered by Next.js, Mongoose & Nodemailer. All rights reserved.</span>
        </div>
      </footer>

    </div>
  );
}
