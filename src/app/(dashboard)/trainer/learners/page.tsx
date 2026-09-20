"use client";

import React, { useState, useEffect } from "react";
import { trainerLearnersApi, connectionsApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { AssignContentModal } from "@/components/trainer/AssignContentModal";
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Eye,
  AlertCircle,
  MessageSquare,
  Search,
  Calendar,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function TrainerLearnersPage() {
  const [activeTab, setActiveTab] = useState<"learners" | "requests">("learners");
  const [learners, setLearners] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  // Assign modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedLearnerForAssign, setSelectedLearnerForAssign] = useState<{
    id: string;
    name: string;
  } | undefined>(undefined);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [learnersRes, reqRes] = await Promise.all([
        trainerLearnersApi.list(),
        connectionsApi.list("pending"),
      ]);

      if (learnersRes.success && learnersRes.data) {
        setLearners(learnersRes.data.learners || []);
      }
      if (reqRes.success && reqRes.data) {
        setPendingRequests(reqRes.data.connections || []);
      }
    } catch {
      setError("An unexpected error occurred while loading learner connections");
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (connectionId: string, status: "accepted" | "rejected") => {
    try {
      setError(null);
      setActionSuccess(null);
      const res = await connectionsApi.respond(connectionId, status);
      if (res.success) {
        setActionSuccess(`Request ${status === "accepted" ? "accepted! Learner added to My Learners" : "declined"}.`);
        loadData();
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        setError(res.error?.message || "Failed to respond to request");
      }
    } catch {
      setError("An unexpected error occurred");
    }
  };

  const filteredLearners = learners.filter((l) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.stream?.toLowerCase().includes(q) ||
      l.skills?.some((s: string) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>My Learners & Requests</span>
            <Badge variant="purple" size="sm">
              Trainer Studio
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your connected learners, review mentorship requests, and assign diagnostic content
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedLearnerForAssign(undefined);
            setAssignModalOpen(true);
          }}
          className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold px-4 flex items-center gap-2"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Assign Content</span>
        </Button>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("learners")}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === "learners"
              ? "border-purple-600 text-purple-600 dark:text-purple-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Connected Learners</span>
          <Badge variant={activeTab === "learners" ? "purple" : "slate"} size="sm">
            {learners.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab("requests")}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === "requests"
              ? "border-purple-600 text-purple-600 dark:text-purple-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Requests</span>
          {pendingRequests.length > 0 && (
            <Badge variant="amber" size="sm">
              {pendingRequests.length} new
            </Badge>
          )}
        </button>
      </div>

      {/* TAB 1: CONNECTED LEARNERS */}
      {activeTab === "learners" && (
        <div className="space-y-4">
          {/* Search filter */}
          {learners.length > 0 && (
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by name, stream, or skill..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-white dark:bg-[#11131f] border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
              />
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : filteredLearners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLearners.map((learner) => (
                <Card
                  key={learner.learnerId}
                  className="p-6 flex flex-col justify-between hover:border-purple-300 dark:hover:border-purple-800/80 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm">
                          {learner.name?.charAt(0)?.toUpperCase() || "L"}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {learner.name}
                          </h3>
                          <p className="text-[11px] text-slate-400">{learner.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                      {learner.stream && (
                        <p className="text-[11px]">
                          <span className="text-slate-400">Stream:</span>{" "}
                          <span className="capitalize font-medium text-purple-600 dark:text-purple-400">
                            {learner.stream}
                          </span>
                        </p>
                      )}
                      {learner.designation && (
                        <p className="text-[11px]">
                          <span className="text-slate-400">Role:</span> {learner.designation}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Connected {new Date(learner.connectedAt).toLocaleDateString()}
                        </span>
                      </p>
                    </div>

                    {learner.skills && learner.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {learner.skills.slice(0, 3).map((skill: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <Link
                      href={`/trainer/learners/${learner.learnerId}`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        className="w-full rounded-xl text-xs font-semibold py-2 flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Profile</span>
                      </Button>
                    </Link>

                    <Button
                      onClick={() => {
                        setSelectedLearnerForAssign({
                          id: learner.learnerId,
                          name: learner.name,
                        });
                        setAssignModalOpen(true);
                      }}
                      className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold py-2 px-3 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Assign</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                No Connected Learners Yet
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Learners can search for you and send connection requests. You will see pending requests in the next tab.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: PENDING REQUESTS */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {loading ? (
            <CardSkeleton />
          ) : pendingRequests.length > 0 ? (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <Card
                  key={req._id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-amber-200 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-sm">
                        {req.learnerName?.charAt(0)?.toUpperCase() || "L"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {req.learnerName}
                          </h3>
                          <Badge variant="amber" size="sm">
                            Pending Approval
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-400">{req.learnerEmail}</p>
                      </div>
                    </div>

                    {req.requestMessage && (
                      <div className="p-3 rounded-xl bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 max-w-xl">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                        <span>&quot;{req.requestMessage}&quot;</span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                      {req.learnerStream && (
                        <span>
                          Stream: <strong className="text-slate-600 dark:text-slate-300">{req.learnerStream}</strong>
                        </span>
                      )}
                      <span>
                        Requested {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center">
                    <Button
                      onClick={() => handleRespond(req._id, "rejected")}
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900/60"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </Button>
                    <Button
                      onClick={() => handleRespond(req._id, "accepted")}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold px-4 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accept Learner</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                No Pending Requests
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                You have handled all incoming connection requests. New requests from learners will appear here.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Unified Assign Content Modal */}
      <AssignContentModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onSuccess={() => {
          setActionSuccess("Content assigned successfully!");
          loadData();
        }}
        preselectedLearner={selectedLearnerForAssign}
      />
    </div>
  );
}
