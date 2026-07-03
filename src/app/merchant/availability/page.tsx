'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { 
  Save, 
  Clock, 
  Calendar, 
  Sparkles, 
  Trash, 
  Plus, 
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface DaySchedule {
  dayName: string;
  isEnabled: boolean;
  startTime: string;
  endTime: string;
  breaks: Array<{ startTime: string; endTime: string }>;
}

export default function MerchantAvailability() {
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    { dayName: "Monday", isEnabled: true, startTime: "09:00", endTime: "17:00", breaks: [{ startTime: "12:00", endTime: "13:00" }] },
    { dayName: "Tuesday", isEnabled: true, startTime: "09:00", endTime: "17:00", breaks: [{ startTime: "12:00", endTime: "13:00" }] },
    { dayName: "Wednesday", isEnabled: true, startTime: "09:00", endTime: "17:00", breaks: [{ startTime: "12:00", endTime: "13:00" }] },
    { dayName: "Thursday", isEnabled: true, startTime: "09:00", endTime: "17:00", breaks: [{ startTime: "12:00", endTime: "13:00" }] },
    { dayName: "Friday", isEnabled: true, startTime: "09:00", endTime: "17:00", breaks: [] },
    { dayName: "Saturday", isEnabled: false, startTime: "10:00", endTime: "14:00", breaks: [] },
    { dayName: "Sunday", isEnabled: false, startTime: "10:00", endTime: "14:00", breaks: [] }
  ]);

  const [timezone, setTimezone] = useState("America/New_York");
  const [message, setMessage] = useState('');

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

  const handleSave = () => {
    setMessage('Schedule configurations saved successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="flex bg-surface-container-low min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Availability Configurations" subtitle="Define operational days, working hours, and regular breaks." />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto max-w-4xl">
          
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
                className="text-xs bg-surface-container border border-outline-variant/30 rounded-lg p-2 focus:outline-none"
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
            {schedule.map((day, dayIdx) => (
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
                        className="bg-surface-container border border-outline-variant/30 text-xs rounded-lg p-2 focus:outline-none text-on-surface"
                      />
                      <span className="text-xs text-on-surface-variant font-bold">to</span>
                      <input 
                        type="time" 
                        value={day.endTime}
                        onChange={(e) => handleTimeChange(dayIdx, 'endTime', e.target.value)}
                        className="bg-surface-container border border-outline-variant/30 text-xs rounded-lg p-2 focus:outline-none text-on-surface"
                      />
                    </div>

                    {/* Break times */}
                    <div className="flex flex-col gap-2">
                      {day.breaks.map((brk, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/20">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase">Break:</span>
                          <span className="text-xs font-semibold text-on-surface">{brk.startTime} - {brk.endTime}</span>
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
            ))}
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
