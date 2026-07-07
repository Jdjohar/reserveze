'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  Calendar, 
  ArrowRight,
  User,
  Sparkles,
  Info,
  Building,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true); // Toggle login vs signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (isLogin) {
      if (!email || !password) {
        setError('Please fill in all fields.');
        return;
      }
      setLoading(true);
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'login',
            email,
            password
          })
        });
        const data = await res.json();
        setLoading(false);
        if (data.success) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('merchant_email', data.user.email);
            localStorage.setItem('merchant_name', data.user.name);
            if (data.businessId) {
              localStorage.setItem('merchant_business_id', data.businessId);
            } else {
              localStorage.removeItem('merchant_business_id');
            }
            if (data.assignedCalendarIds) {
              localStorage.setItem('assigned_calendar_ids', JSON.stringify(data.assignedCalendarIds));
            } else {
              localStorage.removeItem('assigned_calendar_ids');
            }
          }
          setMessage('Login successful! Redirecting...');
          setTimeout(() => {
            if (data.businessId) {
              router.push('/merchant/dashboard');
            } else {
              router.push('/merchant/onboarding');
            }
          }, 800);
        } else {
          setError(data.error || 'Invalid credentials.');
        }
      } catch (err) {
        setLoading(false);
        setError('Connection error. Please try again.');
      }
    } else {
      if (!name || !businessName || !email || !password || !confirmPassword) {
        setError('Please fill in all fields.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      setLoading(true);
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'signup',
            email,
            password,
            name,
            businessName
          })
        });
        const data = await res.json();
        setLoading(false);
        if (data.success) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('merchant_email', data.user.email);
            localStorage.setItem('merchant_name', data.user.name);
            localStorage.removeItem('merchant_business_id');
          }
          setMessage('Account registered successfully! Logging you in...');
          setTimeout(() => {
            router.push('/merchant/onboarding');
          }, 1200);
        } else {
          setError(data.error || 'Failed to register account.');
        }
      } catch (err) {
        setLoading(false);
        setError('Connection error. Please try again.');
      }
    }
  };

  const handleSocialAuth = (provider: 'Google' | 'Apple' | 'Facebook') => {
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      setMessage(`Successfully authenticated with ${provider}!`);
      setTimeout(() => {
        router.push('/merchant/dashboard');
      }, 1000);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Banner header */}
        <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-on-primary text-center space-y-2">
          <div className="bg-white/20 text-on-primary w-10 h-10 rounded-lg flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="font-extrabold text-xl">{isLogin ? 'Sign into Reserveze' : 'Create Merchant Account'}</h2>
          <p className="text-xs opacity-80">{isLogin ? 'Access your scheduling dashboard.' : 'Start automating your business today.'}</p>
        </div>

        <div className="p-8 space-y-6">
          
          {/* Messages */}
          {error && (
            <div className="bg-error/10 border border-error/20 text-error p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div className="bg-secondary/10 border border-secondary/20 text-secondary p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{message}</span>
            </div>
          )}

          {/* Social login buttons */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block text-center">
              Sign {isLogin ? 'in' : 'up'} with social accounts
            </span>
            <div className="grid grid-cols-3 gap-2">
              {/* Google */}
              <button 
                type="button"
                onClick={() => handleSocialAuth('Google')}
                className="flex items-center justify-center gap-1.5 border border-outline-variant/30 hover:bg-surface-container rounded-lg py-2.5 text-[10px] font-bold transition-colors"
              >
                {/* SVG Google logo */}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google</span>
              </button>

              {/* Apple */}
              <button 
                type="button"
                onClick={() => handleSocialAuth('Apple')}
                className="flex items-center justify-center gap-1.5 border border-outline-variant/30 hover:bg-surface-container rounded-lg py-2.5 text-[10px] font-bold transition-colors"
              >
                {/* SVG Apple logo */}
                <svg className="w-3.5 h-3.5 fill-on-surface" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.84-.98 2.94 1.07.08 2.15-.52 2.81-1.33z"/>
                </svg>
                <span>Apple</span>
              </button>

              {/* Facebook */}
              <button 
                type="button"
                onClick={() => handleSocialAuth('Facebook')}
                className="flex items-center justify-center gap-1.5 border border-outline-variant/30 hover:bg-surface-container rounded-lg py-2.5 text-[10px] font-bold transition-colors"
              >
                {/* SVG Facebook logo */}
                <svg className="w-3.5 h-3.5 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-outline-variant/20"></div>
            <span className="flex-shrink mx-4 text-[9px] font-bold text-on-surface-variant uppercase">Or use email credential</span>
            <div className="flex-grow border-t border-outline-variant/20"></div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* Full Name (Signup only) */}
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Full Name *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full text-xs bg-surface-container rounded-lg pl-9 pr-4 py-2.5 border border-outline-variant/30 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Business Name (Signup only) */}
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Business Name *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                    <Building className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Vanguard Wellness Salon"
                    className="w-full text-xs bg-surface-container rounded-lg pl-9 pr-4 py-2.5 border border-outline-variant/30 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase">Email Address *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@business.com"
                  className="w-full text-xs bg-surface-container rounded-lg pl-9 pr-4 py-2.5 border border-outline-variant/30 focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Password *</label>
                {isLogin && (
                  <Link href="/forgot-password" className="text-[10px] font-bold text-primary hover:underline">
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs bg-surface-container rounded-lg pl-9 pr-4 py-2.5 border border-outline-variant/30 focus:outline-none"
                />
              </div>
            </div>

            {/* Confirm Password (Signup only) */}
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Confirm Password *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs bg-surface-container rounded-lg pl-9 pr-4 py-2.5 border border-outline-variant/30 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Action button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-container text-on-primary py-3 rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>Processing auth request...</span>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Merchant Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Sandbox creds alert box */}
          <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/30 space-y-1.5 text-[10px] text-on-surface-variant leading-relaxed">
            <span className="font-bold text-primary flex items-center gap-1 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Sandbox Authentication
            </span>
            <p>
              OAuth channels (Google & Apple) are fully simulated. If using credential fields, enter any email and password combination.
            </p>
          </div>

        </div>

        {/* Footer switch state link */}
        <div className="bg-surface-container p-4 border-t border-outline-variant/30 text-center text-xs">
          <span className="text-on-surface-variant">
            {isLogin ? "New to Reserveze? " : "Already have an account? "}
          </span>
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setMessage('');
            }}
            className="font-bold text-primary hover:underline"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </div>

      </div>
    </div>
  );
}
