"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Building2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { apiPost, apiGet } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

type InviteInfo = {
  id:        string;
  email:     string;
  role:      string;
  expiresAt: string;
  workspace: { name: string; type: string };
  invitedBy: { name: string | null; email: string };
};

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { user }     = useAuth();

  const token = searchParams.get("token");

  const [invite,     setInvite]     = useState<InviteInfo | null>(null);
  const [loadError,  setLoadError]  = useState("");
  const [accepting,  setAccepting]  = useState(false);
  const [accepted,   setAccepted]   = useState(false);
  const [acceptError, setAcceptError] = useState("");

  /* ── Load invite info ── */
  useEffect(() => {
    if (!token) { setLoadError("No invite token provided."); return; }

    apiGet<InviteInfo>(`/invites/info?token=${token}`)
      .then(setInvite)
      .catch((err) => setLoadError(err.message ?? "Invalid or expired invite link."));
  }, [token]);

  /* ── Accept ── */
  async function handleAccept() {
    if (!token) return;
    setAcceptError("");
    setAccepting(true);

    try {
      const result = await apiPost<{ workspaceId: string; workspaceName: string; role: string }>(
        "/invites/accept",
        { token },
      );
      setAccepted(true);

      // Redirect to dashboard after a short delay
      setTimeout(() => router.replace("/v2/dashboard"), 2000);
    } catch (err: any) {
      setAcceptError(err.message ?? "Failed to accept invite.");
    } finally {
      setAccepting(false);
    }
  }

  /* ── UI states ── */

  const isLoading = !invite && !loadError;

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-slate-900">
            Property CRM
          </span>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-8">

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400 mb-3" />
              <p className="text-[13.5px] text-slate-500">Loading invite…</p>
            </div>
          )}

          {/* Error loading */}
          {loadError && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-[17px] font-bold text-slate-900 mb-1">Invalid invite</h2>
              <p className="text-[13px] text-slate-500 mb-6">{loadError}</p>
              <Link href="/login" className="text-[13.5px] font-semibold text-slate-800 hover:underline">
                Go to login →
              </Link>
            </div>
          )}

          {/* Accepted */}
          {accepted && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <h2 className="text-[17px] font-bold text-slate-900 mb-1">You're in!</h2>
              <p className="text-[13px] text-slate-500">
                Redirecting to your dashboard…
              </p>
            </div>
          )}

          {/* Invite details */}
          {invite && !accepted && (
            <>
              <div className="mb-6">
                <h1 className="text-[20px] font-bold text-slate-900 mb-1">
                  You've been invited
                </h1>
                <p className="text-[13.5px] text-slate-500 leading-relaxed">
                  <strong className="text-slate-800">{invite.invitedBy.name ?? invite.invitedBy.email}</strong>
                  {" "}has invited you to join{" "}
                  <strong className="text-slate-800">{invite.workspace.name}</strong>
                  {" "}as a <strong className="text-slate-800">{invite.role.toLowerCase()}</strong>.
                </p>
              </div>

              {/* Workspace info */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B1F14]">
                    <Building2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-slate-900">{invite.workspace.name}</p>
                    <p className="text-[12px] text-slate-500">{invite.workspace.type} account</p>
                  </div>
                </div>
              </div>

              {/* Not logged in as the right user */}
              {user && user.email.toLowerCase() !== invite.email.toLowerCase() && (
                <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                  <p className="text-[12.5px] text-amber-800">
                    This invite was sent to <strong>{invite.email}</strong>.
                    You're logged in as <strong>{user.email}</strong>.
                    Please log in with the correct account.
                  </p>
                </div>
              )}

              {/* Not logged in */}
              {!user && (
                <div className="mb-4 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                  <p className="text-[12.5px] text-slate-700">
                    You need to{" "}
                    <Link href={`/register?email=${encodeURIComponent(invite.email)}&from=/invites/accept?token=${token}`}
                      className="font-semibold text-emerald-700 hover:underline">
                      create an account
                    </Link>
                    {" "}or{" "}
                    <Link href={`/login?from=/invites/accept?token=${token}`}
                      className="font-semibold text-slate-800 hover:underline">
                      sign in
                    </Link>
                    {" "}with <strong>{invite.email}</strong> to accept this invite.
                  </p>
                </div>
              )}

              {acceptError && (
                <p className="mb-4 text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {acceptError}
                </p>
              )}

              <button
                onClick={handleAccept}
                disabled={
                  accepting ||
                  !user ||
                  user.email.toLowerCase() !== invite.email.toLowerCase()
                }
                className="w-full h-11 rounded-lg bg-[#0B1F14] text-[14px] font-semibold text-white hover:bg-[#1A3525] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {accepting && <Loader2 className="h-4 w-4 animate-spin" />}
                {accepting ? "Joining…" : `Join ${invite.workspace.name}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}