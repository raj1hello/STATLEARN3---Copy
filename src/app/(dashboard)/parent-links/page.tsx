"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { parentLinksApi, ParentLinkItem } from "@/lib/api/client";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/components/parent/parentShared";
import { UserCheck, UserX, Loader2, ShieldCheck, UserPlus, Link2, X } from "lucide-react";

/**
 * Learner-facing "Parent & Guardian Connections" page.
 *
 * Allows a learner to:
 * 1. Send connection requests to their Parent/Guardian by entering their account email.
 * 2. Review and Accept/Decline incoming connection requests sent by parents.
 * 3. Track active, pending, and past connections with full revocation capability.
 */

function RequestStatusBadge({
  status,
  requestedBy,
}: {
  status: ParentLinkItem["status"];
  requestedBy?: string;
}) {
  if (status === "active") return <Badge variant="emerald">Linked</Badge>;
  if (status === "pending") {
    if (requestedBy === "learner") {
      return <Badge variant="amber">Awaiting Parent Approval</Badge>;
    }
    return <Badge variant="amber">Awaiting Your Approval</Badge>;
  }
  if (status === "rejected") return <Badge variant="red">Declined</Badge>;
  return <Badge variant="slate">Revoked</Badge>;
}

export default function ParentLinksPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<ParentLinkItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Send request form state
  const [parentEmail, setParentEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await parentLinksApi.list();
    if (res.success && res.data) {
      setRequests(res.data.requests || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && user && user.role !== "learner" && user.role !== "admin") {
      router.replace("/dashboard");
    }
    if (!authLoading && user) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, router]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentEmail.trim()) return;

    setSubmitting(true);
    setStatusMsg(null);

    const res = await parentLinksApi.request(parentEmail.trim());
    setSubmitting(false);

    if (res.success) {
      setStatusMsg({
        kind: "ok",
        text: "Connection request sent! Your parent/guardian must accept it from their account to complete the link.",
      });
      setParentEmail("");
      await load();
    } else {
      setStatusMsg({
        kind: "error",
        text: res.error?.message || "Failed to send the connection request.",
      });
    }
  };

  const handleRespond = async (id: string, status: "accepted" | "rejected") => {
    setBusyId(id);
    const res = await parentLinksApi.respond(id, status);
    setBusyId(null);
    if (res.success) {
      await load();
    }
  };

  const handleRevoke = async (id: string) => {
    setBusyId(id);
    const res = await parentLinksApi.revoke(id);
    setBusyId(null);
    if (res.success) {
      await load();
    }
  };

  if (authLoading || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <Card className="p-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </Card>
      </div>
    );
  }

  // Incoming requests waiting for Learner's approval
  const incomingPending = requests.filter(
    (r) => r.status === "pending" && r.requestedBy !== "learner"
  );

  // Outgoing requests sent by Learner waiting for Parent's approval
  const outgoingPending = requests.filter(
    (r) => r.status === "pending" && r.requestedBy === "learner"
  );

  // Active / Established links
  const activeLinks = requests.filter((r) => r.status === "active");

  // Past / History (rejected or revoked)
  const historyLinks = requests.filter(
    (r) => r.status === "rejected" || r.status === "revoked"
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Parent &amp; Guardian Connections
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Connect your parent or guardian to grant them read-only visibility into your learning report card, competencies, and study progress.
        </p>
      </div>

      {/* Send Connection Request Form */}
      <Card className="p-6">
        <CardHeader
          title="Send Parent / Guardian Connection Request"
          subtitle="Enter your parent or guardian's registered account email to request a link"
          icon={<UserPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
        />
        <form onSubmit={handleSendRequest} className="mt-4 space-y-3 max-w-xl">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="email"
              required
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              placeholder="parent@example.com"
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161828] px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={submitting || !parentEmail.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Send Request
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your parent or guardian will receive the request in their portal and can accept it to link accounts.
          </p>
        </form>

        {statusMsg && (
          <div
            className={`mt-4 text-sm rounded-xl px-4 py-3 border ${
              statusMsg.kind === "ok"
                ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60"
                : "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60"
            }`}
          >
            {statusMsg.text}
          </div>
        )}
      </Card>

      {/* Incoming Requests Awaiting Learner Approval */}
      {incomingPending.length > 0 && (
        <Card className="p-6 border-amber-200 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10">
          <CardHeader
            title="Incoming Requests Awaiting Your Approval"
            subtitle="The following parents have requested access to your learning reports"
            icon={<ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          />
          <div className="mt-4 space-y-3">
            {incomingPending.map((r) => (
              <div
                key={r.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-200/70 dark:border-amber-900/50 bg-white dark:bg-slate-900/50 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {r.parentName || "Parent / Guardian"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {r.parentEmail}
                    {r.createdAt ? ` · requested ${formatDate(r.createdAt)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleRespond(r.id, "accepted")}
                    disabled={busyId === r.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {busyId === r.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )}
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespond(r.id, "rejected")}
                    disabled={busyId === r.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                  >
                    {busyId === r.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserX className="w-3.5 h-3.5" />
                    )}
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Outgoing Requests Awaiting Parent Approval */}
      {outgoingPending.length > 0 && (
        <Card className="p-6">
          <CardHeader
            title="Sent Connection Requests"
            subtitle="Waiting for parent/guardian confirmation"
            icon={<Link2 className="w-5 h-5 text-indigo-500" />}
          />
          <div className="mt-4 space-y-3">
            {outgoingPending.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                    {r.parentName || r.parentEmail}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {r.parentEmail}
                    {r.createdAt ? ` · sent ${formatDate(r.createdAt)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <RequestStatusBadge status={r.status} requestedBy={r.requestedBy} />
                  <button
                    onClick={() => handleRevoke(r.id)}
                    disabled={busyId === r.id}
                    title="Cancel request"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Active Connected Parents */}
      <Card className="p-6">
        <CardHeader
          title="Active Parent / Guardian Connections"
          subtitle="Guardians with current read-only access to your learning progress"
          icon={<ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
        />
        {loading ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : activeLinks.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
            No active parent connections. Send a request using the form above.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {activeLinks.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/20"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                    {r.parentName || "Parent / Guardian"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {r.parentEmail}
                    {r.respondedAt || r.createdAt
                      ? ` · connected ${formatDate(r.respondedAt || r.createdAt)}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="emerald">Connected</Badge>
                  <button
                    onClick={() => handleRevoke(r.id)}
                    disabled={busyId === r.id}
                    title="Revoke access"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer text-xs font-semibold"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Previous / Past Connections */}
      {historyLinks.length > 0 && (
        <Card className="p-6">
          <CardHeader
            title="Past &amp; Declined Requests"
            subtitle="History of previous connection activities"
          />
          <div className="mt-4 space-y-3">
            {historyLinks.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs text-slate-700 dark:text-slate-300 truncate">
                    {r.parentName || r.parentEmail}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {r.parentEmail}
                    {r.revokedAt
                      ? ` · revoked ${formatDate(r.revokedAt)}`
                      : r.respondedAt
                      ? ` · ${formatDate(r.respondedAt)}`
                      : ""}
                  </p>
                </div>
                <RequestStatusBadge status={r.status} requestedBy={r.requestedBy} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
