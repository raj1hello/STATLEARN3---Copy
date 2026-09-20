"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { parentLinksApi, ParentLinkItem } from "@/lib/api/client";
import { formatDate } from "@/components/parent/parentShared";
import { Link2, UserPlus, Loader2, X } from "lucide-react";

/**
 * "Link Learner" action for the Parent / Guardian Portal.
 *
 * Opens a modal where a parent can:
 *   - request a new link by entering the learner's account email (the request
 *     is created as `pending`; the learner must confirm before it activates);
 *   - see every link they own (pending / active / rejected / revoked) and
 *     cancel a pending request or revoke an active link.
 *
 * It reads and writes exclusively through /api/parent/links, which enforces
 * role + ownership server-side. After a link activates the parent report
 * provider is refreshed so the new learner appears immediately.
 */

function LinkStatusBadge({ status, requestedBy }: { status: ParentLinkItem["status"], requestedBy?: string }) {
  if (status === "active") return <Badge variant="emerald">Active</Badge>;
  if (status === "pending") {
    if (requestedBy === "learner") return <Badge variant="amber">Awaiting your approval</Badge>;
    return <Badge variant="amber">Awaiting learner</Badge>;
  }
  if (status === "rejected") return <Badge variant="red">Declined</Badge>;
  return <Badge variant="slate">Revoked</Badge>;
}

interface LinkedLearnersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLinked: () => void; // called after an active link changes so the parent can refresh
}

export function LinkedLearnersModal({ isOpen, onClose, onLinked }: LinkedLearnersModalProps) {
  const [links, setLinks] = useState<ParentLinkItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await parentLinksApi.list();
    if (res.success && res.data) {
      setLinks(res.data.links || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStatusMsg(null);
      setEmail("");
      load();
    }
  }, [isOpen, load]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setStatusMsg(null);
    const res = await parentLinksApi.request(email);
    setSubmitting(false);
    if (res.success) {
      const active = res.data?.status === "active";
      setStatusMsg({
        kind: "ok",
        text: active
          ? "Learner linked successfully."
          : "Link request sent. The learner must confirm it from their account before the link becomes active.",
      });
      setEmail("");
      await load();
      if (active) onLinked();
    } else {
      setStatusMsg({ kind: "error", text: res.error?.message || "Failed to send the link request." });
    }
  };

  const handleRevoke = async (id: string) => {
    const res = await parentLinksApi.revoke(id);
    if (res.success) {
      await load();
      onLinked();
    } else {
      setStatusMsg({ kind: "error", text: res.error?.message || "Failed to remove the link." });
    }
  };

  const handleRespond = async (id: string, status: "accepted" | "rejected") => {
    setSubmitting(true);
    setStatusMsg(null);
    const res = await parentLinksApi.respond(id, status);
    setSubmitting(false);
    if (res.success) {
      await load();
      if (status === "accepted") onLinked();
    } else {
      setStatusMsg({ kind: "error", text: res.error?.message || "Failed to respond." });
    }
  };

  const pendingCount = links.filter((l) => l.status === "pending").length;
  const activeCount = links.filter((l) => l.status === "active").length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Linked Learners" maxWidth="max-w-lg">
      {/* New link request */}
      <form onSubmit={handleRequest} className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Link a learner by their account email
          </span>
          <div className="mt-1.5 flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="learner@example.com"
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161828] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={submitting || !email.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Send
            </button>
          </div>
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The learner must approve the request from their account before you can
          see their report.
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

      {/* Existing links */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Link2 className="w-4 h-4 text-purple-500" />
            Your links
          </h4>
          {!loading && (activeCount > 0 || pendingCount > 0) && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {activeCount} active{pendingCount > 0 ? ` · ${pendingCount} awaiting learner` : ""}
            </span>
          )}
        </div>

        <div className="mt-2 space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">Loading…</p>
          ) : links.length === 0 ? (
            <div className="text-center py-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No learners linked yet. Enter an email above to get started.
              </p>
            </div>
          ) : (
            links.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">
                    {l.learnerName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {l.learnerEmail}
                    {l.learnerStream ? ` · ${l.learnerStream}` : ""}
                    {l.respondedAt || l.createdAt ? ` · ${formatDate(l.respondedAt || l.createdAt)}` : ""}
                  </p>
                </div>
                <LinkStatusBadge status={l.status} requestedBy={l.requestedBy} />
                {l.status === "pending" && l.requestedBy === "learner" ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRespond(l.id, "accepted")}
                      disabled={submitting}
                      className="px-2 py-1 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespond(l.id, "rejected")}
                      disabled={submitting}
                      className="px-2 py-1 text-xs font-semibold rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  (l.status === "pending" || l.status === "active") && (
                    <button
                      onClick={() => handleRevoke(l.id)}
                      title={l.status === "pending" ? "Cancel request" : "Revoke link"}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
