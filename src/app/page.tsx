import Link from "next/link";
import { 
  Calendar, 
  Settings, 
  UserCheck, 
  MessageSquare, 
  ShieldAlert, 
  Sparkles, 
  TrendingUp, 
  ArrowRight,
  Database,
  Mail,
  Zap
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-surface-container-low text-on-surface">
      
      {/* Premium Header */}
      <header className="border-b border-outline-variant/30 px-6 py-4 glass-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-on-primary p-2 rounded-lg shadow-md shadow-primary/20">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-primary">Reserveze</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-on-surface-variant">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#notification-engine" className="hover:text-primary transition-colors">Smarter Notifications</a>
            <a href="#modules" className="hover:text-primary transition-colors">Modules Demo</a>
          </nav>
          <div>
            <Link 
              href="/booking/mock-business-id" 
              className="bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 shadow-md shadow-primary/10"
            >
              Demo Booking
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center md:text-left flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-native Scheduling SaaS Platform</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            The Professional Operating System for <span className="text-primary">Service Brands</span>
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl">
            Streamline availability, service libraries, multi-channel calendars, and client relationships. Engineered with a budget-first notification engine to slash communication costs.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <a 
              href="#modules" 
              className="w-full sm:w-auto bg-primary hover:bg-primary-container text-on-primary px-6 py-3 rounded-lg font-bold text-base transition-all duration-200 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              Explore Modules
              <ArrowRight className="w-5 h-5" />
            </a>
            <Link 
              href="/booking/mock-business" 
              className="w-full sm:w-auto bg-surface-container-highest hover:bg-surface-container-high border border-outline-variant/30 text-on-surface px-6 py-3 rounded-lg font-bold text-base transition-all duration-200 flex items-center justify-center gap-2"
            >
              Book an Appointment
            </Link>
          </div>
        </div>
        
        {/* Hero Interactive Visual */}
        <div className="flex-1 w-full max-w-md bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full"></div>
          <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <span className="text-xs text-on-surface-variant font-medium">reserveze.com/booking/vanguard-salon</span>
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">VS</div>
                <div>
                  <h4 className="font-bold text-sm">Vanguard Salon</h4>
                  <p className="text-xs text-on-surface-variant">Haircut & Styling</p>
                </div>
              </div>
              <span className="text-xs font-bold text-secondary bg-secondary-container/20 px-2.5 py-1 rounded-full">Confirmed</span>
            </div>
            
            <div className="p-4 bg-surface-container-low rounded-lg space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">Primary Channel</span>
                <span className="font-bold text-primary flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> Email (Recommended)
                </span>
              </div>
              <div className="border-t border-outline-variant/20 pt-3 flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">Live Tracking Portal</span>
                <span className="font-semibold text-secondary flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Enabled (No SMS spam)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid of Interactive Modules */}
      <section id="modules" className="max-w-7xl mx-auto px-6 py-20 border-t border-outline-variant/30">
        <h2 className="text-3xl font-extrabold text-center mb-4">Three Specialized Modules</h2>
        <p className="text-on-surface-variant text-center max-w-xl mx-auto mb-12">
          Reserveze packages full operational flow into distinct hubs, tailor-made for platform administrators, business managers, and clients.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Card 1: Merchant Hub */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Merchant Panel</h3>
              <p className="text-sm text-on-surface-variant mb-6">
                The ultimate command center for business owners. Configure multi-calendar views, service libraries, availability thresholds, CRM lists, and track overall metrics.
              </p>
            </div>
            <div className="space-y-3">
              <Link 
                href="/merchant/dashboard" 
                className="w-full bg-primary hover:bg-primary-container text-on-primary py-2.5 rounded-lg text-sm font-semibold text-center block transition-colors"
              >
                Go to Merchant Dashboard
              </Link>
              <Link 
                href="/login" 
                className="w-full bg-secondary/15 hover:bg-secondary/25 border border-secondary/30 text-secondary py-2 rounded-lg text-xs font-bold text-center block transition-colors"
              >
                Team Member / Staff Login
              </Link>
              <Link 
                href="/merchant/calendar" 
                className="w-full border border-outline-variant/40 hover:bg-surface-container-low text-on-surface py-2.5 rounded-lg text-sm font-semibold text-center block transition-colors"
              >
                View Interactive Calendar
              </Link>
            </div>
          </div>

          {/* Card 2: Customer Flow */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="bg-secondary/10 text-secondary w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Customer Booking Journey</h3>
              <p className="text-sm text-on-surface-variant mb-6">
                Fully responsive, high-performance customer interface. Guide clients through service selection, timezone-aware date picking, details submission, and confirmations.
              </p>
            </div>
            <div className="space-y-3">
              <Link 
                href="/booking/mock-business" 
                className="w-full bg-secondary hover:bg-secondary-container text-on-secondary py-2.5 rounded-lg text-sm font-semibold text-center block transition-colors"
              >
                Open Booking Screen
              </Link>
              <Link 
                href="/booking/track/mock-appt-id" 
                className="w-full border border-outline-variant/40 hover:bg-surface-container-low text-on-surface py-2.5 rounded-lg text-sm font-semibold text-center block transition-colors"
              >
                Open Live Tracking Portal
              </Link>
            </div>
          </div>

          {/* Card 3: Platform Governance */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="bg-tertiary/10 text-tertiary w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <Settings className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Master Admin Panel</h3>
              <p className="text-sm text-on-surface-variant mb-6">
                Platform-level controls for SaaS operators. Manage registered businesses, subscription tiers, global system configuration, and audit server event logs.
              </p>
            </div>
            <div className="space-y-3">
              <div className="p-3 text-xs bg-surface-container rounded-lg border border-outline-variant/20 mb-3 text-center text-on-surface-variant">
                Platform governance mock sandbox
              </div>
              <div className="opacity-60 pointer-events-none w-full bg-outline/20 text-on-surface py-2.5 rounded-lg text-sm font-semibold text-center block">
                Master Admin Portal (Production)
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Smarter Notification Engine Specs */}
      <section id="notification-engine" className="max-w-7xl mx-auto px-6 py-20 border-t border-outline-variant/30 bg-surface-container-low rounded-3xl mb-20">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          
          <div className="flex-1 space-y-6">
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Budget-First Architecture</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Smarter Notification Engine
            </h2>
            <p className="text-on-surface-variant">
              Communication costs can drain SaaS wallets. Reserveze implements a budget-conscious dispatch engine that keeps SMS and WhatsApp costs minimal without compromising the user experience.
            </p>
            
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-secondary/20 text-secondary flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckIcon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Single Channel Preference</h4>
                  <p className="text-xs text-on-surface-variant">Customers pick one primary alerts delivery method (SMS, WhatsApp, or Email) with visual nudges steering them to free email/calendar sync.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-secondary/20 text-secondary flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckIcon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">The &quot;Single-Text&quot; Tracking Portal</h4>
                  <p className="text-xs text-on-surface-variant">Instead of texting on every status update, a single text sends a dynamic web portal link where clients track progress live.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-secondary/20 text-secondary flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckIcon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Smarter Reminder Cascades</h4>
                  <p className="text-xs text-on-surface-variant">24 hours before, we send a free confirmation email. Fallback mobile SMS/WhatsApp reminders only trigger if the email remains unconfirmed 4 hours prior.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-secondary/20 text-secondary flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckIcon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Rate-Limits & Cooldowns</h4>
                  <p className="text-xs text-on-surface-variant">Hard cap of 3 mobile alerts per booking, and a 15-minute cooldown timer for rapid reschedules, reverting to email only.</p>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="flex-1 w-full bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 shadow-md">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Cascade Workflow Simulator
            </h3>
            
            <div className="space-y-4 relative">
              <div className="border-l-2 border-outline-variant/50 absolute left-6 top-8 bottom-8 z-0"></div>
              
              <div className="flex gap-4 items-start relative z-10">
                <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold">24h</div>
                <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/30 flex-1">
                  <span className="text-xs font-bold text-primary block">Step 1: Email Confirmation</span>
                  <p className="text-xs text-on-surface-variant mt-1">Interactive email dispatched (Cost: $0.00)</p>
                </div>
              </div>

              <div className="flex gap-4 items-start relative z-10">
                <div className="w-12 h-12 rounded-full bg-surface-container-high border border-outline-variant/40 flex items-center justify-center font-bold text-xs">Check</div>
                <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/30 flex-1">
                  <span className="text-xs font-bold text-on-surface block">Step 2: Monitoring State</span>
                  <p className="text-xs text-on-surface-variant mt-1">Waiting for customer to click &quot;Confirm Appointment&quot; on tracking web app.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start relative z-10">
                <div className="w-12 h-12 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold">4h</div>
                <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/30 flex-1">
                  <span className="text-xs font-bold text-secondary block">Step 3: Trigger Mobile Fallback</span>
                  <p className="text-xs text-on-surface-variant mt-1">Only if unconfirmed, dispatch SMS or WhatsApp template (Cost: $0.015 - Deducted from merchant credit cap).</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-variant/30 py-12 px-6 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-on-primary p-1.5 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-primary">Reserveze</span>
          </div>
          <span className="text-xs text-on-surface-variant">&copy; 2026 Reserveze SaaS. Built with Next.js & MongoDB Atlas. Optimized for SEO.</span>
        </div>
      </footer>
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
