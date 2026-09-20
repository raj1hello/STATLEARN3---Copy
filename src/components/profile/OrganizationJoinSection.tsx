"use client";

import React, { useState, useEffect } from "react";
import { organizationApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Building, Search, Clock, CheckCircle2, XCircle } from "lucide-react";

export function OrganizationJoinSection() {
  const [loading, setLoading] = useState(true);
  const [statusObj, setStatusObj] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState("");

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await organizationApi.getMyRequestStatus();
      if (res.success && res.data) {
        setStatusObj(res.data);
      }
    } catch (err) {
      console.error("Failed to load organization status", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    try {
      setSearching(true);
      setError("");
      const res = await organizationApi.search(searchQuery);
      if (res.success && res.data) {
        setSearchResults(res.data.organizations || []);
      }
    } catch (err: any) {
      setError(err.message || "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleJoin = async (orgId: string) => {
    try {
      setRequesting(true);
      setError("");
      const res = await organizationApi.join(orgId);
      if (res.success) {
        await loadStatus();
        setSearchQuery("");
        setSearchResults([]);
      } else {
        setError(res.error?.message || "Join failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to join");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 border-slate-200 dark:border-slate-800">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 animate-pulse rounded mb-4" />
        <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
      </Card>
    );
  }

  const status = statusObj?.status || "Not connected";
  const org = statusObj?.organization;

  return (
    <Card className="p-8 space-y-6 border-slate-200 dark:border-slate-800/80">
      <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/80">
        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <Building className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Organization Settings</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Connect to your institution or training provider</p>
        </div>
      </div>

      <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#121422]">
        <div>
          <span className="block text-xs text-slate-500 font-semibold mb-1">Current Status</span>
          <div className="flex items-center gap-2">
            {status === "Not connected" && (
              <Badge variant="slate">Not Connected</Badge>
            )}
            {status === "pending" && (
              <>
                <Badge variant="amber" className="flex items-center gap-1"><Clock className="w-3 h-3"/> Pending Approval</Badge>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">for {org?.name}</span>
              </>
            )}
            {status === "approved" && (
              <>
                <Badge variant="emerald" className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Connected</Badge>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{org?.name}</span>
              </>
            )}
            {status === "rejected" && (
              <Badge variant="red" className="flex items-center gap-1"><XCircle className="w-3 h-3"/> Request Rejected</Badge>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {(status === "Not connected" || status === "rejected") && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Find Your Organization
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by college or organization name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={searching || searchQuery.length < 2}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                Search
              </Button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {searchResults.map((org) => (
                <div key={org.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">{org.name}</h4>
                    {(org.department || org.designation) && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {org.department} {org.designation && `- ${org.designation}`}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    loading={requesting}
                    onClick={() => handleJoin(org.id)}
                    className="rounded-lg text-xs"
                  >
                    Request to Join
                  </Button>
                </div>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && searchResults.length === 0 && searching === false && (
            <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 dark:bg-slate-900/20 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
              No organizations found matching "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
