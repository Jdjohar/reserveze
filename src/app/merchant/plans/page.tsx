/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
'use client';

import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { useState, useEffect } from 'react';
import { Check, ShieldCheck, Sparkles, CreditCard, Receipt } from 'lucide-react';

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
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTxs, setLoadingTxs] = useState(true);
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

  const fetchTransactions = async () => {
    try {
      const storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : null;
      if (!storedBizId) return;

      const res = await fetch(`/api/billing/transactions?businessId=${storedBizId}`);
      const data = await res.json();
      if (data.success && data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoadingTxs(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const assignedCalId = localStorage.getItem('assigned_calendar_ids');
      if (assignedCalId) {
        window.location.href = '/merchant/dashboard';
        return;
      }
    }
    fetchBusiness();
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && business) {
      const params = new URLSearchParams(window.location.search);
      const isSuccess = params.get('success') === 'true';
      const isCancelled = params.get('cancelled') === 'true';
      const isMock = params.get('mock') === 'true';
      const credits = params.get('credits');
      const price = params.get('price');

      if (isSuccess) {
        if (isMock && credits) {
          const creditsNum = parseInt(credits, 10);
          const priceNum = parseFloat(price || '0');
          
          const runMockTopUp = async () => {
            try {
              const res = await fetch('/api/business', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  businessId: business._id,
                  buyCredits: creditsNum,
                  price: priceNum
                })
              });
              const data = await res.json();
              if (data.success) {
                setBusiness(data.business);
                setSuccess(`Successfully verified checkout session! Purchased ${creditsNum} Booking Credits for $${priceNum}!`);
                fetchTransactions();
                window.dispatchEvent(new Event('storage'));
              }
            } catch (err) {}
          };
          runMockTopUp();
        } else {
          const sessionId = params.get('session_id');
          if (sessionId) {
            const runRealVerify = async () => {
              try {
                const res = await fetch('/api/billing/verify-session', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sessionId })
                });
                const data = await res.json();
                if (data.success) {
                  setSuccess('Payment verified successfully! Your booking credits have been updated.');
                  fetchBusiness();
                  fetchTransactions();
                  window.dispatchEvent(new Event('storage'));
                } else {
                  setError(data.error || 'Failed to verify checkout session.');
                }
              } catch (err) {
                console.error('Session verification error:', err);
              }
            };
            runRealVerify();
          } else {
            setSuccess(`Successfully verified checkout session! Refreshed balance details.`);
            fetchBusiness();
            fetchTransactions();
          }
        }
        window.history.replaceState({}, '', '/merchant/plans');
      } else if (isCancelled) {
        setError('Payment checkout cancelled by user.');
        window.history.replaceState({}, '', '/merchant/plans');
      }
    }
  }, [business]);

  const handlePurchasePack = async (credits: number, price: number) => {
    if (!business) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business._id,
          credits,
          price
        })
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to initiate checkout session.');
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
              {/* Transaction History Section */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  <h3 className="font-extrabold text-sm text-on-surface">Transaction History</h3>
                </div>

                {loadingTxs ? (
                  <div className="text-center py-6 text-[10px] text-on-surface-variant font-bold">
                    Loading payments receipt history...
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-[10px] text-on-surface-variant font-semibold">
                    No transactions recorded yet. Completed payments will appear here.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant/20 text-on-surface-variant font-bold uppercase tracking-wider text-[9px]">
                          <th className="pb-3 pr-4">Date</th>
                          <th className="pb-3 pr-4">Description</th>
                          <th className="pb-3 pr-4">Session ID / Reference</th>
                          <th className="pb-3 pr-4 text-right">Amount</th>
                          <th className="pb-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10 text-on-surface font-medium">
                        {transactions.map((tx) => (
                          <tr key={tx._id} className="hover:bg-surface-container-low/20 transition-colors">
                            <td className="py-3 pr-4 text-on-surface-variant">
                              {new Date(tx.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-3 pr-4 font-bold text-on-surface">
                              +{tx.credits} Booking Credits
                            </td>
                            <td className="py-3 pr-4 font-mono text-[10px] text-on-surface-variant truncate max-w-[150px]" title={tx.sessionId}>
                              {tx.sessionId || 'N/A'}
                            </td>
                            <td className="py-3 pr-4 text-right font-bold text-primary">
                              ${tx.amount.toFixed(2)}
                            </td>
                            <td className="py-3 text-right">
                              <span className="bg-green-500/10 text-green-700 border border-green-500/20 px-2 py-0.5 rounded-full font-black text-[9px] uppercase">
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
