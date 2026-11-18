"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw } from "lucide-react";
import AwaitingIntegration from "@/components/common/AwaitingIntegration";
import PartnerDrawer from "@/components/partners/PartnerDrawer";
import { partnerService } from "@/services/partnerService";
import { Partner } from "@/types/api.types";
import { useToast } from "@/contexts/ToastContext";

export default function ManagePartnersPage() {
  const toast = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  const checkPartnerEndpoint = useCallback(async () => {
    setIsPinging(true);
    try {
      const data = await partnerService.getPartners();
      setPartners(data);
      if (data.length > 0) {
        toast.success(`Loaded ${data.length} partner(s).`, 200);
      }
    } catch {
      // Pending backend implementation
    } finally {
      setLoading(false);
      setIsPinging(false);
    }
  }, [toast]);

  useEffect(() => {
    checkPartnerEndpoint();
  }, [checkPartnerEndpoint]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-xs font-bold text-brand-primary dark:text-brand-accent uppercase tracking-wider">
              Talent &amp; Agencies
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Manage Brand Partners
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            Curate talent rosters, brand collaborations, and partnership agreements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={checkPartnerEndpoint}
            disabled={isPinging}
            className="p-3 rounded-xl border border-border-subtle text-gray-500 hover:text-text-primary hover:bg-border-subtle/50 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-50"
            title="Refresh Partners"
          >
            <RefreshCw
              className={`w-4 h-4 ${isPinging ? "animate-spin text-brand-accent" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="px-5 py-3 rounded-xl bg-brand-primary hover:bg-brand-accent text-white hover:text-brand-primary font-bold text-xs tracking-wide shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 cursor-pointer hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Configure Partner</span>
          </button>
        </div>
      </div>

      {/* If live data exists, render table; otherwise render clean minimalist empty state */}
      {partners.length > 0 ? (
        <div className="bg-bg-surface rounded-2xl border border-border-subtle shadow-sm p-6 overflow-hidden">
          <p className="text-xs font-bold text-brand-accent mb-4">
            Active Partners ({partners.length})
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="border-b border-border-subtle text-xs uppercase text-text-primary">
                <tr>
                  <th className="py-3 px-4">Partner Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Tier</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-sm">
                {partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-border-subtle/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-text-primary">
                      {partner.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-400">
                      {partner.contactEmail}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-brand-primary text-brand-accent text-xs font-semibold">
                        {partner.tier}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold">
                      {partner.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <AwaitingIntegration
          moduleName="Brand Partner Directory"
          description="The partner directory is currently in development and will be available in an upcoming release."
          onRefresh={checkPartnerEndpoint}
          isRefreshing={isPinging}
        />
      )}

      {/* Right-Side Drawer */}
      <PartnerDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={() => {
          checkPartnerEndpoint();
        }}
      />
    </div>
  );
}
