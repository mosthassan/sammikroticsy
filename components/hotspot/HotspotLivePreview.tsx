'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { HotspotPortalTemplate } from '@/types';
import {
  Smartphone,
  Monitor,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Code,
  FileText,
  Eye,
  Sparkles,
  Wifi
} from 'lucide-react';

interface HotspotLivePreviewProps {
  template: HotspotPortalTemplate;
  networkName: string;
  activePage: 'login' | 'status' | 'alogin' | 'logout' | 'errors';
  onActivePageChange: (page: 'login' | 'status' | 'alogin' | 'logout' | 'errors') => void;
}

export const HotspotLivePreview: React.FC<HotspotLivePreviewProps> = ({
  template,
  networkName,
  activePage,
  onActivePageChange
}) => {
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'desktop'>('mobile');
  const [simulateError, setSimulateError] = useState<boolean>(false);
  const [customErrorMessage, setCustomErrorMessage] = useState<string>('كود الكرت غير صحيح أو منتهي الصلاحية! يرجى التأكد من الأرقام');
  const [previewKey, setPreviewKey] = useState<number>(0);
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(3745);

  // Increment live simulated uptime every second
  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedUptime = useMemo(() => {
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [uptimeSeconds]);

  // Compute processed HTML with simulated MikroTik tags replaced
  const renderedContent = useMemo(() => {
    if (activePage === 'errors') {
      return template.errorsTxt;
    }

    let rawHtml = '';
    if (activePage === 'login') rawHtml = template.htmlLogin;
    else if (activePage === 'status') rawHtml = template.htmlStatus;
    else if (activePage === 'alogin') rawHtml = template.htmlAlogin;
    else if (activePage === 'logout') rawHtml = template.htmlLogout;

    // Simulate MikroTik template conditional blocks
    let processed = rawHtml;

    // 1. Error conditionals
    if (simulateError) {
      processed = processed.replace(/\$\(if error\)([\s\S]*?)\$\(endif\)/g, '$1');
      processed = processed.replace(/\$\(error\)/g, customErrorMessage);
    } else {
      processed = processed.replace(/\$\(if error\)[\s\S]*?\$\(endif\)/g, '');
      processed = processed.replace(/\$\(error\)/g, '');
    }

    // 2. Free trial conditional
    if (template.showFreeTrial) {
      processed = processed.replace(/\$\(if trial == 'yes'\)([\s\S]*?)\$\(endif\)/g, '$1');
    } else {
      processed = processed.replace(/\$\(if trial == 'yes'\)[\s\S]*?\$\(endif\)/g, '');
    }

    // 3. CHAP ID conditional simulation
    processed = processed.replace(/\$\(if chap-id\)[\s\S]*?\$\(endif\)/g, '');

    // 4. Replace MikroTik Variables with realistic simulation data
    processed = processed
      .replace(/\$\(link-login-only\)/g, '#')
      .replace(/\$\(link-login\)/g, '#')
      .replace(/\$\(link-logout\)/g, '#')
      .replace(/\$\(link-orig\)/g, 'http://www.google.com')
      .replace(/\$\(link-orig-esc\)/g, 'http%3A%2F%2Fwww.google.com')
      .replace(/\$\(link-redirect\)/g, 'http://www.google.com')
      .replace(/\$\(username\)/g, '849201')
      .replace(/\$\(mac\)/g, 'D4:38:9C:12:FE:55')
      .replace(/\$\(mac-esc\)/g, 'D4%3A38%3A9C%3A12%3AFE%3A55')
      .replace(/\$\(ip\)/g, '192.168.88.245')
      .replace(/\$\(uptime\)/g, formattedUptime)
      .replace(/\$\(session-time-left\)/g, '04:18:22')
      .replace(/\$\(bytes-in-nice\)/g, '342.8 MiB')
      .replace(/\$\(bytes-out-nice\)/g, '48.2 MiB')
      .replace(/\$\(remain-bytes-total-nice\)/g, '681.2 MiB')
      .replace(/\$\(refresh-timeout\)/g, '60s');

    return processed;
  }, [activePage, template, simulateError, customErrorMessage, formattedUptime]);

  const handleRefresh = () => {
    setPreviewKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl font-sans" dir="rtl">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 border-b border-slate-800">
        {/* Device Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            id="btn-preview-mobile"
            type="button"
            onClick={() => setDeviceMode('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              deviceMode === 'mobile'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>هاتف (380px)</span>
          </button>
          <button
            id="btn-preview-desktop"
            type="button"
            onClick={() => setDeviceMode('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              deviceMode === 'desktop'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>كمبيوتر</span>
          </button>
        </div>

        {/* Page Switcher Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          <button
            type="button"
            onClick={() => onActivePageChange('login')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activePage === 'login'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-transparent'
            }`}
          >
            login.html (الدخول)
          </button>
          <button
            type="button"
            onClick={() => onActivePageChange('status')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activePage === 'status'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-transparent'
            }`}
          >
            status.html (الحالة)
          </button>
          <button
            type="button"
            onClick={() => onActivePageChange('alogin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activePage === 'alogin'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-transparent'
            }`}
          >
            alogin.html (التحويل)
          </button>
          <button
            type="button"
            onClick={() => onActivePageChange('logout')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activePage === 'logout'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-transparent'
            }`}
          >
            logout.html (الخروج)
          </button>
          <button
            type="button"
            onClick={() => onActivePageChange('errors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activePage === 'errors'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-transparent'
            }`}
          >
            errors.txt (التعريب)
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {activePage === 'login' && (
            <button
              id="btn-toggle-error-sim"
              type="button"
              onClick={() => setSimulateError(!simulateError)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition border ${
                simulateError
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="محاكاة ظهور رسالة خطأ عند إدخال كود غير صحيح"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{simulateError ? 'إلغاء رسالة الخطأ' : 'محاكاة خطأ'}</span>
            </button>
          )}

          <button
            id="btn-refresh-preview"
            type="button"
            onClick={handleRefresh}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 transition"
            title="إعادة تحميل المعاينة"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 sm:p-6 overflow-auto min-h-[520px]">
        {activePage === 'errors' ? (
          /* Errors.txt raw text display */
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-400 overflow-auto max-h-[480px] whitespace-pre-wrap leading-relaxed">
            {renderedContent}
          </div>
        ) : deviceMode === 'mobile' ? (
          /* Realistic Smartphone Mockup Frame */
          <div className="relative w-[340px] sm:w-[380px] h-[640px] bg-slate-900 rounded-[44px] p-3.5 border-4 border-slate-700 shadow-2xl shadow-black/80 flex flex-col">
            {/* Phone Top Notch & Camera */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-950 rounded-full z-20 flex items-center justify-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-800"></div>
              <div className="w-10 h-1.5 rounded-full bg-slate-900"></div>
            </div>

            {/* Live iframe Screen */}
            <div className="flex-1 w-full h-full rounded-[32px] overflow-hidden bg-slate-950 relative border border-slate-800/80">
              <iframe
                key={previewKey}
                srcDoc={renderedContent}
                title="Mobile Hotspot Portal Live Preview"
                className="w-full h-full border-0 bg-transparent"
                sandbox="allow-scripts allow-forms allow-same-origin"
              />
            </div>

            {/* Phone Bottom Home Bar */}
            <div className="w-28 h-1 bg-slate-700 rounded-full mx-auto mt-2"></div>
          </div>
        ) : (
          /* Desktop / Laptop Mockup Frame */
          <div className="w-full max-w-3xl bg-slate-900 rounded-2xl border-2 border-slate-700 shadow-2xl overflow-hidden flex flex-col h-[520px]">
            {/* Browser Header Bar */}
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              </div>
              <div className="flex-1 mx-4 bg-slate-900 text-slate-400 text-xs px-3 py-1 rounded-lg border border-slate-800 flex items-center justify-between font-mono">
                <span>http://hotspot.lan/login</span>
                <Wifi className="w-3 h-3 text-sky-400" />
              </div>
            </div>

            {/* Desktop iframe Screen */}
            <div className="flex-1 w-full h-full bg-slate-950 overflow-hidden">
              <iframe
                key={previewKey}
                srcDoc={renderedContent}
                title="Desktop Hotspot Portal Live Preview"
                className="w-full h-full border-0 bg-transparent"
                sandbox="allow-scripts allow-forms allow-same-origin"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Info & Compatibility Badges */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>معاينة حية دقيقة متوافقة 100% مع أنظمة <strong>MikroTik RouterOS v6 & v7</strong></span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
          <span>متغيرات: $(link-login-only), $(chap-id), $(uptime), $(bytes-in-nice)</span>
        </div>
      </div>
    </div>
  );
};
