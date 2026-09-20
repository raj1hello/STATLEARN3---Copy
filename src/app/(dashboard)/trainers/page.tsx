"use client";

import React, { useState, useEffect } from "react";
import { trainersApi, connectionsApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import {
  GraduationCap,
  Search,
  UserCheck,
  Clock,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  BookOpen,
} from "lucide-react";

export default function LearnerTrainersPage() {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request modal state
  const [selectedTrainer, setSelectedTrainer] = useState<any | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (query = "") => {
    try {
      setLoading(true);
      setError(null);
      const [trainersRes, connRes] = await Promise.all([
        trainersApi.list(query),
        connectionsApi.list(),
      ]);

      if (trainersRes.success && trainersRes.data) {
        setTrainers(trainersRes.data.trainers || []);
      } else {
        setError(trainersRes.error?.message || "Failed to load trainers");
      }

      if (connRes.success && connRes.data) {
        setMyRequests(connRes.data.connections || []);
      }
    } catch {
      setError("An unexpected error occurred while loading trainers");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(searchQuery);
  };

  const handleOpenConnectModal = (trainer: any) => {
    setSelectedTrainer(trainer);
    setRequestMessage("");
    setRequestSuccess(null);
    setError(null);
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainer) return;

    try {
      setSendingRequest(true);
      setError(null);
      const res = await connectionsApi.request(selectedTrainer.userId, requestMessage);

      if (res.success) {
        setRequestSuccess("Connection request sent successfully!");
        // Update local status
        setTrainers((prev) =>
          prev.map((t) =>
            t.userId === selectedTrainer.userId
              ? { ...t, connectionStatus: "pending" }
              : t
          )
        );
        setTimeout(() => {
          setSelectedTrainer(null);
          loadData(searchQuery);
        }, 1200);
      } else {
        setError(res.error?.message || "Failed to send connection request");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Find & Connect with Trainers</span>
            <Badge variant="purple" size="sm">
              Mentorship
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Connect with domain trainers to receive diagnostic assessments, targeted quizzes, and study notes
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search trainers by name or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
            />
          </div>
          <Button
            type="submit"
            className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold px-5"
          >
            Search
          </Button>
        </form>
      </Card>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Trainers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : trainers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainers.map((t) => (
            <Card
              key={t.userId}
              className="p-6 flex flex-col justify-between hover:border-purple-300 dark:hover:border-purple-800/80 transition shadow-sm"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm">
                      {t.name?.charAt(0)?.toUpperCase() || "T"}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {t.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {t.designation || "Statistical Trainer"}
                      </p>
                    </div>
                  </div>

                  {t.connectionStatus === "accepted" && (
                    <Badge variant="emerald" size="sm" className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      <span>Connected</span>
                    </Badge>
                  )}
                  {t.connectionStatus === "pending" && (
                    <Badge variant="amber" size="sm" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Pending</span>
                    </Badge>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {t.department && (
                    <p className="text-[11px]">
                      <span className="text-slate-400">Dept:</span> {t.department}
                    </p>
                  )}
                  {t.stream && (
                    <p className="text-[11px]">
                      <span className="text-slate-400">Stream:</span>{" "}
                      <span className="capitalize">{t.stream}</span>
                    </p>
                  )}
                  {t.experience && (
                    <p className="text-[11px]">
                      <span className="text-slate-400">Experience:</span> {t.experience} years
                    </p>
                  )}
                </div>

                {t.existingSkills && t.existingSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {t.existingSkills.slice(0, 4).map((skill: string, idx: number) => (
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

              <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800/80">
                {t.connectionStatus === "accepted" ? (
                  <div className="text-center py-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Trainer Connected</span>
                  </div>
                ) : t.connectionStatus === "pending" ? (
                  <Button
                    disabled
                    variant="outline"
                    className="w-full rounded-xl text-xs font-semibold py-2 opacity-70 cursor-not-allowed"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Request Sent (Pending)</span>
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleOpenConnectModal(t)}
                    className="w-full bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold py-2 flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Connection Request</span>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center space-y-3">
          <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            No Trainers Found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query or check back later once trainers join the platform.
          </p>
        </Card>
      )}

      {/* Connection Request Modal */}
      {selectedTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#11131f] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Connect with {selectedTrainer.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Send a personalized message with your request
                </p>
              </div>
              <button
                onClick={() => setSelectedTrainer(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {requestSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{requestSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleSendRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Message (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="e.g. Hello Professor, I would like to join your statistical assessment stream and receive guidance."
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedTrainer(null)}
                    className="rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={sendingRequest}
                    className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold px-4"
                  >
                    {sendingRequest ? "Sending..." : "Send Request"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
