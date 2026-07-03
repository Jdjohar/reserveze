'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  Calendar, 
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP, 3: Reset Password
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    
    // Simulate OTP generation
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setLoading(false);
      setStep(2);
      setMessage(`OTP verification code generated successfully!`);
    }, 1000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otpCode !== generatedOtp) {
      setError('Invalid verification code. Please check the code provided.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMessage('OTP verified successfully!');
      setStep(3);
    }, 800);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMessage('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-on-primary text-center space-y-2">
          <div className="bg-white/20 text-on-primary w-10 h-10 rounded-lg flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="font-extrabold text-xl">Reset Password</h2>
          <p className="text-xs opacity-80">Recover your Reserveze merchant credentials.</p>
        </div>

        <div className="p-8 space-y-6">
          
          {/* Notifications banner */}
          {error && (
            <div className="bg-error/10 border border-error/20 text-error p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div className="bg-secondary/10 border border-secondary/20 text-secondary p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{message}</span>
            </div>
          )}

          {/* OTP Code Sandbox helper (So they can test without actually configuring an SMTP mailer) */}
          {step === 2 && generatedOtp && (
            <div className="bg-primary/10 border border-primary/20 text-primary p-4 rounded-xl space-y-2 text-xs">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Simulated OTP Dispatch
              </span>
              <p className="text-[10px] text-on-surface-variant">
                Since we are running in a sandbox local test workspace, we simulated sending a code to <strong>{email}</strong>. Enter the following code to continue:
              </p>
              <div className="font-extrabold text-lg text-center tracking-widest bg-surface-container-lowest p-2 rounded border border-outline-variant/20 select-all">
                {generatedOtp}
              </div>
            </div>
          )}

          {/* STEP 1: Enter email */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Enter your registered merchant email below. We will send a 6-digit OTP verification code to confirm your identity.
              </p>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Email Address</label>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-container text-on-primary py-3 rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <span>Sending Code...</span> : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Verify OTP Code */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                A verification code was dispatched to <strong>{email}</strong>. Please input the code below to unlock password resetting.
              </p>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Verification Code (OTP)</label>
                <input
                  type="text"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="e.g. 123456"
                  maxLength={6}
                  className="w-full text-center text-sm font-extrabold tracking-widest bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-container text-on-primary py-3 rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <span>Verifying...</span> : (
                  <>
                    <span>Verify Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Reset password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Choose a new secure password for your merchant profile.
              </p>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">New Password *</label>
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

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Confirm New Password *</label>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-container text-on-primary py-3 rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <span>Saving Password...</span> : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Back Link Footer */}
        <div className="bg-surface-container p-4 border-t border-outline-variant/30 text-center text-xs">
          <Link href="/login" className="font-bold text-on-surface-variant hover:text-on-surface flex items-center justify-center gap-1 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
