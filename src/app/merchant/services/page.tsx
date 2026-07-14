/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Clock, 
  DollarSign, 
  Users, 
  ToggleLeft, 
  ToggleRight,
  Sparkles,
  Check,
  Upload,
  Image as ImageIcon,
  CalendarCheck
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  duration: number; // total duration in minutes
  durationHours: number;
  durationMinutes: number;
  price: number;
  maxCapacity: number;
  advanceBookingDays: number;
  advanceBookingHours: number;
  advanceBookingMinutes: number;
  imageUrl?: string;
  isActive: boolean;
}

export default function MerchantServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Editor state
  const [currentService, setCurrentService] = useState<Partial<Service>>({
    name: '',
    durationHours: 0,
    durationMinutes: 30,
    price: 0,
    maxCapacity: 1,
    advanceBookingDays: 0,
    advanceBookingHours: 0,
    advanceBookingMinutes: 0,
    imageUrl: '',
    isActive: true
  });

  // Location scopes
  const [dbCalendars, setDbCalendars] = useState<any[]>([]);
  const [isRestrictedManager, setIsRestrictedManager] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('assigned_calendar_ids');
    }
    return false;
  });
  const [assignedCalendarIds, setAssignedCalendarIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const rawAssigned = localStorage.getItem('assigned_calendar_ids');
      if (rawAssigned) {
        try {
          const parsed = JSON.parse(rawAssigned);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
    }
    return [];
  });
  const [selectedCalendarId, setSelectedCalendarId] = useState(() => {
    if (typeof window !== 'undefined') {
      const rawAssigned = localStorage.getItem('assigned_calendar_ids');
      if (rawAssigned) {
        try {
          const parsed = JSON.parse(rawAssigned);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed[0];
          }
        } catch {}
      }
    }
    return '';
  });
  const [syncing, setSyncing] = useState(false);
  const [isCustom, setIsCustom] = useState(true);

  // Initialize and load calendars
  useEffect(() => {
    const initPage = async () => {
      try {
        const storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : null;
        if (!storedBizId) return;

        // Fetch calendars
        const calRes = await fetch(`/api/calendars?businessId=${storedBizId}`);
        const calData = await calRes.json();
        if (calData.success) {
          setDbCalendars(calData.calendars);
        }
      } catch (err) {
        console.error('Failed to load initial metadata:', err);
      }
    };
    initPage();
  }, []);

  // Fetch services when selectedCalendarId changes
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : null;
        if (!storedBizId) return;

        let url = `/api/services?businessId=${storedBizId}`;
        if (selectedCalendarId) {
          url += `&calendarId=${selectedCalendarId}`;
        }
        
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          const mapped = data.services.map((s: any) => ({
            ...s,
            id: s._id
          }));
          setServices(mapped);
          setIsCustom(data.isCustom ?? true);
        }
      } catch (err) {
        console.error('Error fetching services from MongoDB:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [selectedCalendarId]);

  const handleToggleActive = async (id: string) => {
    const service = services.find(s => s.id === id);
    if (!service) return;
    
    const updatedActive = !service.isActive;
    
    // Optimistic UI update
    setServices(services.map(s => s.id === id ? { ...s, isActive: updatedActive } : s));

    try {
      await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...service, isActive: updatedActive })
      });
    } catch (err) {
      console.error('Failed to update status in DB:', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    // Validate size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image size exceeds 2MB limit.');
      setUploading(false);
      return;
    }

    // Validate formats (JPEG, PNG, WEBP)
    const allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedFormats.includes(file.type)) {
      setUploadError('Unsupported format. Please upload JPEG, PNG, or WEBP.');
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      
      if (data.success && data.url) {
        setCurrentService(prev => ({ ...prev, imageUrl: data.url }));
      } else {
        setUploadError(data.error || 'Upload failed');
      }
    } catch (err: any) {
      setUploadError('Failed to connect to upload API');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveService = async () => {
    if (!currentService.name) return;

    const hours = currentService.durationHours || 0;
    const mins = currentService.durationMinutes || 0;
    const totalDuration = (hours * 60) + mins;

    const storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : undefined;

    const payload = {
      businessId: storedBizId,
      calendarId: selectedCalendarId || undefined,
      name: currentService.name,
      durationHours: hours,
      durationMinutes: mins,
      price: currentService.price || 0,
      maxCapacity: currentService.maxCapacity || 1,
      advanceBookingDays: currentService.advanceBookingDays || 0,
      advanceBookingHours: currentService.advanceBookingHours || 0,
      advanceBookingMinutes: currentService.advanceBookingMinutes || 0,
      imageUrl: currentService.imageUrl,
      isActive: currentService.isActive ?? true
    };

    try {
      // If service already exists and has a 24-character hex ID (Mongoose ObjectId)
      if (currentService.id && currentService.id.length === 24) {
        const res = await fetch(`/api/services/${currentService.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          setServices(services.map(s => s.id === currentService.id ? { ...data.service, id: data.service._id } : s));
        }
      } else {
        // If we are in central fallback mode for a location branch, sync central templates first!
        if (selectedCalendarId && !isCustom) {
          await fetch('/api/services/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessId: storedBizId,
              calendarId: selectedCalendarId
            })
          });
        }

        // Create new document in MongoDB
        const res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          if (selectedCalendarId) {
            // Re-fetch services to load the freshly synced templates and the new service
            const refRes = await fetch(`/api/services?businessId=${storedBizId}&calendarId=${selectedCalendarId}`);
            const refData = await refRes.json();
            if (refData.success) {
              setServices(refData.services.map((s: any) => ({ ...s, id: s._id })));
              setIsCustom(refData.isCustom ?? true);
            }
          } else {
            setServices([...services, { ...data.service, id: data.service._id }]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to save service data:', err);
    }
    
    setShowModal(false);
  };

  const handleEditService = (service: Service) => {
    setCurrentService(service);
    setShowModal(true);
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return;
    }
    // Optimistic UI update
    setServices(services.filter(s => s.id !== id));

    try {
      await fetch(`/api/services/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Failed to delete service from MongoDB:', err);
    }
  };

  const handleSyncServices = async () => {
    if (!selectedCalendarId) return;
    setSyncing(true);
    try {
      const storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : null;
      if (!storedBizId) return;

      const res = await fetch('/api/services/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: storedBizId,
          calendarId: selectedCalendarId
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Services synced successfully.');
        // Refresh the list
        const url = `/api/services?businessId=${storedBizId}&calendarId=${selectedCalendarId}`;
        const refRes = await fetch(url);
        const refData = await refRes.json();
        if (refData.success) {
          setServices(refData.services.map((s: any) => ({ ...s, id: s._id })));
          setIsCustom(refData.isCustom ?? true);
        }
      } else {
        alert(data.error || 'Failed to sync services.');
      }
    } catch (err) {
      console.error('Failed to sync services:', err);
      alert('Connection error. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleResetToCentral = async () => {
    if (!confirm('Are you sure you want to delete all custom service overrides for this location and revert back to central business services? This cannot be undone.')) return;
    setSyncing(true);
    try {
      const storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : null;
      if (!storedBizId || !selectedCalendarId) return;

      const res = await fetch(`/api/services?businessId=${storedBizId}&calendarId=${selectedCalendarId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        alert('Custom overrides deleted. Switched back to central business services.');
        // Refresh
        const refRes = await fetch(`/api/services?businessId=${storedBizId}&calendarId=${selectedCalendarId}`);
        const refData = await refRes.json();
        if (refData.success) {
          setServices(refData.services.map((s: any) => ({ ...s, id: s._id })));
          setIsCustom(refData.isCustom ?? true);
        }
      } else {
        alert(data.error || 'Failed to reset services.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error. Please try again.');
    } finally {
      setSyncing(false);
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
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);
    return `${parts.join(' ')} prior`;
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex bg-surface-container-low min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Service Portfolio" subtitle="Configure durations, pricing caps, advance booking requirements, and images." />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          
          {/* Header Search & Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center gap-3">
              <div className="relative w-full sm:w-80">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search services..."
                  className="w-full bg-surface-container-lowest text-xs rounded-lg pl-9 pr-4 py-2.5 border border-outline-variant/30 focus:outline-none"
                />
              </div>

              {/* Location Scope Selector */}
              <div className="w-full sm:w-64">
                {isRestrictedManager ? (
                  <select
                    value={selectedCalendarId}
                    disabled
                    className="w-full bg-surface-container-lowest text-xs rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none font-bold text-on-surface-variant opacity-75 cursor-not-allowed"
                  >
                    {dbCalendars.filter(cal => assignedCalendarIds.includes(cal._id)).map(cal => (
                      <option key={cal._id} value={cal._id}>📍 {cal.name}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={selectedCalendarId}
                    onChange={(e) => setSelectedCalendarId(e.target.value)}
                    className="w-full bg-surface-container-lowest text-xs rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none font-bold text-on-surface"
                  >
                    <option value="">🏢 Central Business Services</option>
                    {dbCalendars.map(cal => (
                      <option key={cal._id} value={cal._id}>📍 {cal.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <button 
              onClick={() => {
                setCurrentService({
                  name: '',
                  durationHours: 0,
                  durationMinutes: 30,
                  price: 0,
                  maxCapacity: 1,
                  advanceBookingDays: 0,
                  advanceBookingHours: 0,
                  advanceBookingMinutes: 0,
                  imageUrl: '',
                  isActive: true
                });
                setShowModal(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Service</span>
            </button>
          </div>

          {/* Location Scope Banner Info */}
          {selectedCalendarId && !loading && (
            <div className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm mb-6 ${
              isCustom 
                ? 'bg-emerald-50/40 border-emerald-100/60' 
                : 'bg-indigo-50/40 border-indigo-100/60'
            }`}>
              <div className="space-y-1">
                <h5 className="font-extrabold text-[13px] text-on-surface flex items-center gap-1.5">
                  <span className={isCustom ? 'text-emerald-600' : 'text-indigo-600'}>📍</span>
                  {isCustom ? 'Location Custom Services Enabled' : 'Central Business Services Active'}
                </h5>
                <p className="text-xs text-on-surface-variant max-w-2xl leading-relaxed">
                  {isCustom 
                    ? 'This location is using custom service overrides. Any edits or deactivations here will only affect this branch and will not change central business templates.' 
                    : 'Currently using standard central business services. Any edits or deactivations are disabled until you enable location-specific custom services.'}
                </p>
              </div>
              <div>
                {isCustom ? (
                  <button
                    onClick={handleResetToCentral}
                    disabled={syncing}
                    className="w-full sm:w-auto bg-surface-container-lowest hover:bg-red-50 text-error border border-outline-variant/30 hover:border-red-200 font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow-sm"
                  >
                    Reset to Central Services
                  </button>
                ) : (
                  <button
                    onClick={handleSyncServices}
                    disabled={syncing}
                    className="w-full sm:w-auto bg-primary hover:bg-primary-container text-on-primary font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow-md"
                  >
                    {syncing ? 'Enabling...' : 'Enable Custom Services'}
                  </button>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-20 text-xs text-on-surface-variant font-bold">
              Fetching services from MongoDB...
            </div>
          ) : services.length === 0 ? (
            selectedCalendarId ? (
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-12 text-center space-y-4 max-w-xl mx-auto shadow-sm">
                <div className="bg-primary/10 text-primary w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-sm text-on-surface">No custom services setup for this location</h3>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                  You can sync all services from the primary central business to this location. You can then edit or customize them specifically for this branch without affecting central settings.
                </p>
                <button
                  onClick={handleSyncServices}
                  disabled={syncing}
                  className="bg-primary hover:bg-primary-container text-on-primary font-bold text-xs px-4 py-2.5 rounded-lg transition-all"
                >
                  {syncing ? 'Syncing central services...' : 'Sync Central Business Services'}
                </button>
              </div>
            ) : (
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-16 text-center space-y-3 max-w-lg mx-auto">
                <div className="bg-primary/10 text-primary w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                  <Plus className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-sm text-on-surface">No Central Services Found</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  There are no central service offerings registered for the business yet. Click &quot;Add New Service&quot; to create one.
                </p>
              </div>
            )
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12 text-xs text-on-surface-variant italic font-semibold">
              No matching services found for &quot;{search}&quot;.
            </div>
          ) : (
            /* Cards Grid */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <div 
                  key={service.id} 
                  className={`bg-surface-container-lowest border rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
                    service.isActive ? 'border-outline-variant/30' : 'border-outline-variant/10 opacity-70'
                  }`}
                >
                  <div>
                    {/* Optional Image */}
                    {service.imageUrl ? (
                      <div className="h-44 w-full relative overflow-hidden bg-surface-container">
                        <img 
                          src={service.imageUrl} 
                          alt={service.name}
                          className="w-full h-full object-cover"
                        />
                        {!service.isActive && (
                          <div className="absolute inset-0 bg-surface-container-highest/60 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="bg-surface-container-lowest text-[10px] text-on-surface font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider border border-outline-variant/30">Inactive</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-28 w-full bg-surface-container flex items-center justify-center text-outline-variant relative">
                        <ImageIcon className="w-8 h-8 opacity-40" />
                        {!service.isActive && (
                          <div className="absolute inset-0 bg-surface-container-highest/60 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="bg-surface-container-lowest text-[10px] text-on-surface font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider border border-outline-variant/30">Inactive</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-5 space-y-4">
                      
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm text-on-surface leading-snug line-clamp-1" title={service.name}>{service.name}</h4>
                          {selectedCalendarId && !isCustom && (
                            <span className="inline-block bg-indigo-50 text-indigo-600 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider border border-indigo-100/50">Central Template</span>
                          )}
                        </div>
                        <button 
                          onClick={() => {
                            if (selectedCalendarId && !isCustom) {
                              alert('You are currently viewing Central Services. Please enable Custom Services for this location to edit or deactivate them.');
                              return;
                            }
                            handleToggleActive(service.id);
                          }}
                          className={`text-on-surface-variant hover:text-on-surface transition-colors ${
                            selectedCalendarId && !isCustom ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title={service.isActive ? "Deactivate Service" : "Activate Service"}
                        >
                          {service.isActive ? (
                            <ToggleRight className="w-6 h-6 text-primary" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-outline" />
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 border-y border-outline-variant/20 py-3 text-xs font-semibold text-on-surface-variant">
                        <div className="space-y-1">
                          <span className="text-[9px] text-outline-variant uppercase tracking-wider font-extrabold">Price Rate</span>
                          <div className="flex items-center gap-1 font-bold text-on-surface text-[13px]">
                            <DollarSign className="w-4 h-4 text-primary" />
                            {service.price}
                          </div>
                        </div>
                        <div className="space-y-1 border-l border-outline-variant/20 pl-3">
                          <span className="text-[9px] text-outline-variant uppercase tracking-wider font-extrabold">Duration</span>
                          <div className="flex items-center gap-1 font-bold text-on-surface text-[13px]">
                            <Clock className="w-4 h-4 text-primary" />
                            {formatDuration(service.durationHours, service.durationMinutes)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 border-b border-outline-variant/20 pb-3 text-xs font-semibold text-on-surface-variant">
                        <div className="space-y-1">
                          <span className="text-[9px] text-outline-variant uppercase tracking-wider font-extrabold">Max Capacity</span>
                          <div className="flex items-center gap-1 font-semibold text-[11px] text-on-surface">
                            <Users className="w-3.5 h-3.5 text-secondary" />
                            {service.maxCapacity} {service.maxCapacity === 1 ? 'person' : 'persons'}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="p-5 pt-0 flex gap-2.5">
                    <button 
                      onClick={() => {
                        if (selectedCalendarId && !isCustom) {
                          alert('You are currently viewing Central Services. Please enable Custom Services for this location to edit them.');
                          return;
                        }
                        handleEditService(service);
                      }}
                      className={`flex-1 flex items-center justify-center gap-1 border border-outline-variant/40 hover:bg-surface-container-low text-on-surface py-2 rounded-lg text-[11px] font-bold transition-colors ${
                        selectedCalendarId && !isCustom ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Details
                    </button>
                    <button 
                      onClick={() => {
                        if (selectedCalendarId && !isCustom) {
                          alert('You are currently viewing Central Services. Central templates cannot be deleted from branch panels.');
                          return;
                        }
                        handleDeleteService(service.id);
                      }}
                      className={`p-2 border border-outline-variant/40 hover:bg-red-50 text-error rounded-lg transition-colors ${
                        selectedCalendarId && !isCustom ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add / Edit Modal Sandbox */}
          {showModal && (
            <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-xl space-y-4 my-8">
                
                <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
                  <h3 className="font-bold text-sm">{currentService.id && currentService.id.length === 24 ? 'Edit Service Details' : 'Add New Service'}</h3>
                  <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface font-bold text-xs">Close</button>
                </div>

                <div className="space-y-4 text-xs">
                  
                  {/* Name field */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Service Name *</label>
                    <input 
                      type="text" 
                      value={currentService.name || ''} 
                      onChange={(e) => setCurrentService({ ...currentService, name: e.target.value })}
                      placeholder="e.g. Haircut & Styling"
                      className="w-full text-xs bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                    />
                  </div>

                  {/* Pricing and Capacity */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase">Price ($) *</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        step="0.01"
                        value={currentService.price === 0 && !currentService.id ? '' : currentService.price} 
                        onChange={(e) => setCurrentService({ ...currentService, price: parseFloat(e.target.value) || 0 })}
                        onFocus={(e) => e.target.select()}
                        placeholder="0.00"
                        className="w-full text-xs bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase">Max Capacity *</label>
                      <input 
                        type="number" 
                        value={currentService.maxCapacity || 1} 
                        onChange={(e) => setCurrentService({ ...currentService, maxCapacity: parseInt(e.target.value) || 1 })}
                        className="w-full text-xs bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Duration split: Hours and Minutes */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Service Duration</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <select 
                          value={currentService.durationHours || 0}
                          onChange={(e) => setCurrentService({ ...currentService, durationHours: parseInt(e.target.value) || 0 })}
                          className="w-full text-xs bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 focus:outline-none"
                        >
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(h => (
                            <option key={h} value={h}>{h} {h === 1 ? 'hour' : 'hours'}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <select 
                          value={currentService.durationMinutes || 30}
                          onChange={(e) => setCurrentService({ ...currentService, durationMinutes: parseInt(e.target.value) || 0 })}
                          className="w-full text-xs bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 focus:outline-none"
                        >
                          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                            <option key={m} value={m}>{m} minutes</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Advance Booking split: Days, Hours, and Minutes */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Advance Booking Window (Days, Hours, Mins)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <select 
                          value={currentService.advanceBookingDays || 0}
                          onChange={(e) => setCurrentService({ ...currentService, advanceBookingDays: parseInt(e.target.value) || 0 })}
                          className="w-full text-xs bg-surface-container border border-outline-variant/30 rounded-lg p-2 focus:outline-none"
                        >
                          {[0, 1, 2, 3, 4, 5, 7, 10, 14, 30].map(d => (
                            <option key={d} value={d}>{d} {d === 1 ? 'day' : 'days'}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select 
                          value={currentService.advanceBookingHours || 0}
                          onChange={(e) => setCurrentService({ ...currentService, advanceBookingHours: parseInt(e.target.value) || 0 })}
                          className="w-full text-xs bg-surface-container border border-outline-variant/30 rounded-lg p-2 focus:outline-none"
                        >
                          {Array.from({ length: 24 }).map((_, h) => (
                            <option key={h} value={h}>{h} {h === 1 ? 'hour' : 'hours'}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select 
                          value={currentService.advanceBookingMinutes || 0}
                          onChange={(e) => setCurrentService({ ...currentService, advanceBookingMinutes: parseInt(e.target.value) || 0 })}
                          className="w-full text-xs bg-surface-container border border-outline-variant/30 rounded-lg p-2 focus:outline-none"
                        >
                          {[0, 15, 30, 45].map(m => (
                            <option key={m} value={m}>{m} mins</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Cloudinary Image Upload Section */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Service Image (Cloudinary)</label>
                    
                    <div className="flex gap-4 items-center">
                      {currentService.imageUrl ? (
                        <div className="h-16 w-16 rounded-lg bg-surface-container overflow-hidden border border-outline-variant/30 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={currentService.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-surface-container border border-outline-variant/30 flex items-center justify-center text-outline/30 flex-shrink-0">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                      
                      <div className="grow">
                        <label className="border border-dashed border-outline-variant/40 hover:bg-surface-container-low transition-colors rounded-lg px-4 py-3 flex flex-col items-center justify-center cursor-pointer text-center">
                          <Upload className="w-4.5 h-4.5 text-on-surface-variant" />
                          <span className="font-semibold text-[10px] text-on-surface mt-1">
                            {uploading ? 'Uploading to Cloudinary...' : 'Select service image'}
                          </span>
                          <input 
                            type="file" 
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageUpload}
                            disabled={uploading}
                            className="hidden"
                          />
                        </label>
                        <span className="text-[9px] text-on-surface-variant block mt-1 text-center">
                          Supported formats: JPEG, PNG, WEBP. Max size 2MB.
                        </span>
                      </div>
                    </div>

                    {uploadError && (
                      <span className="text-[10px] text-error font-semibold mt-1 block">{uploadError}</span>
                    )}
                  </div>

                </div>

                <div className="flex gap-3 pt-4 border-t border-outline-variant/20">
                  <button 
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 border border-outline-variant/40 hover:bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface-variant transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveService}
                    className="flex-1 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Check className="w-4 h-4" /> Save Service
                  </button>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
