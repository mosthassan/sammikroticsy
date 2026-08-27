'use client';

import React, { useState } from 'react';
import { TeamMember, Tenant, UserRole } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Phone,
  Mail,
  KeyRound,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Smartphone,
  Copy,
  Check
} from 'lucide-react';

interface TeamManagerProps {
  tenant: Tenant;
  team: TeamMember[];
  onAddMember: (member: Omit<TeamMember, 'id' | 'createdAt'>) => void;
  onUpdateMember: (memberId: string, updates: Partial<TeamMember>) => void;
  onDeleteMember: (memberId: string) => void;
}

export const TeamManager: React.FC<TeamManagerProps> = ({
  tenant,
  team,
  onAddMember,
  onUpdateMember,
  onDeleteMember
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('distributor');
  const [pinCode, setPinCode] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    onAddMember({
      tenantId: tenant.id,
      name: name.trim(),
      email: email.trim() || `${phone.trim()}@distributor.samtech.net`,
      phone: phone.trim(),
      role,
      pinCode: pinCode.trim() || '1234',
      active: true,
      totalInvoicesCreated: 0,
      totalPaymentsCollected: 0
    });

    setName('');
    setEmail('');
    setPhone('');
    setPinCode(Math.floor(1000 + Math.random() * 9000).toString());
    setShowAddForm(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCopyCredentials = (member: TeamMember) => {
    const text = `بيانات دخول موزع شبكة ${tenant.businessName}:\nالاسم: ${member.name}\nرقم الدخول / الهاتف: ${member.phone}\nرمز PIN السريع: ${member.pinCode}\nالرابط: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedPinId(member.id);
    setTimeout(() => setCopiedPinId(null), 2500);
  };

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      {/* Header & Overview */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            فريق العمل والموزعين الميدانيين (RBAC)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إدارة صلاحيات الموزعين الميدانيين، إنشاء حساباتهم ورموز الـ PIN لتسليم الكروت وتحصيل الدفعات من الجوال دون الوصول لإعدادات الشبكة الحساسة.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-900/30 transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          {showAddForm ? 'إلغاء الإضافة' : 'إضافة موزع جديد'}
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>تمت إضافة الموزع بنجاح وتفعيل حسابه الميداني!</span>
        </div>
      )}

      {/* Add New Member Drawer/Card */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="bg-slate-900 border border-sky-500/30 rounded-2xl p-5 shadow-xl space-y-4 text-xs">
          <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-sky-400" />
              بيانات الموزع / عضو الفريق الجديد
            </h3>
            <span className="text-[11px] text-sky-400 bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded-md">
              صلاحية موزع ميداني
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">اسم الموزع الرباعي *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="مثال: يحيى صالح الحرازي"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">رقم الهاتف / الواتساب *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="771234567"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">البريد الإلكتروني (اختياري)</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="distributor@example.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">رمز الدخول السريع (PIN Code) *</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={pinCode}
                  onChange={e => setPinCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-center tracking-widest text-base font-bold focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setPinCode(Math.floor(1000 + Math.random() * 9000).toString())}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] whitespace-nowrap"
                >
                  توليد PIN
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">يستخدمه الموزع لتسجيل الدخول السريع من هاتفه المحمول</p>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">مستوى الصلاحية (Role)</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="distributor">موزع ميداني (تسليم كروت، سندات قبض، نقاط البيع فقط)</option>
                <option value="owner">مدير شبكة كامل (كامل الصلاحيات والإعدادات)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-md shadow-emerald-900/30"
            >
              حفظ الموزع وتفعيل الصلاحية
            </button>
          </div>
        </form>
      )}

      {/* Team Members List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            قائمة الموزعين المسجلين في النظام ({team.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            الصلاحيات مفعلة وفق نظام عزل الأدوار
          </span>
        </div>

        {team.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p>لا يوجد موزعون مسجلون حالياً. أضف أول موزع ميداني الآن للبدء بتوزيع المهام.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {team.map(member => (
              <div
                key={member.id}
                className={`p-4 hover:bg-slate-800/30 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  !member.active ? 'opacity-60 bg-slate-950/40' : ''
                }`}
              >
                {/* Member Info */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 font-bold text-sm shrink-0">
                    {member.name.charAt(0)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{member.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          member.role === 'owner'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                            : 'bg-sky-950/60 text-sky-300 border-sky-500/30'
                        }`}
                      >
                        {member.role === 'owner' ? 'مدير شبكة' : 'موزع ميداني'}
                      </span>
                      {member.active ? (
                        <span className="text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                          نشط
                        </span>
                      ) : (
                        <span className="text-[10px] bg-rose-950/60 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded">
                          معطل
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      <div className="flex items-center gap-1 font-mono text-slate-300">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{member.phone}</span>
                      </div>
                      {member.email && (
                        <div className="flex items-center gap-1 font-mono text-slate-400">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{member.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                        <KeyRound className="w-3 h-3 text-amber-400" />
                        <span>PIN: {member.pinCode}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance & Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleCopyCredentials(member)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700"
                    title="نسخ بيانات الدخول للموزع لإرسالها بالواتساب"
                  >
                    {copiedPinId === member.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>بيانات الدخول</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onUpdateMember(member.id, { active: !member.active })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      member.active
                        ? 'bg-rose-950/40 hover:bg-rose-950 text-rose-300 border-rose-500/30'
                        : 'bg-emerald-950/40 hover:bg-emerald-950 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {member.active ? 'تعطيل' : 'تفعيل'}
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من حذف الموزع ${member.name}؟`)) {
                        onDeleteMember(member.id);
                      }
                    }}
                    className="p-2 text-slate-500 hover:text-rose-400 transition rounded-xl hover:bg-slate-800"
                    title="حذف الموزع"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Guide Explanation */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-2">
        <h4 className="font-bold text-slate-200 flex items-center gap-2">
          <Shield className="w-4 h-4 text-sky-400" />
          مقارنة الصلاحيات بين الأدوار (Role Permissions Matrix):
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-400">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="font-bold text-amber-300 block mb-1">👑 مدير الشبكة / المالك (Owner):</span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li>كامل صلاحيات النظام والتحكم المالي</li>
              <li>ربط المايكروتك ومزامنة المستخدمين</li>
              <li>استوديو تصميم الكروت وطباعة A4</li>
              <li>إدارة وتعديل الأسعار وإضافة الموزعين</li>
            </ul>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="font-bold text-sky-300 block mb-1">🛵 الموزع الميداني (Field Distributor):</span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li>واجهة ميدانية مخصصة للهواتف الذكية</li>
              <li>إنشاء سندات تسليم الكروت للبقالات</li>
              <li>تسجيل سندات القبض والتحصيل الميداني</li>
              <li>عرض قائمة البقالات ومواقعها وديونها فقط</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
