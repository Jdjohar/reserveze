/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect, use } from 'react';
import { 
  CalendarDays, 
  Clock, 
  User, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  CalendarCheck,
  AlertCircle,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import { validateEmail, validatePhone } from '@/lib/validation';

interface Service {
  id: string;
  name: string;
  duration: number; // total duration in minutes
  durationHours: number;
  durationMinutes: number;
  price: number;
  description: string;
  advanceBookingDays: number;
  advanceBookingHours: number;
  advanceBookingMinutes: number;
  imageUrl?: string;
}

export default function CustomerBookingPage({ params }: { params: Promise<{ businessId: string }> }) {
  const resolvedParams = use(params);
  const businessId = resolvedParams.businessId;
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [primaryChannel, setPrimaryChannel] = useState<'email' | 'whatsapp' | 'sms'>('email');

  // Business contact states
  const [phoneVal, setPhoneVal] = useState('');
  const [emailVal, setEmailVal] = useState('');
  const [addressVal, setAddressVal] = useState('');

  // Other location branches
  const [otherLocations, setOtherLocations] = useState<any[]>([]);

  // Bot protection state variables
  const [botTimestamp, setBotTimestamp] = useState<number>(0);
  const [numA, setNumA] = useState(0);
  const [numB, setNumB] = useState(0);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [createdApptId, setCreatedApptId] = useState('');
  const [welcomeBackMessage, setWelcomeBackMessage] = useState('');

  const handleEmailBlur = async () => {
    if (!email.trim() || !realBusinessId) return;
    try {
      const res = await fetch(`/api/clients?businessId=${realBusinessId}&email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      if (data.success && data.client) {
        setFirstName(data.client.firstName || '');
        setLastName(data.client.lastName || '');
        setPhone(data.client.phone || '');
        setPrimaryChannel(data.client.primaryNotificationChannel || 'email');
        setWelcomeBackMessage(`Welcome back, ${data.client.firstName}! We've prefilled your details.`);
        setTimeout(() => setWelcomeBackMessage(''), 5000);
      }
    } catch (e) {
      console.error('Failed to look up returning customer:', e);
    }
  };

  // Dynamic Date Generator: Next 5 days starting from today
  const [dates, setDates] = useState<Array<{ day: string; date: string; value: string }>>([]);

  useEffect(() => {
    const list = Array.from({ length: 5 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const value = d.toISOString().split('T')[0];
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      return { day: dayName, date: dateStr, value };
    });
    setDates(list);
  }, []);

  // Bot prevention setup on Step 3 mount
  useEffect(() => {
    if (step === 3) {
      setBotTimestamp(Date.now());
      setNumA(Math.floor(Math.random() * 8) + 2);
      setNumB(Math.floor(Math.random() * 8) + 2);
      setCaptchaInput('');
      setCaptchaError('');
      setErrorMessage('');
    }
  }, [step]);

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('Vanguard Wellness Salon');
  const [logoUrl, setLogoUrl] = useState('');
  const [realBusinessId, setRealBusinessId] = useState('');
  const [calendarId, setCalendarId] = useState('');
  const [availabilities, setAvailabilities] = useState<any[]>([]);

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        // 1. Fetch details by checking if ID/Slug is a Calendar Location first
        let activeBizId = businessId;
        let resolvedCalId = '';
        const calCheckRes = await fetch(`/api/calendars/${businessId}`);
        const calCheckData = await calCheckRes.json();

        if (calCheckData.success && calCheckData.calendar) {
          // It's a specific calendar location!
          const cal = calCheckData.calendar;
          setCalendarId(cal._id);
          resolvedCalId = cal._id;
          activeBizId = cal.businessId;
          setRealBusinessId(cal.businessId);

          // Get business profile for logo
          const bizRes = await fetch(`/api/business?businessId=${cal.businessId}`);
          const bizData = await bizRes.json();
          if (bizData.success && bizData.business) {
            setBusinessName(cal.name || bizData.business.name);
            setLogoUrl(bizData.business.logoUrl || '');
            setPhoneVal(cal.phone || bizData.business.phone || '');
            setEmailVal(cal.email || bizData.business.email || '');
            setAddressVal(cal.address || bizData.business.address || '');
          }

          // Fetch other locations of this business
          const otherCalRes = await fetch(`/api/calendars?businessId=${cal.businessId}`);
          const otherCalData = await otherCalRes.json();
          if (otherCalData.success) {
            const list = otherCalData.calendars.filter((c: any) => c._id !== cal._id);
            setOtherLocations(list);
          }
        } else {
          // Standard business profile lookup
          const bizRes = await fetch(`/api/business?businessId=${businessId}`);
          const bizData = await bizRes.json();
          if (bizData.success && bizData.business) {
            setBusinessName(bizData.business.name);
            setLogoUrl(bizData.business.logoUrl || '');
            setPhoneVal(bizData.business.phone || '');
            setEmailVal(bizData.business.email || '');
            setAddressVal(bizData.business.address || '');
            activeBizId = bizData.business._id;
            setRealBusinessId(bizData.business._id);
          }

          // Fetch calendars list
          const calRes = await fetch(`/api/calendars?businessId=${activeBizId}`);
          const calData = await calRes.json();
          if (calData.success && calData.calendars.length > 0) {
            setCalendarId(calData.calendars[0]._id);
          }
        }

        // 3. Fetch availability rules
        const availRes = await fetch(`/api/availability?businessId=${activeBizId}`);
        const availData = await availRes.json();
        if (availData.success) {
          setAvailabilities(availData.availabilities);
        }

        // 4. Fetch team members
        const teamRes = await fetch(`/api/team?businessId=${activeBizId}`);
        const teamData = await teamRes.json();
        if (teamData.success) {
          setEmployees(teamData.employees);
        }

        // 5. Fetch services list (check location scope)
        let servicesUrl = `/api/services?businessId=${activeBizId}`;
        if (resolvedCalId) {
          servicesUrl += `&calendarId=${resolvedCalId}`;
        }
        let res = await fetch(servicesUrl);
        let data = await res.json();
        if (data.success && data.services.length === 0 && resolvedCalId) {
          // Fall back to central business services
          const fallbackRes = await fetch(`/api/services?businessId=${activeBizId}`);
          data = await fallbackRes.json();
        }

        if (data.success) {
          const activeServices = data.services.filter((s: any) => s.isActive !== false);
          const mapped = activeServices.map((s: any) => ({
            ...s,
            id: s._id
          }));
          setServices(mapped);
        }
      } catch (err) {
        console.error('Failed to load booking page data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBusinessData();
  }, [businessId]);

  const isClosedDay = (dateStr: string) => {
    if (availabilities.length === 0) return false;
    const dayOfWeekNum = new Date(dateStr).getDay();
    const rules = availabilities.find(a => a.dayOfWeek === dayOfWeekNum);
    return !rules || !rules.isEnabled;
  };

  const getSlotsForDate = (dateStr: string | null) => {
    if (!dateStr || availabilities.length === 0) {
      return [
        "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", 
        "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", 
        "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"
      ];
    }

    const dayOfWeekNum = new Date(dateStr).getDay();
    const rules = availabilities.find(a => a.dayOfWeek === dayOfWeekNum);
    if (!rules || !rules.isEnabled) return [];

    const slotsList = [];
    const [startH, startM] = rules.startTime.split(':').map(Number);
    const [endH, endM] = rules.endTime.split(':').map(Number);

    let current = new Date();
    current.setHours(startH, startM, 0, 0);

    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    const interval = selectedService ? selectedService.duration : 30;

    while (current.getTime() < end.getTime()) {
      const timeStr = current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      slotsList.push(timeStr);
      current.setMinutes(current.getMinutes() + interval);
    }
    return slotsList;
  };

  const parseSlotTime = (dateStr: string, timeStr: string) => {
    const [time, modifier] = timeStr.split(' ');
    let [hoursStr, minutesStr] = time.split(':');
    let hours = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);
    
    if (modifier === 'PM' && hours < 12) {
      hours += 12;
    }
    if (modifier === 'AM' && hours === 12) {
      hours = 0;
    }
    
    const d = new Date(dateStr);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const isSlotDisabled = (dateStr: string, timeStr: string) => {
    if (!selectedService) return false;
    
    const slotDate = parseSlotTime(dateStr, timeStr);
    const now = new Date();
    
    // Add required advance booking window
    const reqDays = selectedService.advanceBookingDays || 0;
    const reqHours = selectedService.advanceBookingHours || 0;
    const reqMins = selectedService.advanceBookingMinutes || 0;
    
    const advanceTimeMs = (reqDays * 24 * 60 + reqHours * 60 + reqMins) * 60 * 1000;
    const cutoffTime = new Date(now.getTime() + advanceTimeMs);
    
    return slotDate.getTime() < cutoffTime.getTime();
  };

  const handleNext = () => {
    if (step === 1 && !selectedService) return;
    if (step === 2 && (!selectedDate || !selectedTime)) return;
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleConfirm = async () => {
    if (!firstName || !lastName || !email || !selectedService || !selectedDate || !selectedTime) return;

    if (Number(captchaInput) !== (numA + numB)) {
      setCaptchaError('Incorrect math verification answer. Please solve the puzzle correctly.');
      return;
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (emailCheck.isDisposable) {
      setErrorMessage('Disposable email addresses are not allowed. Please use a standard email domain.');
      return;
    }
    if (primaryChannel !== 'email' && !phone.trim()) {
      setErrorMessage(`Mobile phone number is mandatory for receiving booking notifications via ${primaryChannel === 'sms' ? 'SMS' : 'WhatsApp'}.`);
      return;
    }
    if (phone && !validatePhone(phone)) {
      setErrorMessage('Please enter a valid phone number (7 to 15 digits).');
      return;
    }

    setErrorMessage('');
    try {
      // 1. Create client profile first
      const clientRes = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: realBusinessId || businessId,
          calendarId: calendarId || undefined,
          firstName,
          lastName,
          email,
          phone,
          primaryNotificationChannel: primaryChannel
        })
      });
      const clientData = await clientRes.json();
      
      if (!clientData.success) {
        setErrorMessage(clientData.error || 'Failed to initialize customer profile.');
        return;
      }
      
      const clientId = clientData.client._id;

      // 2. Parse slot times
      const start = parseSlotTime(selectedDate, selectedTime);
      const end = new Date(start.getTime() + (selectedService.duration * 60 * 1000));

      // 3. Register appointment with anti-bot inputs
      const apptRes = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarId: calendarId || undefined,
          serviceId: selectedService.id,
          clientId,
          employeeId: selectedEmployee?._id || undefined,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          status: 'PENDING',
          primaryChannel,
          botTimestamp,
          captchaAnswer: numA + numB,
          captchaInput
        })
      });
      
      const apptData = await apptRes.json();
      if (apptData.success) {
        if (apptData.appointment && apptData.appointment._id) {
          setCreatedApptId(apptData.appointment._id);
        }
        setStep(4);
      } else {
        setErrorMessage(apptData.error || 'Failed to complete booking.');
      }
    } catch (err) {
      console.error('Failed to confirm booking request:', err);
      setErrorMessage('Network connection error. Please try again.');
    }
  };

  const formatDuration = (hours: number, mins: number) => {
    let str = '';
    if (hours > 0) str += `${hours}h `;
    if (mins > 0 || hours === 0) str += `${mins}m`;
    return str.trim();
  };

  const formatAdvanceBooking = (days: number, hours: number, mins: number) => {
    if (days === 0 && hours === 0 && mins === 0) return 'Instant';
    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);
    return `${parts.join(' ')} prior`;
  };

  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Business Header Banner */}
        <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-on-primary flex items-center gap-4">
          {logoUrl && (
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/20 bg-white flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h2 className="font-extrabold text-xl">{businessName}</h2>
            <p className="text-xs opacity-80 mt-0.5">Book your appointment in three simple steps.</p>
          </div>
        </div>

        {/* Contact Details & Address Info Bar */}
        {(emailVal || phoneVal || addressVal) && (
          <div className="bg-surface-container/60 border-b border-outline-variant/20 px-6 py-3 text-[10px] text-on-surface-variant flex flex-wrap gap-x-4 gap-y-1.5 font-semibold">
            {phoneVal && (
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-primary" />
                {phoneVal}
              </span>
            )}
            {emailVal && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" />
                {emailVal}
              </span>
            )}
            {addressVal && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {addressVal}
              </span>
            )}
          </div>
        )}

        {/* Step Progress indicators */}
        {step < 4 && (
          <div className="px-6 py-4 bg-surface-container border-b border-outline-variant/30 flex justify-between text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
            <span className={step === 1 ? 'text-primary font-extrabold' : ''}>1. Service</span>
            <span className={step === 2 ? 'text-primary font-extrabold' : ''}>2. Date & Time</span>
            <span className={step === 3 ? 'text-primary font-extrabold' : ''}>3. Your Details</span>
          </div>
        )}

        <div className="p-6 space-y-6">
          
          {/* STEP 1: Select Service */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm">Select a Service</h3>
              
              {otherLocations.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2 text-xs">
                  <h4 className="font-bold text-primary flex items-center gap-1">
                    📍 Looking for another branch location?
                  </h4>
                  <p className="text-[10px] text-on-surface-variant">We have other locations in the area. Book at another location:</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {otherLocations.map(loc => (
                      <Link 
                        key={loc._id} 
                        href={`/booking/${loc.slug || loc._id}`}
                        className="bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface font-semibold px-2.5 py-1.5 rounded-lg text-[10px] transition-all hover:underline"
                      >
                        {loc.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {loading ? (
                <div className="text-center py-12 text-xs font-bold text-on-surface-variant">
                  Fetching services list...
                </div>
              ) : services.length === 0 ? (
                <div className="bg-surface-container border border-outline-variant/30 rounded-xl p-8 text-center space-y-2">
                  <h4 className="font-bold text-xs text-on-surface">No Services Configured</h4>
                  <p className="text-[10px] text-on-surface-variant">This business has not setup any booking services yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {services.map(s => (
                    <label 
                      key={s.id} 
                      onClick={() => setSelectedService(s)}
                      className={`border rounded-xl overflow-hidden flex flex-col sm:flex-row cursor-pointer hover:border-primary/50 transition-all ${
                        selectedService?.id === s.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-outline-variant/20 bg-surface-container-low/20'
                      }`}
                    >
                      {/* Thumbnail preview */}
                      {s.imageUrl && (
                        <div className="h-28 sm:h-auto sm:w-28 bg-surface-container relative overflow-hidden flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      
                      <div className="p-4 grow flex justify-between items-center gap-4">
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-xs">{s.name}</h4>
                          <p className="text-[10px] text-on-surface-variant leading-relaxed max-w-xs">{s.description}</p>
                          <div className="flex gap-4 text-[10px] font-bold text-on-surface-variant pt-2">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-primary" /> {formatDuration(s.durationHours, s.durationMinutes)}</span>
                            <span className="flex items-center gap-1"><CalendarCheck className="w-3.5 h-3.5 text-tertiary" /> Req: {formatAdvanceBooking(s.advanceBookingDays, s.advanceBookingHours, s.advanceBookingMinutes)}</span>
                          </div>
                        </div>
                        <div className="text-right flex items-center shrink-0">
                          <span className="font-extrabold text-sm text-primary">${s.price}</span>
                          <input 
                            type="radio" 
                            name="service" 
                            checked={selectedService?.id === s.id}
                            onChange={() => {}}
                            className="text-primary focus:ring-primary w-4 h-4 ml-4 align-middle" 
                          />
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Select Date & Time */}
          {step === 2 && (
            <div className="space-y-6">
              
              {/* Date Picking Grid */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-primary" /> Select Date</h3>
                <div className="grid grid-cols-5 gap-2">
                  {dates.map(d => {
                    const isClosed = isClosedDay(d.value);
                    return (
                      <button 
                        key={d.value}
                        disabled={isClosed}
                        onClick={() => {
                          setSelectedDate(d.value);
                          setSelectedTime(null);
                        }}
                        className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                          isClosed
                            ? 'border-outline-variant/10 bg-surface-container/20 text-outline-variant/40 cursor-not-allowed opacity-50'
                            : selectedDate === d.value 
                            ? 'border-primary bg-primary text-on-primary shadow-sm' 
                            : 'border-outline-variant/30 bg-surface-container hover:bg-surface-container-high text-on-surface'
                        }`}
                      >
                        <span className="text-[9px] font-bold uppercase opacity-80">{d.day}</span>
                        <span className="text-xs font-extrabold">{isClosed ? 'Closed' : d.date.split(' ')[1]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Grid with Advance Booking Window check */}
              {selectedDate && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> Select Time Slot</h3>
                    <span className="text-[9px] font-semibold text-on-surface-variant flex items-center gap-0.5">
                      <AlertCircle className="w-3.5 h-3.5 text-primary" />
                      Requires {formatAdvanceBooking(selectedService?.advanceBookingDays || 0, selectedService?.advanceBookingHours || 0, selectedService?.advanceBookingMinutes || 0)} advance booking.
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    {getSlotsForDate(selectedDate).length === 0 ? (
                      <span className="col-span-4 text-xs font-bold text-on-surface-variant text-center py-4">No slots available on this day.</span>
                    ) : (
                      getSlotsForDate(selectedDate).map(slot => {
                        const isDisabled = isSlotDisabled(selectedDate, slot);
                        return (
                          <button 
                            key={slot}
                            disabled={isDisabled}
                            onClick={() => setSelectedTime(slot)}
                            className={`py-2.5 text-center text-xs font-bold rounded-lg border transition-all ${
                              selectedTime === slot 
                                ? 'border-primary bg-primary text-on-primary shadow-sm' 
                                : isDisabled 
                                ? 'border-outline-variant/10 bg-surface-container/30 text-outline-variant/40 cursor-not-allowed line-through'
                                : 'border-outline-variant/30 bg-surface-container hover:bg-surface-container-high text-on-surface'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* STEP 3: Customer Details Form & Channel Selector */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="font-bold text-sm">Personal Information</h3>
              
              {/* Select Specialist (Optional) */}
              {employees.length > 0 && (
                <div className="space-y-2.5 bg-surface-container/20 border border-outline-variant/20 rounded-xl p-4">
                  <label className="text-[10px] font-extrabold text-primary uppercase block">Select Preferred specialist (Optional)</label>
                  <p className="text-[10px] text-on-surface-variant">Choose a staff member for your scheduling reservation:</p>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedEmployee(null)}
                      className={`p-2.5 rounded-lg border text-center text-[10px] font-extrabold transition-all leading-normal uppercase ${
                        !selectedEmployee 
                          ? 'border-primary bg-primary text-on-primary shadow-sm shadow-primary/10' 
                          : 'border-outline-variant/30 bg-surface-container hover:bg-surface-container-high text-on-surface'
                      }`}
                    >
                      Any Staff
                    </button>
                    {employees
                      .filter(emp => 
                        (!emp.calendarIds || emp.calendarIds.length === 0 || emp.calendarIds.includes(calendarId)) &&
                        (!emp.serviceIds || emp.serviceIds.length === 0 || emp.serviceIds.includes(selectedService?.id))
                      )
                      .map(emp => (
                        <button
                          key={emp._id}
                          type="button"
                          onClick={() => setSelectedEmployee(emp)}
                          className={`p-2.5 rounded-lg border text-center text-[10px] font-extrabold transition-all leading-normal uppercase truncate ${
                            selectedEmployee?._id === emp._id
                              ? 'border-primary bg-primary text-on-primary shadow-sm shadow-primary/10'
                              : 'border-outline-variant/30 bg-surface-container hover:bg-surface-container-high text-on-surface'
                          }`}
                          title={`${emp.firstName} ${emp.lastName}`}
                        >
                          {emp.firstName} {emp.lastName.substring(0, 1)}.
                        </button>
                      ))}
                  </div>
                </div>
              )}
              
              {welcomeBackMessage && (
                <div className="bg-secondary/10 border border-secondary/20 text-secondary p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{welcomeBackMessage}</span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">First Name *</label>
                  <input 
                    type="text" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="John"
                    className="w-full text-xs bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Last Name *</label>
                  <input 
                    type="text" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="Doe"
                    className="w-full text-xs bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Email Address *</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  required
                  placeholder="john.doe@example.com"
                  className="w-full text-xs bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Mobile Phone</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full text-xs bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                />
              </div>

              {/* Cost-saving single channel alert preferencing */}
              <div className="space-y-3 border-t border-outline-variant/20 pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Primary Notification Channel</label>
                  <span className="text-[9px] font-bold text-primary flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3" /> Select one primary channel
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  
                  {/* Email */}
                  <button 
                    type="button"
                    onClick={() => setPrimaryChannel('email')}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 text-center transition-all ${
                      primaryChannel === 'email' ? 'border-primary bg-primary/5' : 'border-outline-variant/20 bg-surface-container-low/20'
                    }`}
                  >
                    <Mail className={`w-5 h-5 ${primaryChannel === 'email' ? 'text-primary' : 'text-outline'}`} />
                    <span className="text-[9px] font-bold">Email</span>
                    <span className="text-[8px] text-secondary font-bold leading-none bg-secondary/10 px-1 py-0.5 rounded">Recom.</span>
                  </button>

                  {/* WhatsApp */}
                  <button 
                    type="button"
                    onClick={() => setPrimaryChannel('whatsapp')}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 text-center transition-all ${
                      primaryChannel === 'whatsapp' ? 'border-primary bg-primary/5' : 'border-outline-variant/20 bg-surface-container-low/20'
                    }`}
                  >
                    <MessageSquare className={`w-5 h-5 ${primaryChannel === 'whatsapp' ? 'text-secondary' : 'text-outline'}`} />
                    <span className="text-[9px] font-bold">WhatsApp</span>
                    <span className="text-[8px] text-primary font-bold leading-none bg-primary/10 px-1 py-0.5 rounded">Standard</span>
                  </button>

                  {/* SMS */}
                  <button 
                    type="button"
                    onClick={() => setPrimaryChannel('sms')}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 text-center transition-all ${
                      primaryChannel === 'sms' ? 'border-primary bg-primary/5' : 'border-outline-variant/20 bg-surface-container-low/20'
                    }`}
                  >
                    <Smartphone className={`w-5 h-5 ${primaryChannel === 'sms' ? 'text-tertiary' : 'text-outline'}`} />
                    <span className="text-[9px] font-bold">SMS Text</span>
                    <span className="text-[8px] text-on-surface-variant font-medium leading-none">Carrier rates</span>
                  </button>

                </div>

                <span className="text-[9px] text-on-surface-variant block text-center leading-normal">
                  {primaryChannel === 'email' && "Best for auto-syncing calendar events (.ics attachment included)."}
                  {primaryChannel === 'whatsapp' && "Quick updates and free scheduling chat notifications via WhatsApp."}
                  {primaryChannel === 'sms' && "Standard text alerts directly to your phone carrier network."}
                </span>

              </div>

              {/* Captcha & Error alert */}
              <div className="space-y-4 pt-4 border-t border-outline-variant/20">
                <div className="space-y-1.5 bg-surface-container/30 border border-outline-variant/20 rounded-xl p-4">
                  <label className="text-[10px] font-extrabold text-primary uppercase block">🛡️ Anti-Bot Verification</label>
                  <p className="text-[10px] text-on-surface-variant">Please solve this arithmetic puzzle to verify you are a human:</p>
                  <div className="flex items-center gap-3 pt-2">
                    <span className="font-extrabold text-xs bg-surface-container border border-outline-variant/30 px-3 py-2 rounded-lg text-on-surface select-none">
                      {numA} + {numB} = ?
                    </span>
                    <input 
                      type="number"
                      value={captchaInput}
                      onChange={(e) => {
                        setCaptchaInput(e.target.value);
                        setCaptchaError('');
                      }}
                      required
                      placeholder="Your answer"
                      className="bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none text-xs font-bold w-28 text-center text-primary"
                    />
                  </div>
                  {captchaError && (
                    <span className="text-[9px] font-bold text-red-600 block mt-1">{captchaError}</span>
                  )}
                </div>

                {errorMessage && (
                  <div className="bg-red-500/10 border border-red-200 text-red-700 text-xs font-bold p-3.5 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                    {(errorMessage.includes('verification') || errorMessage.includes('Bot') || errorMessage.includes('puzzle') || errorMessage.includes('Submit')) && (
                      <button
                        type="button"
                        onClick={() => {
                          setBotTimestamp(Date.now());
                          setNumA(Math.floor(Math.random() * 8) + 2);
                          setNumB(Math.floor(Math.random() * 8) + 2);
                          setCaptchaInput('');
                          setCaptchaError('');
                          setErrorMessage('');
                        }}
                        className="mt-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg self-start transition-colors"
                      >
                        Reset Verification & Retry
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* STEP 4: Success confirmation screen */}
          {step === 4 && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-secondary-container text-secondary flex items-center justify-center mx-auto shadow-md shadow-secondary/10">
                <Check className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-on-surface">Booking Request Submitted!</h3>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                  We've successfully requested your appointment. You will receive a confirmation alert on your primary channel (<strong>{primaryChannel.toUpperCase()}</strong>).
                </p>
              </div>

              {/* Dynamic portal tracking link box */}
              <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/30 max-w-md mx-auto space-y-3">
                <span className="text-[10px] font-bold text-primary flex items-center justify-center gap-1 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> Booking Reference: {createdApptId ? `REZ-${createdApptId.slice(-6).toUpperCase()}` : 'REZ-MOCKID'}
                </span>
                <p className="text-[10px] text-on-surface-variant leading-relaxed">
                  Save this live tracking link to verify your appointment status, manager notes, and employee assignments at any time:
                </p>
                
                <div className="flex items-center gap-2 bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/20">
                  <span className="text-[9px] font-bold text-primary grow truncate select-all">
                    {typeof window !== 'undefined' ? `${window.location.origin}/booking/track/${createdApptId || 'mock-appt-id'}` : ''}
                  </span>
                  <button 
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(`${window.location.origin}/booking/track/${createdApptId || 'mock-appt-id'}`);
                        alert('Tracking link copied to clipboard!');
                      }
                    }}
                    className="bg-primary hover:bg-primary-container text-on-primary text-[9px] font-bold px-2 py-1 rounded transition-colors"
                  >
                    Copy
                  </button>
                </div>

                <Link 
                  href={`/booking/track/${createdApptId || 'mock-appt-id'}`}
                  className="w-full bg-primary hover:bg-primary-container text-on-primary py-2 rounded-lg text-xs font-bold block transition-colors shadow-sm text-center"
                >
                  Open Live Status Tracking Page
                </Link>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Actions footer */}
        {step < 4 && (
          <div className="px-6 py-4 bg-surface-container border-t border-outline-variant/30 flex justify-between items-center">
            <button 
              onClick={handleBack}
              disabled={step === 1}
              className={`flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors ${
                step === 1 ? 'opacity-30 cursor-not-allowed' : ''
              }`}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            
            {step < 3 ? (
              <button 
                onClick={handleNext}
                disabled={step === 2 && (!selectedDate || !selectedTime)}
                className={`flex items-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                  step === 2 && (!selectedDate || !selectedTime) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={handleConfirm}
                className="flex items-center gap-1 bg-secondary hover:bg-secondary-container text-on-secondary px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all"
              >
                Confirm Appointment
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
