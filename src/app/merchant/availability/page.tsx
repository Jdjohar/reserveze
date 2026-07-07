'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { 
  Save, 
  Clock, 
  Sparkles, 
  Trash, 
  Plus, 
  CheckCircle2,
  AlertTriangle,
  Globe
} from 'lucide-react';

interface DaySchedule {
  dayName: string;
  isEnabled: boolean;
  startTime: string;
  endTime: string;
  breaks: Array<{ startTime: string; endTime: string }>;
}

export default function MerchantAvailability() {
  const defaultSchedule: DaySchedule[] = [
    { dayName: "Monday", isEnabled: true, startTime: "09:00", endTime: "17:00", breaks: [{ startTime: "12:00", endTime: "13:00" }] },
    { dayName: "Tuesday", isEnabled: true, startTime: "09:00", endTime: "17:00", breaks: [{ startTime: "12:00", endTime: "13:00" }] },
    { dayName: "Wednesday", isEnabled: true, startTime: "09:00", endTime: "17:00", breaks: [{ startTime: "12:00", endTime: "13:00" }] },
    { dayName: "Thursday", isEnabled: true, startTime: "09:00", endTime: "17:00", breaks: [{ startTime: "12:00", endTime: "13:00" }] },
    { dayName: "Friday", isEnabled: true, startTime: "09:00", endTime: "17:00", breaks: [] },
    { dayName: "Saturday", isEnabled: false, startTime: "10:00", endTime: "14:00", breaks: [] },
    { dayName: "Sunday", isEnabled: false, startTime: "10:00", endTime: "14:00", breaks: [] }
  ];

  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultSchedule);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Scoped locations
  const [isRestrictedManager, setIsRestrictedManager] = useState(false);
  const [assignedCalendarIds, setAssignedCalendarIds] = useState<string[]>([]);
  const [dbCalendars, setDbCalendars] = useState<any[]>([]);
  const [selectedCalId, setSelectedCalId] = useState('');

  // Initial load
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : null;
        if (!storedBizId) return;

        // Check restricted manager status
        let isRestricted = false;
        let assignedIds: string[] = [];
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('assigned_calendar_ids');
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) {
                isRestricted = true;
                assignedIds = parsed;
                setIsRestrictedManager(true);
                setAssignedCalendarIds(parsed);
              }
            } catch {}
          }
        }

        // Load calendars (locations)
        const calRes = await fetch(`/api/calendars?businessId=${storedBizId}`);
        const calData = await calRes.json();
        if (calData.success) {
          const list = calData.calendars || [];
          setDbCalendars(list);

          // Set default location selection
          if (isRestricted && assignedIds.length > 0) {
            setSelectedCalId(assignedIds[0]);
          } else if (list.length > 0) {
            // Owner defaults to primary location (oldest calendar)
            const primaryCalId = list.reduce((oldest: string, current: any) => {
              if (!oldest) return current._id;
              return current._id < oldest ? current._id : oldest;
            }, '');
            setSelectedCalId(primaryCalId);
          }
        }
      } catch (err) {
        console.error('Failed to load calendars metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch schedule whenever selectedCalId changes
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!selectedCalId) return;
      setLoading(true);
      try {
        const storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : null;
        const res = await fetch(`/api/availability?calendarId=${selectedCalId}&businessId=${storedBizId}`);
        const data = await res.json();
        if (data.success && data.availabilities && data.availabilities.length > 0) {
          // Map DB items to React UI state
          const newSchedule = [...defaultSchedule];
          data.availabilities.forEach((avail: any) => {
            // Mapping: 1 -> Monday (0), 2 -> Tuesday (1), 3 -> Wednesday (2), 4 -> Thursday (3), 5 -> Friday (4), 6 -> Saturday (5), 0 -> Sunday (6)
            const idx = avail.dayOfWeek === 0 ? 6 : avail.dayOfWeek - 1;
            if (idx >= 0 && idx < 7) {
              newSchedule[idx] = {
                dayName: newSchedule[idx].dayName,
                isEnabled: avail.isEnabled,
                startTime: avail.startTime || '09:00',
                endTime: avail.endTime || '17:00',
                breaks: Array.isArray(avail.breaks) ? avail.breaks : []
              };
            }
          });
          setSchedule(newSchedule);

          // Sync timezone from selected calendar
          const calObj = dbCalendars.find(c => c._id === selectedCalId);
          if (calObj && calObj.timezone) {
            setTimezone(calObj.timezone);
          }
        } else {
          // If no availability documents, load template defaults
          setSchedule(defaultSchedule);
        }
      } catch (err) {
        console.error('Failed to fetch schedule:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [selectedCalId, dbCalendars]);

  const handleToggleDay = (idx: number) => {
    setSchedule(schedule.map((day, i) => i === idx ? { ...day, isEnabled: !day.isEnabled } : day));
  };

  const handleTimeChange = (idx: number, field: 'startTime' | 'endTime', val: string) => {
    setSchedule(schedule.map((day, i) => i === idx ? { ...day, [field]: val } : day));
  };

  const handleAddBreak = (dayIdx: number) => {
    setSchedule(schedule.map((day, i) => {
      if (i === dayIdx) {
        return {
          ...day,
          breaks: [...day.breaks, { startTime: "12:00", endTime: "13:00" }]
        };
      }
      return day;
    }));
  };

  const handleRemoveBreak = (dayIdx: number, breakIdx: number) => {
    setSchedule(schedule.map((day, i) => {
      if (i === dayIdx) {
        return {
          ...day,
          breaks: day.breaks.filter((_, bIdx) => bIdx !== breakIdx)
        };
      }
      return day;
    }));
  };

  const handleBreakTimeChange = (dayIdx: number, breakIdx: number, field: 'startTime' | 'endTime', val: string) => {
    setSchedule(schedule.map((day, dIdx) => {
      if (dIdx === dayIdx) {
        return {
          ...day,
          breaks: day.breaks.map((brk, bIdx) => bIdx === breakIdx ? { ...brk, [field]: val } : brk)
        };
      }
      return day;
    }));
  };

  const handleSave = async () => {
    if (!selectedCalId) return;
    try {
      // Map indexes back to dayOfWeek numbers: Monday (0) -> 1, Sunday (6) -> 0
      const listToSave = schedule.map((day, idx) => {
        const dayOfWeek = idx === 6 ? 0 : idx + 1;
        return {
          dayOfWeek,
          isEnabled: day.isEnabled,
          startTime: day.startTime,
          endTime: day.endTime,
          breaks: day.breaks
        };
      });

      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarId: selectedCalId,
          timezone,
          availabilities: listToSave
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Schedule configurations saved successfully!');
        // Update local calendar timezone cache
        setDbCalendars(dbCalendars.map(c => c._id === selectedCalId ? { ...c, timezone } : c));
        setTimeout(() => setMessage(''), 3000);
      } else {
        alert(data.error || 'Failed to save availability.');
      }
    } catch (err) {
      console.error('Save availability error:', err);
      alert('Failed to connect to backend.');
    }
  };

  return (
    <div className="flex bg-surface-container-low min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Availability Configurations" subtitle="Define operational days, working hours, and regular breaks." />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto max-w-4xl">
          
          {/* Select Location Dropdown */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <Globe className="w-4.5 h-4.5 text-primary" />
                Select Operating Workspace
              </h3>
              <p className="text-xs text-on-surface-variant">Configure weekly schedules for a specific branch or primary location.</p>
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
                  {dbCalendars.map(cal => {
                    const isPrimary = cal._id === dbCalendars.reduce((oldest: string, current: any) => {
                      if (!oldest) return current._id;
                      return current._id < oldest ? current._id : oldest;
                    }, '');
                    return (
                      <option key={cal._id} value={cal._id}>
                        {isPrimary ? '🏢 ' : '📍 '}{cal.name} {isPrimary ? '(Primary Location)' : ''}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          </div>

          {/* Header Action / Save Banner */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-on-surface">Weekly Operating Hours</h3>
              <p className="text-xs text-on-surface-variant">Setup time ranges during which clients can schedule appointments.</p>
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={timezone} 
                onChange={(e) => setTimezone(e.target.value)}
                className="text-xs bg-surface-container border border-outline-variant/30 rounded-lg p-2 focus:outline-none font-bold"
              >
                <option value="UTC">UTC (GMT+0)</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="Europe/London">London (GMT+1)</option>
                <option value="Asia/Kolkata">Kolkata (IST)</option>
              </select>
              <button 
                onClick={handleSave}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-primary/10"
              >
                <Save className="w-4 h-4" />
                <span>Save Schedule</span>
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {message && (
            <div className="bg-secondary/10 border border-secondary/20 text-secondary p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{message}</span>
            </div>
          )}

          {/* Weekly Days Scheduler */}
          <div className="space-y-4">
            {loading ? (
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-8 text-center text-xs font-bold text-on-surface-variant">
                Loading workspace schedule details from database...
              </div>
            ) : (
              schedule.map((day, dayIdx) => (
                <div 
                  key={day.dayName} 
                  className={`bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between transition-all ${
                    day.isEnabled ? 'opacity-100 border-outline-variant/30' : 'opacity-65 border-outline-variant/10 bg-surface-container-low/10'
                  }`}
                >
                  
                  {/* Checkbox Toggle Day */}
                  <div className="flex items-center gap-4 min-w-[140px]">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={day.isEnabled} 
                        onChange={() => handleToggleDay(dayIdx)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-outline-variant/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                    <span className="font-extrabold text-sm text-on-surface">{day.dayName}</span>
                  </div>

                  {/* Operating hours select inputs */}
                  {day.isEnabled ? (
                    <div className="flex-1 flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-outline" />
                        <input 
                          type="time" 
                          value={day.startTime}
                          onChange={(e) => handleTimeChange(dayIdx, 'startTime', e.target.value)}
                          className="bg-surface-container border border-outline-variant/30 text-xs rounded-lg p-2 focus:outline-none text-on-surface font-semibold"
                        />
                        <span className="text-xs text-on-surface-variant font-bold">to</span>
                        <input 
                          type="time" 
                          value={day.endTime}
                          onChange={(e) => handleTimeChange(dayIdx, 'endTime', e.target.value)}
                          className="bg-surface-container border border-outline-variant/30 text-xs rounded-lg p-2 focus:outline-none text-on-surface font-semibold"
                        />
                      </div>

                      {/* Editable Break times */}
                      <div className="flex flex-col gap-2">
                        {day.breaks.map((brk, bIdx) => (
                          <div key={bIdx} className="flex items-center gap-2 bg-surface-container px-3 py-1 rounded-lg border border-outline-variant/20">
                            <span className="text-[9px] font-bold text-on-surface-variant uppercase">Break:</span>
                            <input 
                              type="time" 
                              value={brk.startTime}
                              onChange={(e) => handleBreakTimeChange(dayIdx, bIdx, 'startTime', e.target.value)}
                              className="bg-transparent text-xs font-semibold text-on-surface focus:outline-none w-16"
                            />
                            <span className="text-xs text-on-surface-variant font-bold">-</span>
                            <input 
                              type="time" 
                              value={brk.endTime}
                              onChange={(e) => handleBreakTimeChange(dayIdx, bIdx, 'endTime', e.target.value)}
                              className="bg-transparent text-xs font-semibold text-on-surface focus:outline-none w-16"
                            />
                            <button 
                              onClick={() => handleRemoveBreak(dayIdx, bIdx)}
                              className="text-error hover:bg-error-container/20 p-1 rounded transition-colors ml-1"
                            >
                              <Trash className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        
                        <button 
                          onClick={() => handleAddBreak(dayIdx)}
                          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Break
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 text-xs font-bold text-on-surface-variant">
                      Unavailable / Closed
                    </div>
                  )}

                </div>
              ))
            )}
          </div>

          {/* Holiday Alert Notice */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-800 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs text-yellow-900">National Holidays Sync Active</h4>
              <p className="text-[11px] text-yellow-800 mt-0.5">
                Reserveze syncs with the Abstract Holiday API to automatically disable appointment bookings on public bank holidays according to your business location (United States).
              </p>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
