'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter, 
  CalendarDays,
  Clock,
  Sparkles,
  Mail,
  MessageSquare,
  Settings,
  Trash2,
  Check,
  X,
  ShieldCheck
} from 'lucide-react';

interface DBAppointment {
  _id: string;
  startTime: string;
  endTime: string;
  status: string;
  primaryChannel: string;
  clientName?: string;
  serviceName?: string;
  serviceId?: string;
  calendarId?: string;
}

const HOLIDAYS = [
  { name: "Independence Day", date: "2026-07-04" },
  { name: "Labor Day", date: "2026-09-07" },
  { name: "Christmas Eve", date: "2026-12-24" },
  { name: "Christmas Day", date: "2026-12-25" },
  { name: "New Year's Day", date: "2026-01-01" }
];

export default function MerchantCalendar() {
  const [appointments, setAppointments] = useState<DBAppointment[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<DBAppointment | null>(null);
  const [showApptDetailModal, setShowApptDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCalModal, setShowCalModal] = useState(false);
  const [editingCal, setEditingCal] = useState<any>(null);
  const [errorCalModal, setErrorCalModal] = useState('');

  const handleApptClick = (apptId: string) => {
    const found = appointments.find(a => a._id === apptId);
    if (found) {
      setSelectedAppt(found);
      setShowApptDetailModal(true);
    }
  };

  const handleUpdateApptStatus = async (apptId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setAppointments(appointments.map(a => a._id === apptId ? { ...a, status: newStatus } : a));
        setShowApptDetailModal(false);
        setSelectedAppt(null);
      } else {
        alert(data.error || 'Failed to update status.');
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert('Network error.');
    }
  };
  const [showSidebar, setShowSidebar] = useState(true);
  const [createCount, setCreateCount] = useState(1);
  const [importFromId, setImportFromId] = useState('');
  const [importDataEnabled, setImportDataEnabled] = useState(true);
  const [currentWeekLabel, setCurrentWeekLabel] = useState("");
  const [selectedService, setSelectedService] = useState('all');
  const [baseDate, setBaseDate] = useState(new Date());

  const [isRestrictedManager, setIsRestrictedManager] = useState(false);
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week');

  // Dynamically calculate days range according to currentView
  const [days, setDays] = useState<Array<{ name: string; date: string; value: string }>>([]);

  useEffect(() => {
    if (currentView === 'day') {
      const dayVal = baseDate.toISOString().split('T')[0];
      setDays([{
        name: baseDate.toLocaleDateString('en-US', { weekday: 'short' }),
        date: baseDate.getDate().toString(),
        value: dayVal
      }]);
      setCurrentWeekLabel(baseDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
    } else if (currentView === 'week') {
      const currentDay = baseDate.getDay();
      const monday = new Date(baseDate.getTime());
      // Adjust to Monday
      monday.setDate(monday.getDate() - currentDay + (currentDay === 0 ? -6 : 1));

      const list = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(monday.getTime());
        d.setDate(monday.getDate() + i);
        const value = d.toISOString().split('T')[0];
        const dateStr = d.getDate().toString();
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        return { name: dayName, date: dateStr, value };
      });

      setDays(list);

      const startStr = monday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      const sunday = new Date(monday.getTime());
      sunday.setDate(monday.getDate() + 6);
      const endStr = sunday.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' });
      setCurrentWeekLabel(`${startStr} — ${endStr}`);
    } else if (currentView === 'month') {
      setCurrentWeekLabel(baseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
      
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const startingDay = firstDay.getDay(); // 0 is Sunday
      
      const startOffset = startingDay === 0 ? 6 : startingDay - 1;
      const startDate = new Date(firstDay.getTime());
      startDate.setDate(firstDay.getDate() - startOffset);

      const list = Array.from({ length: 35 }).map((_, i) => {
        const d = new Date(startDate.getTime());
        d.setDate(startDate.getDate() + i);
        const value = d.toISOString().split('T')[0];
        const dateStr = d.getDate().toString();
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        return { name: dayName, date: dateStr, value };
      });
      setDays(list);
    }
  }, [baseDate, currentView]);

  const [dbServices, setDbServices] = useState<any[]>([]);
  const [dbCalendars, setDbCalendars] = useState<any[]>([]);
  const [dbClients, setDbClients] = useState<any[]>([]);

  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);

  useEffect(() => {
    if (dbCalendars.length > 0) {
      setSelectedCalendarIds(prev => {
        if (prev.length === 0) {
          const isRestricted = typeof window !== 'undefined' && !!localStorage.getItem('assigned_calendar_ids');
          if (isRestricted) {
            return dbCalendars.map(c => c._id);
          } else {
            const primaryCalId = dbCalendars.reduce((oldest, current) => {
              if (!oldest) return current._id;
              return current._id < oldest ? current._id : oldest;
            }, '');
            return primaryCalId ? [primaryCalId] : [];
          }
        }
        return prev.filter(id => dbCalendars.some(c => c._id === id));
      });
    } else {
      setSelectedCalendarIds([]);
    }
  }, [dbCalendars]);

  const handleToggleCalendarFilter = (id: string) => {
    setSelectedCalendarIds(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  // Load appointments, services, calendars, and clients from database on mount
  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        const storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : null;
        
        // Fetch appointments
        const apptUrl = storedBizId ? `/api/appointments?businessId=${storedBizId}` : '/api/appointments';
        const apptRes = await fetch(apptUrl);
        const apptData = await apptRes.json();
        if (apptData.success) {
          let list = apptData.appointments;
          if (typeof window !== 'undefined') {
            const rawAssigned = localStorage.getItem('assigned_calendar_ids');
            if (rawAssigned) {
              const assignedIds: string[] = JSON.parse(rawAssigned);
              list = list.filter((a: any) => assignedIds.includes(a.calendarId));
            }
          }
          setAppointments(list);
        }

        // Fetch services
        const svcUrl = storedBizId ? `/api/services?businessId=${storedBizId}` : '/api/services';
        const svcRes = await fetch(svcUrl);
        const svcData = await svcRes.json();
        if (svcData.success) {
          setDbServices(svcData.services);
        }

        // Fetch calendars
        const calUrl = storedBizId ? `/api/calendars?businessId=${storedBizId}` : '/api/calendars';
        const calRes = await fetch(calUrl);
        const calData = await calRes.json();
        if (calData.success) {
          let list = calData.calendars;
          if (typeof window !== 'undefined') {
            const rawAssigned = localStorage.getItem('assigned_calendar_ids');
            if (rawAssigned) {
              const assignedIds: string[] = JSON.parse(rawAssigned);
              list = list.filter((c: any) => assignedIds.includes(c._id));
            }
          }
          setDbCalendars(list);
        }

        // Fetch clients
        const clientUrl = storedBizId ? `/api/clients?businessId=${storedBizId}` : '/api/clients';
        const clientRes = await fetch(clientUrl);
        const clientData = await clientRes.json();
        if (clientData.success) {
          setDbClients(clientData.clients);
        }
      } catch (err) {
        console.error('Failed to load calendar data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCalendarData();
    if (typeof window !== 'undefined') {
      const rawAssigned = localStorage.getItem('assigned_calendar_ids');
      if (rawAssigned) {
        setIsRestrictedManager(true);
      }
    }
  }, []);

  const [showNewApptModal, setShowNewApptModal] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [calendarSearch, setCalendarSearch] = useState('');
  const [newAppt, setNewAppt] = useState({
    clientId: '',
    serviceId: '',
    calendarId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    primaryChannel: 'email',
    notes: ''
  });

  const handleOpenNewAppt = () => {
    setClientSearch('');
    setServiceSearch('');
    setCalendarSearch('');
    setNewAppt({
      clientId: dbClients[0]?._id || '',
      serviceId: dbServices[0]?._id || '',
      calendarId: dbCalendars[0]?._id || '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      primaryChannel: 'email',
      notes: ''
    });
    setShowNewApptModal(true);
  };

  const handleCreateAppt = async () => {
    if (!newAppt.clientId || !newAppt.serviceId || !newAppt.calendarId || !newAppt.date || !newAppt.time) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const [h, m] = newAppt.time.split(':').map(Number);
      const start = new Date(newAppt.date);
      start.setHours(h, m, 0, 0);

      const service = dbServices.find(s => s._id === newAppt.serviceId);
      const duration = service ? service.duration : 30;
      const end = new Date(start.getTime() + duration * 60 * 1000);

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarId: newAppt.calendarId,
          serviceId: newAppt.serviceId,
          clientId: newAppt.clientId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          status: 'PENDING',
          primaryChannel: newAppt.primaryChannel,
          notes: newAppt.notes
        })
      });
      const data = await res.json();
      if (data.success) {
        // Refresh appointments
        const storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : null;
        const apptUrl = storedBizId ? `/api/appointments?businessId=${storedBizId}` : '/api/appointments';
        const apptRes = await fetch(apptUrl);
        const apptData = await apptRes.json();
        if (apptData.success) {
          setAppointments(apptData.appointments);
        }
        setShowNewApptModal(false);
      }
    } catch (err) {
      console.error('Failed to create appointment:', err);
    }
  };

  const handleCreateCalendarClick = () => {
    const storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : null;
    setEditingCal({
      name: '',
      timezone: 'UTC',
      timeFormat: '12h',
      phone: '',
      email: '',
      address: '',
      slug: '',
      businessId: storedBizId || ''
    });
    setCreateCount(1);
    setImportFromId(dbCalendars[0]?._id || '');
    setImportDataEnabled(true);
    setErrorCalModal('');
    setShowCalModal(true);
  };

  const handleEditCalendar = (cal: any) => {
    setEditingCal({
      _id: cal._id,
      name: cal.name || '',
      timezone: cal.timezone || 'UTC',
      timeFormat: cal.timeFormat || '12h',
      phone: cal.phone || '',
      email: cal.email || '',
      address: cal.address || '',
      slug: cal.slug || '',
      businessId: cal.businessId || ''
    });
    setErrorCalModal('');
    setShowCalModal(true);
  };

  const handleSaveCalendar = async () => {
    if (isRestrictedManager) {
      alert("Permission Denied: Location managers are not authorized to create or edit location details.");
      return;
    }
    const isEdit = !!editingCal._id;
    if ((isEdit || createCount === 1) && !editingCal.name) {
      setErrorCalModal('Location / Branch Name is required.');
      return;
    }
    setErrorCalModal('');
    try {
      const isEdit = !!editingCal._id;
      const url = isEdit ? `/api/calendars/${editingCal._id}` : '/api/calendars';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = isEdit 
        ? editingCal 
        : {
            ...editingCal,
            count: createCount,
            importFromId: importDataEnabled ? importFromId : undefined
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        if (isEdit) {
          setDbCalendars(dbCalendars.map(c => c._id === editingCal._id ? data.calendar : c));
        } else {
          const newCals = data.calendars || (data.calendar ? [data.calendar] : []);
          setDbCalendars([...dbCalendars, ...newCals]);
          if (typeof window !== 'undefined') {
            const rawAssigned = localStorage.getItem('assigned_calendar_ids');
            if (rawAssigned) {
              const assignedIds: string[] = JSON.parse(rawAssigned);
              const newIds = newCals.map((c: any) => c._id);
              localStorage.setItem('assigned_calendar_ids', JSON.stringify([...assignedIds, ...newIds]));
            }
          }
        }
        setShowCalModal(false);
      } else {
        setErrorCalModal(data.error || 'Failed to save calendar locations.');
      }
    } catch (err) {
      console.error('Failed to save calendar:', err);
      setErrorCalModal('Connection error. Please try again.');
    }
  };

  const handleDeleteCalendar = async (id: string) => {
    if (isRestrictedManager) {
      alert("Permission Denied: Location managers are not authorized to delete locations.");
      return;
    }
    if (!confirm('Are you sure you want to permanently delete this calendar location? This action cannot be undone.')) return;

    try {
      const res = await fetch(`/api/calendars/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setDbCalendars(dbCalendars.filter(c => c._id !== id));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'));
        }
      } else {
        alert(data.error || 'Failed to delete calendar location.');
      }
    } catch (err) {
      console.error('Failed to delete calendar:', err);
      alert('Connection error. Please try again.');
    }
  };

  const handlePrev = () => {
    const prev = new Date(baseDate.getTime());
    if (currentView === 'day') {
      prev.setDate(prev.getDate() - 1);
    } else if (currentView === 'week') {
      prev.setDate(prev.getDate() - 7);
    } else if (currentView === 'month') {
      prev.setMonth(prev.getMonth() - 1);
    }
    setBaseDate(prev);
  };

  const handleNext = () => {
    const next = new Date(baseDate.getTime());
    if (currentView === 'day') {
      next.setDate(next.getDate() + 1);
    } else if (currentView === 'week') {
      next.setDate(next.getDate() + 7);
    } else if (currentView === 'month') {
      next.setMonth(next.getMonth() + 1);
    }
    setBaseDate(next);
  };

  const handleToday = () => {
    setBaseDate(new Date());
  };

  const hours = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
  ];

  // Map database appointments to the grid coordinates
  const mappedAppointments = appointments
    .filter((appt) => {
      // Filter by selectedService if not 'all'
      if (selectedService !== 'all' && appt.serviceId !== selectedService) {
        return false;
      }
      // Filter by selectedCalendarIds list
      if (selectedCalendarIds.length > 0 && (!appt.calendarId || !selectedCalendarIds.includes(appt.calendarId))) {
        return false;
      }
      return true;
    })
    .map((appt) => {
      const start = new Date(appt.startTime);
      const end = new Date(appt.endTime);
    
    // Find which column day date string matches
    const apptDateStr = start.toISOString().split('T')[0];
    const dayIdx = days.findIndex(d => d.value === apptDateStr);

    // Calculate start hour index based on hour: starts at 9am
    const startHour = start.getHours();
    const startHourIdx = Math.max(0, startHour - 9);

    // Calculate height
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const height = durationHours <= 0.5 ? "h-10" : durationHours <= 1.0 ? "h-16" : "h-24";

    return {
      id: appt._id,
      client: appt.clientName || 'Scheduled Client',
      service: appt.serviceName || 'Standard Slot',
      time: `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      dayIdx,
      startHourIdx,
      height,
      color: appt.status === 'CANCELLED' 
        ? "bg-red-500/10 border-red-500 text-red-700" 
        : appt.status === 'CONFIRMED'
        ? "bg-emerald-500/10 border-emerald-500 text-emerald-700"
        : appt.status === 'COMPLETED'
        ? "bg-slate-500/10 border-slate-500 text-slate-700"
        : "bg-amber-500/10 border-amber-500 text-amber-700", // PENDING default
      channel: appt.primaryChannel
    };
  }).filter(a => {
    if (currentView === 'month') return true;
    return a.dayIdx !== -1 && a.startHourIdx >= 0 && a.startHourIdx < hours.length;
  });

  return (
    <div className="flex bg-surface-container-low min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Calendar Management" subtitle="Manage bookings, blocked hours, and schedules." />

        {/* Dashboard Navigation Bar */}
        <div className="bg-surface-container-lowest border-b border-outline-variant/30 px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Week Selector */}
          <div className="flex items-center gap-4">
            <div className="flex border border-outline-variant/30 rounded-lg overflow-hidden bg-surface-container">
              <button onClick={handlePrev} className="p-2 hover:bg-surface-container-high transition-colors text-on-surface-variant">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={handleNext} className="p-2 hover:bg-surface-container-high transition-colors text-on-surface-variant border-l border-outline-variant/20">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <span className="font-bold text-sm text-on-surface">{currentWeekLabel}</span>
            <button onClick={handleToday} className="text-xs bg-surface-container-high border border-outline-variant/30 text-on-surface px-3 py-1.5 rounded-lg font-bold hover:bg-surface-container transition-colors">
              Today
            </button>
          </div>

          {/* View Selection & Filters */}
          <div className="flex items-center gap-3">
            <div className="flex border border-outline-variant/30 rounded-lg overflow-hidden bg-surface-container text-xs font-bold text-on-surface-variant">
              <button 
                onClick={() => setCurrentView('day')} 
                className={`px-3.5 py-2 transition-colors ${currentView === 'day' ? 'bg-primary text-on-primary shadow-sm shadow-primary/10' : 'hover:bg-surface-container-high'}`}
              >
                Day
              </button>
              <button 
                onClick={() => setCurrentView('week')} 
                className={`px-3.5 py-2 border-l border-outline-variant/20 transition-colors ${currentView === 'week' ? 'bg-primary text-on-primary shadow-sm shadow-primary/10' : 'hover:bg-surface-container-high'}`}
              >
                Week
              </button>
              <button 
                onClick={() => setCurrentView('month')} 
                className={`px-3.5 py-2 border-l border-outline-variant/20 transition-colors ${currentView === 'month' ? 'bg-primary text-on-primary shadow-sm shadow-primary/10' : 'hover:bg-surface-container-high'}`}
              >
                Month
              </button>
            </div>

            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className={`flex items-center gap-1.5 px-3 py-2 border text-xs font-bold rounded-lg transition-colors ${
                showSidebar 
                  ? 'bg-primary/10 border-primary text-primary hover:bg-primary/20' 
                  : 'bg-surface-container-high border-outline-variant/30 text-on-surface hover:bg-surface-container'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            <button 
              onClick={handleOpenNewAppt}
              className="flex items-center gap-1 bg-primary hover:bg-primary-container text-on-primary px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-primary/10"
            >
              <Plus className="w-4 h-4" />
              <span>New Appointment</span>
            </button>
          </div>

        </div>

        {/* Main Workspace Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Filter Sidebar */}
          <div className={`${showSidebar ? 'w-64 block' : 'w-0 hidden'} border-r border-outline-variant/30 p-6 bg-surface-container-lowest flex flex-col gap-6 overflow-y-auto transition-all duration-300`}>
            
            {/* Calendar list selection */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Active Calendars</h4>
                {!isRestrictedManager && (
                  <button 
                    onClick={handleCreateCalendarClick}
                    className="text-[10px] font-extrabold text-primary hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {dbCalendars.length === 0 ? (
                  <span className="text-[10px] text-on-surface-variant">No active calendars.</span>
                ) : (
                  (() => {
                    const primaryCalId = dbCalendars.reduce((oldest, current) => {
                      if (!oldest) return current._id;
                      return current._id < oldest ? current._id : oldest;
                    }, '');

                    return dbCalendars.map(cal => (
                      <div key={cal._id} className="flex items-center justify-between text-xs font-semibold text-on-surface group/cal w-full py-0.5">
                        <label className="flex items-center gap-2 cursor-pointer max-w-[70%]">
                          <input 
                            type="checkbox" 
                            checked={selectedCalendarIds.includes(cal._id)} 
                            onChange={() => handleToggleCalendarFilter(cal._id)}
                            className="rounded border-outline-variant/60 text-primary focus:ring-primary w-4 h-4" 
                          />
                          <span className="truncate" title={cal.name}>{cal.name}</span>
                          {cal._id === primaryCalId && (
                            <span className="ml-1 text-[8px] bg-primary/10 text-primary px-1 py-0.5 rounded font-extrabold uppercase scale-90 whitespace-nowrap">Primary</span>
                          )}
                        </label>
                        {!isRestrictedManager && (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover/cal:opacity-100 transition-opacity">
                            <button 
                              type="button"
                              onClick={() => handleEditCalendar(cal)} 
                              className="p-1 hover:bg-surface-container rounded"
                              title="Edit Location Settings"
                            >
                              <Settings className="w-3.5 h-3.5 text-on-surface-variant hover:text-on-surface" />
                            </button>
                            {cal._id !== primaryCalId && dbCalendars.length > 1 && (
                              <button 
                                type="button"
                                onClick={() => handleDeleteCalendar(cal._id)} 
                                className="p-1 hover:bg-red-500/10 rounded"
                                title="Delete Location Branch"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500 hover:text-red-700" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ));
                  })()
                )}
              </div>
            </div>

            {/* Filter by Service */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Filter Services</h4>
              <select 
                value={selectedService} 
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full text-xs bg-surface-container-low border border-outline-variant/30 rounded-lg p-2 focus:outline-none"
              >
                <option value="all">All Services</option>
                {dbServices.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Notification Audit Legend */}
            <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/30 space-y-3 mt-auto">
              <h5 className="font-bold text-[11px] uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" /> Routing Legend
              </h5>
              <div className="space-y-2 text-[10px] text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/20 border border-primary"></div>
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email Preferred</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary/20 border border-[#006c49]"></div>
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> WhatsApp / SMS</span>
                </div>
              </div>
            </div>

          </div>

          {/* Calendar Workspace Grid */}
          <div className="flex-1 overflow-auto bg-surface-container-lowest">
            
            {/* Header Dates Bar */}
            <div className="grid grid-cols-[80px_1fr] border-b border-outline-variant/30 bg-surface-container-low/20 sticky top-0 z-20">
              <div className="border-r border-outline-variant/30"></div>
              <div className={`grid ${currentView === 'day' ? 'grid-cols-1' : 'grid-cols-7'} text-center py-3`}>
                {currentView === 'month' ? (
                  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, idx) => (
                    <span key={idx} className="text-[10px] font-bold text-on-surface-variant uppercase">{dayName}</span>
                  ))
                ) : (
                  days.map((day, idx) => {
                    const matchedHoliday = HOLIDAYS.find(h => h.date === day.value);
                    return (
                      <div key={idx} className={`space-y-1 py-1 px-2 rounded-lg transition-all ${
                        matchedHoliday ? 'bg-red-500/5 border border-red-200/50' : ''
                      }`}>
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase flex items-center justify-center gap-1">
                          {day.name}
                          {matchedHoliday && <span title={matchedHoliday.name} className="text-red-500 select-none">🎈</span>}
                        </span>
                        <div className={`text-sm font-extrabold ${matchedHoliday ? 'text-red-700' : 'text-on-surface'}`}>{day.date}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Time Grid Layout */}
            {loading ? (
              <div className="flex justify-center items-center py-40 text-xs text-on-surface-variant font-bold">
                Loading calendar coordinates from MongoDB...
              </div>
            ) : currentView === 'month' ? (
              <div className="grid grid-cols-7 border-b border-outline-variant/20 bg-surface-container-lowest">
                {days.map((day, dayIdx) => {
                  const apptsForDay = mappedAppointments.filter(a => {
                    const matchedAppt = appointments.find(o => o._id === a.id);
                    if (!matchedAppt) return false;
                    const apptDateStr = new Date(matchedAppt.startTime).toISOString().split('T')[0];
                    return apptDateStr === day.value;
                  });

                  const matchedHoliday = HOLIDAYS.find(h => h.date === day.value);

                  return (
                    <div 
                      key={dayIdx} 
                      className={`border-r border-b border-outline-variant/20 min-h-[120px] p-2 flex flex-col gap-1.5 hover:bg-surface-container/10 transition-colors ${
                        matchedHoliday ? 'bg-red-500/[0.01]' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        {matchedHoliday ? (
                          <span 
                            title={matchedHoliday.name} 
                            className="bg-red-500/10 text-red-700 text-[8px] font-extrabold px-1 py-0.5 rounded truncate max-w-[70%]"
                          >
                            🎉 {matchedHoliday.name}
                          </span>
                        ) : <span />}
                        <span className={`text-xs font-bold self-end ${matchedHoliday ? 'text-red-700' : 'text-on-surface-variant'}`}>{day.date}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-1 max-h-[80px]">
                        {apptsForDay.map(appt => (
                          <div 
                            key={appt.id} 
                            onClick={() => handleApptClick(appt.id)}
                            className={`p-1 text-[8px] rounded border ${appt.color} truncate leading-tight cursor-pointer hover:opacity-80 transition-opacity`} 
                            title={`${appt.client} - ${appt.service}`}
                          >
                            <strong>{appt.time}</strong> {appt.client}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="relative">
                {hours.map((hour, hourIdx) => (
                  <div key={hourIdx} className="grid grid-cols-[80px_1fr] border-b border-outline-variant/20 h-24 relative">
                    
                    {/* Time label */}
                    <div className="py-2 px-3 border-r border-outline-variant/30 text-[10px] text-on-surface-variant font-bold text-right select-none">
                      {hour}
                    </div>
                    
                    {/* Calendar columns */}
                    <div className={`grid ${currentView === 'day' ? 'grid-cols-1' : 'grid-cols-7'} relative h-full`}>
                      {days.map((day, dayIdx) => {
                        const appt = mappedAppointments.find(
                          (a) => {
                            if (currentView === 'day') {
                              const matchedAppt = appointments.find(o => o._id === a.id);
                              if (!matchedAppt) return false;
                              const apptDateStr = new Date(matchedAppt.startTime).toISOString().split('T')[0];
                              return apptDateStr === day.value && a.startHourIdx === hourIdx;
                            }
                            return a.dayIdx === dayIdx && a.startHourIdx === hourIdx;
                          }
                        );
                        
                        const matchedHoliday = HOLIDAYS.find(h => h.date === day.value);
                        
                        return (
                          <div 
                            key={dayIdx} 
                            className={`border-r border-outline-variant/20 h-full relative p-1 group hover:bg-surface-container/20 transition-colors ${
                              matchedHoliday ? 'bg-red-500/[0.02]' : ''
                            }`}
                          >
                            {matchedHoliday && hourIdx === 0 && (
                              <div className="absolute inset-x-1 top-1 bg-red-500/10 border border-red-200 text-red-800 text-[8px] font-extrabold rounded p-1.5 text-center select-none z-10 animate-pulse">
                                🎈 Holiday: {matchedHoliday.name}
                              </div>
                            )}

                            {appt && (
                              <div 
                                onClick={() => handleApptClick(appt.id)}
                                className={`absolute inset-x-1 top-1 z-10 rounded-lg p-2 border-l-4 border shadow-sm ${appt.color} ${appt.height} overflow-hidden cursor-pointer hover:shadow transition-all`}
                              >
                                <div className="flex justify-between items-start">
                                  <h4 className="font-extrabold text-[10px] leading-tight truncate">{appt.client}</h4>
                                  <span className="text-[8px] opacity-75 shrink-0">
                                    {appt.channel === 'whatsapp' ? '💬 WA' : appt.channel === 'sms' ? '📱 SMS' : '✉️ Mail'}
                                  </span>
                                </div>
                                <p className="text-[8px] font-semibold truncate mt-0.5">{appt.service}</p>
                                <span className="text-[8px] opacity-80 block mt-1 flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {appt.time}
                                </span>
                              </div>
                            )}
                            
                            {/* Invite to create slot on hover */}
                            {!appt && !matchedHoliday && (
                              <div className="hidden group-hover:flex absolute inset-0 items-center justify-center pointer-events-none">
                                <span className="text-[8px] font-bold text-primary/50 bg-primary/5 px-2 py-1 rounded-full border border-dashed border-primary/30">
                                  + Book
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Edit/Add Calendar Settings Modal */}
      {showCalModal && editingCal && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
            
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h3 className="font-extrabold text-sm text-on-surface">
                {editingCal._id ? 'Edit Location Workspace' : 'Add New Calendar Location'}
              </h3>
              <button 
                onClick={() => setShowCalModal(false)} 
                className="text-on-surface-variant hover:text-on-surface font-bold text-[11px]"
              >
                Close
              </button>
            </div>

            {errorCalModal && (
              <div className="bg-red-500/10 border border-red-200 text-red-700 text-[11px] font-bold p-2.5 rounded-lg">
                ⚠️ {errorCalModal}
              </div>
            )}

            <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1">
              
              {/* Bulk Creation & Settings Import options */}
              {!editingCal._id && (
                <div className="space-y-3 bg-surface-container-low/30 border border-outline-variant/20 rounded-xl p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase block">Locations to Add *</label>
                      <input 
                        type="number" 
                        min={1} 
                        max={10}
                        value={createCount} 
                        onChange={(e) => setCreateCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                        className="w-full bg-surface-container rounded-lg p-2 border border-outline-variant/30 focus:outline-none font-bold text-primary text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase block">Import Data?</label>
                      <label className="flex items-center gap-2 cursor-pointer pt-1.5 justify-center">
                        <input 
                          type="checkbox" 
                          checked={importDataEnabled} 
                          onChange={(e) => setImportDataEnabled(e.target.checked)}
                          className="rounded border-outline-variant/60 text-primary focus:ring-primary w-4 h-4"
                        />
                        <span className="font-bold text-on-surface text-[11px]">Clone Settings</span>
                      </label>
                    </div>
                  </div>

                  {importDataEnabled && dbCalendars.length > 0 && (
                    <div className="space-y-1 pt-1.5 border-t border-outline-variant/10">
                      <label className="text-[9px] font-bold text-primary uppercase block">Template Location Source</label>
                      <select
                        value={importFromId}
                        onChange={(e) => setImportFromId(e.target.value)}
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2 focus:outline-none font-semibold text-[10px]"
                      >
                        {dbCalendars.map(cal => (
                          <option key={cal._id} value={cal._id}>{cal.name}</option>
                        ))}
                      </select>
                      <span className="text-[8px] text-on-surface-variant block mt-0.5">Clones contact details, weekly timezone formats, and work schedule availability automatically.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Name */}
              {(editingCal._id || createCount === 1) && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase block">Location / Branch Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="E.g. Beverly Hills Branch"
                    value={editingCal.name || ''} 
                    onChange={(e) => setEditingCal({ ...editingCal, name: e.target.value })}
                    className="w-full bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none font-semibold"
                  />
                </div>
              )}

              {(!importDataEnabled || editingCal._id) && (
                <>
                  {/* Custom Slug */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase block">Unique Booking Handle / Slug</label>
                    <input 
                      type="text" 
                      placeholder="E.g. beverly-hills-spa"
                      value={editingCal.slug || ''} 
                      onChange={(e) => setEditingCal({ ...editingCal, slug: e.target.value })}
                      className="w-full bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none font-semibold text-primary"
                    />
                    {editingCal.slug && (
                      <span className="text-[9px] text-on-surface-variant block mt-1">
                        Share Link: <strong className="text-primary">http://localhost:3000/booking/{editingCal.slug.toLowerCase().replace(/[^a-z0-9-_]/g, '')}</strong>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase block">Location Email</label>
                      <input 
                        type="email" 
                        placeholder="beverly@domain.com"
                        value={editingCal.email || ''} 
                        onChange={(e) => setEditingCal({ ...editingCal, email: e.target.value })}
                        className="w-full bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                      />
                    </div>
                    {/* Phone */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase block">Location Phone</label>
                      <input 
                        type="text" 
                        placeholder="+1 555-0199"
                        value={editingCal.phone || ''} 
                        onChange={(e) => setEditingCal({ ...editingCal, phone: e.target.value })}
                        className="w-full bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Physical Address */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase block">Physical Address</label>
                    <textarea 
                      rows={2}
                      placeholder="E.g. 120 Beverly Drive, Beverly Hills, CA 90210"
                      value={editingCal.address || ''} 
                      onChange={(e) => setEditingCal({ ...editingCal, address: e.target.value })}
                      className="w-full bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none font-medium"
                    />
                  </div>

                  {/* Time Format */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase block">Time Format</label>
                    <select
                      value={editingCal.timeFormat || '12h'}
                      onChange={(e) => setEditingCal({ ...editingCal, timeFormat: e.target.value as any })}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 focus:outline-none font-semibold text-on-surface"
                    >
                      <option value="12h">12-Hour format (AM / PM)</option>
                      <option value="24h">24-Hour military format</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 pt-3 border-t border-outline-variant/20">
              <button 
                type="button"
                onClick={() => setShowCalModal(false)}
                className="flex-1 py-2.5 border border-outline-variant/40 hover:bg-surface-container-low rounded-lg font-bold text-on-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSaveCalendar}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-lg font-bold transition-all shadow-md shadow-primary/15"
              >
                {editingCal._id ? 'Save Changes' : 'Create Location'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* New Appointment Modal */}
      {showNewApptModal && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-xl space-y-4 text-xs">
            
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h3 className="font-extrabold text-sm text-on-surface">Book New Appointment</h3>
              <button 
                onClick={() => setShowNewApptModal(false)} 
                className="text-on-surface-variant hover:text-on-surface font-bold text-[11px]"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              {/* Select Client */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase flex justify-between">
                  <span>Select Customer *</span>
                  {clientSearch && <span className="text-[9px] text-primary lowercase font-medium">Filtering...</span>}
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="🔍 Search client by name or email..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full bg-surface-container rounded-lg p-2 border border-outline-variant/20 focus:outline-none text-[11px] text-on-surface font-semibold"
                  />
                  <select
                    value={newAppt.clientId}
                    onChange={(e) => setNewAppt({ ...newAppt, clientId: e.target.value })}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 focus:outline-none text-on-surface font-semibold"
                  >
                    <option value="">-- Choose Customer --</option>
                    {dbClients
                      .filter(c => `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(clientSearch.toLowerCase()))
                      .map(c => (
                        <option key={c._id} value={c._id}>{c.firstName} {c.lastName} ({c.email})</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Select Service */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase flex justify-between">
                  <span>Select Service *</span>
                  {serviceSearch && <span className="text-[9px] text-primary lowercase font-medium">Filtering...</span>}
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="🔍 Search service name..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="w-full bg-surface-container rounded-lg p-2 border border-outline-variant/20 focus:outline-none text-[11px] text-on-surface font-semibold"
                  />
                  <select
                    value={newAppt.serviceId}
                    onChange={(e) => setNewAppt({ ...newAppt, serviceId: e.target.value })}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 focus:outline-none text-on-surface font-semibold"
                  >
                    <option value="">-- Choose Service --</option>
                    {dbServices
                      .filter(s => `${s.name} ${s.price}`.toLowerCase().includes(serviceSearch.toLowerCase()))
                      .map(s => (
                        <option key={s._id} value={s._id}>{s.name} (${s.price} - {s.duration} mins)</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Select Calendar / Location */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase flex justify-between">
                  <span>Calendar Workspace *</span>
                  {calendarSearch && <span className="text-[9px] text-primary lowercase font-medium">Filtering...</span>}
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="🔍 Search workspace branch..."
                    value={calendarSearch}
                    onChange={(e) => setCalendarSearch(e.target.value)}
                    className="w-full bg-surface-container rounded-lg p-2 border border-outline-variant/20 focus:outline-none text-[11px] text-on-surface font-semibold"
                  />
                  <select
                    value={newAppt.calendarId}
                    onChange={(e) => setNewAppt({ ...newAppt, calendarId: e.target.value })}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 focus:outline-none text-on-surface font-semibold"
                  >
                    <option value="">-- Choose Calendar Branch --</option>
                    {dbCalendars
                      .filter(c => c.name.toLowerCase().includes(calendarSearch.toLowerCase()))
                      .map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Date *</label>
                  <input 
                    type="date" 
                    value={newAppt.date} 
                    onChange={(e) => setNewAppt({ ...newAppt, date: e.target.value })}
                    className="w-full bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none text-on-surface font-semibold"
                  />
                </div>
                {/* Time */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Start Time *</label>
                  <input 
                    type="time" 
                    value={newAppt.time} 
                    onChange={(e) => setNewAppt({ ...newAppt, time: e.target.value })}
                    className="w-full bg-surface-container rounded-lg p-2.5 border border-outline-variant/30 focus:outline-none text-on-surface font-semibold"
                  />
                </div>
              </div>

              {/* Alert Channel */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Notification Channel</label>
                <select
                  value={newAppt.primaryChannel}
                  onChange={(e) => setNewAppt({ ...newAppt, primaryChannel: e.target.value })}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 focus:outline-none text-on-surface font-semibold"
                >
                  <option value="email">Email confirmation</option>
                  <option value="sms">SMS text alert</option>
                  <option value="whatsapp">WhatsApp direct alert</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Internal Notes</label>
                <textarea
                  value={newAppt.notes}
                  onChange={(e) => setNewAppt({ ...newAppt, notes: e.target.value })}
                  placeholder="E.g. customer preferences, parking requests..."
                  rows={2}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 focus:outline-none text-on-surface font-medium"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-outline-variant/20">
              <button 
                onClick={() => setShowNewApptModal(false)}
                className="flex-1 py-2.5 border border-outline-variant/40 hover:bg-surface-container-low rounded-lg font-semibold text-on-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateAppt}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-lg font-semibold transition-colors"
              >
                Book Appointment
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Appointment Detail Modal */}
      {showApptDetailModal && selectedAppt && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-xl space-y-4">
            
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h3 className="font-extrabold text-sm">Appointment Details</h3>
              <button 
                onClick={() => {
                  setShowApptDetailModal(false);
                  setSelectedAppt(null);
                }}
                className="text-on-surface-variant hover:text-on-surface font-bold text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-on-surface">
              {/* Service info */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Booked Service</span>
                <p className="font-bold text-sm text-on-surface">{selectedAppt.serviceName || 'Standard Service'}</p>
              </div>

              {/* Client Info */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Client</span>
                <p className="font-semibold text-on-surface">{selectedAppt.clientName || 'Mock Client'}</p>
              </div>

              {/* Date / Time */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Date & Time</span>
                <p className="font-medium text-on-surface flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-outline" />
                  {new Date(selectedAppt.startTime).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Status</span>
                <div>
                  <span className={`text-[9px] font-extrabold border px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    selectedAppt.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-700 border-green-500/20' :
                    selectedAppt.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' :
                    selectedAppt.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-700 border-blue-500/20' :
                    'bg-red-500/10 text-red-700 border-red-500/20 border-red-500/20'
                  }`}>
                    {selectedAppt.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick action buttons */}
            {(selectedAppt.status === 'PENDING' || selectedAppt.status === 'CONFIRMED') && (
              <div className="flex gap-2 pt-3 border-t border-outline-variant/20">
                {selectedAppt.status === 'PENDING' && (
                  <button
                    onClick={() => handleUpdateApptStatus(selectedAppt._id, 'CONFIRMED')}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                )}
                {selectedAppt.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleUpdateApptStatus(selectedAppt._id, 'COMPLETED')}
                    className="flex-1 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" /> Complete
                  </button>
                )}
                <button
                  onClick={() => handleUpdateApptStatus(selectedAppt._id, 'CANCELLED')}
                  className="flex-1 py-2.5 border border-red-500/30 hover:bg-red-500/5 text-red-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
