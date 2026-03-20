"use client";

import { useEffect, useState } from "react";
import {
  UserPlus, Trash2, ChevronDown, Mail,
  Clock, CheckCircle2, XCircle, Loader2,
} from "lucide-react";
import { PageContainer } from "@/components/v2/layout/PageContainer";
import { PageHeader } from "@/components/v2/layout/PageHeader";
import { apiGet, apiPost, apiDel, apiPatch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */

type Member = {
  memberId:     string;
  role:         "OWNER" | "BROKER" | "VIEWER";
  joinedAt:     string;
  lastActiveAt: string | null;
  user: {
    id:       string;
    email:    string;
    name:     string | null;
    isActive: boolean;
  };
};

type Invite = {
  id:        string;
  email:     string;
  role:      string;
  expiresAt: string;
  createdAt: string;
  invitedBy: { name: string | null; email: string };
};

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

function initials(name?: string | null, email?: string) {
  if (name) return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (email ?? "?")[0].toUpperCase();
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function relativeTime(iso: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const ROLE_BADGE: Record<string, string> = {
  OWNER:  "bg-violet-100 text-violet-700",
  BROKER: "bg-sky-100 text-sky-700",
  VIEWER: "bg-slate-100 text-slate-600",
};

/* ------------------------------------------------------------------ */
/* INVITE MODAL                                                        */
/* ------------------------------------------------------------------ */

function InviteModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [email,   setEmail]   = useState("");
  const [role,    setRole]    = useState<"BROKER" | "VIEWER">("BROKER");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [done,    setDone]    = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiPost<{ inviteUrl: string }>("/team/invites", { email, role });
      setInviteUrl(res.inviteUrl);
      setDone(true);
      onSent();
    } catch (err: any) {
      setError(err.message ?? "Failed to send invite");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-[16px] font-bold text-slate-900">Invite team member</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors text-lg leading-none">×</button>
        </div>

        {!done ? (
          <form onSubmit={handleSend} className="p-6 space-y-4">
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="broker@example.com"
                required
                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13.5px] text-slate-700 focus:outline-none focus:border-slate-400"
              >
                <option value="BROKER">Broker — can manage own leads and properties</option>
                <option value="VIEWER">Viewer — read-only access</option>
              </select>
            </div>

            {error && (
              <p className="text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 h-10 rounded-lg border border-slate-200 text-[13.5px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 h-10 rounded-lg bg-[#0B1F14] text-[13.5px] font-semibold text-white hover:bg-[#1A3525] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Sending…" : "Send invite"}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-[15px] font-semibold text-slate-900 mb-1">Invite sent!</p>
            <p className="text-[13px] text-slate-500 mb-4">
              An invite link was sent to <strong>{email}</strong>.
            </p>

            {/* Dev helper — copy link */}
            {inviteUrl && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-left mb-4">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  🛠 Dev — invite link
                </p>
                <p className="text-[12px] text-slate-700 break-all">{inviteUrl}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(inviteUrl)}
                  className="mt-2 text-[11.5px] text-emerald-700 font-medium hover:underline"
                >
                  Copy link
                </button>
              </div>
            )}

            <button onClick={onClose}
              className="w-full h-10 rounded-lg bg-[#0B1F14] text-[13.5px] font-semibold text-white hover:bg-[#1A3525] transition-colors">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */

export default function TeamPage() {
  const { user } = useAuth();
  const isOwner  = (user as any)?.role === "OWNER";

  const [members,  setMembers]  = useState<Member[]>([]);
  const [invites,  setInvites]  = useState<Invite[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [removing,  setRemoving] = useState<string | null>(null);
  const [revoking,  setRevoking] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [m, i] = await Promise.all([
      apiGet<Member[]>("/team/members").catch(() => []),
      isOwner ? apiGet<Invite[]>("/team/invites").catch(() => []) : Promise.resolve([]),
    ]);
    setMembers(m);
    setInvites(i);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleRemove(memberId: string) {
    if (!confirm("Remove this member? They will lose access immediately.")) return;
    setRemoving(memberId);
    try {
      await apiDel(`/team/members/${memberId}`);
      setMembers((prev) => prev.filter((m) => m.memberId !== memberId));
    } catch (e: any) { alert(e.message); }
    setRemoving(null);
  }

  async function handleRevokeInvite(inviteId: string) {
    setRevoking(inviteId);
    try {
      await apiDel(`/team/invites/${inviteId}`);
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    } catch (e: any) { alert(e.message); }
    setRevoking(null);
  }

  async function handleRoleChange(memberId: string, role: string) {
    try {
      await apiPatch(`/team/members/${memberId}/role`, { role });
      setMembers((prev) =>
        prev.map((m) => m.memberId === memberId ? { ...m, role: role as any } : m)
      );
    } catch (e: any) { alert(e.message); }
  }

  return (
    <PageContainer className="bg-[#F7F5F0]">
      <PageHeader
        title="Team"
        actions={
          isOwner ? (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-[9px] bg-[#0B1F14] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#1A3525] hover:shadow-md hover:-translate-y-[1px]"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500">
                <UserPlus className="h-3 w-3 text-white" />
              </span>
              Invite broker
            </button>
          ) : undefined
        }
      />

      {/* ── MEMBERS ── */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <p className="text-[13px] font-semibold text-slate-800">Members</p>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
            {members.length}
          </span>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="h-9 w-9 rounded-full bg-slate-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded bg-slate-100" />
                  <div className="h-2.5 w-48 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {members.map((m) => {
              const isSelf = m.user.id === (user as any)?.id;
              return (
                <div key={m.memberId} className="flex items-center gap-4 px-5 py-3.5">
                  {/* Avatar */}
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">
                    {initials(m.user.name, m.user.email)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13.5px] font-semibold text-slate-800 truncate">
                        {m.user.name ?? m.user.email}
                        {isSelf && <span className="ml-1 text-[11px] text-slate-400">(you)</span>}
                      </p>
                      <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${ROLE_BADGE[m.role]}`}>
                        {m.role}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-400 truncate">
                      {m.user.email} · Last active {relativeTime(m.lastActiveAt)}
                    </p>
                  </div>

                  {/* Actions — owner only, not self */}
                  {isOwner && !isSelf && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Role selector */}
                      <div className="relative">
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.memberId, e.target.value)}
                          className="h-7 pl-2 pr-6 rounded-lg border border-slate-200 bg-white text-[12px] text-slate-700 appearance-none focus:outline-none focus:border-slate-400 cursor-pointer"
                        >
                          <option value="OWNER">Owner</option>
                          <option value="BROKER">Broker</option>
                          <option value="VIEWER">Viewer</option>
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemove(m.memberId)}
                        disabled={removing === m.memberId}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-600 transition-all"
                        title="Remove member"
                      >
                        {removing === m.memberId
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2   className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── PENDING INVITES ── */}
      {isOwner && (
        <div className="mt-5 rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <p className="text-[13px] font-semibold text-slate-800">Pending invites</p>
            {invites.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                {invites.length}
              </span>
            )}
          </div>

          {invites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Mail className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-[13px] font-medium text-slate-600">No pending invites</p>
              <p className="text-[12px] text-slate-400 mt-0.5">
                Invited brokers will appear here until they accept.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-700">
                    {inv.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13.5px] font-semibold text-slate-800 truncate">{inv.email}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${ROLE_BADGE[inv.role] ?? "bg-slate-100 text-slate-600"}`}>
                        {inv.role}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-400">
                      <Clock className="inline h-3 w-3 mr-0.5" />
                      Expires {fmt(inv.expiresAt)} · Invited by {inv.invitedBy.name ?? inv.invitedBy.email}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRevokeInvite(inv.id)}
                    disabled={revoking === inv.id}
                    className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-slate-200 text-[12px] text-slate-500 hover:border-red-300 hover:text-red-600 transition-all flex-shrink-0"
                  >
                    {revoking === inv.id
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <XCircle  className="h-3 w-3" />}
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <InviteModal
          onClose={() => setShowModal(false)}
          onSent={() => { load(); }}
        />
      )}
    </PageContainer>
  );
}