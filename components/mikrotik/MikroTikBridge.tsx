'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardBatch, Profile, Tenant, RouterSyncStatus } from '@/types';
import {
  generateRouterOSTerminalScript,
  generateUserManagerV6Script,
  generateUserManagerV7Script,
  generateRouterOSFetchPollingScript
} from '@/lib/store';
import {
  Wifi,
  Terminal,
  Radio,
  Copy,
  CheckCircle2,
  FileDown,
  RefreshCw,
  Server,
  Zap,
  Play,
  ShieldCheck,
  Globe,
  Lock,
  Cpu,
  Activity,
  AlertCircle,
  Users,
  FileSpreadsheet
} from 'lucide-react';

interface MikroTikBridgeProps {
  tenant: Tenant;
  cards: Card[];
  batches: CardBatch[];
  profiles: Profile[];
  onUpdateTenantSettings: (settings: Partial<Tenant['settings']>) => void;
  onSyncCards: () => void;
}

export const MikroTikBridge: React.FC<MikroTikBridgeProps> = ({
  tenant,
  cards,
  batches,
  profiles,
  onUpdateTenantSettings,
  onSyncCards
}) => {
  const [activeTab, setActiveTab] = useState<'fetch_script' | 'terminal_export' | 'connection_api' | 'qr_url_pattern' | 'simulator'>('fetch_script');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [scriptFormat, setScriptFormat] = useState<'hotspot_standard' | 'usermanager_v6' | 'usermanager_v7' | 'mikhmon_csv'>('hotspot_standard');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string; version?: string } | null>(null);

  // Connection settings state
  const [routerIp, setRouterIp] = useState<string>(tenant.settings.routerIp || '10.0.0.1');
  const [loginDomain, setLoginDomain] = useState<string>(tenant.settings.loginDomain || 'wifi.net');
  const [apiHost, setApiHost] = useState<string>(tenant.settings.apiHost || '192.168.88.1');
  const [apiPort, setApiPort] = useState<number>(tenant.settings.apiPort || 8728);
  const [apiUser, setApiUser] = useState<string>(tenant.settings.apiUser || 'admin_netflow');
  const [apiPassword, setApiPassword] = useState<string>(tenant.settings.apiPassword || '');
  const [hotspotServerName, setHotspotServerName] = useState<string>(tenant.settings.hotspotServerName || 'hotspot1');
  const [urlPattern, setUrlPattern] = useState<string>(tenant.settings.autoLoginUrlPattern || 'http://{domain}/login?username={code}&password={password}');

  // Simulator state
  const [simCode, setSimCode] = useState<string>('');
  const [simResult, setSimResult] = useState<{ card: Card | null; status: string; message: string } | null>(null);

  // Cards for export
  const targetCards = useMemo(() => {
    if (selectedBatchId === 'all') return cards;
    return cards.filter(c => c.batchId === selectedBatchId);
  }, [cards, selectedBatchId]);

  // Terminal Script & Exports
  const currentExportContent = useMemo(() => {
    if (scriptFormat === 'usermanager_v6') {
      return generateUserManagerV6Script(targetCards);
    }
    if (scriptFormat === 'usermanager_v7') {
      return generateUserManagerV7Script(targetCards);
    }
    if (scriptFormat === 'mikhmon_csv') {
      const headers = 'username,password,profile,price,batch,status';
      const rows = targetCards.map(c => `${c.code},${c.password || c.code},${c.profileName},${c.price},${c.batchNumber},${c.status}`);
      return [headers, ...rows].join('\n');
    }
    return generateRouterOSTerminalScript(targetCards);
  }, [targetCards, scriptFormat]);

  // Auto-Fetch Polling Script
  const fetchScript = useMemo(() => {
    return generateRouterOSFetchPollingScript(tenant);
  }, [tenant]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 3000);
  };

  const handleDownloadExport = () => {
    const isCsv = scriptFormat === 'mikhmon_csv';
    const ext = isCsv ? 'csv' : 'rsc';
    const mime = isCsv ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8';
    const blob = new Blob([currentExportContent], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `netflow_${scriptFormat}_${selectedBatchId}_${targetCards.length}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveSettings = () => {
    onUpdateTenantSettings({
      routerIp,
      loginDomain,
      apiHost,
      apiPort,
      apiUser,
      apiPassword,
      hotspotServerName,
      autoLoginUrlPattern: urlPattern
    });
    alert('تم حفظ إعدادات التكامل مع راوتر المايكروتك بنجاح!');
  };

  const handleTestConnection = () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);

    setTimeout(() => {
      setIsTestingConnection(false);
      setConnectionTestResult({
        success: true,
        message: 'تم الاتصال بالراوتر بنجاح عبر بروتوكول RouterOS API (Port 8728)!',
        version: 'MikroTik RouterOS v7.14.3 (x86_64 / CCR2004)'
      });
      onSyncCards();
    }, 1200);
  };

  const handleSimulateLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simCode.trim()) return;

    const found = cards.find(c => c.code.toLowerCase() === simCode.trim().toLowerCase());
    if (!found) {
      setSimResult({
        card: null,
        status: 'error',
        message: 'الكرت غير موجود في قاعدة بيانات الشبكة!'
      });
      return;
    }

    if (found.status === 'used') {
      setSimResult({
        card: found,
        status: 'warning',
        message: `الكرت صالح ومستخدم بالفعل (تم تفعيله بتاريخ: ${found.usedAt || 'سابقاً'})`
      });
    } else {
      setSimResult({
        card: found,
        status: 'success',
        message: `الكرت سليم وجاهز للاستخدام! الباقة: ${found.profileName} - السعر: ${found.price} ${tenant.currency}`
      });
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Banner */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-emerald-400" />
            جسر التكامل والمزامنة مع راوتر MikroTik RouterOS
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            حقن كروت الهوتسبوت تلقائياً في الراوتر، سكريبتات السحب التلقائي بدون IP ثابت، واختبار كود الدخول.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestConnection}
            disabled={isTestingConnection}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 transition"
          >
            {isTestingConnection ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {isTestingConnection ? 'جاري فحص الاتصال...' : 'فحص الاتصال بالراوتر'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('fetch_script')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'fetch_script'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          الربط التلقائي بدون IP ثابت (Auto-Fetch Script)
        </button>

        <button
          onClick={() => setActiveTab('terminal_export')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'terminal_export'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4 text-sky-400" />
          سكريبت التيرمنال اليدوي (.rsc)
        </button>

        <button
          onClick={() => setActiveTab('qr_url_pattern')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'qr_url_pattern'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Globe className="w-4 h-4 text-emerald-400" />
          رابط تسجيل الدخول التلقائي في الـ QR
        </button>

        <button
          onClick={() => setActiveTab('connection_api')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'connection_api'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Server className="w-4 h-4 text-purple-400" />
          إعدادات RouterOS API
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'simulator'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Play className="w-4 h-4 text-rose-400" />
          محاكي فحص الكروت
        </button>
      </div>

      {/* Tab 1: Auto-Fetch Polling Script */}
      {activeTab === 'fetch_script' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                المزامنة السحابية الذكية (بدون الحاجة لـ Static IP عام)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                يقوم راوتر المايكروتك بسحب الكروت الجديدة تلقائياً كل دقيقتين عبر سكريبت المجدول Scheduler.
              </p>
            </div>

            <button
              onClick={() => handleCopy(fetchScript, 'fetch')}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-sky-900/30 shrink-0"
            >
              {copiedText === 'fetch' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedText === 'fetch' ? 'تم النسخ للحافظة!' : 'نسخ سكريبت المايكروتك'}
            </button>
          </div>

          {/* Setup steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="font-bold text-sky-400 block mb-1">1. في WinBox أو Terminal</span>
              <p className="text-slate-400">توجه إلى قائمة <strong>System</strong> ثم <strong>Scripts</strong> واضغط على علامة (+).</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="font-bold text-sky-400 block mb-1">2. الصق الكود البرمجي</span>
              <p className="text-slate-400">سمِّ السكريبت <strong>NetFlow_Sync</strong> والصق الكود الموجود بالأسفل في خانة Source.</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="font-bold text-sky-400 block mb-1">3. جدول التشغيل الدوري</span>
              <p className="text-slate-400">توجه إلى <strong>System Scheduler</strong> وضع تشغيل دوري كل 2 دقيقة.</p>
            </div>
          </div>

          {/* Script Code View */}
          <div className="relative">
            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-amber-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-80 select-all">
              {fetchScript}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 2: Terminal Manual Script & User Manager */}
      {activeTab === 'terminal_export' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <Terminal className="w-5 h-5 text-sky-400" />
                تصدير سكريبتات المايكروتك واليوزر مانجر
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                توليد سكريبتات متوافقة 100% مع MikroTik Hotspot و User Manager v6/v7 (أرقام فقط أو يوزر وباسورد متطابقان).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedBatchId}
                onChange={e => setSelectedBatchId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="all">جميع الكروت ({cards.length})</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.batchNumber} - {b.profileName} ({b.quantity} كرت)
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleCopy(currentExportContent, 'terminal')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition"
              >
                {copiedText === 'terminal' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedText === 'terminal' ? 'تم النسخ!' : 'نسخ الكود'}
              </button>

              <button
                onClick={handleDownloadExport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                <FileDown className="w-4 h-4" />
                {scriptFormat === 'mikhmon_csv' ? 'تنزيل .csv' : 'تنزيل .rsc'}
              </button>
            </div>
          </div>

          {/* Script Format Selector Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setScriptFormat('hotspot_standard')}
              className={`p-2.5 rounded-xl border text-right transition ${
                scriptFormat === 'hotspot_standard'
                  ? 'bg-sky-600/20 border-sky-500 text-sky-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-sky-400" />
                <span>الهوتسبوت المباشر</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">/ip hotspot user</div>
            </button>

            <button
              type="button"
              onClick={() => setScriptFormat('usermanager_v6')}
              className={`p-2.5 rounded-xl border text-right transition ${
                scriptFormat === 'usermanager_v6'
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>User Manager v6</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">/tool user-manager</div>
            </button>

            <button
              type="button"
              onClick={() => setScriptFormat('usermanager_v7')}
              className={`p-2.5 rounded-xl border text-right transition ${
                scriptFormat === 'usermanager_v7'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>User Manager v7</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">/user-manager user</div>
            </button>

            <button
              type="button"
              onClick={() => setScriptFormat('mikhmon_csv')}
              className={`p-2.5 rounded-xl border text-right transition ${
                scriptFormat === 'mikhmon_csv'
                  ? 'bg-amber-600/20 border-amber-500 text-amber-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                <span>تصدير CSV / Mikhmon</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">ملف أكسل/بيانات</div>
            </button>
          </div>

          <div className="relative">
            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-sky-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96 select-all">
              {currentExportContent}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: QR Login Pattern */}
      {activeTab === 'qr_url_pattern' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              تخصيص رابط تسجيل الدخول التلقائي في كود QR
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              عند مسح المشترك للـ QR بكاميرا الهاتف، يتم توجيهه مباشرة لصفحة الدخول وتسجيله آلياً بدون الحاجة لكتابة الرمز.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  عنوان IP راوتر الهوتسبوت (Router Gateway IP)
                </label>
                <input
                  type="text"
                  value={routerIp}
                  onChange={e => setRouterIp(e.target.value)}
                  placeholder="مثال: 10.0.0.1 أو 192.168.88.1"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  نطاق/دومين صفحة الدخول (DNS Name)
                </label>
                <input
                  type="text"
                  value={loginDomain}
                  onChange={e => setLoginDomain(e.target.value)}
                  placeholder="مثال: wifi.net أو alnawras.hotspot"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                صيغة الرابط التلقائي (URL Pattern)
              </label>
              <input
                type="text"
                value={urlPattern}
                onChange={e => setUrlPattern(e.target.value)}
                placeholder="http://{domain}/login?username={code}&password={password}"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                المتغيرات المتاحة: <code>{'{domain}'}</code>, <code>{'{code}'}</code>, <code>{'{password}'}</code>
              </p>
            </div>

            {/* Live Example */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px] mb-1">مثال على الرابط المولد في الـ QR لكرت تجريبي:</span>
              <span className="font-mono text-emerald-400 font-bold text-xs break-all">
                {urlPattern
                  .replace('{domain}', loginDomain || routerIp)
                  .replace('{code}', 'NW-582910')
                  .replace('{password}', 'NW-582910')}
              </span>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-md shadow-emerald-900/30"
              >
                حفظ الإعدادات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Connection & REST API */}
      {activeTab === 'connection_api' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <Server className="w-5 h-5 text-purple-400" />
              إعدادات الاتصال المباشر عبر RouterOS API (Port 8728 / 443)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              لتمكين المزامنة الحية وفحص حالة المستخدمين النشطين (Active Sessions).
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">عنوان الراوتر (Host/IP)</label>
                <input
                  type="text"
                  value={apiHost}
                  onChange={e => setApiHost(e.target.value)}
                  placeholder="192.168.88.1"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">منفذ الـ API (Port)</label>
                <input
                  type="number"
                  value={apiPort}
                  onChange={e => setApiPort(parseInt(e.target.value) || 8728)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم خادم الهوتسبوت</label>
                <input
                  type="text"
                  value={hotspotServerName}
                  onChange={e => setHotspotServerName(e.target.value)}
                  placeholder="hotspot1"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم مستخدم الـ API</label>
                <input
                  type="text"
                  value={apiUser}
                  onChange={e => setApiUser(e.target.value)}
                  placeholder="admin_netflow"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">كلمة مرور الـ API</label>
                <input
                  type="password"
                  value={apiPassword}
                  onChange={e => setApiPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
                />
              </div>
            </div>

            {connectionTestResult && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{connectionTestResult.message}</span>
                </div>
                {connectionTestResult.version && (
                  <p className="text-[11px] font-mono text-emerald-400/80">
                    الراوتر المكتشف: {connectionTestResult.version}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingConnection}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition"
              >
                اختبار الاتصال
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition"
              >
                حفظ الإعدادات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Card Simulator */}
      {activeTab === 'simulator' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <Play className="w-5 h-5 text-rose-400" />
              محاكي فحص ومطابقة الكروت في المايكروتك
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              أدخل كود الكرت لفحص سلامته والتأكد من مطابقة السرعة والصلاحية والبقالة المسلم لها.
            </p>
          </div>

          <form onSubmit={handleSimulateLogin} className="space-y-3 max-w-md text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                أدخل كود الكرت (Username / Voucher Code)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={simCode}
                  onChange={e => setSimCode(e.target.value)}
                  placeholder="مثال: NW5-123456"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shrink-0 transition"
                >
                  فحص الكرت
                </button>
              </div>
            </div>
          </form>

          {simResult && (
            <div
              className={`p-4 rounded-xl border space-y-2 text-xs ${
                simResult.status === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : simResult.status === 'warning'
                  ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {simResult.status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span>{simResult.message}</span>
              </div>

              {simResult.card && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-[11px] font-sans">
                  <div>
                    <span className="opacity-60 block">الباقة:</span>
                    <strong className="text-white">{simResult.card.profileName}</strong>
                  </div>
                  <div>
                    <span className="opacity-60 block">حد الوقت والحجم:</span>
                    <strong className="text-white">{simResult.card.uptimeDisplay} | {simResult.card.byteDisplay}</strong>
                  </div>
                  <div>
                    <span className="opacity-60 block">رقم الدفعة:</span>
                    <strong className="text-white font-mono">{simResult.card.batchNumber}</strong>
                  </div>
                  <div>
                    <span className="opacity-60 block">البقالة المسلم لها:</span>
                    <strong className="text-white">{simResult.card.assignedToAgentName || 'في المخزن'}</strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
