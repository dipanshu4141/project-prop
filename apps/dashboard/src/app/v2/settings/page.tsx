'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiGet, apiPatch } from '@/lib/api';
import {
  User, Lock, Building2, CreditCard,
  CheckCircle2, AlertCircle, Loader2,
  Eye, EyeOff, X, ChevronRight, ArrowRight,
  Zap, Shield, Star, Clock, XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';

/* ── Types ── */
interface SettingsData {
  user: {
    id:            string;
    name:          string | null;
    email:         string;
    phone:         string | null;
    avatarUrl:     string | null;
    emailVerified: boolean;
    hasPassword:   boolean;
    hasGoogle:     boolean;
    createdAt:     string;
  };
  workspace: {
    id:   string;
    name: string;
    slug: string;
    plan: string;
  };
  subscription: {
    status:                string;
    plan:                  string;
    trialEndsAt:           string | null;
    currentPeriodEnd?:     string | null;
    gatewaySubscriptionId?: string | null;
    isExpired?:            boolean;
  } | null;
}

interface SubscribeResponse {
  subscriptionId: string;
  keyId:          string;
}

/* ── Helpers ── */
function initials(name?: string | null, email?: string | null) {
  if (name) return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  if (email) return email[0].toUpperCase();
  return '?';
}

function daysLeft(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

/* ── Toast ── */
function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-medium text-white shadow-xl lg:bottom-8 whitespace-nowrap ${ok ? 'bg-emerald-600' : 'bg-red-500'}`}>
      {ok ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
      {msg}
    </div>
  );
}

/* ── Modal ── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

/* ── Field ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">{label}</label>
      {children}
    </div>
  );
}

/* ── Input ── */
function Input({ value, onChange, placeholder, type = 'text', disabled }: {
  value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input type={type} value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder} disabled={disabled}
      className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
}

/* ── Password input ── */
function PasswordInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 pr-10 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors"
      />
      <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/* ── Save button ── */
function SaveBtn({ loading, onClick, label = 'Save changes' }: { loading: boolean; onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="w-full h-10 rounded-xl bg-[#0B1F14] text-[13.5px] font-semibold text-white hover:bg-[#1A3525] disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {loading ? 'Saving…' : label}
    </button>
  );
}

/* ── Setting card ── */
function SettingCard({ icon: Icon, title, subtitle, onClick, badge }: {
  icon: any; title: string; subtitle: string; onClick: () => void; badge?: { label: string; color: string };
}) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-start gap-3 rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 text-left hover:border-slate-300 hover:shadow-md transition-all active:scale-[0.98] w-full">
      <div className="flex items-center justify-between w-full">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
          <Icon className="h-4.5 w-4.5 text-slate-600" style={{ width: 18, height: 18 }} />
        </div>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
            {badge.label}
          </span>
        )}
      </div>
      <div className="min-w-0 w-full">
        <p className="text-[13.5px] font-semibold text-slate-800">{title}</p>
        <p className="text-[11.5px] text-slate-400 mt-0.5 truncate">{subtitle}</p>
      </div>
    </button>
  );
}

const FEATURES = [
  'WhatsApp group auto-ingestion',
  'AI property deduplication',
  'Unlimited listings',
  'Client share portal',
  'Deal pipeline tracking',
  'Media uploads (photos & videos)',
  'Private group support',
  'Priority support',
];

/* ── Main ── */
export default function SettingsPage() {
  const router = useRouter();
  const [data,    setData]    = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState<string | null>(null);
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null);

  const [name,  setName]  = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [wsName, setWsName] = useState('');
  const [savingWs, setSavingWs] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw,  setSavingPw]  = useState(false);

  const [paying,     setPaying]     = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled,  setCancelled]  = useState(false);

  const showToast = (msg: string, ok = true) => setToast({ msg, ok });
  const closeModal = () => setModal(null);

  const loadData = useCallback(() => {
    apiGet<SettingsData>('/settings/me')
      .then(d => {
        setData(d);
        setName(d.user.name ?? '');
        setPhone(d.user.phone ?? '');
        setWsName(d.workspace.name ?? '');
      })
      .catch(() => showToast('Failed to load settings', false))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function saveProfile() {
    setSavingProfile(true);
    try {
      await apiPatch('/settings/profile', { name, phone: phone || undefined });
      showToast('Profile updated');
      setData(d => d ? { ...d, user: { ...d.user, name, phone } } : d);
      closeModal();
    } catch (e: any) {
      showToast(e.message ?? 'Failed', false);
    } finally { setSavingProfile(false); }
  }

  async function saveWorkspace() {
    setSavingWs(true);
    try {
      await apiPatch('/settings/workspace', { name: wsName });
      showToast('Workspace updated');
      setData(d => d ? { ...d, workspace: { ...d.workspace, name: wsName } } : d);
      closeModal();
    } catch (e: any) {
      showToast(e.message ?? 'Failed', false);
    } finally { setSavingWs(false); }
  }

  async function savePassword() {
    if (newPw !== confirmPw)  { showToast('Passwords do not match', false); return; }
    if (newPw.length < 8)     { showToast('Min 8 characters', false); return; }
    setSavingPw(true);
    try {
      await apiPatch('/settings/password', { currentPassword: currentPw, newPassword: newPw });
      showToast('Password updated');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      closeModal();
    } catch (e: any) {
      showToast(e.message ?? 'Failed', false);
    } finally { setSavingPw(false); }
  }

  const handleSubscribe = useCallback(async () => {
    setPaying(true);
    try {
      const res = await apiPost<SubscribeResponse>('/billing/subscribe', {});
      const rzp = new (window as any).Razorpay({
        key:             res.keyId,
        subscription_id: res.subscriptionId,
        name:            'GrowCliento',
        description:     'Pro Plan · ₹999/month',
        image:           '/icons/icon-512.png',
        theme:           { color: '#0B1F14' },
        handler: async (response: any) => {
          try {
            await apiPost('/billing/verify', {
              razorpay_payment_id:      response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature:       response.razorpay_signature,
            });
            router.replace('/v2/dashboard');
          } catch {
            showToast('Payment verification failed. Contact support.', false);
            setPaying(false);
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.open();
    } catch (e: any) {
      showToast(e.message ?? 'Failed to initiate payment', false);
      setPaying(false);
    }
  }, [router]);

  const handleCancel = useCallback(async () => {
    if (!confirm('Cancel subscription? You keep access until the billing period ends.')) return;
    setCancelling(true);
    try {
      await apiPost('/billing/cancel', {});
      setCancelled(true);
      showToast('Subscription cancelled');
      loadData();
    } catch (e: any) {
      showToast(e.message ?? 'Failed to cancel', false);
    } finally { setCancelling(false); }
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data) return null;

  const sub        = data.subscription;
  const isActive   = sub?.status === 'ACTIVE';
  const isTrialing = sub?.status === 'TRIALING';
  const isHalted   = sub?.status === 'HALTED';
  const days       = daysLeft(sub?.trialEndsAt ?? null);
  const isExpired  = sub?.isExpired || (!isActive && !isTrialing && !isHalted);

  const subBadge = isActive
    ? { label: 'Active', color: 'bg-emerald-100 text-emerald-700' }
    : isTrialing
    ? { label: `${days}d left`, color: 'bg-amber-100 text-amber-700' }
    : { label: 'Expired', color: 'bg-red-100 text-red-600' };

  const subSubtitle = isActive
    ? sub?.currentPeriodEnd
      ? `Renews ${new Date(sub.currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
      : 'Pro plan active'
    : isTrialing
    ? `${days} day${days !== 1 ? 's' : ''} left in trial`
    : 'Tap to reactivate';

  return (
    <>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      <div className="min-h-screen bg-[#F7F5F0]">
        <div className="max-w-lg mx-auto px-4 pb-28 lg:pb-8">

          {/* ── HERO ── */}
          <div className="relative overflow-hidden rounded-b-3xl mb-6 px-5 pt-10 pb-8"
            style={{ background: 'linear-gradient(135deg, #0B1F14 0%, #1a3525 50%, #0B1F14 100%)' }}>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, #10b981, transparent)', animation: 'float1 6s ease-in-out infinite' }} />
              <div className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full opacity-15"
                style={{ background: 'radial-gradient(circle, #34d399, transparent)', animation: 'float2 8s ease-in-out infinite' }} />
              <div className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                }} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-[15px] font-bold text-white flex-shrink-0">
                  {initials(data.user.name, data.user.email)}
                </div>
                <div>
                  <p className="text-[15px] font-bold text-white">{data.user.name ?? data.user.email}</p>
                  <p className="text-[12px] text-white/50">{data.workspace.name}</p>
                </div>
              </div>
            </div>

            <style>{`
              @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(12px,-12px) scale(1.1)} }
              @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-10px,10px) scale(1.05)} }
            `}</style>
          </div>

          {/* ── CARDS GRID ── */}
          <div className="mb-6">
              <h1 className="text-[26px] font-bold leading-tight">Settings</h1>
              <p className="text-[13px] text-black/50 mt-1">Manage your account & workspace</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SettingCard
              icon={User} title="Profile"
              subtitle={data.user.name ?? 'Update your info'}
              onClick={() => setModal('profile')}
              badge={!data.user.emailVerified ? { label: 'Verify email', color: 'bg-amber-100 text-amber-700' } : undefined}
            />
            <SettingCard
              icon={Building2} title="Workspace"
              subtitle={data.workspace.name}
              onClick={() => setModal('workspace')}
            />
            <SettingCard
              icon={Lock} title="Security"
              subtitle={data.user.hasPassword ? 'Password set' : 'Set a password'}
              onClick={() => setModal('security')}
            />
            <SettingCard
              icon={CreditCard} title="Subscription"
              subtitle={subSubtitle}
            //   onClick={() => setModal('subscription')}
            onClick={() => router.push('/v2/subscription')}
              badge={subBadge}
            />
          </div>
        </div>
      </div>

      {/* ── PROFILE MODAL ── */}
      {modal === 'profile' && (
        <Modal title="Profile" onClose={closeModal}>
          <Field label="Full name">
            <Input value={name} onChange={setName} placeholder="Your name" />
          </Field>
          <Field label="Email address">
            <div className="relative">
              <Input value={data.user.email} disabled />
              {data.user.emailVerified
                ? <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                : <AlertCircle  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
              }
            </div>
            {!data.user.emailVerified && (
              <p className="text-[11.5px] text-amber-600 mt-1">Email not verified.</p>
            )}
          </Field>
          <Field label="Mobile number">
            <div className="flex">
              <span className="flex items-center px-3 h-10 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-[13px] text-slate-500 select-none">+91</span>
              <input type="tel" value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210" maxLength={10}
                className="flex-1 h-10 rounded-r-xl border border-slate-200 bg-slate-50 px-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors"
              />
            </div>
          </Field>
          <div className="flex items-center gap-2 py-2 border-t border-slate-100">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${data.user.hasGoogle ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
              {data.user.hasGoogle ? '✓ Google connected' : 'Google not linked'}
            </span>
          </div>
          <SaveBtn loading={savingProfile} onClick={saveProfile} />
        </Modal>
      )}

      {/* ── WORKSPACE MODAL ── */}
      {modal === 'workspace' && (
        <Modal title="Workspace" onClose={closeModal}>
          <Field label="Workspace name">
            <Input value={wsName} onChange={setWsName} placeholder="My workspace" />
          </Field>
          <Field label="Slug (cannot be changed)">
            <Input value={data.workspace.slug} disabled />
          </Field>
          <Field label="Plan">
            <Input value={data.workspace.plan} disabled />
          </Field>
          <SaveBtn loading={savingWs} onClick={saveWorkspace} label="Update workspace" />
        </Modal>
      )}

      {/* ── SECURITY MODAL ── */}
      {modal === 'security' && (
        <Modal title="Security" onClose={closeModal}>
          {data.user.hasGoogle && !data.user.hasPassword && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
              <p className="text-[12.5px] text-blue-700 font-medium">Signed in with Google</p>
              <p className="text-[11.5px] text-blue-500 mt-0.5">Set a password to also enable email login</p>
            </div>
          )}
          {data.user.hasPassword && (
            <Field label="Current password">
              <PasswordInput value={currentPw} onChange={setCurrentPw} placeholder="Current password" />
            </Field>
          )}
          <Field label="New password">
            <PasswordInput value={newPw} onChange={setNewPw} placeholder="Minimum 8 characters" />
          </Field>
          <Field label="Confirm new password">
            <PasswordInput value={confirmPw} onChange={setConfirmPw} placeholder="Repeat new password" />
          </Field>
          <SaveBtn loading={savingPw} onClick={savePassword} label="Update password" />
        </Modal>
      )}

      {/* ── SUBSCRIPTION MODAL ── */}
        {modal === 'subscription' && (
        <Modal title="Subscription" onClose={closeModal}>

            {/* Status card */}
            <div className={`rounded-xl p-4 ${isActive ? 'bg-emerald-50 border border-emerald-100' : isTrialing ? 'bg-amber-50 border border-amber-100' : 'bg-red-50 border border-red-100'}`}>
            <div className="flex items-center justify-between">
                <div>
                <p className="text-[14px] font-bold text-slate-800">GrowCliento Pro</p>
                <p className="text-[12px] text-slate-500 mt-0.5">₹999/month · GST inclusive</p>
                <p className="text-[11.5px] text-slate-400 mt-1">{subSubtitle}</p>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${subBadge.color}`}>
                {subBadge.label}
                </span>
            </div>
            </div>

            {/* Redirect to full page */}
            <Link href="/v2/subscription" onClick={closeModal}
            className="flex items-center justify-between w-full h-11 rounded-xl bg-[#0B1F14] px-4 text-[13.5px] font-semibold text-white hover:bg-[#1A3525] transition-colors">
            <span>{isActive ? 'Manage subscription' : isTrialing ? 'Upgrade to Pro' : 'Reactivate subscription'}</span>
            <ArrowRight className="h-4 w-4" />
            </Link>

            <p className="text-center text-[11.5px] text-slate-400">
            You'll be taken to the full subscription page
            </p>
        </Modal>
        )}

      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
    </>
  );
}