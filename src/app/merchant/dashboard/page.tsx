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
  Users
} from 'lucide-react';
import Link from 'next/link';

interface AppointmentObj {
  _id: string;
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('merchant_name');
      if (storedName) {
        setMerchantName(storedName);
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

        const url = storedBizId ? `/api/appointments?businessId=${storedBizId}` : '/api/appointments';
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

  // Calculate dynamic stats
  const today = new Date().toDateString();
  const todayBookings = appointments.filter(a => new Date(a.startTime).toDateString() === today);
  const cancelledBookings = appointments.filter(a => a.status === 'CANCELLED');
  const completedBookings = appointments.filter(a => a.status === 'COMPLETED');
  
  // Simulated revenue mapping based on sample service price fallback
  const totalRevenue = appointments
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
              ) : appointments.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="bg-primary/10 text-primary w-10 h-10 rounded-full flex items-center justify-center mx-auto">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-xs text-on-surface">No Appointments Registered</h4>
                  <p className="text-[11px] text-on-surface-variant max-w-xs mx-auto">
                    There are no bookings in the database. Share your booking link to let customers schedule dates.
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
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appt) => (
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
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              appt.status === 'CONFIRMED' ? 'bg-secondary/10 text-secondary' : 'bg-yellow-500/10 text-yellow-600'
                            }`}>
                              {appt.status}
                            </span>
                          </td>
                        </tr>
                      ))}
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
      </div>
    </div>
  );
}
