'use client';

import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { useState, useEffect } from 'react';
import { Building, Mail, Phone, Upload, Check, AlertCircle } from 'lucide-react';

interface BusinessDetails {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  logoUrl?: string;
  address?: string;
}

export default function MerchantProfile() {
  const [business, setBusiness] = useState<BusinessDetails | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [address, setAddress] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : null;
        if (!storedBizId) return;

        const res = await fetch(`/api/business?businessId=${storedBizId}`);
        const data = await res.json();
        if (data.success && data.business) {
          setBusiness(data.business);
          setName(data.business.name || '');
          setEmail(data.business.email || '');
          setPhone(data.business.phone || '');
          setWhatsapp(data.business.whatsapp || '');
          setLogoUrl(data.business.logoUrl || '');
          setAddress(data.business.address || '');
        }
      } catch (err) {
        console.error('Failed to load profile details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBusiness();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.url) {
        setLogoUrl(data.url);
        setSuccess('Logo uploaded successfully! Click save to apply changes.');
      } else {
        setError(data.error || 'Failed to upload logo.');
      }
    } catch (err) {
      console.error('Failed to upload file:', err);
      setError('Connection error during upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
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
          name,
          email,
          phone,
          whatsapp,
          logoUrl,
          address
        })
      });
      const data = await res.json();
      if (data.success) {
        setBusiness(data.business);
        setSuccess('Business profile updated successfully!');
      } else {
        setError(data.error || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError('Connection error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex bg-surface-container-low min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Business Profile Settings" subtitle="Configure your public branding, business name, logo, and contact info." />

        <main className="flex-1 p-8 space-y-8 overflow-y-auto max-w-2xl">
          
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 space-y-6">
            <h3 className="font-extrabold text-base text-on-surface">Branding & Contact Info</h3>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-200 text-red-700 text-xs font-bold rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg">
                <Check className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {loading ? (
              <div className="text-center py-10 text-xs text-on-surface-variant font-bold">
                Loading profile details from MongoDB...
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
                
                {/* Logo Image Upload Row */}
                <div className="flex items-center gap-6 pb-2 border-b border-outline-variant/10">
                  <div className="w-20 h-20 bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden flex items-center justify-center relative shadow-inner">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Business logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building className="w-8 h-8 text-outline/30" />
                    )}
                  </div>
                  <div className="space-y-1.5 grow">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase block">Business Logo</label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 rounded-lg text-[10px] font-bold text-on-surface transition-all">
                        <Upload className="w-3.5 h-3.5 text-primary" />
                        <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
                      </label>
                      {logoUrl && (
                        <button 
                          type="button" 
                          onClick={() => setLogoUrl('')}
                          className="text-[10px] font-semibold text-error hover:underline"
                        >
                          Remove logo
                        </button>
                      )}
                    </div>
                    <span className="text-[9px] text-on-surface-variant block">Supports PNG, JPG, or GIF. Max size 2MB.</span>
                  </div>
                </div>

                {/* Business Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase block">Business / Trading Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface-container rounded-lg p-3 border border-outline-variant/30 focus:outline-none text-on-surface font-semibold text-xs"
                    placeholder="E.g. Vanguard Luxury Spa"
                  />
                </div>

                {/* Business Email */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase block">Public Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-container rounded-lg p-3 border border-outline-variant/30 focus:outline-none text-on-surface font-semibold text-xs"
                    placeholder="E.g. contact@vanguardspa.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase block">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-surface-container rounded-lg p-3 border border-outline-variant/30 focus:outline-none text-on-surface font-semibold text-xs"
                      placeholder="E.g. +1 555-0199"
                    />
                  </div>
                  {/* WhatsApp */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase block">WhatsApp Number</label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full bg-surface-container rounded-lg p-3 border border-outline-variant/30 focus:outline-none text-on-surface font-semibold text-xs"
                      placeholder="E.g. +1 555-0199"
                    />
                  </div>
                </div>

                {/* Physical Address */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase block">Physical Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="w-full bg-surface-container rounded-lg p-3 border border-outline-variant/30 focus:outline-none text-on-surface font-semibold text-xs"
                    placeholder="E.g. 123 Luxury Way, Beverly Hills, CA 90210"
                  />
                </div>

                <div className="pt-4 border-t border-outline-variant/10">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-primary hover:bg-primary-container disabled:opacity-40 text-on-primary font-bold py-3 rounded-lg text-xs transition-all shadow-md shadow-primary/10"
                  >
                    {saving ? 'Saving changes...' : 'Save Profile Changes'}
                  </button>
                </div>

              </form>
            )}

          </div>

        </main>
      </div>
    </div>
  );
}
