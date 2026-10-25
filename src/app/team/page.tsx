"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpDown, UserCheck } from "lucide-react";
import { db } from "@/lib/db/dexie";
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

      const dueCount = allShopProducts.filter((sp) => sp.next_due_date <= todayStr).length;

      const todayDeliveries = allDeliveries.filter(
        (d) => formatDateOnly(new Date(d.delivered_at)) === todayStr
      );

      const completedShopsSet = new Set(todayDeliveries.map((d) => d.shop_id));

      const items: StaffProgressItem[] = [];

      items.push({
        id: "owner-1",
        name: profiles[0]?.name || "Distributor Owner (You)",
        role: "Owner",
        shopsDue: dueCount,
        shopsCompleted: completedShopsSet.size,
        lastActive: todayDeliveries.length > 0 ? "Just now" : "Today at 08:30 AM",
      });

      items.push({
        id: "staff-2",
        name: "Ramesh Kumar (Route 02 Driver)",
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
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="text-xs font-mono text-[#94A3B8] hover:text-[#F8FAFC] inline-flex items-center gap-1 mb-2 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Today&apos;s Dispatch</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
          Team Dispatch Progress
        </h1>
        <p className="text-xs text-[#94A3B8] mt-1 font-mono">
          Glanceable progress of all drivers, salesmen, and daily route completions.
        </p>
      </div>

      <div className="border border-white/[0.08] rounded-2xl bg-[#111827] overflow-hidden shadow-lift font-mono text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08] bg-[#16161B] text-[#94A3B8] select-none">
              <th
                onClick={() => handleSort("name")}
                className="py-3 px-4 font-bold cursor-pointer hover:text-[#F8FAFC]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Staff Member</span>
                  <ArrowUpDown size={12} className="text-[#64748B]" />
                </div>
              </th>
              <th className="py-3 px-4 font-bold">Role</th>
              <th
                onClick={() => handleSort("shopsDue")}
                className="py-3 px-4 font-bold cursor-pointer hover:text-[#F8FAFC] text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Due</span>
                  <ArrowUpDown size={12} className="text-[#64748B]" />
                </div>
              </th>
              <th
                onClick={() => handleSort("shopsCompleted")}
                className="py-3 px-4 font-bold cursor-pointer hover:text-[#F8FAFC] text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Completed</span>
                  <ArrowUpDown size={12} className="text-[#64748B]" />
                </div>
              </th>
              <th className="py-3 px-4 font-bold text-right">Last Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[#94A3B8]">
                  Loading team data...
                </td>
              </tr>
            ) : (
              sortedStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-[#1E293B]/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#F8FAFC]">
                    <div className="flex items-center gap-2.5">
                      <UserCheck size={15} className="text-[#3B82F6]" />
                      <span>{staff.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#94A3B8]">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#2563EB]/15 text-[#3B82F6] border border-[#3B82F6]/25">
                      {staff.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-[#F8FAFC] tabular-nums">
                    {staff.shopsDue}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-[#22C55E] tabular-nums">
                    {staff.shopsCompleted}
                  </td>
                  <td className="py-3.5 px-4 text-right text-[#94A3B8]">
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
