'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Bell, Sparkles, User, LogOut } from 'lucide-react';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('Alex Mercer');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('merchant_name');
      if (storedName) {
        setUserName(storedName);
      }
    }
  }, []);

  return (
    <header className="h-16 border-b border-outline-variant/30 px-8 flex items-center justify-between bg-surface-container-lowest sticky top-0 z-30">
      
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="font-bold text-lg text-on-surface leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-6">
        
        {/* Search Bar */}
        <div className="relative hidden sm:block">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search appointments, clients..."
            className="w-64 bg-surface-container text-xs rounded-lg pl-9 pr-4 py-2 border border-outline-variant/30 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* SMS Credits Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20 text-xs font-bold text-primary">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Credits: 85/100</span>
        </div>

        {/* Notification Bell */}
        <button className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary"></span>
        </button>

        {/* User Account Dropdown */}
        <div className="relative">
          <div 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 pl-4 border-l border-outline-variant/30 cursor-pointer select-none"
          >
            <div className="text-right hidden md:block">
              <h4 className="font-bold text-xs text-on-surface">{userName}</h4>
              <p className="text-[10px] text-on-surface-variant">Merchant Admin</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/30 text-on-surface-variant">
              <User className="w-4 h-4" />
            </div>
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg py-1.5 z-40 text-xs">
              <Link 
                href="/login"
                className="flex items-center gap-2 px-4 py-2.5 hover:bg-surface-container text-error font-semibold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
