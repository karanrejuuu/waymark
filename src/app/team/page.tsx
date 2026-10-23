"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpDown, UserCheck } from "lucide-react";
import { db, LocalProfile, LocalDelivery } from "@/lib/db/dexie";
import { formatDateOnly } from "@/lib/scheduling";

interface StaffProgressItem {
  id: string;
  name: string;
  role: string;
  shopsDue: number;
  shopsCompleted: number;
  lastActive: string;
}

export default function TeamPage() {
  const [staffData, setStaffData] = useState<StaffProgressItem[]>([]);
  const [sortField, setSortField] = useState<keyof StaffProgressItem>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeamData() {
      const todayStr = formatDateOnly(new Date());

      const [profiles, allDeliveries, allShopProducts] = await Promise.all([
        db.profiles.toArray(),
        db.deliveries.toArray(),
        db.shop_products.toArray(),
      ]);

      // Calculate total due today across system
      const dueCount = allShopProducts.filter((sp) => sp.next_due_date <= todayStr).length;

      // Count deliveries made today
      const todayDeliveries = allDeliveries.filter(
        (d) => formatDateOnly(new Date(d.delivered_at)) === todayStr
      );

      // Unique shops completed today
      const completedShopsSet = new Set(todayDeliveries.map((d) => d.shop_id));

      const items: StaffProgressItem[] = [];

      // Current owner profile
      items.push({
        id: "owner-1",
        name: profiles[0]?.name || "Distributor Owner (You)",
        role: "Owner",
        shopsDue: dueCount,
        shopsCompleted: completedShopsSet.size,
        lastActive: todayDeliveries.length > 0 ? "Just now" : "Today at 08:30 AM",
      });

      // Sample secondary staff member for multi-staff readiness preview
      items.push({
        id: "staff-2",
        name: "Ramesh Kumar (Delivery Route B)",
        role: "Delivery",
        shopsDue: 4,
        shopsCompleted: 3,
        lastActive: "15m ago",
      });

      setStaffData(items);
      setLoading(false);
    }

    loadTeamData();
  }, []);

  const handleSort = (field: keyof StaffProgressItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedStaff = [...staffData].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === "string" && typeof valB === "string") {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    if (typeof valA === "number" && typeof valB === "number") {
      return sortAsc ? valA - valB : valB - valA;
    }
    return 0;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-5">
        <Link
          href="/"
          className="text-xs font-semibold text-[#475569] hover:text-[#0F172A] inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft size={14} />
          <span>Back to Today's Route</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] font-heading">
          Team Dispatch Progress
        </h1>
        <p className="text-xs text-[#475569] mt-1 font-medium">
          Glanceable progress of all salesmen and daily route completions.
        </p>
      </div>

      <div className="border border-[#CBD5E1] rounded-2xl bg-white overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#CBD5E1] bg-[#FAF8F5] text-[#334155] font-bold select-none">
              <th
                onClick={() => handleSort("name")}
                className="py-3 px-4 font-bold cursor-pointer hover:text-[#0F172A]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Staff Member</span>
                  <ArrowUpDown size={13} className="text-[#64748B]" />
                </div>
              </th>
              <th className="py-3 px-4 font-bold">Role</th>
              <th
                onClick={() => handleSort("shopsDue")}
                className="py-3 px-4 font-bold cursor-pointer hover:text-[#0F172A] text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Shops Due</span>
                  <ArrowUpDown size={13} className="text-[#64748B]" />
                </div>
              </th>
              <th
                onClick={() => handleSort("shopsCompleted")}
                className="py-3 px-4 font-bold cursor-pointer hover:text-[#0F172A] text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Completed Today</span>
                  <ArrowUpDown size={13} className="text-[#64748B]" />
                </div>
              </th>
              <th className="py-3 px-4 font-bold text-right">Last Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-[#475569]">
                  Loading team data...
                </td>
              </tr>
            ) : (
              sortedStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                    <div className="flex items-center gap-2.5">
                      <UserCheck size={16} className="text-[#92400E]" />
                      <span>{staff.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#334155]">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                      {staff.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-[#0F172A] tabular-nums">
                    {staff.shopsDue}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-[#065F46] tabular-nums">
                    {staff.shopsCompleted}
                  </td>
                  <td className="py-3.5 px-4 text-right text-[#475569] font-medium">
                    {staff.lastActive}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
