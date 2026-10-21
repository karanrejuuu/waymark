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
      <div className="mb-6">
        <Link
          href="/"
          className="text-xs text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft size={14} />
          <span>Back to Today</span>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">
          Team Progress
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Glanceable progress of all staff members and daily route completions.
        </p>
      </div>

      <div className="border border-border rounded-lg bg-bg overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-bg-subtle text-text-secondary select-none">
              <th
                onClick={() => handleSort("name")}
                className="py-2.5 px-3 font-medium cursor-pointer hover:text-text-primary"
              >
                <div className="flex items-center gap-1.5">
                  <span>Staff Member</span>
                  <ArrowUpDown size={12} className="text-text-tertiary" />
                </div>
              </th>
              <th className="py-2.5 px-3 font-medium">Role</th>
              <th
                onClick={() => handleSort("shopsDue")}
                className="py-2.5 px-3 font-medium cursor-pointer hover:text-text-primary text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Shops Due</span>
                  <ArrowUpDown size={12} className="text-text-tertiary" />
                </div>
              </th>
              <th
                onClick={() => handleSort("shopsCompleted")}
                className="py-2.5 px-3 font-medium cursor-pointer hover:text-text-primary text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Completed Today</span>
                  <ArrowUpDown size={12} className="text-text-tertiary" />
                </div>
              </th>
              <th className="py-2.5 px-3 font-medium text-right">Last Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-text-tertiary">
                  Loading team data...
                </td>
              </tr>
            ) : (
              sortedStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-bg-subtle/50 transition-colors">
                  <td className="py-3 px-3 font-medium text-text-primary">
                    <div className="flex items-center gap-2">
                      <UserCheck size={14} className="text-accent" />
                      <span>{staff.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-text-secondary">
                    <span className="px-1.5 py-0.5 rounded text-[11px] bg-bg-subtle border border-border">
                      {staff.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-text-primary">
                    {staff.shopsDue}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-green-soft">
                    {staff.shopsCompleted}
                  </td>
                  <td className="py-3 px-3 text-right text-text-tertiary">
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
