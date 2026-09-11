'use client';

import React, { useState, useMemo } from 'react';
import { NetworkDevice, DeviceType, DeviceStatus, Tenant } from '@/types';
import {
  Network,
  Radio,
  Wifi,
  Server,
  Video,
  Cpu,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Copy,
  ExternalLink,
  QrCode,
  Printer,
  Sparkles,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  FileCode,
  Download,
  Info,
  Sliders,
  RefreshCw,
  Compass,
  MapPin,
  HelpCircle,
  X,
  Lock,
  Tag,
  Share2
} from 'lucide-react';

interface DeviceManagerProps {
  tenant: Tenant;
  devices: NetworkDevice[];
  onSaveDevice: (device: NetworkDevice) => Promise<boolean>;
  onDeleteDevice: (deviceId: string) => Promise<boolean>;
}

// Device types helper dictionary
const DEVICE_TYPE_LABELS: Record<DeviceType, { label: string; icon: any; color: string; desc: string }> = {
  access_point: {
    label: 'أكسس بوينت (واي فاي)',
    icon: Wifi,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    desc: 'نقطة بث واي فاي للمشتركين'
  },
  sector_antenna: {
    label: 'سيكتور بث رئيسي',
    icon: Radio,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    desc: 'هوائي بث قطاعي عريض للمناطق'
  },
  dish_antenna: {
    label: 'صحن ربط مايكرويف (Dish)',
    icon: Radio,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    desc: 'نقطة ربط للمسافات البعيدة PTP'
  },
  nanostation: {
    label: 'محطة نانوستيشن / لايت بيم',
    icon: Radio,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    desc: 'جهاز استقبال أو إرسال محلي'
  },
  switch: {
    label: 'سويتش توزيع (Switch/PoE)',
    icon: Server,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    desc: 'سويتش توزيع شبكي ومزود طاقة'
  },
  routerboard: {
    label: 'راوتر بورد مايكروتك فرعي',
    icon: Cpu,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    desc: 'راوتر فرعي أو سيرفر توزيع'
  },
  fiber_olt_onu: {
    label: 'ألياف ضوئية فايبر (OLT / ONU)',
    icon: Network,
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    desc: 'أجهزة شبكات الفايبر الضوئية'
  },
  camera: {
    label: 'كاميرا مراقبة للموقع',
    icon: Video,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    desc: 'كاميرا IP لحماية الأبراج والمعدات'
  },
  other: {
    label: 'جهاز شبكة آخر',
    icon: Layers,
    color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    desc: 'طاقة شمسية، بطاريات ذكية، حماية'
  }
};

const POPULAR_BRANDS = [
  'TP-Link',
  'Ubiquiti UniFi',
  'Ubiquiti airMAX',
  'MikroTik',
  'Reyee / Ruijie',
  'Tenda',
  'Hikvision',
  'Dahua',
  'Netgear',
  'Cisco'
];

