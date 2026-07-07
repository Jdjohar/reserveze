'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Sparkles, 
  Check, 
  ArrowRight,
  ArrowLeft,
  Calendar,
  Smartphone,
  Upload,
  Globe,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react';

interface CalendarObj {
  id: string;
  name: string;
  country: string;
  city: string;
  timeFormat: '12h' | '24h';
  availability: {
    days: string[];
    startTime: string;
    endTime: string;
  };
}

export default function MerchantOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // STEP 1: Plan Selection
  const [plan, setPlan] = useState<'basic' | 'advance'>('advance');

  // STEP 5: Services & Team Members Lists
  const [onboardingServices, setOnboardingServices] = useState<Array<{ name: string; price: number; duration: number }>>([
    { name: 'Standard Haircut', price: 25, duration: 30 },
    { name: 'Premium Trim', price: 40, duration: 45 }
  ]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState({ name: '', price: 0, duration: 30, index: -1 });

  const [onboardingTeam, setOnboardingTeam] = useState<Array<{ firstName: string; lastName: string; email: string; phone: string; role: 'STAFF' | 'SPECIALIST' | 'MANAGER'; password?: string }>>([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState({ firstName: '', lastName: '', email: '', phone: '', role: 'STAFF' as any, password: '', index: -1 });

  // STEP 2: Category Selection
  const [category, setCategory] = useState('salon');
  
  const DEFAULT_SERVICES_BY_CATEGORY: Record<string, Array<{ name: string; price: number; duration: number }>> = {
    salon: [
      { name: 'Haircut & Styling', price: 25, duration: 30 },
      { name: 'Premium Hair Spa', price: 45, duration: 45 },
      { name: 'Relaxing Facial', price: 35, duration: 30 }
    ],
    dentist: [
      { name: 'Dental Checkup', price: 50, duration: 30 },
      { name: 'Teeth Whitening', price: 120, duration: 60 },
      { name: 'Cavity Filling', price: 80, duration: 45 }
    ],
    autoshop: [
      { name: 'Basic Oil Change', price: 40, duration: 30 },
      { name: 'Full Car Detail Wash', price: 60, duration: 45 },
      { name: 'Brake Pad Replacement', price: 150, duration: 60 }
    ],
    restaurant: [
      { name: 'Standard Table Booking', price: 0, duration: 90 },
      { name: 'VIP Booth Reservation', price: 20, duration: 120 }
    ],
    consulting: [
      { name: 'Initial Business Consultation', price: 80, duration: 45 },
      { name: 'Strategy Development Session', price: 150, duration: 60 }
    ],
    other: [
      { name: 'General Appointment Slot', price: 15, duration: 30 }
    ]
  };

  useEffect(() => {
    setOnboardingServices(DEFAULT_SERVICES_BY_CATEGORY[category] || DEFAULT_SERVICES_BY_CATEGORY.other);
  }, [category]);
  const categories = [
    { id: 'restaurant', name: 'Restaurant', desc: 'Table bookings & dining times' },
    { id: 'dentist', name: 'Dentist', desc: 'Healthcare, checkups & treatments' },
    { id: 'autoshop', name: 'Autoshop', desc: 'Vehicle repair, servicing & wash' },
    { id: 'salon', name: 'Salon & Spa', desc: 'Haircuts, beauty styling & massage' },
    { id: 'consulting', name: 'Consulting', desc: 'Advisory, coaching & tech services' },
    { id: 'other', name: 'Other Business', desc: 'Custom scheduling workflows' }
  ];

  // STEP 3: Business Profile
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [numLocations, setNumLocations] = useState(1);
  const [address, setAddress] = useState('');
  const [uploading, setUploading] = useState(false);
  const [facebookLink, setFacebookLink] = useState('');
  const [instagramLink, setInstagramLink] = useState('');
  const [preferredNotification, setPreferredNotification] = useState<'email' | 'sms' | 'whatsapp'>('email');

  // STEP 4 & 5: Calendars & Availability
  const [calendars, setCalendars] = useState<CalendarObj[]>([
    {
      id: '1',
      name: 'Main Branch Clinic',
      country: 'United States',
      city: 'New York',
      timeFormat: '12h',
      availability: {
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        startTime: '09:00',
        endTime: '17:00'
      }
    }
  ]);
  
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState<Partial<CalendarObj>>({
    name: '',
    country: 'United States',
    city: '',
    timeFormat: '12h'
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.success && data.url) {
        setLogoUrl(data.url);
      }
    } catch (err) {
      console.error('Logo upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCalendar = () => {
    if (!editingCalendar.name) return;

    // Plan check constraint: Basic plan can only have 1 calendar
    if (plan === 'basic' && calendars.length >= 1 && !editingCalendar.id) {
      alert('Basic Plan is limited to a single calendar workspace. Upgrade to Advance Plan for up to 10 calendars.');
      return;
    }

    if (editingCalendar.id) {
      // Edit
      setCalendars(calendars.map(c => c.id === editingCalendar.id ? (editingCalendar as CalendarObj) : c));
    } else {
      // Add
      const newCal: CalendarObj = {
        id: (calendars.length + 1).toString(),
        name: editingCalendar.name,
        country: editingCalendar.country || 'United States',
        city: editingCalendar.city || '',
        timeFormat: editingCalendar.timeFormat || '12h',
        availability: {
          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          startTime: '09:00',
          endTime: '17:00'
        }
      };
      setCalendars([...calendars, newCal]);
    }
    setShowCalendarModal(false);
  };

  const handleDeleteCalendar = (id: string) => {
    setCalendars(calendars.filter(c => c.id !== id));
  };

  const handleSaveService = () => {
    if (!editingService.name) return;
    if (editingService.index >= 0) {
      setOnboardingServices(onboardingServices.map((s, i) => i === editingService.index ? { name: editingService.name, price: Number(editingService.price) || 0, duration: Number(editingService.duration) || 30 } : s));
    } else {
      setOnboardingServices([...onboardingServices, { name: editingService.name, price: Number(editingService.price) || 0, duration: Number(editingService.duration) || 30 }]);
    }
    setShowServiceModal(false);
  };

  const handleSaveTeam = () => {
    if (!editingTeam.firstName || !editingTeam.email) return;
    if (editingTeam.index >= 0) {
      setOnboardingTeam(onboardingTeam.map((t, i) => i === editingTeam.index ? { firstName: editingTeam.firstName, lastName: editingTeam.lastName, email: editingTeam.email, phone: editingTeam.phone, role: editingTeam.role, password: editingTeam.password } : t));
    } else {
      setOnboardingTeam([...onboardingTeam, { firstName: editingTeam.firstName, lastName: editingTeam.lastName, email: editingTeam.email, phone: editingTeam.phone, role: editingTeam.role, password: editingTeam.password }]);
    }
    setShowTeamModal(false);
  };

  const handleToggleDay = (calId: string, day: string) => {
    setCalendars(calendars.map(c => {
      if (c.id === calId) {
        const days = c.availability.days.includes(day)
          ? c.availability.days.filter(d => d !== day)
          : [...c.availability.days, day];
        return {
          ...c,
          availability: { ...c.availability, days }
        };
      }
      return c;
    }));
  };

  const handleTimeChange = (calId: string, field: 'startTime' | 'endTime', val: string) => {
    setCalendars(calendars.map(c => {
      if (c.id === calId) {
        return {
          ...c,
          availability: { ...c.availability, [field]: val }
        };
      }
      return c;
    }));
  };

  const handleFinish = async () => {
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantEmail: typeof window !== 'undefined' ? localStorage.getItem('merchant_email') : undefined,
          merchantName: typeof window !== 'undefined' ? localStorage.getItem('merchant_name') : undefined,
          category,
          businessName,
          phone,
          whatsapp,
          email,
          logoUrl,
          address,
          preferredNotification,
          calendars: calendars.map((c, idx) => ({
            name: c.name,
            timeFormat: c.timeFormat,
            phone: phone,
            email: email,
            address: address,
            slug: `${businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}-loc-${idx + 1}`,
            availability: c.availability
          })),
          services: onboardingServices,
          team: onboardingTeam
        })
      });
      const data = await res.json();
      if (data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('merchant_business_id', data.businessId);
        }
        router.push('/merchant/dashboard');
      } else {
        alert('Failed to save onboarding configuration. Please check inputs.');
      }
    } catch (err) {
      console.error('Error during onboarding submit:', err);
      alert('Could not complete onboarding. Please verify database connectivity.');
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Progress Bar Header */}
        <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-on-primary">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider opacity-90">
            <span>Step {step} of 5</span>
            <span>Reserveze Merchant Onboarding</span>
          </div>
          <div className="w-full bg-white/20 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-white h-1.5 transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Steps container */}
        <div className="p-8 space-y-6">

          {/* STEP 1: Category Selector */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-on-surface">Select Business Category</h3>
                <p className="text-xs text-on-surface-variant">This pre-configures template services and formats matching your category.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                {categories.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`text-left p-4 border rounded-xl flex items-center gap-3 transition-all ${
                      category === c.id 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'border-outline-variant/20 bg-surface-container-low/20 hover:border-primary/30'
                    }`}
                  >
                    <div className="bg-primary/10 text-primary p-2.5 rounded-lg shrink-0">
                      <Building2 className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-on-surface">{c.name}</h4>
                      <p className="text-[10px] text-on-surface-variant mt-0.5 leading-normal">{c.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Business Profile Update */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-on-surface">Establish Business Profile</h3>
                <p className="text-xs text-on-surface-variant">Update credentials and preferences loaded on client booking panels.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-xs">
                {/* Left Col */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Business Name *</label>
                    <input 
                      type="text" 
                      value={businessName} 
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Vanguard Salon"
                      className="w-full bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Business Phone *</label>
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Whatsapp Number</label>
                    <input 
                      type="tel" 
                      value={whatsapp} 
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+1 (555) 192-3847"
                      className="w-full bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Business Email *</label>
                    <input 
                      type="email" 
                      required
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@vanguardsalon.com"
                      className="w-full bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Physical Address *</label>
                    <input 
                      type="text" 
                      required
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. 120 Beverly Drive, Beverly Hills, CA"
                      className="w-full bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Right Col */}
                <div className="space-y-3">
                  {/* Logo upload (Cloudinary integration) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Business Logo</label>
                    <div className="flex gap-3 items-center">
                      {logoUrl ? (
                        <div className="h-12 w-12 rounded-lg bg-surface-container overflow-hidden border border-outline-variant/30 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-surface-container border border-outline-variant/30 flex items-center justify-center text-outline/30 flex-shrink-0">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                      <label className="grow border border-dashed border-outline-variant/30 hover:bg-surface-container/30 transition-colors rounded-lg py-2.5 flex items-center justify-center cursor-pointer text-center text-[10px] font-bold">
                        <Upload className="w-3.5 h-3.5 mr-1" />
                        {uploading ? 'Uploading...' : 'Upload Logo'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      </label>
                    </div>
                  </div>

                  {/* Social media links */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Social Links</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-outline">
                          <Globe className="w-3.5 h-3.5" />
                        </span>
                        <input 
                          type="text" 
                          value={facebookLink} 
                          onChange={(e) => setFacebookLink(e.target.value)}
                          placeholder="facebook.com/..."
                          className="w-full bg-surface-container rounded-lg pl-8 pr-2 py-2 border border-outline-variant/30 focus:outline-none text-[11px]"
                        />
                      </div>
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-outline">
                          <Globe className="w-3.5 h-3.5" />
                        </span>
                        <input 
                          type="text" 
                          value={instagramLink} 
                          onChange={(e) => setInstagramLink(e.target.value)}
                          placeholder="instagram.com/..."
                          className="w-full bg-surface-container rounded-lg pl-8 pr-2 py-2 border border-outline-variant/30 focus:outline-none text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preferred notification */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Preferred Dispatch Channel</label>
                    <select
                      value={preferredNotification}
                      onChange={(e) => setPreferredNotification(e.target.value as any)}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 focus:outline-none"
                    >
                      <option value="email">Email Alerts Only</option>
                      <option value="sms">SMS Text Alerts</option>
                      <option value="whatsapp">WhatsApp Interactive Alerts</option>
                    </select>
                  </div>

                  {/* Number of locations */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Number of Locations to Set Up *</label>
                    <input 
                      type="number"
                      required
                      min={1}
                      max={plan === 'basic' ? 1 : 10}
                      value={numLocations}
                      onChange={(e) => setNumLocations(Math.max(1, Math.min(plan === 'basic' ? 1 : 10, parseInt(e.target.value) || 1)))}
                      className="w-full bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none font-bold text-primary"
                    />
                    <span className="text-[9px] text-on-surface-variant block mt-0.5">
                      {plan === 'basic' 
                        ? 'Basic Plan permits exactly 1 location branch.' 
                        : 'Select up to 10 branch locations. All locations will inherit settings from your first branch.'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Configure Calendars */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-sm text-on-surface">Configure Calendars</h3>
                  <p className="text-xs text-on-surface-variant">
                    {plan === 'basic' 
                      ? 'Basic plan: Single Calendar/Location allocation.' 
                      : 'Advance plan: Configure up to 10 Calendars.'
                    }
                  </p>
                </div>
                {/* Add calendar button */}
                <button
                  onClick={() => {
                    if (plan === 'basic' && calendars.length >= 1) {
                      alert('Basic Plan is limited to a single calendar. Select "Advance" in Step 1 to add more.');
                      return;
                    }
                    setEditingCalendar({ name: '', country: 'United States', city: '', timeFormat: '12h' });
                    setShowCalendarModal(true);
                  }}
                  className="flex items-center gap-1 bg-primary text-on-primary px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Calendar
                </button>
              </div>

              {/* Calendars lists */}
              <div className="space-y-3">
                {calendars.map(cal => (
                  <div key={cal.id} className="bg-surface-container-low/50 border border-outline-variant/30 rounded-xl p-4 flex justify-between items-center">
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-primary" /> {cal.name}
                      </h4>
                      <div className="flex gap-3 text-[10px] text-on-surface-variant font-semibold">
                        <span className="flex items-center gap-0.5"><Globe className="w-3 h-3" /> {cal.city}, {cal.country}</span>
                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> Format: {cal.timeFormat.toUpperCase()}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingCalendar(cal);
                          setShowCalendarModal(true);
                        }}
                        className="p-1.5 hover:bg-surface-container rounded text-on-surface-variant transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCalendar(cal.id)}
                        className="p-1.5 hover:bg-red-50 text-error rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Availability Rules */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-on-surface">Manage Operating Availability</h3>
                <p className="text-xs text-on-surface-variant">Update active workdays, timings, and break schedules for your configured calendars.</p>
              </div>

              <div className="space-y-6">
                {calendars.map(cal => (
                  <div key={cal.id} className="bg-surface-container-low/40 border border-outline-variant/20 rounded-xl p-5 space-y-4">
                    <h4 className="font-extrabold text-xs text-primary border-b border-outline-variant/20 pb-2">{cal.name}</h4>
                    
                    <div className="space-y-3 text-xs">
                      {/* Active Days Toggle */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase">Weekly Workdays</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                            const isSelected = cal.availability.days.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => handleToggleDay(cal.id, day)}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                                  isSelected 
                                    ? 'bg-primary border-primary text-on-primary shadow-sm' 
                                    : 'border-outline-variant/30 text-on-surface-variant bg-surface-container'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Timings */}
                      <div className="flex items-center gap-4 pt-1">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase">Start Hour</span>
                          <input 
                            type="time" 
                            value={cal.availability.startTime}
                            onChange={(e) => handleTimeChange(cal.id, 'startTime', e.target.value)}
                            className="bg-surface-container border border-outline-variant/30 rounded p-1.5 text-xs text-on-surface"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase pt-4">to</span>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase">End Hour</span>
                          <input 
                            type="time" 
                            value={cal.availability.endTime}
                            onChange={(e) => handleTimeChange(cal.id, 'endTime', e.target.value)}
                            className="bg-surface-container border border-outline-variant/30 rounded p-1.5 text-xs text-on-surface"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Services & Team Members Configuration */}
          {step === 5 && (
            <div className="space-y-6 text-xs">
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-on-surface">Services & Team Members Setup</h3>
                <p className="text-xs text-on-surface-variant">Define the services you offer and add your staff members to manage scheduling availability.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Services Column */}
                <div className="space-y-3 bg-surface-container-low/35 border border-outline-variant/20 rounded-xl p-4 flex flex-col justify-between min-h-[300px]">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
                      <h4 className="font-bold text-xs text-primary uppercase">Services Offered</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingService({ name: '', price: 0, duration: 30, index: -1 });
                          setShowServiceModal(true);
                        }}
                        className="text-[10px] bg-primary text-on-primary px-2.5 py-1 rounded font-bold hover:bg-primary-container transition-colors flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Add Service
                      </button>
                    </div>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {onboardingServices.length === 0 ? (
                        <span className="text-[10px] text-on-surface-variant block py-4 text-center">No services added yet.</span>
                      ) : (
                        onboardingServices.map((svc, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-surface-container-low border border-outline-variant/10 rounded-lg p-2.5">
                            <div>
                              <h5 className="font-bold text-xs text-on-surface">{svc.name}</h5>
                              <span className="text-[10px] text-on-surface-variant font-semibold">${svc.price} • {svc.duration} mins</span>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingService({ ...svc, index: idx });
                                  setShowServiceModal(true);
                                }}
                                className="p-1 hover:bg-surface-container rounded text-on-surface-variant"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setOnboardingServices(onboardingServices.filter((_, i) => i !== idx))}
                                className="p-1 hover:bg-red-50 text-red-500 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Team Column */}
                <div className="space-y-3 bg-surface-container-low/35 border border-outline-variant/20 rounded-xl p-4 flex flex-col justify-between min-h-[300px]">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
                      <h4 className="font-bold text-xs text-primary uppercase">Staff & Specialists</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTeam({ firstName: '', lastName: '', email: '', phone: '', role: 'STAFF', password: '', index: -1 });
                          setShowTeamModal(true);
                        }}
                        className="text-[10px] bg-primary text-on-primary px-2.5 py-1 rounded font-bold hover:bg-primary-container transition-colors flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Add Member
                      </button>
                    </div>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {onboardingTeam.length === 0 ? (
                        <span className="text-[10px] text-on-surface-variant block py-4 text-center">No team members added yet.</span>
                      ) : (
                        onboardingTeam.map((member, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-surface-container-low border border-outline-variant/10 rounded-lg p-2.5">
                            <div>
                              <h5 className="font-bold text-xs text-on-surface">{member.firstName} {member.lastName}</h5>
                              <span className="text-[9px] text-on-surface-variant font-semibold flex items-center gap-1">
                                <span className="bg-primary/10 text-primary px-1 py-0.2 rounded font-extrabold uppercase text-[8px]">{member.role}</span>
                                {member.email}
                              </span>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTeam({ ...member, password: member.password || '', index: idx });
                                  setShowTeamModal(true);
                                }}
                                className="p-1 hover:bg-surface-container rounded text-on-surface-variant"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setOnboardingTeam(onboardingTeam.filter((_, i) => i !== idx))}
                                className="p-1 hover:bg-red-50 text-red-500 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Bottom Actions footer */}
        <div className="px-8 py-4 bg-surface-container border-t border-outline-variant/30 flex justify-between items-center">
          <button
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1}
            className={`text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors ${
              step === 1 ? 'opacity-35 cursor-not-allowed' : ''
            }`}
          >
            Back
          </button>
          
          {step < 5 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 2) {
                  if (!businessName || !email || !phone || !address) {
                    alert('Please fill in all required fields marked with *');
                    return;
                  }
                  
                  // Auto-populate numLocations calendars inheriting main branch details!
                  const mainName = businessName || 'Main Location';
                  const list: CalendarObj[] = [];
                  for (let i = 0; i < numLocations; i++) {
                    const name = i === 0 ? `${mainName} (Main Location)` : `${mainName} - Location ${i + 1}`;
                    list.push({
                      id: (i + 1).toString(),
                      name,
                      country: 'United States',
                      city: 'New York',
                      timeFormat: '12h',
                      availability: {
                        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                        startTime: '09:00',
                        endTime: '17:00'
                      }
                    });
                  }
                  setCalendars(list);

                  // Auto-populate first team member using merchant details
                  if (onboardingTeam.length === 0) {
                    const nameParts = (typeof window !== 'undefined' ? localStorage.getItem('merchant_name') : '') || 'Business Owner';
                    const splitNames = nameParts.split(' ');
                    const firstName = splitNames[0] || 'Admin';
                    const lastName = splitNames.slice(1).join(' ') || 'Manager';
                    setOnboardingTeam([{
                      firstName,
                      lastName,
                      email: email,
                      phone: phone,
                      role: 'MANAGER'
                    }]);
                  }
                }
                if (step === 3 && calendars.length === 0) {
                  alert('Please configure at least one calendar location.');
                  return;
                }
                setStep(step + 1);
              }}
              className="flex items-center gap-1 bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-1 bg-secondary hover:bg-secondary-container text-on-secondary px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all"
            >
              <span>Finish Onboarding</span>
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

      {/* Calendar Creator Modal (Step 4) */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-xl space-y-4">
            
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h3 className="font-bold text-sm">{editingCalendar.id ? 'Edit Calendar Details' : 'Add New Calendar'}</h3>
              <button onClick={() => setShowCalendarModal(false)} className="text-on-surface-variant hover:text-on-surface font-bold text-xs">Close</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Calendar / Branch Name *</label>
                <input 
                  type="text" 
                  value={editingCalendar.name || ''} 
                  onChange={(e) => setEditingCalendar({ ...editingCalendar, name: e.target.value })}
                  placeholder="e.g. Main Branch Clinic"
                  className="w-full text-xs bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Country</label>
                  <input 
                    type="text" 
                    value={editingCalendar.country || ''} 
                    onChange={(e) => setEditingCalendar({ ...editingCalendar, country: e.target.value })}
                    className="w-full text-xs bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">City</label>
                  <input 
                    type="text" 
                    value={editingCalendar.city || ''} 
                    onChange={(e) => setEditingCalendar({ ...editingCalendar, city: e.target.value })}
                    placeholder="New York"
                    className="w-full text-xs bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Time Format</label>
                <select
                  value={editingCalendar.timeFormat || '12h'}
                  onChange={(e) => setEditingCalendar({ ...editingCalendar, timeFormat: e.target.value as any })}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 focus:outline-none"
                >
                  <option value="12h">12-Hour format (AM / PM)</option>
                  <option value="24h">24-Hour military format</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-outline-variant/20">
              <button 
                onClick={() => setShowCalendarModal(false)}
                className="flex-1 py-2.5 border border-outline-variant/40 hover:bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveCalendar}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <Check className="w-4 h-4" /> Save Calendar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Service Creator Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h3 className="font-bold text-sm text-on-surface">{editingService.index >= 0 ? 'Edit Service' : 'Add New Service'}</h3>
              <button type="button" onClick={() => setShowServiceModal(false)} className="text-on-surface-variant hover:text-on-surface font-bold text-xs">Close</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Service Name *</label>
                <input
                  type="text"
                  required
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  placeholder="e.g. Haircut & Blowdry"
                  className="w-full text-xs bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Price ($) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingService.price}
                    onChange={(e) => setEditingService({ ...editingService, price: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Duration (Minutes) *</label>
                  <select
                    value={editingService.duration}
                    onChange={(e) => setEditingService({ ...editingService, duration: parseInt(e.target.value) || 30 })}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 focus:outline-none text-xs"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>1 Hour</option>
                    <option value={90}>1.5 Hours</option>
                    <option value={120}>2 Hours</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setShowServiceModal(false)}
                className="flex-1 py-2.5 border border-outline-variant/40 hover:bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveService}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <Check className="w-4 h-4" /> Save Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Creator Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h3 className="font-bold text-sm text-on-surface">{editingTeam.index >= 0 ? 'Edit Team Member' : 'Add New Team Member'}</h3>
              <button type="button" onClick={() => setShowTeamModal(false)} className="text-on-surface-variant hover:text-on-surface font-bold text-xs">Close</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editingTeam.firstName}
                    onChange={(e) => setEditingTeam({ ...editingTeam, firstName: e.target.value })}
                    placeholder="John"
                    className="w-full text-xs bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Last Name</label>
                  <input
                    type="text"
                    value={editingTeam.lastName}
                    onChange={(e) => setEditingTeam({ ...editingTeam, lastName: e.target.value })}
                    placeholder="Doe"
                    className="w-full text-xs bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editingTeam.email}
                  onChange={(e) => setEditingTeam({ ...editingTeam, email: e.target.value })}
                  placeholder="john.doe@company.com"
                  className="w-full text-xs bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Phone Number</label>
                  <input
                    type="tel"
                    value={editingTeam.phone}
                    onChange={(e) => setEditingTeam({ ...editingTeam, phone: e.target.value })}
                    placeholder="+1 (555) 0192"
                    className="w-full text-xs bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Role *</label>
                  <select
                    value={editingTeam.role}
                    onChange={(e) => setEditingTeam({ ...editingTeam, role: e.target.value as any })}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 focus:outline-none text-xs"
                  >
                    <option value="STAFF">Staff Member</option>
                    <option value="SPECIALIST">Specialist</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Login Password (Optional - will auto-generate if empty)</label>
                <input
                  type="password"
                  value={editingTeam.password || ''}
                  onChange={(e) => setEditingTeam({ ...editingTeam, password: e.target.value })}
                  placeholder="e.g. MyPassword123"
                  className="w-full text-xs bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setShowTeamModal(false)}
                className="flex-1 py-2.5 border border-outline-variant/40 hover:bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTeam}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <Check className="w-4 h-4" /> Save Member
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
