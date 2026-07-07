'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { Users, Search, Plus, Mail, Phone, Calendar, ShieldCheck, Edit2, Trash2, Check, X, Tag } from 'lucide-react';

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'MANAGER' | 'STAFF' | 'SPECIALIST';
  calendarIds: string[];
  serviceIds: string[];
  createdAt: string;
}

interface CalendarObj {
  _id: string;
  name: string;
}

interface ServiceObj {
  id: string;
  name: string;
}

export default function MerchantTeamPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [calendars, setCalendars] = useState<CalendarObj[]>([]);
  const [services, setServices] = useState<ServiceObj[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'MANAGER' | 'STAFF' | 'SPECIALIST'>('STAFF');
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [password, setPassword] = useState('');

  // Scoped locations
  const [isRestrictedManager, setIsRestrictedManager] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('assigned_calendar_ids');
    }
    return false;
  });
  const [assignedCalendarIds, setAssignedCalendarIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('assigned_calendar_ids');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
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
      const raw = localStorage.getItem('assigned_calendar_ids');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed[0];
          }
        } catch {}
      }
    }
    return '';
  });

  const fetchTeam = async () => {
    try {
      const storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : null;
      if (!storedBizId) return;

      // Load team members
      let url = `/api/team?businessId=${storedBizId}`;
      if (selectedCalendarId) {
        url += `&calendarId=${selectedCalendarId}`;
      }
      const teamRes = await fetch(url);
      const teamData = await teamRes.json();
      if (teamData.success) {
        setEmployees(teamData.employees);
      }

      // Load calendars (locations)
      const calRes = await fetch(`/api/calendars?businessId=${storedBizId}`);
      const calData = await calRes.json();
      if (calData.success) {
        setCalendars(calData.calendars);
      }

      // Load services
      const serviceRes = await fetch(`/api/services?businessId=${storedBizId}`);
      const serviceData = await serviceRes.json();
      if (serviceData.success) {
        setServices(serviceData.services);
      }
    } catch (err) {
      console.error('Failed to load team data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [selectedCalendarId]);

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setRole('STAFF');
    setSelectedCalendars(isRestrictedManager ? assignedCalendarIds : []);
    setSelectedServices([]);
    setPassword('');
    setShowModal(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFirstName(emp.firstName);
    setLastName(emp.lastName);
    setEmail(emp.email);
    setPhone(emp.phone || '');
    setRole(emp.role);
    setSelectedCalendars(emp.calendarIds || []);
    setSelectedServices(emp.serviceIds || []);
    setPassword('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      alert('Please fill in first name, last name, and email.');
      return;
    }

    const storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : null;
    const isEdit = !!editingEmployee;

    try {
      const payload: any = {
        businessId: storedBizId,
        firstName,
        lastName,
        email,
        phone,
        role,
        calendarIds: selectedCalendars,
        serviceIds: selectedServices,
        password: password || undefined
      };

      if (isEdit && editingEmployee) {
        payload.id = editingEmployee._id;
      }

      const res = await fetch('/api/team', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        setShowModal(false);
        fetchTeam();
        if (data.tempPassword && !password) {
          alert(`Team member created successfully!\n\nTemporary Login Password is:\n${data.tempPassword}\n\nPlease share this password with them to log in.`);
        }
      } else {
        alert(data.error || 'Failed to save team member.');
      }
    } catch (err) {
      console.error('Save employee error:', err);
      alert('An error occurred. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const res = await fetch(`/api/team?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchTeam();
      } else {
        alert(data.error || 'Failed to delete team member.');
      }
    } catch (err) {
      console.error('Delete employee error:', err);
      alert('An error occurred. Please try again.');
    }
  };

  const handleToggleCalendar = (id: string) => {
    setSelectedCalendars(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleToggleService = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const filteredEmployees = employees.filter(emp =>
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    emp.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex bg-surface-container-low min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Team Members" subtitle="Manage employee profiles, assign branch locations, and link performable booking services." />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search team members..."
                  className="w-full bg-surface-container-lowest text-xs rounded-lg pl-9 pr-4 py-2.5 border border-outline-variant/30 focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Location Scope Selector */}
              <div className="w-full sm:w-48 shrink-0">
                {isRestrictedManager ? (
                  <select
                    value={selectedCalendarId}
                    disabled
                    className="w-full bg-surface-container text-xs rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none font-bold text-on-surface-variant opacity-75 cursor-not-allowed"
                  >
                    {calendars.filter(cal => assignedCalendarIds.includes(cal._id)).map(cal => (
                      <option key={cal._id} value={cal._id}>📍 {cal.name}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={selectedCalendarId}
                    onChange={(e) => setSelectedCalendarId(e.target.value)}
                    className="w-full bg-surface-container-lowest text-xs rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none font-bold text-on-surface"
                  >
                    <option value="">🏢 All Locations (Central)</option>
                    {calendars.map(cal => (
                      <option key={cal._id} value={cal._id}>📍 {cal.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <button 
              onClick={handleOpenAdd}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary px-4 py-2.5 rounded-lg text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Team Member</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20 text-xs text-on-surface-variant font-bold">
              Fetching team profiles from MongoDB...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-16 text-center space-y-3">
              <div className="bg-primary/10 text-primary w-12 h-12 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-sm text-on-surface">No Team Members Configured</h3>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                Add profiles for your staff, assign them to specific locations, and select which services they perform.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map(emp => (
                <div key={emp._id} className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 space-y-4 hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="space-y-3 text-xs">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-sm text-on-surface">{emp.firstName} {emp.lastName}</h4>
                        <span className="inline-block bg-primary/15 text-primary text-[8px] font-black uppercase px-2 py-0.5 rounded mt-1 tracking-wider">
                          {emp.role}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 hover:bg-surface-container rounded text-on-surface-variant transition-colors"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(emp._id)}
                          className="p-1.5 hover:bg-red-50 text-error rounded transition-colors"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Contacts info */}
                    <div className="space-y-1.5 pt-2 border-t border-outline-variant/10 text-on-surface-variant font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{emp.email}</span>
                      </div>
                      {emp.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{emp.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Assigned Locations */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Assigned Locations</span>
                      <div className="flex flex-wrap gap-1">
                        {emp.calendarIds && emp.calendarIds.length > 0 ? (
                          emp.calendarIds.map(cId => {
                            const cal = calendars.find(c => c._id === cId);
                            return cal ? (
                              <span key={cId} className="bg-surface-container border border-outline-variant/30 text-[9px] font-bold px-2 py-0.5 rounded">
                                📍 {cal.name}
                              </span>
                            ) : null;
                          })
                        ) : (
                          <span className="text-[9px] text-outline-variant italic">No locations assigned</span>
                        )}
                      </div>
                    </div>

                    {/* Linked Services */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Linked Services</span>
                      <div className="flex flex-wrap gap-1">
                        {emp.serviceIds && emp.serviceIds.length > 0 ? (
                          emp.serviceIds.map(sId => {
                            const srv = services.find(s => s.id === sId);
                            return srv ? (
                              <span key={sId} className="bg-primary/5 border border-primary/20 text-[9px] text-primary font-bold px-2 py-0.5 rounded">
                                ⚙️ {srv.name}
                              </span>
                            ) : null;
                          })
                        ) : (
                          <span className="text-[9px] text-outline-variant italic">No services linked</span>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h3 className="font-extrabold text-sm">{editingEmployee ? 'Edit Team Member' : 'Add Team Member'}</h3>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="text-on-surface-variant hover:text-on-surface font-bold text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Names */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">First Name *</label>
                  <input 
                    type="text" 
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="w-full bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Last Name *</label>
                  <input 
                    type="text" 
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    className="w-full bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Email Address *</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane.smith@example.com"
                    className="w-full bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Phone Number</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 091-2834"
                    className="w-full bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                  />
                </div>
              </div>

              {/* Role select */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Business Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 focus:outline-none font-bold"
                >
                  <option value="STAFF">Standard Staff (Scheduling availability only)</option>
                  <option value="SPECIALIST">Specialist (Linked to specific services)</option>
                  {!isRestrictedManager && (
                    <option value="MANAGER">Location Manager (Access control permissions)</option>
                  )}
                </select>
              </div>



              {/* Assign calendars locations */}
              {!isRestrictedManager && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase block">Assign Locations (Branches)</label>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto bg-surface-container/50 border border-outline-variant/20 rounded-xl p-3">
                    {calendars.length === 0 ? (
                      <span className="text-[10px] text-on-surface-variant italic">No locations configured yet.</span>
                    ) : (
                      calendars.map(cal => (
                        <label key={cal._id} className={`flex items-center gap-2 cursor-pointer`}>
                          <input 
                            type="checkbox"
                            checked={selectedCalendars.includes(cal._id)}
                            onChange={() => handleToggleCalendar(cal._id)}
                            className="rounded border-outline-variant/60 text-primary focus:ring-primary w-4 h-4"
                          />
                          <span className="font-semibold text-on-surface">{cal.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Assign performable services */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase block">Link Performable Services</label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto bg-surface-container/50 border border-outline-variant/20 rounded-xl p-3">
                  {services.length === 0 ? (
                    <span className="text-[10px] text-on-surface-variant italic">No services configured yet.</span>
                  ) : (
                    services.map(srv => (
                      <label key={srv.id} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={selectedServices.includes(srv.id)}
                          onChange={() => handleToggleService(srv.id)}
                          className="rounded border-outline-variant/60 text-primary focus:ring-primary w-4 h-4"
                        />
                        <span className="font-semibold text-on-surface">{srv.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

            </div>

            <div className="flex gap-3 pt-3 border-t border-outline-variant/20">
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-outline-variant/40 hover:bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
              >
                <Check className="w-4 h-4" /> Save Profile
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
