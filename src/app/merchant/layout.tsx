'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('merchant_email');
      if (!email) {
        router.replace('/login');
      } else {
        setAuthorized(true);
      }
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-4">
        <div className="text-center text-xs space-y-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <span className="font-extrabold text-on-surface-variant animate-pulse block">Verifying authorization...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
