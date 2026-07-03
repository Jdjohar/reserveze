'use client';

import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { useState, useEffect } from 'react';
import { Check, ShieldCheck, Sparkles } from 'lucide-react';

interface BusinessDetails {
  _id: string;
  name: string;
  plan?: 'BASIC' | 'PRO';
  bookingCreditsBalance?: number;
  smsCreditsUsed?: number;
  smsCreditsCap?: number;
}

export default function MerchantPlansPage() {
  const [business, setBusiness] = useState<BusinessDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchBusiness = async () => {
    try {
      const storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : null;
      if (!storedBizId) return;

      const res = await fetch(`/api/business?businessId=${storedBizId}`);
      const data = await res.json();
      if (data.success && data.business) {
        setBusiness(data.business);
      }
    } catch (err) {
      console.error('Failed to load pricing details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusiness();
  }, []);

  const handlePurchasePack = async (credits: number, price: number) => {
    if (!business) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business._id,
          buyCredits: credits
        })
      });
      const data = await res.json();
      if (data.success) {
        setBusiness(data.business);
        setSuccess(`Successfully purchased ${credits} Booking Credits for $${price}!`);
        
        // Trigger storage event so sidebar dynamically reloads
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'));
        }
      } else {
        setError(data.error || 'Failed to complete credit purchase.');
      }
    } catch (err) {
      console.error('Failed to purchase credits:', err);
      setError('Connection error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex bg-surface-container-low min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Prepaid Booking Plans" subtitle="Purchase booking credits to accept client scheduling requests across all location branches." />

        <main className="flex-1 p-8 space-y-8 overflow-y-auto max-w-4xl">
          
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-200 text-emerald-700 text-xs font-bold p-3.5 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-secondary" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-200 text-red-700 text-xs font-bold p-3.5 rounded-lg flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 text-xs text-on-surface-variant font-bold">
              Loading credit balances from MongoDB...
            </div>
          ) : (
            <div className="space-y-8">
              {/* Credits Balance Indicator */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-extrabold text-on-surface">Available Prepaid Booking Credits</h2>
                  <p className="text-[10px] text-on-surface-variant font-semibold">Each reservation slot booked at any location branch deducts 1 credit from your wallet balance.</p>
                </div>
                <div className="bg-primary text-on-primary px-6 py-3 rounded-2xl font-black text-xl flex flex-col items-center shadow-md shadow-primary/10 shrink-0">
                  <span>{business?.bookingCreditsBalance ?? 50}</span>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider opacity-90 mt-0.5">Remaining</span>
                </div>
              </div>

              {/* Tiers Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Pack 1 */}
                <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 flex flex-col justify-between space-y-6 hover:shadow-md transition-all">
                  <div className="space-y-3 text-xs">
                    <h3 className="font-extrabold text-sm text-on-surface">Starter Pack</h3>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed">Perfect for new, small solo businesses testing booking features.</p>
                    <div className="py-2 border-y border-outline-variant/10 text-center">
                      <span className="text-2xl font-black text-primary">100</span>
                      <span className="text-[10px] font-bold text-on-surface-variant block mt-0.5">Booking Credits</span>
                    </div>
                    <div className="text-center font-bold text-xs text-on-surface pt-1">
                      Price: <span className="text-primary font-black">$10</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePurchasePack(100, 10)}
                    disabled={saving}
                    className="w-full bg-primary hover:bg-primary-container text-on-primary py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/10"
                  >
                    Buy Pack (100)
                  </button>
                </div>

                {/* Pack 2 */}
                <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/40 rounded-2xl p-5 flex flex-col justify-between space-y-6 hover:shadow-md transition-all relative">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[8px] font-black uppercase px-2.5 py-1 rounded-full shadow-sm tracking-wider">
                    Best Value
                  </span>
                  <div className="space-y-3 text-xs pt-1">
                    <h3 className="font-extrabold text-sm text-on-surface">Growth Pack</h3>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed">Ideal for expanding businesses with steady client flow.</p>
                    <div className="py-2 border-y border-outline-variant/10 text-center">
                      <span className="text-2xl font-black text-primary">500</span>
                      <span className="text-[10px] font-bold text-on-surface-variant block mt-0.5">Booking Credits</span>
                    </div>
                    <div className="text-center font-bold text-xs text-on-surface pt-1">
                      Price: <span className="text-primary font-black">$30</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePurchasePack(500, 30)}
                    disabled={saving}
                    className="w-full bg-primary hover:bg-primary-container text-on-primary py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/10 animate-pulse"
                  >
                    Buy Pack (500)
                  </button>
                </div>

                {/* Pack 3 */}
                <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 flex flex-col justify-between space-y-6 hover:shadow-md transition-all">
                  <div className="space-y-3 text-xs">
                    <h3 className="font-extrabold text-sm text-on-surface">Pro Pack</h3>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed">Designed for high-volume branches and staff coordination.</p>
                    <div className="py-2 border-y border-outline-variant/10 text-center">
                      <span className="text-2xl font-black text-primary">1200</span>
                      <span className="text-[10px] font-bold text-on-surface-variant block mt-0.5">Booking Credits</span>
                    </div>
                    <div className="text-center font-bold text-xs text-on-surface pt-1">
                      Price: <span className="text-primary font-black">$50</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePurchasePack(1200, 50)}
                    disabled={saving}
                    className="w-full bg-primary hover:bg-primary-container text-on-primary py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/10"
                  >
                    Buy Pack (1200)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sandbox alert footer */}
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 text-center text-[10px] text-on-surface-variant font-medium max-w-lg mx-auto">
            🛡️ Sandbox Payment Simulator: credit packs purchases instantly top up your super-merchant balance in MongoDB.
          </div>

        </main>
      </div>
    </div>
  );
}
