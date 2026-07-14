/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Calendar as CalendarIcon, 
  Info, 
  X, 
  Check, 
  Globe, 
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Edit2,
  Trash2
} from 'lucide-react';
import { validateEmail, validatePhone } from '@/lib/validation';

interface Client {
  _id: string;
  calendarId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export default function MerchantClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add client states
  const [dbCalendars, setDbCalendars] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCalendarId, setSelectedCalendarId] = useState('');
  const [isRestrictedManager, setIsRestrictedManager] = useState(false);
  const [assignedCalendarIds, setAssignedCalendarIds] = useState<string[]>([]);
  const [selectedScopeCalId, setSelectedScopeCalId] = useState('');
  const [errorModal, setErrorModal] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Detail Modal/Drawer states
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientAppointments, setClientAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  useEffect(() => {
    const initPage = async () => {
      try {
        const storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : null;
        
        // Check manager status
        let isRestricted = false;
        let assignedIds: string[] = [];
        if (typeof window !== 'undefined') {
          const rawAssigned = localStorage.getItem('assigned_calendar_ids');
          if (rawAssigned) {
            isRestricted = true;
            assignedIds = JSON.parse(rawAssigned);
            setIsRestrictedManager(true);
            setAssignedCalendarIds(assignedIds);
          }
        }

        // Fetch calendars
        if (storedBizId) {
          const calRes = await fetch(`/api/calendars?businessId=${storedBizId}`);
          const calData = await calRes.json();
          if (calData.success) {
            setDbCalendars(calData.calendars);
          }
        }

        // Set default scope selection
        if (isRestricted && assignedIds.length > 0) {
          setSelectedScopeCalId(assignedIds[0]);
        } else {
          setSelectedScopeCalId('');
        }

        // Fetch clients
        const url = storedBizId ? `/api/clients?businessId=${storedBizId}` : '/api/clients';
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setClients(data.clients);
        }
      } catch (err) {
        console.error('Failed to load clients data:', err);
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, []);

  const handleOpenAdd = () => {
    setEditingClient(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    if (isRestrictedManager && assignedCalendarIds.length > 0) {
      setSelectedCalendarId(assignedCalendarIds[0]);
    } else {
      setSelectedCalendarId('');
    }
    setErrorModal('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFirstName(client.firstName);
    setLastName(client.lastName);
    setEmail(client.email);
    setPhone(client.phone || '');
    setSelectedCalendarId(client.calendarId || '');
    setErrorModal('');
    setShowAddModal(true);
  };

  const handleDeleteClient = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`/api/clients?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setClients(clients.filter(c => c._id !== id));
      } else {
        alert(data.error || 'Failed to delete customer.');
      }
    } catch (err) {
      console.error('Delete client error:', err);
      alert('Connection error. Please try again.');
    }
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      setErrorModal('First Name, Last Name, and Email are required.');
      return;
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setErrorModal('Please enter a valid email address.');
      return;
    }
    if (emailCheck.isDisposable) {
      setErrorModal('Disposable email addresses are not allowed. Please use a standard email domain.');
      return;
    }
    if (phone && !validatePhone(phone)) {
      setErrorModal('Please enter a valid phone number (7 to 15 digits).');
      return;
    }

    setErrorModal('');
    try {
      const storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : null;
      const isEdit = !!editingClient;

      const payload: any = {
        businessId: storedBizId,
        calendarId: selectedCalendarId || undefined,
        firstName,
        lastName,
        email,
        phone
      };

      if (isEdit && editingClient) {
        payload.id = editingClient._id;
      }

      const res = await fetch('/api/clients', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        if (isEdit) {
          setClients(clients.map(c => c._id === editingClient._id ? data.client : c));
        } else {
          setClients([data.client, ...clients]);
        }
        setShowAddModal(false);
      } else {
        setErrorModal(data.error || 'Failed to save client.');
      }
    } catch (err) {
      console.error('Save client error:', err);
      setErrorModal('Connection error. Please try again.');
    }
  };

  const handleClientClick = async (client: Client) => {
    setSelectedClient(client);
    setClientAppointments([]);
    setLoadingAppointments(true);
    try {
      const storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : null;
      const res = await fetch(`/api/appointments?businessId=${storedBizId}&clientId=${client._id}`);
      const data = await res.json();
      if (data.success) {
        setClientAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error('Failed to fetch client appointments:', err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleUpdateStatus = async (apptId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        // Update local list
        setClientAppointments(clientAppointments.map(a => a._id === apptId ? { ...a, status: newStatus } : a));
      } else {
        alert(data.error || 'Failed to update status.');
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert('Network error.');
    }
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
                          c.email.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    // Location scope filter
    if (isRestrictedManager) {
      if (c.calendarId && !assignedCalendarIds.includes(c.calendarId)) {
        return false;
      }
      return true;
    }

    // Owner scope filter:
    if (selectedScopeCalId === 'central') {
      return !c.calendarId;
    }
    if (selectedScopeCalId && selectedScopeCalId !== '') {
      return c.calendarId === selectedScopeCalId;
    }
    return true; // 'all'
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'COMPLETED':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      default:
        return 'bg-outline-variant/10 text-on-surface-variant/70 border-outline-variant/10';
    }
  };

  return (
    <div className="flex bg-surface-container-low min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Client CRM Portal" subtitle="Manage client accounts, appointment histories, and contact info." />

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
                  placeholder="Search clients by name or email..."
                  className="w-full bg-surface-container-lowest text-xs rounded-lg pl-9 pr-4 py-2.5 border border-outline-variant/30 focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Location Scope Selector */}
              <div className="w-full sm:w-48 shrink-0">
                {isRestrictedManager ? (
                  <select
                    value={selectedScopeCalId}
                    disabled
                    className="w-full bg-surface-container text-xs rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none font-bold text-on-surface-variant opacity-75 cursor-not-allowed"
                  >
                    {dbCalendars.filter(cal => assignedCalendarIds.includes(cal._id)).map(cal => (
                      <option key={cal._id} value={cal._id}>📍 {cal.name}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={selectedScopeCalId}
                    onChange={(e) => setSelectedScopeCalId(e.target.value)}
                    className="w-full bg-surface-container-lowest text-xs rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none font-bold text-on-surface"
                  >
                    <option value="">🏢 All Locations (Central CRM)</option>
                    <option value="central">⭐ Central CRM (No Location)</option>
                    {dbCalendars.map(cal => (
                      <option key={cal._id} value={cal._id}>📍 {cal.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <button 
              onClick={handleOpenAdd}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Client</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20 text-xs text-on-surface-variant font-bold">
              Fetching client list from MongoDB...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-16 text-center space-y-3">
              <div className="bg-primary/10 text-primary w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-sm text-on-surface">No Clients Found</h3>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                There are no client profiles in the database for the selected scope. Clients will be registered automatically upon placing bookings.
              </p>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30 text-on-surface-variant font-bold uppercase tracking-wider bg-surface-container-low/20">
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4">Location / Branch</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((c) => {
                    const fullName = `${c.firstName} ${c.lastName}`;
                    const initials = `${c.firstName[0] || ''}${c.lastName[0] || ''}`.toUpperCase();
                    return (
                      <tr 
                        key={c._id} 
                        onClick={() => handleClientClick(c)}
                        className="border-b border-outline-variant/20 hover:bg-surface-container-low/40 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-4 font-bold text-on-surface flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-[10px]">
                            {initials || 'U'}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span>{fullName}</span>
                            <ChevronRight className="w-3 h-3 text-outline/50 sm:hidden" />
                          </div>
                        </td>
                        <td className="py-4 px-4 text-on-surface-variant">
                          <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-outline" /> {c.email}</span>
                        </td>
                        <td className="py-4 px-4 text-on-surface-variant">
                          <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-outline" /> {c.phone || 'N/A'}</span>
                        </td>
                        <td className="py-4 px-4 text-on-surface-variant font-medium">
                          {c.calendarId ? (
                            dbCalendars.find((cal: any) => cal._id === c.calendarId)?.name || 'Branch Location'
                          ) : (
                            <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-extrabold uppercase scale-90">All Locations</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-on-surface-variant">
                          <span className="flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5 text-outline" /> {new Date(c.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(c);
                              }}
                              className="p-1.5 hover:bg-surface-container text-on-surface rounded transition-colors"
                              title="Edit Customer Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteClient(c._id, e)}
                              className="p-1.5 hover:bg-red-50 text-error rounded transition-colors"
                              title="Delete Customer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </main>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveClient} className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-xl space-y-4">
            
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h3 className="font-extrabold text-sm">{editingClient ? 'Edit Client Profile' : 'Add New Client Profile'}</h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant hover:text-on-surface font-bold text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorModal && (
              <div className="bg-error/10 border border-error/20 text-error p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span>{errorModal}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              
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
                  placeholder="+1 (555) 0192"
                  className="w-full bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                />
              </div>

              {/* Location Select Dropdown */}
              {!isRestrictedManager && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Assign to Location / Branch</label>
                  <select
                    value={selectedCalendarId}
                    onChange={(e) => setSelectedCalendarId(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 focus:outline-none font-bold"
                  >
                    <option value="">All Locations / Central CRM</option>
                    {dbCalendars.map(cal => (
                      <option key={cal._id} value={cal._id}>{cal.name}</option>
                    ))}
                  </select>
                </div>
              )}

            </div>

            <div className="flex gap-3 pt-3 border-t border-outline-variant/20">
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
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

      {/* Client Detail Slide-Over Drawer */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-surface-container-lowest border-l border-outline-variant/30 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xs">
                  {`${selectedClient.firstName[0] || ''}${selectedClient.lastName[0] || ''}`.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-on-surface">{selectedClient.firstName} {selectedClient.lastName}</h3>
                  <p className="text-[10px] text-on-surface-variant">Registered since {new Date(selectedClient.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedClient(null)}
                className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Profile Details Cards */}
              <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/20 space-y-3">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">Contact Profile</h4>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-on-surface-variant font-medium">Email Address</span>
                    <p className="font-semibold text-on-surface break-words flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-outline shrink-0" />
                      {selectedClient.email}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-on-surface-variant font-medium">Phone Number</span>
                    <p className="font-semibold text-on-surface flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-outline shrink-0" />
                      {selectedClient.phone || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-outline-variant/10 pt-3 text-xs">
                  <span className="text-[10px] text-on-surface-variant font-medium">Registered Workspace Scope</span>
                  <p className="font-semibold text-on-surface flex items-center gap-1.5 mt-0.5">
                    <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                    {selectedClient.calendarId ? (
                      dbCalendars.find((cal: any) => cal._id === selectedClient.calendarId)?.name || 'Branch Location'
                    ) : (
                      'All Locations (Central CRM)'
                    )}
                  </p>
                </div>
              </div>

              {/* Appointment History Logs */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Appointment History Logs ({clientAppointments.length})
                </h4>

                {loadingAppointments ? (
                  <div className="py-10 text-center text-xs font-bold text-on-surface-variant">
                    Fetching bookings history from database...
                  </div>
                ) : clientAppointments.length === 0 ? (
                  <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/20 text-center space-y-1.5">
                    <AlertCircle className="w-5 h-5 text-outline mx-auto" />
                    <h5 className="font-bold text-xs text-on-surface">No Appointments Found</h5>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed">
                      This customer has not booked any active service slots yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientAppointments.map((appt) => (
                      <div key={appt._id} className="bg-surface-container p-4 rounded-xl border border-outline-variant/25 space-y-3 transition-all">
                        
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-extrabold text-xs text-on-surface">{appt.serviceName || 'Standard Service'}</h5>
                            <span className="text-[10px] text-on-surface-variant font-medium block mt-0.5 flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3 text-outline" />
                              {new Date(appt.startTime).toLocaleString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          <span className={`text-[9px] font-extrabold border px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusStyle(appt.status)}`}>
                            {appt.status}
                          </span>
                        </div>

                        {/* Interactive action choices */}
                        {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
                          <div className="flex gap-2 pt-2 border-t border-outline-variant/10">
                            {appt.status === 'PENDING' && (
                              <button
                                onClick={() => handleUpdateStatus(appt._id, 'CONFIRMED')}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                              >
                                <Check className="w-3 h-3" /> Approve
                              </button>
                            )}
                            {appt.status === 'CONFIRMED' && (
                              <button
                                onClick={() => handleUpdateStatus(appt._id, 'COMPLETED')}
                                className="flex-1 bg-primary hover:bg-primary-container text-on-primary py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                              >
                                <ShieldCheck className="w-3 h-3" /> Complete
                              </button>
                            )}
                            <button
                              onClick={() => handleUpdateStatus(appt._id, 'CANCELLED')}
                              className="flex-1 border border-red-500/30 hover:bg-red-500/5 text-red-600 py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                            >
                              <X className="w-3 h-3" /> Cancel
                            </button>
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
