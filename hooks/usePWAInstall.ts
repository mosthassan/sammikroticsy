'use client';

import { useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const STORAGE_KEY = 'samtech_pwa_prompt_status_v1';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isFirstMobileVisit, setIsFirstMobileVisit] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(true); // Default true until verified on client

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check if already installed / standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    setIsInstalled(isStandalone);

    // 2. Mobile and OS detection
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) || (navigator.maxTouchPoints > 1 && /macintosh/.test(ua));
    const isAndroidDevice = /android/.test(ua);
    const isMobileDevice =
      isIOSDevice ||
      isAndroidDevice ||
      /mobile|blackberry|iemobile|opera mini/i.test(ua) ||
      window.innerWidth <= 768;

    setIsMobile(isMobileDevice);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // 3. First-time prompt eligibility
    const storedStatus = localStorage.getItem(STORAGE_KEY);
    const dismissed = storedStatus === 'dismissed' || storedStatus === 'installed';
    setHasDismissed(dismissed);

    // If mobile, not standalone, and has not previously dismissed or installed
    if (isMobileDevice && !isStandalone && !dismissed) {
      setIsFirstMobileVisit(true);
    }

    // 4. Capture native beforeinstallprompt (Chromium / Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      localStorage.setItem(STORAGE_KEY, 'installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'manual_needed'> => {
    if (!deferredPrompt) {
      return 'manual_needed';
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        localStorage.setItem(STORAGE_KEY, 'installed');
        return 'accepted';
      }
      return 'dismissed';
    } catch {
      return 'manual_needed';
    }
  }, [deferredPrompt]);

  const dismiss = useCallback((permanent = true) => {
    setIsFirstMobileVisit(false);
    setHasDismissed(true);
    if (permanent && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'dismissed');
    }
  }, []);

  const resetPrompt = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      setHasDismissed(false);
      setIsFirstMobileVisit(true);
    }
  }, []);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isMobile,
    isIOS,
    isAndroid,
    isFirstMobileVisit,
    hasDismissed,
    install,
    dismiss,
    resetPrompt,
  };
}
