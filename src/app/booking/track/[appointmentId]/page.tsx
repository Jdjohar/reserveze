'use client';

import { useState, useEffect, use } from 'react';
import { 
  Check, 
  Clock, 
  MapPin, 
  User, 
  Calendar, 
  AlertCircle,
  MessageSquare,
  Sparkles,
  ChevronRight,
  TrendingDown,
  Mail,
  Smartphone
} from 'lucide-react';
import Link from 'next/link';

export default function CustomerTrackingPortal({ params }: { params: Promise<{ appointmentId: string }> }) {
  const resolvedParams = use(params);
  const appointmentId = resolvedParams.appointmentId;
  const [appt, setAppt] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('PENDING');
  const [message, setMessage] = useState('');
  const [cooldownTime, setCooldownTime] = useState<number | null>(null);

  // Load appointment details on mount
  useEffect(() => {
    if (!appointmentId || appointmentId === 'mock-appt-id') {
      setError('Invalid or Mock appointment reference.');
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/appointments/${appointmentId}`);
        const data = await res.json();
        if (data.success) {
          setAppt(data.appointment);
          setStatus(data.appointment.status);
          setClient(data.client);
          setService(data.service);
          setBusiness(data.business);
        } else {
          setError(data.error || 'Failed to load booking details.');
        }
      } catch (err) {
        console.error('Failed to get tracking details:', err);
        setError('Network error. Failed to load booking.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [appointmentId]);

  // Cooldown countdown timer simulation
  useEffect(() => {
    if (cooldownTime === null) return;
    if (cooldownTime <= 0) {
      setCooldownTime(null);
      return;
    }
    const timer = setTimeout(() => setCooldownTime(cooldownTime - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldownTime]);

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' })
      });
      const data = await res.json();
      if (data.success) {
        setStatus('CANCELLED');
        setMessage('Your appointment has been cancelled successfully.');
      } else {
        setMessage(data.error || 'Failed to cancel appointment.');
      }
    } catch (err) {
      console.error('Failed to cancel:', err);
      setMessage('Network error. Please try again.');
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleReschedule = () => {
    if (cooldownTime !== null) return;
    setMessage('Rescheduled slot requested. Cooldown active (15m fallback to email only).');
    setCooldownTime(900); // 15 mins = 900 seconds
    setTimeout(() => setMessage(''), 5000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getFormatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFormatTimeRange = (startStr?: string, endStr?: string) => {
    if (!startStr || !endStr) return '';
    const start = new Date(startStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const end = new Date(endStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${start} — ${end}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-xl p-8 text-center text-xs">
          <span className="font-bold text-on-surface-variant animate-pulse">Syncing tracking status from database...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-xl p-8 text-center text-xs space-y-4">
          <AlertCircle className="w-8 h-8 text-error mx-auto" />
          <h3 className="font-bold text-sm text-on-surface">Unable to Track Booking</h3>
          <p className="text-on-surface-variant max-w-xs mx-auto leading-relaxed">{error}</p>
          <div className="pt-2">
            <Link 
              href="/"
              className="text-primary font-bold hover:underline"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-xl overflow-hidden space-y-6">
        
        {/* Portal Header */}
        <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-on-primary">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-extrabold text-lg">Booking Tracking Portal</h2>
              <p className="text-[11px] opacity-85 mt-1">Appt ID: appt_{appointmentId}</p>
            </div>
            <span className="text-[10px] font-bold bg-white/20 px-2.5 py-1 rounded-full uppercase flex items-center gap-0.5">
              <Sparkles className="w-3 h-3" /> Live Sync Active
            </span>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div className="mx-6 bg-primary/10 border border-primary/20 text-primary p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        <div className="px-6 space-y-6">

          {/* Stepper Status Indicators */}
          <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/30 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Status Tracking</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                status === 'CONFIRMED' ? 'bg-secondary/15 text-secondary' : 
                status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-600' : 
                status === 'COMPLETED' ? 'bg-primary/15 text-primary' :
                'bg-error-container/20 text-error'
              }`}>
                {status}
              </span>
            </div>

            {/* Visual Stepper dots */}
            <div className="flex items-center gap-2 relative">
              <div className="w-full bg-outline-variant/40 h-1 absolute top-2.5 left-0 z-0"></div>
              
              {/* Dot 1: Booked */}
              <div className="flex-1 flex flex-col items-center gap-1.5 relative z-10">
                <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold">1</div>
                <span className="text-[9px] font-bold text-on-surface">Booked</span>
              </div>

              {/* Dot 2: Confirmed */}
              <div className="flex-1 flex flex-col items-center gap-1.5 relative z-10">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  status === 'CONFIRMED' || status === 'COMPLETED' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                }`}>2</div>
                <span className="text-[9px] font-bold text-on-surface">Confirmed</span>
              </div>

              {/* Dot 3: Completed */}
              <div className="flex-1 flex flex-col items-center gap-1.5 relative z-10">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  status === 'COMPLETED' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                }`}>3</div>
                <span className="text-[9px] font-bold text-on-surface">Session</span>
              </div>
            </div>
          </div>

          {/* Booking Slot Information Details */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm">Appointment Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-surface-container-low/30 border border-outline-variant/20 rounded-xl text-xs">
                <Calendar className="w-4.5 h-4.5 text-primary" />
                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold block uppercase leading-none">Date</span>
                  <span className="font-bold text-on-surface mt-0.5 block">{getFormatDate(appt?.startTime)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-surface-container-low/30 border border-outline-variant/20 rounded-xl text-xs">
                <Clock className="w-4.5 h-4.5 text-secondary" />
                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold block uppercase leading-none">Time Slot</span>
                  <span className="font-bold text-on-surface mt-0.5 block">
                    {getFormatTimeRange(appt?.startTime, appt?.endTime)} ({service?.duration || 30} mins)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-surface-container-low/30 border border-outline-variant/20 rounded-xl text-xs">
                <MapPin className="w-4.5 h-4.5 text-tertiary" />
                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold block uppercase leading-none">Location / Business</span>
                  <span className="font-bold text-on-surface mt-0.5 block">{business?.name || 'Main Calendar'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-surface-container-low/30 border border-outline-variant/20 rounded-xl text-xs">
                <User className="w-4.5 h-4.5 text-primary" />
                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold block uppercase leading-none">Booked Service</span>
                  <span className="font-bold text-on-surface mt-0.5 block">{service?.name || 'Standard Consultation'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Channel summary and wallet details */}
          <div className="bg-surface-container-low/60 rounded-xl p-4 border border-outline-variant/20 space-y-3 text-xs">
            <h4 className="font-bold text-[11px] uppercase tracking-wider text-on-surface-variant">Alert Configuration</h4>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Primary Channel</span>
              <span className="font-bold text-primary flex items-center gap-1 uppercase">
                <Mail className="w-3.5 h-3.5" /> {appt?.primaryChannel || 'EMAIL'}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-outline-variant/10 pt-2">
              <span className="text-on-surface-variant">Sms Surcharge Status</span>
              <span className="font-bold text-secondary flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" /> $0.00 Saved (Free tier)
              </span>
            </div>
          </div>

          {/* Cooldown Warning Notice for Reschedules */}
          {cooldownTime !== null && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-800 rounded-xl p-4 flex gap-3 text-xs">
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-yellow-900 leading-none">Spam Cooldown Protection Active</h4>
                <p className="text-[10px] text-yellow-800 leading-relaxed mt-1">
                  You modified your appointment recently. To protect merchant SMS fees, next dispatches will route to Email only. Cooldown finishes in: <strong>{formatTime(cooldownTime)}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {status !== 'CANCELLED' && (
            <div className="flex gap-4 border-t border-outline-variant/20 pt-6 pb-2">
              <button 
                onClick={handleCancel}
                disabled={actionLoading}
                className="flex-1 py-2.5 border border-outline-variant/40 hover:bg-red-50 text-error rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Cancelling...' : 'Cancel Booking'}
              </button>
              <button 
                onClick={handleReschedule}
                disabled={cooldownTime !== null}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-center transition-all ${
                  cooldownTime !== null 
                    ? 'bg-outline-variant/35 text-on-surface-variant cursor-not-allowed border border-outline-variant/20' 
                    : 'bg-primary hover:bg-primary-container text-on-primary shadow-sm shadow-primary/10'
                }`}
              >
                Reschedule Slot
              </button>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="bg-surface-container p-4 border-t border-outline-variant/30 text-center">
          <span className="text-[10px] text-on-surface-variant font-medium">Powered by Reserveze Booking Sync &copy; 2026</span>
        </div>

      </div>
    </div>
  );
}
