'use client';

import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { Share2, Link as LinkIcon, QrCode, Copy, Check, MessageSquare, Edit3, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BusinessDetails {
  _id: string;
  name: string;
  slug?: string;
}

export default function MerchantShare() {
  const [business, setBusiness] = useState<BusinessDetails | null>(null);
  const [slugInput, setSlugInput] = useState('');
  const [copiedLink, setCopiedLink] = useState<'main' | 'embed' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch business profile on mount
  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : null;
        if (!storedBizId) return;

        const res = await fetch(`/api/business?businessId=${storedBizId}`);
        const data = await res.json();
        if (data.success && data.business) {
          setBusiness(data.business);
          setSlugInput(data.business.slug || '');
        }
      } catch (err) {
        console.error('Failed to load business profile:', err);
      }
    };
    fetchBusiness();
  }, []);

  const handleSaveSlug = async () => {
    if (!business) return;
    setSaving(true);
    setError('');
    setSuccess('');

    // Sanitize slug input
    const cleanSlug = slugInput.toLowerCase().replace(/[^a-z0-9-_]/g, '');

    try {
      const res = await fetch('/api/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business._id,
          slug: cleanSlug
        })
      });
      const data = await res.json();
      if (data.success) {
        setBusiness(data.business);
        setSlugInput(data.business.slug || '');
        setSuccess('Booking handle/slug updated successfully!');
      } else {
        setError(data.error || 'Failed to update booking handle.');
      }
    } catch (err) {
      console.error('Failed to save slug:', err);
      setError('Connection error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getBookingUrl = () => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin;
    const handle = business?.slug || business?._id || 'mock-business';
    return `${base}/booking/${handle}`;
  };

  const handleCopy = (link: string, type: 'main' | 'embed') => {
    navigator.clipboard.writeText(link);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const getEmbedCode = () => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin;
    return `<script src="${base}/embed.js" data-reserveze-url="${bookingUrl}" id="reserveze-embed" async></script>`;
  };

  const bookingUrl = getBookingUrl();
  const embedCode = getEmbedCode();

  return (
    <div className="flex bg-surface-container-low min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Booking URL Manager" subtitle="Share customized scheduling links, embed widgets, or display physical QR codes." />

        <main className="flex-1 p-8 space-y-8 overflow-y-auto max-w-4xl">
          
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Left Col: URL List & Slug Editor */}
            <div className="space-y-6">
              
              {/* Unique Handle / Slug Editor */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-primary" />
                  Customize Booking Slug
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Establish a unique, readable booking address for your business cards and social bios.
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 bg-surface-container p-2 rounded-lg border border-outline-variant/20">
                    <span className="text-[10px] font-semibold text-outline shrink-0">reserveze.com/booking/</span>
                    <input 
                      type="text"
                      value={slugInput}
                      onChange={(e) => setSlugInput(e.target.value)}
                      placeholder="my-business-slug"
                      className="grow bg-transparent text-[11px] font-bold text-primary focus:outline-none placeholder-outline/50"
                    />
                  </div>
                  {error && <span className="text-[10px] text-error font-bold block">{error}</span>}
                  {success && <span className="text-[10px] text-secondary font-bold block">{success}</span>}
                </div>

                <button
                  onClick={handleSaveSlug}
                  disabled={saving || !slugInput}
                  className="w-full bg-primary hover:bg-primary-container disabled:opacity-40 text-on-primary text-xs font-bold py-2 rounded-lg transition-all shadow-sm"
                >
                  {saving ? 'Updating Handle...' : 'Update Booking Handle'}
                </button>
              </div>

              {/* Primary Booking Link */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-primary" />
                  Primary Calendar Link
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Provide this absolute link to allow clients to browse your full catalog, pick specialists, and self-schedule.
                </p>

                <div className="flex items-center gap-2 bg-surface-container p-2.5 rounded-lg border border-outline-variant/20">
                  <span className="text-[10px] font-bold text-primary grow truncate">{bookingUrl}</span>
                  <button 
                    onClick={() => handleCopy(bookingUrl, 'main')}
                    className="p-1.5 hover:bg-surface-container-high rounded text-on-surface-variant transition-colors"
                  >
                    {copiedLink === 'main' ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                
                {business?.slug && (
                  <a 
                    href={bookingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 mt-1 justify-end"
                  >
                    <Globe className="w-3 h-3" /> Test Live Booking Page
                  </a>
                )}
              </div>

            </div>

            {/* Right Col: QR Code Display & Widget Embed */}
            <div className="space-y-6">
              
              {/* QR Code Card */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 flex flex-col items-center text-center space-y-4">
                <h3 className="font-bold text-sm text-on-surface self-start flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-tertiary" />
                  Printable QR Code
                </h3>
                <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
                  Display this in your physical reception area to let walk-in clients scan and reserve slots on the fly.
                </p>
                <div className="w-36 h-36 bg-surface-container border border-outline-variant/30 rounded-lg flex items-center justify-center font-bold text-outline/30 text-xs relative">
                  {/* Mock QR Code Pattern visual */}
                  <div className="absolute inset-4 border-2 border-primary/20 border-dashed rounded flex items-center justify-center text-[10px] text-primary">
                    [DYNAMIC QR CODE]
                  </div>
                </div>
                <button className="text-xs font-bold text-primary hover:underline">Download High-Res PDF</button>
              </div>

              {/* Embed Script */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 space-y-3">
                <h3 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                  <MessageSquare className="w-4.5 h-4.5 text-primary" />
                  Web Widget JS Embed Script
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Integrate scheduling dynamically by copying this JS script snippet directly into your custom page.
                </p>
                <div className="flex items-center gap-2">
                  <pre className="bg-surface-container p-3 rounded-lg border border-outline-variant/20 text-[9px] text-on-surface-variant overflow-x-auto grow select-all">
                    {embedCode}
                  </pre>
                  <button 
                    onClick={() => handleCopy(embedCode, 'embed')}
                    className="p-2 hover:bg-surface-container rounded border border-outline-variant/30 text-on-surface-variant"
                  >
                    {copiedLink === 'embed' ? <Check className="w-4.5 h-4.5 text-secondary" /> : <Copy className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
