'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { 
  CalendarDays, 
  DollarSign, 
  XOctagon, 
  CheckCircle2, 
  ArrowUpRight, 
  Plus, 
  UserPlus, 
  Link2, 
  Clock, 
  ArrowRight,
  Sparkles,
  Users,
  Check,
  X,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

interface AppointmentObj {
  _id: string;
  calendarId: string;
  startTime: string;
  endTime: string;
  status: string;
  primaryChannel: string;
  notes?: string;
  clientName?: string; // fallback mockup
  serviceName?: string; // fallback mockup
  price?: number; // fallback mockup
}

export default function MerchantDashboard() {
  const [appointments, setAppointments] = useState<AppointmentObj[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchantName, setMerchantName] = useState('Alex');

  // Change password modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');

  const handleUpdateStatus = async (apptId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setAppointments(appointments.map(a => a._id === apptId ? { ...a, status: newStatus } : a));
      } else {
        alert(data.error || 'Failed to update status.');
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert('Network error.');
    }
  };

  // Scoped location filtering states
  const [isRestrictedManager, setIsRestrictedManager] = useState(false);
  const [assignedCalendarIds, setAssignedCalendarIds] = useState<string[]>([]);
  const [dbCalendars, setDbCalendars] = useState<any[]>([]);
  const [selectedCalId, setSelectedCalId] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('merchant_name');
      if (storedName) {
        setMerchantName(storedName);
      }
      const needsChange = localStorage.getItem('needs_password_change');
      if (needsChange === 'true') {
        setShowPasswordModal(true);
      }
    }
  }, []);

  useEffect(() => {
    const initAndFetch = async () => {
      try {
        let storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : null;
        const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('merchant_email') : null;

        // If no businessId in session, look up by logged-in user email
        if (!storedBizId && storedEmail) {
          const res = await fetch(`/api/business?email=${storedEmail}`);
          const data = await res.json();
          if (data.success && data.business) {
            storedBizId = data.business._id;
            localStorage.setItem('merchant_business_id', data.business._id);
          }
        }

        if (!storedBizId) return;

        // Fetch calendars (locations)
        const calRes = await fetch(`/api/calendars?businessId=${storedBizId}`);
        const calData = await calRes.json();
        let listCals = [];
        if (calData.success) {
          listCals = calData.calendars || [];
          setDbCalendars(listCals);
        }

        // Check restricted manager status
        let isRestricted = false;
        let assignedIds: string[] = [];
        const rawAssigned = localStorage.getItem('assigned_calendar_ids');
        if (rawAssigned) {
          try {
            const parsed = JSON.parse(rawAssigned);
            if (Array.isArray(parsed) && parsed.length > 0) {
              isRestricted = true;
              assignedIds = parsed;
              setIsRestrictedManager(true);
              setAssignedCalendarIds(parsed);
            }
          } catch {}
        }

        // Set default location selection
        if (isRestricted) {
          setSelectedCalId(assignedIds[0]);
        } else {
          setSelectedCalId('primary');
        }

        const url = `/api/appointments?businessId=${storedBizId}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setAppointments(data.appointments);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    initAndFetch();
  }, []);

  // Password change submission handler
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
        setChangeSuccess('Password updated successfully! Welcome to Reserveze.');
        localStorage.removeItem('needs_password_change');
        setTimeout(() => {
          setShowPasswordModal(false);
        }, 1500);
      } else {
        setChangeError(data.error || 'Failed to update password.');
      }
    } catch (err) {
      setChangeLoading(false);
      setChangeError('Connection error. Please try again.');
    }
  };

  // Find the primary calendar ID
  const primaryCalId = dbCalendars.reduce((oldest, current) => {
    if (!oldest) return current._id;
    return current._id < oldest ? current._id : oldest;
  }, '');

  // Filter the appointments according to scope
  const filteredAppointments = appointments.filter(appt => {
    // If restricted manager, only show their assigned locations
    if (isRestrictedManager) {
      return assignedCalendarIds.includes(appt.calendarId);
    }

    // Owner filters:
    if (selectedCalId === 'primary') {
      return appt.calendarId === primaryCalId;
    }
    if (selectedCalId && selectedCalId !== 'all') {
      return appt.calendarId === selectedCalId;
    }
    return true; // 'all'
  });

  // Calculate dynamic stats
  const today = new Date().toDateString();
  const todayBookings = filteredAppointments.filter(a => new Date(a.startTime).toDateString() === today);
  const cancelledBookings = filteredAppointments.filter(a => a.status === 'CANCELLED');
  const completedBookings = filteredAppointments.filter(a => a.status === 'COMPLETED');
  
  // Simulated revenue mapping based on sample service price fallback
  const totalRevenue = filteredAppointments
    .filter(a => a.status !== 'CANCELLED')
    .reduce((sum, a) => sum + (a.price || 45), 0);

  const stats = [
    { title: "Today's Appointments", value: todayBookings.length.toString(), change: "Live from database", icon: CalendarDays, color: "text-primary bg-primary/10" },
    { title: "Weekly Revenue", value: `$${totalRevenue}`, change: "Calculated total", icon: DollarSign, color: "text-secondary bg-secondary/10" },
    { title: "Cancelled Slots", value: cancelledBookings.length.toString(), change: "Status: CANCELLED", icon: XOctagon, color: "text-error bg-error/10" },
    { title: "Completed Sessions", value: completedBookings.length.toString(), change: "Status: COMPLETED", icon: CheckCircle2, color: "text-secondary bg-secondary/10" }
  ];

  const holidays = [
    { name: "Independence Day", date: "July 4, 2026", type: "National Holiday" },
    { name: "Labor Day", date: "September 7, 2026", type: "National Holiday" }
  ];

  return (
    <div className="flex bg-surface-container-low min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Merchant Operational Dashboard" subtitle={`Welcome back, ${merchantName}. Here is your overview for today.`} />

        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          
          {/* Scope selector bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm">
            <div className="space-y-1">
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">Active Location Overview</h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Viewing analytics and schedule details for the selected branch calendar.
              </p>
            </div>
            <div className="w-full sm:w-60">
              {isRestrictedManager ? (
                <select
                  value={selectedCalId}
                  disabled
                  className="w-full bg-surface-container text-xs rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none font-bold text-on-surface-variant opacity-75 cursor-not-allowed"
                >
                  {dbCalendars.filter(cal => assignedCalendarIds.includes(cal._id)).map(cal => (
                    <option key={cal._id} value={cal._id}>📍 {cal.name}</option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedCalId}
                  onChange={(e) => setSelectedCalId(e.target.value)}
                  className="w-full bg-surface-container-lowest text-xs rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none font-bold text-on-surface"
                >
                  <option value="primary">🏢 Primary Location</option>
                  {dbCalendars.map(cal => (
                    <option key={cal._id} value={cal._id}>📍 {cal.name}</option>
                  ))}
                  <option value="all">🌍 All Locations (Central View)</option>
                </select>
              )}
            </div>
          </div>

          {/* Dashboard Headline Alerts */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-lg text-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-on-surface">Smart Notification Engine Active</h4>
                <p className="text-xs text-on-surface-variant">We've saved you SMS fees this week by routing confirmations to free email and using tracking links.</p>
              </div>
            </div>
            <Link 
              href="/merchant/notifications" 
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              Configure engine
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 hover:shadow-sm transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">{stat.title}</span>
                    <div className={`p-2 rounded-lg ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-extrabold text-on-surface">{stat.value}</h3>
                    <p className="text-[11px] text-on-surface-variant font-medium mt-1">{stat.change}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Tables Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left Col: Upcoming Bookings (2/3 width) */}
            <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-base">Upcoming Appointments</h3>
                <Link href="/merchant/calendar" className="text-xs text-primary hover:underline font-bold flex items-center gap-0.5">
                  Full Calendar <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>

              {loading ? (
                <div className="text-center py-10 text-xs text-on-surface-variant font-bold">
                  Loading appointments from MongoDB...
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="bg-primary/10 text-primary w-10 h-10 rounded-full flex items-center justify-center mx-auto">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-xs text-on-surface">No Appointments Registered</h4>
                  <p className="text-[11px] text-on-surface-variant max-w-xs mx-auto">
                    There are no bookings in the database for the selected scope. Share your booking link to let customers schedule dates.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/30 text-on-surface-variant font-bold uppercase tracking-wider">
                        <th className="py-3 px-2">Client</th>
                        <th className="py-3 px-2">Service</th>
                        <th className="py-3 px-2">Time</th>
                        <th className="py-3 px-2">Channel</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppointments.map((appt) => {
                        const statusStyle = 
                          appt.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-700' :
                          appt.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-600' :
                          appt.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-700' :
                          'bg-red-500/10 text-red-700';
                        return (
                          <tr key={appt._id} className="border-b border-outline-variant/20 hover:bg-surface-container-low/30 transition-colors">
                            <td className="py-3.5 px-2 font-bold text-on-surface">{appt.clientName || 'Mock Client'}</td>
                            <td className="py-3.5 px-2 text-on-surface-variant">{appt.serviceName || 'Mock Service'}</td>
                            <td className="py-3.5 px-2 font-medium text-on-surface">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-outline" />
                                {new Date(appt.startTime).toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3.5 px-2">
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-primary/10 text-primary uppercase">
                                {appt.primaryChannel}
                              </span>
                            </td>
                            <td className="py-3.5 px-2">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${statusStyle}`}>
                                {appt.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-2 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {appt.status === 'PENDING' && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateStatus(appt._id, 'CONFIRMED')}
                                      title="Approve"
                                      className="p-1 bg-green-500/10 hover:bg-green-500/20 text-green-700 rounded transition-colors"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleUpdateStatus(appt._id, 'CANCELLED')}
                                      title="Cancel"
                                      className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded transition-colors"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                {appt.status === 'CONFIRMED' && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateStatus(appt._id, 'COMPLETED')}
                                      title="Complete"
                                      className="p-1 bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors"
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleUpdateStatus(appt._id, 'CANCELLED')}
                                      title="Cancel"
                                      className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded transition-colors"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right Col: Quick Actions & Holidays (1/3 width) */}
            <div className="space-y-8">
              
              {/* Quick Actions Card */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-base">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-3">
                  <Link 
                    href="/merchant/calendar?action=new" 
                    className="flex items-center gap-3 p-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 rounded-lg text-xs font-semibold text-on-surface transition-colors"
                  >
                    <div className="bg-primary text-on-primary p-1.5 rounded-md">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span>Add New Appointment</span>
                  </Link>
                  <Link 
                    href="/merchant/clients?action=new" 
                    className="flex items-center gap-3 p-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 rounded-lg text-xs font-semibold text-on-surface transition-colors"
                  >
                    <div className="bg-secondary text-on-secondary p-1.5 rounded-md">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <span>Add New Client</span>
                  </Link>
                  <Link 
                    href="/merchant/share" 
                    className="flex items-center gap-3 p-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 rounded-lg text-xs font-semibold text-on-surface transition-colors"
                  >
                    <div className="bg-tertiary text-on-tertiary p-1.5 rounded-md">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <span>Share Booking Links</span>
                  </Link>
                </div>
              </div>

              {/* Bank Holidays Card */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-base">Holiday Autopermission Sync</h3>
                <div className="space-y-3.5">
                  {holidays.map((holiday, i) => (
                    <div key={i} className="flex justify-between items-start text-xs border-b border-outline-variant/10 pb-2 last:border-0 last:pb-0">
                      <div>
                        <h4 className="font-bold text-on-surface">{holiday.name}</h4>
                        <span className="text-[10px] text-on-surface-variant font-medium">{holiday.type}</span>
                      </div>
                      <span className="font-bold text-on-surface-variant">{holiday.date}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </main>
      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-on-primary text-center space-y-2">
              <div className="bg-white/20 text-on-primary w-10 h-10 rounded-lg flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="font-extrabold text-lg">Change Temporary Password</h2>
              <p className="text-[10px] opacity-90 leading-relaxed">
                For security reasons, you must update your temporary password to a strong personal password before accessing the panel.
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

              <button
                type="submit"
                disabled={changeLoading}
                className="w-full bg-primary hover:bg-primary-container text-on-primary py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2"
              >
                {changeLoading ? 'Updating Password...' : 'Save Strong Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
