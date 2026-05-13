import { AuthProvider } from '@/context/AuthContext';
import { Providers } from "./providers";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Property AI",
  description: "AI Powered Real Estate CRM for Brokers",
  manifest: "/manifest.json",
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* iOS PWA Support */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
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

/**
 * apps/dashboard/src/app/layout.tsx
 *
 * Add <AuthProvider> here so every page and component has access to useAuth().
 * Drop this into your existing root layout, wrapping {children}.
 */


// Your existing layout — just add AuthProvider around {children}:
