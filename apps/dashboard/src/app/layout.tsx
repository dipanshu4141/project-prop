import { AuthProvider } from '@/context/AuthContext';
import { Providers } from "./providers";
import "./globals.css";
import type { Metadata } from "next";
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { PwaInstallProvider } from '@/context/PwaInstallContext';

export const viewport = {
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  title: 'GrowCliento Dashboard',
  description: 'AI Powered Real Estate CRM',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icons/icon-192.png',
  },
  openGraph: {
    title: 'GrowCliento — WhatsApp CRM for Indian Real Estate Brokers',
    description: 'AI Powered Real Estate CRM. Automatically ingest WhatsApp listings, deduplicate properties, and manage clients.',
    url: 'https://app.growcliento.com',
    siteName: 'GrowCliento',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'GrowCliento',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'GrowCliento',
    description: 'AI Powered Real Estate CRM',
    images: ['/icons/icon-512.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GrowCliento',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <ServiceWorkerRegister/>
        <PwaInstallProvider>
          <Providers>
            <AuthProvider>
              {children}
            </AuthProvider>
          </Providers>
        </PwaInstallProvider>
      </body>
    </html>
  );
}