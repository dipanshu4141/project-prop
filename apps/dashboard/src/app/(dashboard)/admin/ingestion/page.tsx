'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG as QRCode } from 'qrcode.react';

interface Phone {
  id: string;
  phone: string;
  displayName?: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'QR_PENDING' | 'CONNECTING';
  qrCode?: string | null;
}

export default function IngestionAdminPage() {
  const [phones, setPhones] = useState<Phone[]>([]);

  const fetchPhones = async () => {
    const res = await fetch('/api/admin/ingestion/phones');
    if (res.ok) setPhones(await res.json());
  };

  useEffect(() => {
    fetchPhones();
    const interval = setInterval(fetchPhones, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold text-[#0B1F14]">Ingestion Phones</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {phones.map((phone) => (
          <div key={phone.id} className="border rounded-xl p-4 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{phone.displayName ?? phone.phone}</p>
                <p className="text-sm text-gray-500">{phone.phone}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                phone.status === 'CONNECTED'    ? 'bg-emerald-100 text-emerald-700' :
                phone.status === 'QR_PENDING'   ? 'bg-yellow-100 text-yellow-700'  :
                phone.status === 'CONNECTING'   ? 'bg-blue-100 text-blue-700'      :
                                                  'bg-gray-100 text-gray-600'
              }`}>
                {phone.status}
              </span>
            </div>
            {phone.status === 'QR_PENDING' && phone.qrCode && (
              <div className="flex flex-col items-center gap-2 pt-2">
                <QRCode value={phone.qrCode} size={200} />
                <p className="text-xs text-gray-400">Scan with WhatsApp to connect</p>
              </div>
            )}
            {phone.status === 'CONNECTED' && (
              <p className="text-sm text-emerald-600">✓ Connected</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}