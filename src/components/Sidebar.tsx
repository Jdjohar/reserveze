'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  Settings, 
  Users, 
  Clock, 
  Sparkles, 
  Sliders, 
  BellRing, 
  QrCode,
  LogOut,
  UserCheck
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname();
  
  const [bookingCredits, setBookingCredits] = useState(50);
  const [isRestrictedManager, setIsRestrictedManager] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const assignedCalId = localStorage.getItem('assigned_calendar_ids');
      setIsRestrictedManager(!!assignedCalId);
    }
  }, []);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : null;
        if (!storedBizId) return;

        const res = await fetch(`/api/business?businessId=${storedBizId}`);
        const data = await res.json();
        if (data.success && data.business) {
          setBookingCredits(data.business.bookingCreditsBalance ?? 50);
        }
      } catch (err) {
        console.error('Failed to load credits:', err);
      }
    };
    fetchCredits();

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', fetchCredits);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', fetchCredits);
      }
    };
  }, []);

  const links = [
    { name: 'Dashboard', href: '/merchant/dashboard', icon: LayoutDashboard },
    { name: 'Calendar View', href: '/merchant/calendar', icon: Calendar },
    { name: 'Services', href: '/merchant/services', icon: Sliders },
    { name: 'Team Members', href: '/merchant/team', icon: UserCheck },
    { name: 'Client CRM', href: '/merchant/clients', icon: Users },
    { name: 'Availability', href: '/merchant/availability', icon: Clock },
    ...(!isRestrictedManager ? [{ name: 'Notifications UI', href: '/merchant/notifications', icon: BellRing }] : []),
    ...(!isRestrictedManager ? [{ name: 'Billing Plans', href: '/merchant/plans', icon: Sparkles }] : []),
    { name: 'Share Links', href: '/merchant/share', icon: QrCode },
    ...(!isRestrictedManager ? [{ name: 'Business Profile', href: '/merchant/profile', icon: Settings }] : []),
    { name: 'Log Out', href: '/login', icon: LogOut }
  ];

  return (
    <aside className={`w-64 bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col h-screen sticky top-0 ${className}`}>
      
      {/* Brand Header */}
      <div className="p-6 border-b border-outline-variant/30 flex items-center gap-2">
        <div className="bg-primary text-on-primary p-1.5 rounded-lg">
          <Calendar className="w-5 h-5" />
        </div>
        <span className="font-bold text-xl tracking-tight text-primary">Reserveze</span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                isActive 
                  ? 'bg-primary text-on-primary shadow-sm shadow-primary/15' 
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Credit / Status Widget */}
      {!isRestrictedManager && (
        <div className="p-4 m-4 bg-surface-container rounded-xl border border-outline-variant/30 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-on-surface-variant font-medium">Prepaid Billing</span>
            <span className="font-bold text-primary flex items-center gap-0.5 uppercase tracking-wider text-[10px]">
              <Sparkles className="w-3 h-3 animate-pulse" /> Active
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-on-surface-variant">
              <span>Booking Credits</span>
              <span className="font-bold text-primary">{bookingCredits} left</span>
            </div>
            <div className="w-full bg-outline-variant/30 rounded-full h-1.5 overflow-hidden">
              <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (bookingCredits / 100) * 100)}%` }}></div>
            </div>
          </div>
          
          <Link 
            href="/merchant/plans" 
            className="block w-full text-center bg-primary/10 hover:bg-primary/15 text-primary text-[10px] font-bold py-1.5 rounded-lg transition-colors border border-primary/20"
          >
            Buy Booking Credits
          </Link>
        </div>
      )}
    </aside>
  );
}
