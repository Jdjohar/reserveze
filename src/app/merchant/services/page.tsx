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

  // Load services from MongoDB on mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : null;
        const url = storedBizId ? `/api/services?businessId=${storedBizId}` : '/api/services';
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          const mapped = data.services.map((s: any) => ({
            ...s,
            id: s._id // Map Mongoose _id to frontend component id
          }));
          setServices(mapped);
        }
      } catch (err) {
        console.error('Error fetching services from MongoDB:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

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
        // Create new document in MongoDB
        const res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          setServices([...services, { ...data.service, id: data.service._id }]);
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

          {/* Loading Indicator */}
          {loading ? (
            <div className="flex justify-center items-center py-20 text-xs text-on-surface-variant font-bold">
              Fetching services from MongoDB...
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
                    {/* Service Image banner */}
                    <div className="h-40 w-full bg-surface-container relative overflow-hidden flex items-center justify-center border-b border-outline-variant/20">
                      {service.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={service.imageUrl} 
                          alt={service.name} 
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <ImageIcon className="w-10 h-10 text-outline/30" />
                      )}
                      <span className="absolute top-3 right-3 text-[10px] font-extrabold text-primary bg-surface-container-lowest px-2.5 py-1 rounded-full shadow-sm">
                        ${service.price}
                      </span>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-extrabold text-sm text-on-surface leading-snug">{service.name}</h3>
                        <button 
                          onClick={() => handleToggleActive(service.id)}
                          className={`text-on-surface-variant transition-colors ${service.isActive ? 'text-primary' : 'text-outline/40'}`}
                        >
                          {service.isActive ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 py-3 border-y border-outline-variant/20 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Duration</span>
                          <div className="font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            {formatDuration(service.durationHours, service.durationMinutes)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Max Capacity</span>
                          <div className="font-bold flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-secondary" />
                            {service.maxCapacity} {service.maxCapacity === 1 ? 'person' : 'persons'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider flex items-center gap-1">
                          <CalendarCheck className="w-3.5 h-3.5 text-tertiary" /> Advance Booking
                        </span>
                        <span className="font-bold text-on-surface">
                          {formatAdvanceBooking(service.advanceBookingDays, service.advanceBookingHours, service.advanceBookingMinutes)}
                        </span>
                      </div>

                    </div>
                  </div>

                  <div className="p-5 pt-0 flex gap-2.5">
                    <button 
                      onClick={() => handleEditService(service)}
                      className="flex-1 flex items-center justify-center gap-1 border border-outline-variant/40 hover:bg-surface-container-low text-on-surface py-2 rounded-lg text-[11px] font-bold transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Details
                    </button>
                    <button 
                      onClick={() => handleDeleteService(service.id)}
                      className="p-2 border border-outline-variant/40 hover:bg-red-50 text-error rounded-lg transition-colors"
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
                        value={currentService.price || 0} 
                        onChange={(e) => setCurrentService({ ...currentService, price: parseFloat(e.target.value) || 0 })}
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
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                            className="hidden"
                          />
                        </label>
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
