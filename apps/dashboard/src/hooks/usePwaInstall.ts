'use client';

import { useEffect, useState, useCallback } from 'react';

type Platform = 'ios' | 'android' | 'desktop' | 'standalone';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePwaInstall() {
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed) — covers iOS + Android + desktop PWAs
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true; // iOS Safari legacy flag
    setIsStandalone(standalone);

    if (standalone) {
      setPlatform('standalone');
      return;
    }

    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroid = /Android/.test(ua);

    if (isIOS) {
      setPlatform('ios');
      // iOS has no install prompt API — button always "available" to show instructions
      setCanInstall(true);
    } else if (isAndroid) {
      setPlatform('android');
      // Wait for beforeinstallprompt — only fires if installable criteria met
    } else {
      setPlatform('desktop');
    }

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    }

    function handleAppInstalled() {
      setIsStandalone(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return { outcome: 'unavailable' as const };
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
    return choice;
  }, [deferredPrompt]);

  return {
    platform,
    canInstall: canInstall && !isStandalone,
    isStandalone,
    promptInstall,
    hasNativePrompt: !!deferredPrompt,
  };
}