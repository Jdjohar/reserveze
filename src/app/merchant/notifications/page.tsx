'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { 
  Save, 
  Sparkles, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  AlertCircle, 
  TrendingDown, 
  ShieldAlert, 
  ToggleRight, 
  ToggleLeft,
  CheckCircle2
} from 'lucide-react';

export default function MerchantNotifications() {
  const [primaryChannel, setPrimaryChannel] = useState<'email' | 'whatsapp' | 'sms'>('email');
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const assignedCalId = localStorage.getItem('assigned_calendar_ids');
      if (assignedCalId) {
        window.location.href = '/merchant/dashboard';
      }
    }
  }, []);
  const [cascadeEnabled, setCascadeEnabled] = useState(true);
  const [cooldownEnabled, setCooldownEnabled] = useState(true);
  const [limitEnabled, setLimitEnabled] = useState(true);
  const [whatsappWindowPrompt, setWhatsappWindowPrompt] = useState(true);
  const [message, setMessage] = useState('');

  const handleSave = () => {
    setMessage('Notification engine parameters updated successfully.');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="flex bg-surface-container-low min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Notification Control Hub" subtitle="Optimize communication flows, configure reminder cascades, and audit costs." />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto max-w-4xl">
          
          {/* Main Saving Header */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-on-surface">Cost-Optimized Notification Engine</h3>
              <p className="text-xs text-on-surface-variant">Minimize utility charges by dynamically routing alerts based on urgency and confirmation state.</p>
            </div>
            <button 
              onClick={handleSave}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-primary/10"
            >
              <Save className="w-4 h-4" />
              <span>Save Configurations</span>
            </button>
          </div>

          {/* Success Banner */}
          {message && (
            <div className="bg-secondary/10 border border-secondary/20 text-secondary p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{message}</span>
            </div>
          )}

          {/* 2-Column Controls Setup */}
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Left Col: Main Engine Settings (2/3 width) */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Card 1: Default Primary Channel Preference */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary" />
                  Primary Dispatch Channel
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Select the default communication channel pre-selected for clients during booking.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  
                  {/* Email Channel */}
                  <label className={`border rounded-xl p-4 flex flex-col justify-between cursor-pointer hover:border-primary/50 transition-colors ${
                    primaryChannel === 'email' ? 'border-primary bg-primary/5' : 'border-outline-variant/30'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="bg-primary/10 text-primary p-2 rounded-lg">
                        <Mail className="w-4.5 h-4.5" />
                      </div>
                      <input 
                        type="radio" 
                        name="primaryChannel" 
                        value="email"
                        checked={primaryChannel === 'email'} 
                        onChange={() => setPrimaryChannel('email')}
                        className="text-primary focus:ring-primary w-4 h-4 mt-1" 
                      />
                    </div>
                    <div className="mt-4">
                      <h4 className="font-extrabold text-xs">Email Alerts</h4>
                      <span className="text-[9px] text-secondary font-bold bg-secondary-container/20 px-2 py-0.5 rounded-full mt-1.5 inline-block">100% Free</span>
                    </div>
                  </label>

                  {/* WhatsApp Channel */}
                  <div className="border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between opacity-50 cursor-not-allowed bg-surface-container-low/40">
                    <div className="flex justify-between items-start">
                      <div className="bg-secondary/15 text-secondary p-2 rounded-lg">
                        <MessageSquare className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-[8px] bg-outline-variant/40 text-on-surface-variant px-1.5 py-0.5 rounded font-extrabold uppercase scale-90 whitespace-nowrap">Coming Soon</span>
                    </div>
                    <div className="mt-4">
                      <h4 className="font-extrabold text-xs text-on-surface-variant">WhatsApp Alert</h4>
                      <span className="text-[9px] text-primary font-bold bg-primary/15 px-2 py-0.5 rounded-full mt-1.5 inline-block">Low Cost Utility</span>
                    </div>
                  </div>

                  {/* SMS Channel */}
                  <div className="border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between opacity-50 cursor-not-allowed bg-surface-container-low/40">
                    <div className="flex justify-between items-start">
                      <div className="bg-tertiary/10 text-tertiary p-2 rounded-lg">
                        <Smartphone className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-[8px] bg-outline-variant/40 text-on-surface-variant px-1.5 py-0.5 rounded font-extrabold uppercase scale-90 whitespace-nowrap">Coming Soon</span>
                    </div>
                    <div className="mt-4">
                      <h4 className="font-extrabold text-xs text-on-surface-variant">Carrier SMS</h4>
                      <span className="text-[9px] text-error font-bold bg-error-container/20 px-2 py-0.5 rounded-full mt-1.5 inline-block">High Cost</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Card 2: Cost Control Rules */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 space-y-5">
                <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-primary" />
                  Cost Containment Rule Gates
                </h3>

                <div className="space-y-4">
                  
                  {/* Gate 1: Cascade Reminders */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs text-on-surface">Enable 24h-4h Reminder Cascade</h4>
                      <p className="text-[11px] text-on-surface-variant">Sends confirmation email 24h prior. Fallback SMS/WhatsApp reminders only trigger if email remains unconfirmed 4h prior, saving up to 80% on text bills.</p>
                    </div>
                    <button 
                      onClick={() => setCascadeEnabled(!cascadeEnabled)}
                      className={`text-on-surface-variant transition-colors ${cascadeEnabled ? 'text-primary' : 'text-outline/40'}`}
                    >
                      {cascadeEnabled ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                    </button>
                  </div>

                  {/* Gate 2: Cooldown Timers */}
                  <div className="flex justify-between items-start gap-4 border-t border-outline-variant/20 pt-4">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs text-on-surface">Reschedule Cooldown Gate (15 mins)</h4>
                      <p className="text-[11px] text-on-surface-variant">Prevents spamming text confirmations if a client repeatedly edits or reschedules bookings rapidly. Fallback triggers silent email update instead.</p>
                    </div>
                    <button 
                      onClick={() => setCooldownEnabled(!cooldownEnabled)}
                      className={`text-on-surface-variant transition-colors ${cooldownEnabled ? 'text-primary' : 'text-outline/40'}`}
                    >
                      {cooldownEnabled ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                    </button>
                  </div>

                  {/* Gate 3: Rate Limiting */}
                  <div className="flex justify-between items-start gap-4 border-t border-outline-variant/20 pt-4">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs text-on-surface">Hard Rate Limit (Max 3 / Booking)</h4>
                      <p className="text-[11px] text-on-surface-variant">Restricts transactional mobile texts (SMS/WhatsApp) to a maximum of 3 notifications per booking ID (booking, confirmation check, reschedule fallback).</p>
                    </div>
                    <button 
                      onClick={() => setLimitEnabled(!limitEnabled)}
                      className={`text-on-surface-variant transition-colors ${limitEnabled ? 'text-primary' : 'text-outline/40'}`}
                    >
                      {limitEnabled ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                    </button>
                  </div>

                  {/* Gate 4: WhatsApp Conversation Window */}
                  <div className="flex justify-between items-start gap-4 border-t border-outline-variant/20 pt-4">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs text-on-surface">WhatsApp User-Initiated Interaction Window</h4>
                      <p className="text-[11px] text-on-surface-variant">Appends confirmation interactive choices ("Reply '1' to confirm") to templates, aiming to trigger a free 24h conversation support window.</p>
                    </div>
                    <button 
                      onClick={() => setWhatsappWindowPrompt(!whatsappWindowPrompt)}
                      className={`text-on-surface-variant transition-colors ${whatsappWindowPrompt ? 'text-primary' : 'text-outline/40'}`}
                    >
                      {whatsappWindowPrompt ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                    </button>
                  </div>

                </div>
              </div>

            </div>

            {/* Right Col: Wallet Analytics & Caps (1/3 width) */}
            <div className="space-y-6">
              
              {/* Wallet Card */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-secondary" />
                  Monthly Wallet Analytics
                </h3>
                
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Est. Mobile Costs Saved</span>
                    <span className="font-extrabold text-secondary">+$18.42</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-outline-variant/20 pt-2">
                    <span className="text-on-surface-variant">SMS Dispatches</span>
                    <span className="font-bold">12 / 100</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">WhatsApp Dispatches</span>
                    <span className="font-bold">3 / 100</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Emails Dispatched</span>
                    <span className="font-bold">186</span>
                  </div>
                </div>

                <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/20 text-[10px] text-on-surface-variant mt-2">
                  <strong>Standard Plan Cap:</strong> 100 SMS/WhatsApp messages. Upgrade to Pro ($15/mo) for 500 dispatches.
                </div>
              </div>

              {/* Alert Warning Box */}
              <div className="bg-primary/10 border border-primary/20 text-on-surface rounded-xl p-5 flex gap-3">
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-primary">SaaS Tenant Guardrail</h4>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    If credits reach 100%, dispatches fall back to Email automatically. Rest assured, you will never receive unexpected billing surcharges.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