export const DeviceManager: React.FC<DeviceManagerProps> = ({
  tenant,
  devices = [],
  onSaveDevice,
  onDeleteDevice
}) => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<NetworkDevice | null>(null);
  const [isIpPoolModalOpen, setIsIpPoolModalOpen] = useState(false);
  const [isAiPlannerModalOpen, setIsAiPlannerModalOpen] = useState(false);
  const [isMikrotikModalOpen, setIsMikrotikModalOpen] = useState(false);
  const [isPrintLabelModalOpen, setIsPrintLabelModalOpen] = useState(false);
  const [selectedDeviceForPrint, setSelectedDeviceForPrint] = useState<NetworkDevice | null>(null);

  // Notifications / Feedback
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [savingLoading, setSavingLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Base Subnet Detection from router IP or devices
  const defaultRouterIp = tenant.settings?.routerIp || '10.0.0.1';
  const subnetBase = useMemo(() => {
    // Extract base, e.g., '10.0.0' or '192.168.1'
    const parts = defaultRouterIp.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}`;
    }
    return '10.0.0';
  }, [defaultRouterIp]);

  // IP Conflict Detection
  const ipConflicts = useMemo(() => {
    const ipMap = new Map<string, NetworkDevice[]>();
    devices.forEach(dev => {
      const cleanIp = dev.ipAddress.trim();
      if (!cleanIp) return;
      const list = ipMap.get(cleanIp) || [];
      list.push(dev);
      ipMap.set(cleanIp, list);
    });

    const conflicts: { ip: string; devices: NetworkDevice[] }[] = [];
    ipMap.forEach((devs, ip) => {
      if (devs.length > 1) {
        conflicts.push({ ip, devices: devs });
      }
    });
    return conflicts;
  }, [devices]);

  // Unique locations list
  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>();
    devices.forEach(d => {
      if (d.location?.trim()) locs.add(d.location.trim());
      if (d.site?.trim()) locs.add(d.site.trim());
    });
    return Array.from(locs);
  }, [devices]);

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter(dev => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = dev.name.toLowerCase().includes(q);
        const matchNum = dev.deviceNumber?.toLowerCase().includes(q);
        const matchIp = dev.ipAddress.toLowerCase().includes(q);
        const matchMac = dev.macAddress?.toLowerCase().includes(q);
        const matchLoc = dev.location.toLowerCase().includes(q);
        const matchModel = dev.model?.toLowerCase().includes(q);
        const matchNotes = dev.notes?.toLowerCase().includes(q);
        if (!matchName && !matchNum && !matchIp && !matchMac && !matchLoc && !matchModel && !matchNotes) {
          return false;
        }
      }

      // Filter Type
      if (filterType !== 'all' && dev.type !== filterType) {
        return false;
      }

      // Filter Location
      if (filterLocation !== 'all' && dev.location !== filterLocation && dev.site !== filterLocation) {
        return false;
      }

      // Filter Status
      if (filterStatus !== 'all' && dev.status !== filterStatus) {
        return false;
      }

      return true;
    });
  }, [devices, searchQuery, filterType, filterLocation, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = devices.length;
    const active = devices.filter(d => d.status === 'active').length;
    const accessPoints = devices.filter(d => d.type === 'access_point').length;
    const antennas = devices.filter(d => ['sector_antenna', 'dish_antenna', 'nanostation'].includes(d.type)).length;
    const switchesAndOther = devices.filter(d => ['switch', 'routerboard', 'camera', 'other'].includes(d.type)).length;
    const conflictsCount = ipConflicts.length;

    return { total, active, accessPoints, antennas, switchesAndOther, conflictsCount };
  }, [devices, ipConflicts]);

  // Helper to suggest next available IP in subnet
  const getNextAvailableIp = (base: string = subnetBase): string => {
    const usedLastOctets = new Set<number>();
    
    // Add router IP octet
    const routerParts = defaultRouterIp.split('.');
    if (routerParts.length === 4 && routerParts.slice(0, 3).join('.') === base) {
      usedLastOctets.add(parseInt(routerParts[3], 10));
    }

    // Add device IP octets
    devices.forEach(d => {
      const parts = d.ipAddress.trim().split('.');
      if (parts.length === 4 && parts.slice(0, 3).join('.') === base) {
        const octet = parseInt(parts[3], 10);
        if (!isNaN(octet)) usedLastOctets.add(octet);
      }
    });

    // Start looking from 11 onwards (leaving 1-10 for core gateways)
    for (let i = 11; i <= 254; i++) {
      if (!usedLastOctets.has(i)) {
        return `${base}.${i}`;
      }
    }
    // If not found in 11-254, check 2-10
    for (let i = 2; i <= 10; i++) {
      if (!usedLastOctets.has(i)) {
        return `${base}.${i}`;
      }
    }
    return `${base}.200`;
  };

  // Open add modal
  const handleOpenAddModal = (presetIp?: string) => {
    const nextNum = devices.length + 1;
    const suggestedIp = presetIp || getNextAvailableIp(subnetBase);
    
    setEditingDevice({
      id: `dev_${Date.now()}`,
      tenantId: tenant.id,
      name: '',
      deviceNumber: `AP-${String(nextNum).padStart(2, '0')}`,
      ipAddress: suggestedIp,
      subnetMask: '255.255.255.0',
      gateway: defaultRouterIp,
      macAddress: '',
      type: 'access_point',
      model: '',
      brand: 'TP-Link',
      location: '',
      site: '',
      adminUsername: 'admin',
      adminPassword: '',
      webPort: 80,
      status: 'active',
      notes: '',
      frequency: '',
      ssid: '',
      createdAt: new Date().toISOString()
    });
    setIsEditModalOpen(true);
  };

  const handleEditDevice = (device: NetworkDevice) => {
    setEditingDevice({ ...device });
    setIsEditModalOpen(true);
  };

  const handleSaveModal = async (dev: NetworkDevice) => {
    if (!dev.name.trim() || !dev.ipAddress.trim()) {
      alert('يرجى كتابة اسم الجهاز وعنوان الآيبي');
      return;
    }

    setSavingLoading(true);
    try {
      const ok = await onSaveDevice(dev);
      if (ok) {
        setIsEditModalOpen(false);
        setEditingDevice(null);
      } else {
        alert('حدث خطأ أثناء حفظ الجهاز');
      }
    } finally {
      setSavingLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const ok = await onDeleteDevice(id);
      if (ok) {
        setDeleteConfirmId(null);
      } else {
        alert('فشل حذف الجهاز');
      }
    } catch {
      alert('فشل حذف الجهاز');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
                <Network className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  إدارة الأجهزة والبنية التحتية
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium">
                    منظومة التوزيع والآيبيهات
                  </span>
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  سجل متكامل للأكسسات، الهوائيات، السويتشات، توزيع عناوين الآيبي IP، وتفادي التعارضات لشبكة <strong>{tenant.businessName}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsIpPoolModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="عرض خريطة رينج الآيبيهات من 1 إلى 254"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              خريطة رينج الآيبيهات (IP Pool)
            </button>

            <button
              onClick={() => setIsAiPlannerModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="توصيات الذكاء الاصطناعي لتنظيم الشبكة"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              تخطيط الرينج بالذكاء الاصطناعي
            </button>

            <button
              onClick={() => setIsMikrotikModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="توليد سكربتات مايكروتك لحجز الآيبيهات ومراقبة الأجهزة"
            >
              <FileCode className="w-4 h-4 text-indigo-400" />
              سكربتات مايكروتك (DHCP/ARP/Netwatch)
            </button>

            <button
              onClick={() => {
                setSelectedDeviceForPrint(null);
                setIsPrintLabelModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="طباعة ملصقات وباركودات الأجهزة للميدان"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              طباعة ملصقات الأجهزة
            </button>

            <button
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              إضافة جهاز جديد
            </button>
          </div>
        </div>

        {/* IP Conflict Warning Banner if any */}
        {ipConflicts.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3 shadow-lg animate-pulse">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <span className="font-bold text-sm block text-rose-200">
                تنبيه أمان شبكي: تم اكتشاف {ipConflicts.length} تعارض في عناوين الآيبي (IP Conflicts)!
              </span>
              <p className="mt-1 text-rose-300/90 leading-relaxed">
                يوجد أكثر من جهاز يمتلك نفس عنوان الآيبي، هذا يسبب انقطاع بث الواي فاي أو توقف الشبكة عن العمل.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ipConflicts.map((conf, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-600/40 text-rose-200 font-mono text-xs"
                  >
                    <strong>{conf.ip}:</strong> {conf.devices.map(d => d.name || d.deviceNumber).join(' ⚡ ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">إجمالي الأجهزة</p>
            <p className="text-xl font-bold text-white font-mono">{stats.total}</p>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">أكسسات واي فاي</p>
            <p className="text-xl font-bold text-emerald-400 font-mono">{stats.accessPoints}</p>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">هوائيات وسيكتورات</p>
            <p className="text-xl font-bold text-cyan-400 font-mono">{stats.antennas}</p>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">سويتشات وكاميرات</p>
            <p className="text-xl font-bold text-purple-400 font-mono">{stats.switchesAndOther}</p>
          </div>
        </div>

        <div className={`rounded-xl p-4 flex items-center gap-3 border ${
          stats.conflictsCount > 0 
            ? 'bg-rose-500/10 border-rose-500/30' 
            : 'bg-slate-900/70 border-slate-800'
        }`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            stats.conflictsCount > 0 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          }`}>
            {stats.conflictsCount > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">حالة الآيبيهات</p>
            <p className={`text-xl font-bold font-mono ${stats.conflictsCount > 0 ? 'text-rose-400' : 'text-blue-400'}`}>
              {stats.conflictsCount > 0 ? `${stats.conflictsCount} تعارض!` : 'منظمة وسليمة'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالاسم، الآيبي، الماك، أو الموقع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">جميع أنواع الأجهزة</option>
            {Object.entries(DEVICE_TYPE_LABELS).map(([key, info]) => (
              <option key={key} value={key}>{info.label}</option>
            ))}
          </select>

          {/* Location Filter */}
          {uniqueLocations.length > 0 && (
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">جميع المواقع والأبراج</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">جاهز ونشط (Online)</option>
            <option value="maintenance">تحت الصيانة</option>
            <option value="offline">غير متصل (Offline)</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              شبكي
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'table' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              جدول
            </button>
          </div>
        </div>
      </div>

      {/* Copy Notification Toast */}
      {copiedText && (
        <div className="fixed bottom-6 left-6 z-50 px-4 py-2.5 rounded-xl bg-cyan-600 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          تم نسخ {copiedText} بنجاح!
        </div>
      )}

      {/* Devices View (Grid or Table) */}
      {filteredDevices.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 mx-auto mb-4">
            <Network className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">لا توجد أجهزة مطابقة</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            {searchQuery || filterType !== 'all' || filterLocation !== 'all'
              ? 'جرّب تغيير عبارة البحث أو الفلاتر المختارة للعثور على الأجهزة'
              : 'لم تقم بإضافة أي أجهزة بعد، اضغط على زر "إضافة جهاز جديد" لبدء تنظيم شبكتك!'}
          </p>
          <button
            onClick={() => handleOpenAddModal()}
            className="mt-5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            إضافة أول جهاز للشبكة
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map(device => {
            const typeInfo = DEVICE_TYPE_LABELS[device.type] || DEVICE_TYPE_LABELS.other;
            const TypeIcon = typeInfo.icon;
            const isConflicted = ipConflicts.some(c => c.ip === device.ipAddress.trim());

            return (
              <div
                key={device.id}
                className={`bg-slate-900/90 border rounded-2xl p-5 shadow-lg relative flex flex-col justify-between transition-all hover:border-slate-700 hover:shadow-cyan-950/20 group ${
                  isConflicted ? 'border-rose-500/60 ring-1 ring-rose-500/40' : 'border-slate-800'
                }`}
              >
                <div>
                  {/* Top Bar: Device Number & Type Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${typeInfo.color}`}>
                        <TypeIcon className="w-3.5 h-3.5" />
                        {device.deviceNumber || 'جهاز'}
                      </span>
                      {device.brand && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 font-medium">
                          {device.brand}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          device.status === 'active'
                            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                            : device.status === 'maintenance'
                            ? 'bg-amber-400'
                            : 'bg-rose-500'
                        }`}
                        title={device.status === 'active' ? 'نشط' : device.status === 'maintenance' ? 'تحت الصيانة' : 'غير متصل'}
                      />
                      <span className="text-[11px] text-slate-400 font-medium">
                        {device.status === 'active' ? 'نشط' : device.status === 'maintenance' ? 'صيانة' : 'غير متصل'}
                      </span>
                    </div>
                  </div>

                  {/* Device Name */}
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {device.name}
                  </h3>

                  {/* Location & Site */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="line-clamp-1">{device.location || 'لم يحدد الموقع'}</span>
                  </div>

                  {/* Model */}
                  {device.model && (
                    <p className="text-xs text-slate-400/80 mt-1 line-clamp-1 font-mono">
                      {device.model}
                    </p>
                  )}

                  {/* IP Address Card */}
                  <div className={`mt-3.5 p-3 rounded-xl border flex items-center justify-between ${
                    isConflicted
                      ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                      : 'bg-slate-950/80 border-slate-800 text-slate-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                        isConflicted ? 'bg-rose-500/20 text-rose-300' : 'bg-cyan-500/10 text-cyan-400'
                      }`}>
                        IP
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">عنوان الآيبي</span>
                        <span className="text-sm font-bold font-mono tracking-wider text-white">
                          {device.ipAddress}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyToClipboard(device.ipAddress, 'عنوان الآيبي')}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                        title="نسخ الآيبي"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <a
                        href={`http://${device.ipAddress}${device.webPort && device.webPort !== 80 ? `:${device.webPort}` : ''}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 transition-colors"
                        title="فتح لوحة تحكم الجهاز في المتصفح"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* MAC & Wireless details */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
                    {device.macAddress && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">الماك أدرس:</span>
                        <span className="font-mono text-slate-300 text-[11px] font-medium flex items-center gap-1">
                          {device.macAddress}
                          <button
                            onClick={() => copyToClipboard(device.macAddress!, 'الماك أدرس')}
                            className="text-slate-500 hover:text-slate-300"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </span>
                      </div>
                    )}

                    {device.ssid && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">شبكة البث SSID:</span>
                        <span className="text-slate-200 text-[11px] font-semibold">{device.ssid}</span>
                      </div>
                    )}

                    {device.frequency && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">التردد / القناة:</span>
                        <span className="text-cyan-400 font-mono text-[11px]">{device.frequency}</span>
                      </div>
                    )}

                    {device.adminUsername && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">بيانات الدخول:</span>
                        <span className="font-mono text-slate-300 text-[11px] flex items-center gap-1">
                          {device.adminUsername}
                          {device.adminPassword && (
                            <button
                              onClick={() => copyToClipboard(`${device.adminUsername}:${device.adminPassword}`, 'بيانات الدخول')}
                              className="text-slate-400 hover:text-cyan-400 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700"
                              title="نسخ اسم المستخدم وكلمة المرور"
                            >
                              نسخ الباسورد
                            </button>
                          )}
                        </span>
                      </div>
                    )}

                    {device.notes && (
                      <p className="text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60 mt-1 line-clamp-2">
                        {device.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedDeviceForPrint(device);
                        setIsPrintLabelModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
                      title="طباعة ملصق وباركود للجهاز"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[11px]">ملصق</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditDevice(device)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="تعديل بيانات الجهاز"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {deleteConfirmId === device.id ? (
                      <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-800 p-0.5 rounded-lg">
                        <button
                          onClick={() => handleDelete(device.id)}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded"
                        >
                          تأكيد
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-0.5 text-slate-400 hover:text-white text-[10px]"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(device.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="حذف الجهاز"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">رقم الجهاز</th>
                  <th className="py-3.5 px-4">اسم الجهاز والنوع</th>
                  <th className="py-3.5 px-4">عنوان الآيبي (IP)</th>
                  <th className="py-3.5 px-4">المكان والموقع</th>
                  <th className="py-3.5 px-4">الماك أدرس</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDevices.map(device => {
                  const typeInfo = DEVICE_TYPE_LABELS[device.type] || DEVICE_TYPE_LABELS.other;
                  const TypeIcon = typeInfo.icon;
                  const isConflicted = ipConflicts.some(c => c.ip === device.ipAddress.trim());

                  return (
                    <tr key={device.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400 text-xs">
                        {device.deviceNumber || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg border ${typeInfo.color}`}>
                            <TypeIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-100 text-sm">{device.name}</div>
                            <div className="text-[11px] text-slate-400">{typeInfo.label} {device.model ? `• ${device.model}` : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                            isConflicted
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-slate-950 text-white border border-slate-800'
                          }`}>
                            {device.ipAddress}
                          </span>
                          <button
                            onClick={() => copyToClipboard(device.ipAddress, 'عنوان الآيبي')}
                            className="text-slate-400 hover:text-slate-200"
                            title="نسخ الآيبي"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`http://${device.ipAddress}${device.webPort && device.webPort !== 80 ? `:${device.webPort}` : ''}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:text-cyan-300"
                            title="فتح صفحة الجهاز"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-300">
                        {device.location || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">
                        {device.macAddress || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                          device.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : device.status === 'maintenance'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {device.status === 'active' ? 'نشط' : device.status === 'maintenance' ? 'صيانة' : 'غير متصل'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedDeviceForPrint(device);
                              setIsPrintLabelModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="ملصق باركود"
                          >
                            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                          </button>
                          <button
                            onClick={() => handleEditDevice(device)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="تعديل"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(device.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. EDIT / ADD DEVICE MODAL */}
      {/* ======================================================== */}
      {isEditModalOpen && editingDevice && (
        <DeviceEditModal
          device={editingDevice}
          allDevices={devices}
          subnetBase={subnetBase}
          defaultRouterIp={defaultRouterIp}
          uniqueLocations={uniqueLocations}
          savingLoading={savingLoading}
          onSave={handleSaveModal}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingDevice(null);
          }}
          onSuggestIp={() => getNextAvailableIp(subnetBase)}
        />
      )}

      {/* ======================================================== */}
      {/* 2. INTERACTIVE IP POOL MAP MODAL */}
      {/* ======================================================== */}
      {isIpPoolModalOpen && (
        <IpPoolMapModal
          devices={devices}
          subnetBase={subnetBase}
          defaultRouterIp={defaultRouterIp}
          onClose={() => setIsIpPoolModalOpen(false)}
          onSelectFreeIp={(ip) => {
            setIsIpPoolModalOpen(false);
            handleOpenAddModal(ip);
          }}
          onSelectDevice={(dev) => {
            setIsIpPoolModalOpen(false);
            handleEditDevice(dev);
          }}
        />
      )}

      {/* ======================================================== */}
      {/* 3. AI SUBNET & IP RANGE PLANNER MODAL */}
      {/* ======================================================== */}
      {isAiPlannerModalOpen && (
        <AiPlannerModal
          devices={devices}
          subnetBase={subnetBase}
          defaultRouterIp={defaultRouterIp}
          onClose={() => setIsAiPlannerModalOpen(false)}
        />
      )}

      {/* ======================================================== */}
      {/* 4. MIKROTIK SCRIPTS GENERATOR MODAL */}
      {/* ======================================================== */}
      {isMikrotikModalOpen && (
        <MikrotikScriptsModal
          devices={devices}
          tenant={tenant}
          onClose={() => setIsMikrotikModalOpen(false)}
        />
      )}

      {/* ======================================================== */}
      {/* 5. PRINT DEVICE LABEL / QR MODAL */}
      {/* ======================================================== */}
      {isPrintLabelModalOpen && (
        <PrintDeviceLabelsModal
          tenant={tenant}
          devices={selectedDeviceForPrint ? [selectedDeviceForPrint] : devices}
          singleDevice={selectedDeviceForPrint}
          onClose={() => setIsPrintLabelModalOpen(false)}
        />
      )}
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: DeviceEditModal
// =========================================================================
interface DeviceEditModalProps {
  device: NetworkDevice;
  allDevices: NetworkDevice[];
  subnetBase: string;
  defaultRouterIp: string;
  uniqueLocations: string[];
  savingLoading: boolean;
  onSave: (device: NetworkDevice) => void;
  onClose: () => void;
  onSuggestIp: () => string;
}

const DeviceEditModal: React.FC<DeviceEditModalProps> = ({
  device: initialDevice,
  allDevices,
  subnetBase,
  defaultRouterIp,
  uniqueLocations,
  savingLoading,
  onSave,
  onClose,
  onSuggestIp
}) => {
  const [formData, setFormData] = useState<NetworkDevice>({ ...initialDevice });
  const [showPassword, setShowPassword] = useState(false);

  // Check if IP is already taken by ANOTHER device
  const conflictDevice = useMemo(() => {
    const cleanIp = formData.ipAddress.trim();
    if (!cleanIp) return null;
    return allDevices.find(d => d.id !== formData.id && d.ipAddress.trim() === cleanIp);
  }, [formData.ipAddress, formData.id, allDevices]);

  // Handle MAC formatting (auto adds colon)
  const handleMacChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '');
    if (val.length > 12) val = val.slice(0, 12);
    const formatted = val.match(/.{1,2}/g)?.join(':') || val;
    setFormData(prev => ({ ...prev, macAddress: formatted }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scaleUp my-8" dir="rtl">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialDevice.name ? 'تعديل بيانات الجهاز' : 'إضافة جهاز جديد للشبكة'}
              </h2>
              <p className="text-xs text-slate-400">
                تسجيل وحجز الآيبي وتحديد الموقع والمواصفات الفنية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Row 1: Name & Device Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                اسم الجهاز <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="مثال: أكسس بقالة السلام، سيكتور البرج الشمالي"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                رمز/رقم الجهاز
              </label>
              <input
                type="text"
                placeholder="AP-01"
                value={formData.deviceNumber || ''}
                onChange={(e) => setFormData({ ...formData, deviceNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Row 2: Type & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                نوع الجهاز <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as DeviceType })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {Object.entries(DEVICE_TYPE_LABELS).map(([key, info]) => (
                  <option key={key} value={key}>{info.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                الماركة / الشركة المصنعة
              </label>
              <input
                type="text"
                placeholder="TP-Link, Ubiquiti, MikroTik..."
                value={formData.brand || ''}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                list="brands-list"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <datalist id="brands-list">
                {POPULAR_BRANDS.map(b => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Row 3: Model & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                الموديل (Hardware Model)
              </label>
              <input
                type="text"
                placeholder="مثال: EAP225-Outdoor, NanoStation M5"
                value={formData.model || ''}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                حالة الجهاز
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as DeviceStatus })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="active">جاهز ونشط (Active / Online)</option>
                <option value="maintenance">تحت الصيانة (Maintenance)</option>
                <option value="offline">متوقف عن العمل (Offline)</option>
              </select>
            </div>
          </div>

          {/* Row 4: IP Address & Smart Auto-Suggestion */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-200">
                عنوان الآيبي (IP Address) <span className="text-rose-400">*</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  const freeIp = onSuggestIp();
                  setFormData(prev => ({ ...prev, ipAddress: freeIp }));
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                اقتراح الآيبي الشاغر التالي ⚡
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="10.0.0.25 أو 192.168.1.50"
                value={formData.ipAddress}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2.5 text-sm font-mono tracking-wider text-white focus:outline-none ${
                  conflictDevice ? 'border-rose-500 text-rose-300' : 'border-slate-700 focus:border-cyan-500'
                }`}
                required
              />
            </div>

            {/* Conflict Warning */}
            {conflictDevice && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>تحذير تعارض!</strong> هذا الآيبي مستخدم حالياً في جهاز:{' '}
                  <strong className="underline">{conflictDevice.name}</strong> ({conflictDevice.deviceNumber})
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
              <div>
                <span>قناع الشبكة: </span>
                <input
                  type="text"
                  value={formData.subnetMask || '255.255.255.0'}
                  onChange={(e) => setFormData({ ...formData, subnetMask: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-slate-300 font-mono w-28 text-center text-xs ml-1"
                />
              </div>
              <div>
                <span>البوابة (Gateway): </span>
                <input
                  type="text"
                  value={formData.gateway || defaultRouterIp}
                  onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-slate-300 font-mono w-28 text-center text-xs ml-1"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Location & Site */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                المكان والموقع الدقيق <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="مثال: برج حي السلام - الطابق 3"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                list="locations-list"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                required
              />
              <datalist id="locations-list">
                {uniqueLocations.map(loc => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                المنطقة / الحي (Site)
              </label>
              <input
                type="text"
                placeholder="مثال: حي السلام، قطاع الجامعة"
                value={formData.site || ''}
                onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Row 6: MAC Address & Web Port */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                الماك أدرس (MAC Address)
              </label>
              <input
                type="text"
                placeholder="AA:BB:CC:DD:EE:FF"
                value={formData.macAddress || ''}
                onChange={handleMacChange}
                maxLength={17}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono uppercase tracking-wider text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                منفذ الويب (Port)
              </label>
              <input
                type="number"
                placeholder="80"
                value={formData.webPort || 80}
                onChange={(e) => setFormData({ ...formData, webPort: parseInt(e.target.value, 10) || 80 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono text-center focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Row 7: Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                اسم مستخدم الإدارة (Username)
              </label>
              <input
                type="text"
                placeholder="admin أو ubnt"
                value={formData.adminUsername || ''}
                onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-400">
                  كلمة المرور (Password)
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300"
                >
                  {showPassword ? 'إخفاء' : 'إظهار'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="كلمة مرور الدخول للجهاز"
                value={formData.adminPassword || ''}
                onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Row 8: Wireless specs (SSID & Frequency) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                اسم شبكة الوايفاي (SSID)
              </label>
              <input
                type="text"
                placeholder="SamTech_WiFi_Free"
                value={formData.ssid || ''}
                onChange={(e) => setFormData({ ...formData, ssid: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                التردد والقناة (Frequency)
              </label>
              <input
                type="text"
                placeholder="2.4GHz (CH 6) أو 5800MHz"
                value={formData.frequency || ''}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Row 9: Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              ملاحظات فنية لصاحب الشبكة
            </label>
            <textarea
              rows={2}
              placeholder="مثال: يغذي مربع بقالة الأمانة، متصل بالبورت رقم 3 في سويتش البرج، كابل Cat6 خارجي..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            إلغاء
          </button>

          <button
            type="button"
            disabled={savingLoading}
            onClick={() => onSave(formData)}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {savingLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            حفظ بيانات الجهاز
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: IpPoolMapModal (خريطة رينج الآيبيهات التفاعلية)
// =========================================================================
interface IpPoolMapModalProps {
  devices: NetworkDevice[];
  subnetBase: string;
  defaultRouterIp: string;
  onClose: () => void;
  onSelectFreeIp: (ip: string) => void;
  onSelectDevice: (dev: NetworkDevice) => void;
}

const IpPoolMapModal: React.FC<IpPoolMapModalProps> = ({
  devices,
  subnetBase,
  defaultRouterIp,
  onClose,
  onSelectFreeIp,
  onSelectDevice
}) => {
  const [selectedOctet, setSelectedOctet] = useState<number | null>(null);

  // Router last octet
  const routerLastOctet = useMemo(() => {
    const parts = defaultRouterIp.split('.');
    return parts.length === 4 ? parseInt(parts[3], 10) : 1;
  }, [defaultRouterIp]);

  // Map octets 1 to 254
  const pool = useMemo(() => {
    const deviceMap = new Map<number, NetworkDevice[]>();

    devices.forEach(dev => {
      const parts = dev.ipAddress.trim().split('.');
      if (parts.length === 4 && parts.slice(0, 3).join('.') === subnetBase) {
        const octet = parseInt(parts[3], 10);
        if (!isNaN(octet) && octet >= 1 && octet <= 254) {
          const list = deviceMap.get(octet) || [];
          list.push(dev);
          deviceMap.set(octet, list);
        }
      }
    });

    const items = [];
    for (let i = 1; i <= 254; i++) {
      const assigned = deviceMap.get(i) || [];
      const isRouter = i === routerLastOctet;
      const isConflict = assigned.length > 1;
      const isFree = assigned.length === 0 && !isRouter;

      items.push({
        octet: i,
        ip: `${subnetBase}.${i}`,
        isRouter,
        isConflict,
        isFree,
        devices: assigned
      });
    }
    return items;
  }, [devices, subnetBase, routerLastOctet]);

  const selectedItem = selectedOctet ? pool.find(p => p.octet === selectedOctet) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden animate-scaleUp my-6" dir="rtl">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                خريطة رينج الآيبيهات التفاعلية (IP Pool Map)
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono">
                  {subnetBase}.0/24
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                استعراض فوري لجميع عناوين الآيبي (من 1 إلى 254) — اضغط على أي آيبي شاغر لإضافة جهاز جديد فوراً!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="px-6 py-3 bg-slate-950/50 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-indigo-600 border border-indigo-400" />
              <span className="text-slate-300">الراوتر الرئيسي (Gateway)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-cyan-600/80 border border-cyan-400" />
              <span className="text-slate-300">محجوز لجهاز (Assigned)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-rose-600 border border-rose-400 animate-pulse" />
              <span className="text-rose-300 font-bold">تعارض آيبي مكرر (Conflict)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700" />
              <span className="text-slate-400">شاغر ومتاح (Available)</span>
            </div>
          </div>

          <div className="text-slate-400 font-mono text-[11px]">
            المستخدم: {pool.filter(p => !p.isFree).length} / 254
          </div>
        </div>

        {/* 254 IPs Grid */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-20 gap-1.5 font-mono text-xs">
            {pool.map(item => {
              let bgClass = 'bg-slate-800/70 border-slate-700/60 text-slate-400 hover:bg-slate-700 hover:text-white hover:border-cyan-500';
              if (item.isRouter) {
                bgClass = 'bg-indigo-600 border-indigo-400 text-white font-bold shadow-sm';
              } else if (item.isConflict) {
                bgClass = 'bg-rose-600 border-rose-400 text-white font-bold animate-pulse';
              } else if (!item.isFree) {
                bgClass = 'bg-cyan-600/90 border-cyan-400 text-white font-bold shadow-sm';
              }

              const isSelected = selectedOctet === item.octet;

              return (
                <button
                  key={item.octet}
                  onClick={() => setSelectedOctet(item.octet)}
                  title={`${item.ip}${item.isRouter ? ' (راوتر مايكروتك)' : ''}${item.devices.length ? ` - ${item.devices.map(d => d.name).join(', ')}` : ' (شاغر)'}`}
                  className={`h-8 rounded flex items-center justify-center border text-[11px] transition-all relative ${bgClass} ${
                    isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 z-10' : ''
                  }`}
                >
                  .{item.octet}
                </button>
              );
            })}
          </div>

          {/* Selected IP Inspector Card */}
          {selectedItem && (
            <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white font-mono">{selectedItem.ip}</span>
                  {selectedItem.isRouter && (
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                      الراوتر الرئيسي (Default Gateway)
                    </span>
                  )}
                  {selectedItem.isConflict && (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
                      تعارض آيبي خطير!
                    </span>
                  )}
                  {selectedItem.isFree && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                      آيبي متاح وشاغر للاستخدام
                    </span>
                  )}
                </div>

                {selectedItem.devices.length > 0 && (
                  <div className="text-xs text-slate-300 space-y-1 pt-1">
                    {selectedItem.devices.map(d => (
                      <div key={d.id} className="flex items-center gap-2">
                        <span className="font-semibold text-cyan-400">{d.name}</span>
                        <span className="text-slate-500">({d.deviceNumber})</span>
                        <span className="text-slate-400">• {d.location}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedItem.isFree ? (
                  <button
                    onClick={() => onSelectFreeIp(selectedItem.ip)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    تخصيص هذا الآيبي لجهاز جديد
                  </button>
                ) : selectedItem.devices.length > 0 ? (
                  <button
                    onClick={() => onSelectDevice(selectedItem.devices[0])}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    تعديل جهاز {selectedItem.devices[0].name}
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: AiPlannerModal (مخطط وتوصيات الذكاء الاصطناعي لتنظيم الشبكة)
// =========================================================================
interface AiPlannerModalProps {
  devices: NetworkDevice[];
  subnetBase: string;
  defaultRouterIp: string;
  onClose: () => void;
}

const AiPlannerModal: React.FC<AiPlannerModalProps> = ({
  devices,
  subnetBase,
  defaultRouterIp,
  onClose
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyText = (txt: string, id: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const partitions = [
    {
      id: 'gateways',
      title: '1. رينج السيرفرات والراوترات الرئيسية (Core Routers & Gateways)',
      range: `${subnetBase}.1 - ${subnetBase}.10`,
      desc: 'محجوز للبوابة الرئيسية والراوترات الموزعة وسيرفرات RADIUS أو الـ DNS.',
      recommendation: 'الراوتر الرئيسي يفضل أن يكون دائماً .1'
    },
    {
      id: 'ptp',
      title: '2. رينج هوائيات الربط والسويتشات (Switches & PTP Antennas)',
      range: `${subnetBase}.11 - ${subnetBase}.50`,
      desc: 'مخصص لسويتشات التوزيع الذكية (Managed PoE Switches) وأطباق المايكرويف واللايت بيم والربط بين الأبراج.',
      recommendation: 'تثبيت ماك أدرس كل سويتش لضمان استقرار خطوط الربط الرئيسية.'
    },
    {
      id: 'aps',
      title: '3. رينج أكسسات التوزيع والواي فاي (Access Points & Sectors)',
      range: `${subnetBase}.51 - ${subnetBase}.150`,
      desc: 'مخصص لنقاط البث المباشرة للمشتركين وأكسسات الشوارع والأسواق.',
      recommendation: 'تسمية الأكسسات برقم تسلسلي منظم (AP-01 إلى AP-99) مع ربطها برقم الآيبي نفسه (مثال: AP-01 يأخذ .51، AP-02 يأخذ .52) لتجنب أي ارتباك ذهني.'
    },
    {
      id: 'cams',
      title: '4. رينج كاميرات المراقبة والحماية (Security Cameras & IoT)',
      range: `${subnetBase}.151 - ${subnetBase}.200`,
      desc: 'مخصص لكاميرات المراقبة في الأبراج، أنظمة الطاقة الشمسية الذكية، وأجهزة الحماية.',
      recommendation: 'فصل بث الكاميرات لتفادي استهلاك الباندويث العام لشبكة الواي فاي.'
    },
    {
      id: 'emergency',
      title: '5. رينج الطوارئ والـ Management الاحتياطي',
      range: `${subnetBase}.201 - ${subnetBase}.254`,
      desc: 'نطاق حر محجوز لحالات الصيانة السريعة في الميدان وتوصيل لابتوب الفني للصيانة.',
      recommendation: 'تركه شاغراً بدون أجهزة دائمة.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-scaleUp my-6" dir="rtl">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                مساعد الذكاء الاصطناعي لتنظيم الشبكة (AI Subnet Planner)
              </h2>
              <p className="text-xs text-slate-400">
                المعايير الهندسية الاحترافية لتقسيم رينج الآيبيهات وتفادي الارتباك وضياع العناوين
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200 leading-relaxed">
            💡 <strong>نصيحة المهندس الذكي:</strong> لمنع أي ارتباك عند إضافة أكسسات جديدة، ينصح مهندسو الشبكات باعتماد قاعدة:
            <span className="block mt-1 font-mono text-cyan-300">
              عنوان الآيبي = 50 + رقم الأكسس (مثال: أكسس رقم 5 يأخذ الآيبي {subnetBase}.55، وأكسس رقم 12 يأخذ {subnetBase}.62)
            </span>
            بهذه الطريقة البسيطة يعرف أي فني في الميدان عنوان آيبي الأكسس فوراً بمجرد النظر إلى رقمه المكتوب على الملصق الخارجي!
          </div>

          <div className="space-y-3">
            {partitions.map(part => (
              <div key={part.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-100">{part.title}</h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/20">
                    {part.range}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{part.desc}</p>
                <div className="text-[11px] text-emerald-400/90 font-medium flex items-center gap-1 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{part.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors"
          >
            إغلاق المساعد
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: MikrotikScriptsModal (سكربتات مايكروتك)
// =========================================================================
interface MikrotikScriptsModalProps {
  devices: NetworkDevice[];
  tenant: Tenant;
  onClose: () => void;
}

const MikrotikScriptsModal: React.FC<MikrotikScriptsModalProps> = ({
  devices,
  tenant,
  onClose
}) => {
  const [scriptType, setScriptType] = useState<'dhcp_leases' | 'arp_binding' | 'netwatch'>('dhcp_leases');
  const [copied, setCopied] = useState(false);

  // Generate scripts
  const generatedScript = useMemo(() => {
    const validDevices = devices.filter(d => d.ipAddress?.trim());

    if (scriptType === 'dhcp_leases') {
      let script = `# ====================================================\n`;
      script += `# NetFlow SaaS - MikroTik Static DHCP Leases Script\n`;
      script += `# Network: ${tenant.businessName}\n`;
      script += `# Generated: ${new Date().toLocaleString('ar-YE')}\n`;
      script += `# ====================================================\n\n`;

      validDevices.forEach(d => {
        const comment = `${d.deviceNumber || 'DEV'} - ${d.name} (${d.location || ''})`.replace(/["'\n]/g, '');
        if (d.macAddress && d.macAddress.length >= 12) {
          script += `/ip dhcp-server lease add address=${d.ipAddress} mac-address=${d.macAddress} comment="${comment}" always-broadcast=yes\n`;
        } else {
          script += `# Device: ${d.name} (IP: ${d.ipAddress}) - Add MAC address to enable static lease\n`;
        }
      });
      return script;
    }

    if (scriptType === 'arp_binding') {
      let script = `# ====================================================\n`;
      script += `# NetFlow SaaS - Static ARP Security Binding\n`;
      script += `# Protects Access Points against IP Spoofing\n`;
      script += `# ====================================================\n\n`;

      validDevices.forEach(d => {
        if (d.macAddress && d.macAddress.length >= 12) {
          const comment = `Protected: ${d.deviceNumber || ''} ${d.name}`.replace(/["'\n]/g, '');
          script += `/ip arp add address=${d.ipAddress} mac-address=${d.macAddress} interface=bridge comment="${comment}"\n`;
        }
      });
      return script;
    }

    if (scriptType === 'netwatch') {
      let script = `# ====================================================\n`;
      script += `# NetFlow SaaS - MikroTik Automated Netwatch Ping Monitor\n`;
      script += `# Pings all Access Points every 30s & logs alert if DOWN\n`;
      script += `# ====================================================\n\n`;

      validDevices.forEach(d => {
        const devName = `${d.deviceNumber || 'DEV'}: ${d.name}`.replace(/["'\n]/g, '');
        script += `/tool netwatch add host=${d.ipAddress} interval=30s timeout=1000ms comment="Monitor ${devName}" up-script=":log info \\"${devName} is UP\\"" down-script=":log error \\"ALERT: ${devName} is DOWN!\\""\n`;
      });
      return script;
    }

    return '';
  }, [devices, tenant, scriptType]);

  const copyScript = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadScriptFile = () => {
    const blob = new Blob([generatedScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `netflow_devices_${scriptType}.rsc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-scaleUp my-6" dir="rtl">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                توليد سكربتات مايكروتك (MikroTik RouterOS)
              </h2>
              <p className="text-xs text-slate-400">
                سكربتات جاهزة للتنفيذ في الـ Terminal أو عبر New Script لحجز ومراقبة الأجهزة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Script Type Tabs */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setScriptType('dhcp_leases')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                scriptType === 'dhcp_leases'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1. حجز الآيبيهات في DHCP Leases
            </button>
            <button
              onClick={() => setScriptType('arp_binding')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                scriptType === 'arp_binding'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2. حماية الـ Static ARP
            </button>
            <button
              onClick={() => setScriptType('netwatch')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                scriptType === 'netwatch'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3. مراقبة Netwatch التلقائية
            </button>
          </div>

          {/* Script Viewer */}
          <div className="relative">
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400/90 overflow-x-auto max-h-80 whitespace-pre-wrap leading-relaxed select-all">
              {generatedScript}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={downloadScriptFile}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            تنزيل ملف (.rsc)
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={copyScript}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'تم النسخ!' : 'نسخ السكربت كاملاً'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: PrintDeviceLabelsModal (طباعة ملصقات الأجهزة والـ QR)
// =========================================================================
interface PrintDeviceLabelsModalProps {
  tenant: Tenant;
  devices: NetworkDevice[];
  singleDevice: NetworkDevice | null;
  onClose: () => void;
}

const PrintDeviceLabelsModal: React.FC<PrintDeviceLabelsModalProps> = ({
  tenant,
  devices,
  singleDevice,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-scaleUp my-6" dir="rtl">
        {/* Modal Controls (Hidden in Print) */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {singleDevice ? `طباعة ملصق: ${singleDevice.name}` : `طباعة ملصقات جميع الأجهزة (${devices.length})`}
              </h2>
              <p className="text-xs text-slate-400">
                ملصقات فنية للصقها على الأكسسات والمعدات في الميدان لتسهيل الصيانة بالـ QR Code
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
            >
              <Printer className="w-4 h-4" />
              طباعة فورية
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Labels Container */}
        <div className="p-6 max-h-[75vh] overflow-y-auto bg-slate-950/40">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {devices.map(device => {
              const deviceUrl = `http://${device.ipAddress}${device.webPort && device.webPort !== 80 ? `:${device.webPort}` : ''}`;
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(deviceUrl)}`;

              return (
                <div
                  key={device.id}
                  className="bg-white text-slate-900 border-2 border-slate-300 rounded-xl p-4 shadow-sm relative flex flex-col justify-between"
                  style={{ minHeight: '180px' }}
                >
                  <div>
                    {/* Sticker Header */}
                    <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2 mb-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block">
                          {tenant.businessName}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 line-clamp-1">
                          {device.name}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-xs font-black">
                        {device.deviceNumber || 'DEV'}
                      </span>
                    </div>

                    {/* Sticker Body with QR */}
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 shrink-0 border border-slate-300 rounded p-1 bg-white flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrUrl}
                          alt="QR Code"
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>

                      <div className="space-y-1 text-xs text-slate-700 flex-1">
                        <div>
                          <span className="font-bold text-slate-500 text-[10px] block">عنوان الآيبي:</span>
                          <span className="font-mono text-sm font-black text-blue-700">{device.ipAddress}</span>
                        </div>

                        {device.macAddress && (
                          <div>
                            <span className="font-bold text-slate-500 text-[10px] block">الماك أدرس:</span>
                            <span className="font-mono text-[11px] font-bold text-slate-800">{device.macAddress}</span>
                          </div>
                        )}

                        {device.location && (
                          <div className="text-[11px] font-medium text-slate-600 line-clamp-1">
                            📍 {device.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sticker Footer */}
                  <div className="mt-3 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                    <span>Admin: {device.adminUsername || 'admin'}</span>
                    <span>PASS: {device.adminPassword ? '••••••' : 'None'}</span>
                    <span>Port: {device.webPort || 80}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
