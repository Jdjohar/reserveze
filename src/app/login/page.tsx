'use client';

import { useState, useEffect } from 'react';
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
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true); // Toggle login vs signup
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('merchant_email');
      localStorage.removeItem('merchant_name');
      localStorage.removeItem('merchant_business_id');
      localStorage.removeItem('assigned_calendar_ids');
      localStorage.removeItem('needs_password_change');
      
      const cleanNextAuth = async () => {
        try {
          const { signOut } = await import('next-auth/react');
          await signOut({ redirect: false });
        } catch (err) {}
      };
      cleanNextAuth();
    }
  }, []);

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
            if (data.needsPasswordChange) {
              localStorage.setItem('needs_password_change', 'true');
            } else {
              localStorage.removeItem('needs_password_change');
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

      if (showOtpScreen) {
        if (!otpCode) {
          setError('Please enter the 6-digit verification code.');
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
              businessName,
              otpCode
            })
          });
          const data = await res.json();
          setLoading(false);
          if (data.success) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('merchant_email', data.user.email);
              localStorage.setItem('merchant_name', data.user.name);
              localStorage.removeItem('merchant_business_id');

              // Push GTM conversion goal event
              (window as any).dataLayer = (window as any).dataLayer || [];
              (window as any).dataLayer.push({
                event: 'trial_signup',
                user_email: data.user.email,
                user_name: data.user.name
              });
            }
            setMessage('Account verified and created successfully! Redirecting...');
            setTimeout(() => {
              router.push('/merchant/onboarding');
            }, 1200);
          } else {
            setError(data.error || 'Failed to verify OTP code.');
          }
        } catch (err) {
          setLoading(false);
          setError('Connection error. Please try again.');
        }
      } else {
        setLoading(true);
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'send-signup-otp',
              email
            })
          });
          const data = await res.json();
          setLoading(false);
          if (data.success) {
            setShowOtpScreen(true);
            setMessage('A 6-digit verification code has been sent to your email. Enter it below to register.');
          } else {
            setError(data.error || 'Failed to send verification code.');
          }
        } catch (err) {
          setLoading(false);
          setError('Connection error. Please try again.');
        }
      }
    }
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
              Sign {isLogin ? 'in' : 'up'} with Google
            </span>
            <button 
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/merchant/dashboard' })}
              className="w-full flex items-center justify-center gap-2 border border-outline-variant/30 hover:bg-[#f2f3ff] rounded-xl py-3 text-xs font-bold transition-all hover:border-[#3525cd]/40"
            >
              {/* SVG Google logo */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-outline-variant/20"></div>
            <span className="flex-shrink mx-4 text-[9px] font-bold text-on-surface-variant uppercase">Or use credentials</span>
            <div className="flex-grow border-t border-outline-variant/20"></div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* If OTP screen is active */}
            {!isLogin && showOtpScreen ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Email Verification Code *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter 6-digit OTP code"
                      maxLength={6}
                      className="w-full text-center tracking-widest text-sm font-extrabold bg-surface-container rounded-lg pl-9 pr-4 py-3 border border-outline-variant/30 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOtpScreen(false);
                      setError('');
                      setMessage('');
                    }}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    ← Edit Details / Go Back
                  </button>
                </div>
              </div>
            ) : (
              <>
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
                        className="w-full text-xs bg-[#0b0f19]/30 rounded-lg pl-9 pr-4 py-2.5 border border-outline-variant/30 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </>
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
                  <span>{isLogin ? 'Sign In' : (showOtpScreen ? 'Confirm & Verify Signup' : 'Create Merchant Account')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>


        </div>

        {/* Footer switch state link */}
        <div className="bg-surface-container p-4 border-t border-outline-variant/30 text-center text-xs space-y-2">
          <div>
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
          {isLogin && (
            <div className="text-[10px] text-on-surface-variant/80 border-t border-outline-variant/10 pt-2 flex items-center justify-center gap-1">
              <span>Are you a staff member?</span>
              <span className="font-bold text-primary">Team login uses the same credentials form.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
