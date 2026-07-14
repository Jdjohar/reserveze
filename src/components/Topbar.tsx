/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, Sparkles, User, LogOut, Key, X, ShieldCheck, Clock, Mail, Calendar } from 'lucide-react';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('Alex Mercer');
  const [role, setRole] = useState<'Merchant' | 'Manager'>('Merchant');
  const [businessId, setBusinessId] = useState('');

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    clients: any[];
    appointments: any[];
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  // Notification states
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(false);

  // Change password modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');

  const searchRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const validatePasswordStrength = (pass: string) => {
    if (pass.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(pass)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(pass)) return 'Password must contain at least one lowercase letter.';
    if (!/[0-9]/.test(pass)) return 'Password must contain at least one number.';
    if (!/[^A-Za-z0-9]/.test(pass)) return 'Password must contain at least one special character (e.g. @, #, $, etc.).';
    return null;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError('');
    setChangeSuccess('');

    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) {
      setChangeError(strengthError);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setChangeError('Passwords do not match.');
      return;
    }

    setChangeLoading(true);
    try {
      const email = localStorage.getItem('merchant_email');
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-password',
          email,
          newPassword
        })
      });
      const data = await res.json();
      setChangeLoading(false);
      if (data.success) {
        setChangeSuccess('Password updated successfully!');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setChangeSuccess('');
        }, 1500);
      } else {
        setChangeError(data.error || 'Failed to update password.');
      }
    } catch (err) {
      setChangeLoading(false);
      setChangeError('Connection error. Please try again.');
    }
  };

  // Fetch search results
  useEffect(() => {
    if (!searchQuery.trim() || !businessId) {
      setSearchResults(null);
      setSearchDropdownOpen(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search?businessId=${businessId}&q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults({
            clients: data.clients || [],
            appointments: data.appointments || []
          });
          setSearchDropdownOpen(true);
        }
      } catch (err) {
        console.error('Search fetch failed:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, businessId]);

  // Fetch notification list (recent bookings)
  const fetchNotifications = async () => {
    if (!businessId) return;
    try {
      const res = await fetch(`/api/appointments?businessId=${businessId}`);
      const data = await res.json();
      if (data.success && data.appointments) {
        // Map recent appointments to notification objects
        const appts = data.appointments.slice(0, 5); // Latest 5
        setNotifications(appts);
        
        // If there's any PENDING appointment, show the unread red dot
        const hasPending = appts.some((a: any) => a.status === 'PENDING');
        setUnreadNotifications(hasPending);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('merchant_name');
      if (storedName) {
        setUserName(storedName);
      }
      const assignedCalId = localStorage.getItem('assigned_calendar_ids');
      if (assignedCalId) {
        setRole('Manager');
      } else {
        setRole('Merchant');
      }
      const storedBizId = localStorage.getItem('merchant_business_id');
      if (storedBizId) {
        setBusinessId(storedBizId);
      }
    }
  }, []);

  // Fetch notifications once businessId is resolved
  useEffect(() => {
    if (businessId) {
      fetchNotifications();
    }
  }, [businessId]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchDropdownOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b border-outline-variant/30 px-8 flex items-center justify-between bg-surface-container-lowest sticky top-0 z-30">
      
      {/* Page Title & Subtitle */}
      <div className="min-w-0 flex-1 pr-4">
        <h1 className="font-bold text-base sm:text-lg text-on-surface leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-xs text-on-surface-variant mt-0.5 truncate hidden md:block" title={subtitle}>{subtitle}</p>}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-6 flex-shrink-0">
        
        {/* Search Bar */}
        <div ref={searchRef} className="relative hidden sm:block">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search appointments, clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults) setSearchDropdownOpen(true);
            }}
            className="w-64 bg-surface-container text-xs rounded-lg pl-9 pr-4 py-2 border border-outline-variant/30 focus:outline-none focus:border-primary/50 transition-colors"
          />
          {searchLoading && (
            <span className="absolute inset-y-0 right-3 flex items-center text-[10px] text-primary animate-pulse">
              loading...
            </span>
          )}

          {/* Search Dropdown Overlay */}
          {searchDropdownOpen && searchResults && (
            <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg p-3 z-40 max-h-96 overflow-y-auto space-y-3.5 text-xs">
              
              {/* Clients Section */}
              <div>
                <h4 className="font-bold text-[10px] text-primary uppercase tracking-wider mb-1.5 pb-1 border-b border-outline-variant/10">
                  Matching Customers
                </h4>
                {searchResults.clients.length === 0 ? (
                  <p className="text-[10px] text-on-surface-variant italic p-1">No customers matched.</p>
                ) : (
                  <div className="space-y-1.5">
                    {searchResults.clients.map((c) => (
                      <div 
                        key={c._id}
                        onClick={() => {
                          setSearchDropdownOpen(false);
                          router.push(`/merchant/clients?search=${encodeURIComponent(c.firstName + ' ' + c.lastName)}`);
                        }}
                        className="p-2 hover:bg-surface-container rounded-lg cursor-pointer transition-colors"
                      >
                        <p className="font-bold text-on-surface">{c.firstName} {c.lastName}</p>
                        <p className="text-[9px] text-on-surface-variant font-medium mt-0.5">{c.email} • {c.phone || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Appointments Section */}
              <div>
                <h4 className="font-bold text-[10px] text-secondary uppercase tracking-wider mb-1.5 pb-1 border-b border-outline-variant/10">
                  Matching Bookings
                </h4>
                {searchResults.appointments.length === 0 ? (
                  <p className="text-[10px] text-on-surface-variant italic p-1">No appointments matched.</p>
                ) : (
                  <div className="space-y-1.5">
                    {searchResults.appointments.map((a) => (
                      <div 
                        key={a._id}
                        onClick={() => {
                          setSearchDropdownOpen(false);
                          router.push(`/merchant/calendar`);
                        }}
                        className="p-2 hover:bg-surface-container rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-on-surface">{a.clientName}</p>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                            a.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-700' :
                            a.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-600' :
                            a.status === 'CANCELLED' ? 'bg-red-500/10 text-red-700' :
                            'bg-blue-500/10 text-blue-700'
                          }`}>
                            {a.status}
                          </span>
                        </div>
                        <p className="text-[9px] text-on-surface-variant font-medium mt-0.5">{a.serviceName}</p>
                        <p className="text-[8px] text-outline mt-0.5 flex items-center gap-1 font-semibold">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(a.startTime).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Panel Role Badge */}
        {role === 'Merchant' ? (
          <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider shadow-sm">
            Merchant Admin
          </span>
        ) : (
          <span className="bg-secondary/10 text-secondary border border-secondary/20 text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider shadow-sm">
            Branch Manager
          </span>
        )}

        {/* SMS Credits Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20 text-xs font-bold text-primary">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Credits: 85/100</span>
        </div>

        {/* Notification Bell */}
        <div ref={bellRef} className="relative">
          <button 
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            )}
          </button>

          {/* Notification Dropdown Overlay */}
          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg py-2 z-40 text-xs">
              <div className="px-4 py-2 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/20">
                <span className="font-bold text-on-surface">Recent Booking Activities</span>
                {unreadNotifications && (
                  <span className="text-[8px] bg-secondary/10 text-secondary font-extrabold px-1.5 py-0.5 rounded">Action Needed</span>
                )}
              </div>
              
              <div className="divide-y divide-outline-variant/10 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-[10px] text-on-surface-variant italic p-4 text-center">No recent bookings recorded.</p>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n._id}
                      onClick={() => {
                        setNotificationOpen(false);
                        router.push('/merchant/dashboard');
                      }}
                      className="p-3 hover:bg-surface-container cursor-pointer transition-colors flex items-start gap-2.5"
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        n.status === 'PENDING' ? 'bg-amber-500' :
                        n.status === 'CONFIRMED' ? 'bg-emerald-500' :
                        n.status === 'CANCELLED' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="grow space-y-0.5">
                        <p className="font-semibold text-on-surface leading-tight">
                          {n.status === 'PENDING' && `New booking request from ${n.clientName}`}
                          {n.status === 'CONFIRMED' && `Booking confirmed for ${n.clientName}`}
                          {n.status === 'CANCELLED' && `Booking cancelled by ${n.clientName}`}
                          {n.status === 'COMPLETED' && `Session completed for ${n.clientName}`}
                          {n.status === 'RESCHEDULED' && `Booking rescheduled for ${n.clientName}`}
                        </p>
                        <p className="text-[9px] text-on-surface-variant font-medium">{n.serviceName}</p>
                        <p className="text-[8px] text-outline flex items-center gap-0.5 font-bold mt-1">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(n.startTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Dropdown */}
        <div className="relative">
          <div 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 pl-4 border-l border-outline-variant/30 cursor-pointer select-none"
          >
            <div className="text-right hidden md:flex flex-col justify-center min-w-[100px] flex-shrink-0">
              <h4 className="font-bold text-xs text-on-surface whitespace-nowrap">{userName}</h4>
              <p className="text-[10px] text-on-surface-variant font-bold whitespace-nowrap">
                {role === 'Merchant' ? 'Merchant Admin' : 'Branch Manager'}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/30 text-on-surface-variant">
              <User className="w-4 h-4" />
            </div>
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg py-1.5 z-40 text-xs">
              <button 
                onClick={() => {
                  setDropdownOpen(false);
                  setShowPasswordModal(true);
                }}
                className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-surface-container text-on-surface font-semibold transition-colors border-b border-outline-variant/10 pb-2"
              >
                <Key className="w-4 h-4 text-on-surface-variant" />
                <span>Change Password</span>
              </button>
              <Link 
                href="/login"
                className="flex items-center gap-2 px-4 py-2.5 hover:bg-surface-container text-error font-semibold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </Link>
            </div>
          )}
        </div>

      </div>

      {/* Dismissible Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-on-primary text-center relative space-y-2">
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setChangeError('');
                  setChangeSuccess('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                }}
                className="absolute top-4 right-4 text-on-primary/70 hover:text-on-primary hover:bg-white/10 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-white/20 text-on-primary w-10 h-10 rounded-lg flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="font-extrabold text-lg">Change Your Password</h2>
              <p className="text-[10px] opacity-90 leading-relaxed">
                Update your account password. Make sure it conforms to the strong password requirements.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {changeError && (
                <div className="bg-error/10 border border-error/20 text-error p-3 rounded-lg text-xs font-semibold">
                  {changeError}
                </div>
              )}
              {changeSuccess && (
                <div className="bg-secondary/10 border border-secondary/20 text-secondary p-3 rounded-lg text-xs font-semibold">
                  {changeSuccess}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-on-surface-variant">New Password</label>
                <input
                  type="password"
                  required
                  disabled={changeLoading}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs bg-surface-container rounded-lg px-3 py-2.5 border border-outline-variant/30 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-on-surface-variant">Confirm New Password</label>
                <input
                  type="password"
                  required
                  disabled={changeLoading}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs bg-surface-container rounded-lg px-3 py-2.5 border border-outline-variant/30 focus:outline-none"
                />
              </div>

              {/* Password strength checklist helper */}
              <div className="bg-surface-container p-3 rounded-lg text-[10px] text-on-surface-variant font-medium space-y-1 border border-outline-variant/20">
                <p className="font-bold text-on-surface mb-1">Strong Password Requirements:</p>
                <div className="flex items-center gap-1.5">
                  <span className={newPassword.length >= 8 ? 'text-green-600 font-bold' : 'text-on-surface-variant/40'}>✓</span>
                  <span>At least 8 characters long</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={/[A-Z]/.test(newPassword) ? 'text-green-600 font-bold' : 'text-on-surface-variant/40'}>✓</span>
                  <span>At least one uppercase letter (A-Z)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={/[a-z]/.test(newPassword) ? 'text-green-600 font-bold' : 'text-on-surface-variant/40'}>✓</span>
                  <span>At least one lowercase letter (a-z)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={/[0-9]/.test(newPassword) ? 'text-green-600 font-bold' : 'text-on-surface-variant/40'}>✓</span>
                  <span>At least one number (0-9)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-green-600 font-bold' : 'text-on-surface-variant/40'}>✓</span>
                  <span>At least one special character (@, #, $, etc.)</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setChangeError('');
                    setChangeSuccess('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                  }}
                  className="flex-1 border border-outline-variant/30 hover:bg-surface-container text-on-surface py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changeLoading}
                  className="flex-1 bg-primary hover:bg-primary-container text-on-primary py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/10"
                >
                  {changeLoading ? 'Saving...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
