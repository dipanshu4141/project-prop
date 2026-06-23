import { AuthProvider } from '@/context/AuthContext';
import { Providers } from "./providers";
import "./globals.css";
import type { Metadata } from "next";
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';

export const viewport = {
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  title: 'GrowCliento Dashboard',
  description: 'AI Powered Real Estate CRM',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GrowCliento',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
      </head>
      <body className="h-full">
        <ServiceWorkerRegister/>
        <Providers>
          <AuthProvider>
            {children}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}