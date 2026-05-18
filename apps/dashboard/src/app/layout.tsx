import { AuthProvider } from '@/context/AuthContext';
import { Providers } from "./providers";
import "./globals.css";
import type { Metadata } from "next";

export const viewport = {
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  title: 'PropertyAI',
  description: 'AI Powered Real Estate CRM',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PropertyAI',
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
        <Providers>
          <AuthProvider>
            {children}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}