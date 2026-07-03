'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { Users, Search, Plus, Mail, Phone, Calendar, Info } from 'lucide-react';

interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export default function MerchantClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const storedBizId = typeof window !== 'undefined' ? localStorage.getItem('merchant_business_id') : null;
        const url = storedBizId ? `/api/clients?businessId=${storedBizId}` : '/api/clients';
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setClients(data.clients);
        }
      } catch (err) {
        console.error('Failed to load clients:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const filteredClients = clients.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex bg-surface-container-low min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Client CRM Portal" subtitle="Manage client accounts, appointment histories, and contact info." />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients by name or email..."
                className="w-full bg-surface-container-lowest text-xs rounded-lg pl-9 pr-4 py-2.5 border border-outline-variant/30 focus:outline-none focus:border-primary/50"
              />
            </div>

            <button className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary px-4 py-2.5 rounded-lg text-xs font-bold transition-all">
              <Plus className="w-4 h-4" />
              <span>Add New Client</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20 text-xs text-on-surface-variant font-bold">
              Fetching client list from MongoDB...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-16 text-center space-y-3">
              <div className="bg-primary/10 text-primary w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-sm text-on-surface">No Clients Found</h3>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                There are no client profiles in the database. Clients will be registered automatically upon placing bookings.
              </p>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30 text-on-surface-variant font-bold uppercase tracking-wider bg-surface-container-low/20">
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4">Registered Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((c) => {
                    const fullName = `${c.firstName} ${c.lastName}`;
                    const initials = `${c.firstName[0] || ''}${c.lastName[0] || ''}`.toUpperCase();
                    return (
                      <tr key={c._id} className="border-b border-outline-variant/20 hover:bg-surface-container-low/20 transition-colors">
                        <td className="py-4 px-4 font-bold text-on-surface flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-[10px]">
                            {initials || 'U'}
                          </div>
                          {fullName}
                        </td>
                        <td className="py-4 px-4 text-on-surface-variant">
                          <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-outline" /> {c.email}</span>
                        </td>
                        <td className="py-4 px-4 text-on-surface-variant">
                          <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-outline" /> {c.phone || 'N/A'}</span>
                        </td>
                        <td className="py-4 px-4 text-on-surface-variant">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-outline" /> {new Date(c.createdAt).toLocaleDateString()}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
