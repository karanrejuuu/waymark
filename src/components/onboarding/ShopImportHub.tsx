"use client";

import React, { useState } from "react";
import { Upload, Table, Plus, Check, FileText, ArrowRight, Trash2 } from "lucide-react";
import { db } from "@/lib/db/dexie";
import { enqueueWrite } from "@/lib/db/sync";
import { formatDateOnly } from "@/lib/scheduling";

export interface RapidShopRow {
  name: string;
  region: string;
  intervalDays: number;
  contact: string;
  balanceDue: number;
}

interface ShopImportHubProps {
  onComplete: (count: number) => void;
  defaultRegion?: string;
  organisationId?: string;
}

export const ShopImportHub: React.FC<ShopImportHubProps> = ({
  onComplete,
  defaultRegion = "Market Route",
  organisationId = "org-waymark-demo",
}) => {
  const [tab, setTab] = useState<"table" | "csv" | "skip">("table");
  const [isImporting, setIsImporting] = useState(false);

  // 1. Rapid Table State (clean empty entry rows)
  const [rows, setRows] = useState<RapidShopRow[]>([
    { name: "", region: defaultRegion, intervalDays: 7, contact: "", balanceDue: 0 },
    { name: "", region: defaultRegion, intervalDays: 7, contact: "", balanceDue: 0 },
    { name: "", region: defaultRegion, intervalDays: 7, contact: "", balanceDue: 0 },
  ]);

  // 2. CSV / Paste State
  const [csvText, setCsvText] = useState<string>("");
  const [csvError, setCsvError] = useState<string | null>(null);

  const handleAddRow = () => {
    setRows([...rows, { name: "", region: defaultRegion, intervalDays: 7, contact: "", balanceDue: 0 }]);
  };

  const handleUpdateRow = (index: number, field: keyof RapidShopRow, value: any) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  const handleRemoveRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const saveShopsToDb = async (shopList: RapidShopRow[]) => {
    setIsImporting(true);
    const now = new Date();
    const todayStr = formatDateOnly(now);
    let count = 0;

    try {
      // Collect regions
      const regionNames = Array.from(new Set(shopList.map((s) => s.region.trim()).filter(Boolean)));
      const regionMap: Record<string, string> = {};

      for (let i = 0; i < regionNames.length; i++) {
        const rName = regionNames[i];
        let existing = await db.regions.where("name").equals(rName).first();
        if (!existing) {
          const newReg = {
            id: `reg-${Date.now()}-${i}`,
            organisation_id: organisationId,
            owner_id: "demo-user",
            name: rName,
            sort_order: i + 1,
            created_at: now.toISOString(),
          };
          await enqueueWrite("regions", "upsert", newReg);
          regionMap[rName] = newReg.id;
        } else {
          regionMap[rName] = existing.id;
        }
      }

      // Default product
      let defaultProd = await db.products.toCollection().first();
      if (!defaultProd) {
        defaultProd = {
          id: `p-${Date.now()}`,
          organisation_id: organisationId,
          owner_id: "demo-user",
          name: "Standard FMCG Restock Assortment",
          default_interval: 7,
          created_at: now.toISOString(),
        };
        await enqueueWrite("products", "upsert", defaultProd);
      }

      for (let i = 0; i < shopList.length; i++) {
        const item = shopList[i];
        if (!item.name.trim()) continue;

        const shopId = `shop-${Date.now()}-${i}`;
        const shopRecord = {
          id: shopId,
          organisation_id: organisationId,
          owner_id: "demo-user",
          region_id: regionMap[item.region] || null,
          name: item.name.trim(),
          contact: item.contact.trim() || null,
          lat: null,
          lng: null,
          notes: null,
          is_urgent: false,
          sort_order: i + 1,
          balance_due: Number(item.balanceDue) || 0,
          is_archived: false,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        };
        await enqueueWrite("shops", "upsert", shopRecord);

        // Schedule shop_product
        const spRecord = {
          id: `sp-${Date.now()}-${i}`,
          organisation_id: organisationId,
          shop_id: shopId,
          product_id: defaultProd.id,
          default_qty: 2,
          interval_days: item.intervalDays || 7,
          remind_offset_days: 0,
          next_due_date: todayStr, // immediately ready for today!
          snooze_until: null,
          created_at: now.toISOString(),
        };
        await enqueueWrite("shop_products", "upsert", spRecord);
        count++;
      }

      onComplete(count);
    } catch (err) {
      console.error("Failed to import shops:", err);
      setCsvError("Error importing shops. Please check input.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleTableSubmit = () => {
    const valid = rows.filter((r) => r.name.trim().length > 0);
    if (valid.length === 0) {
      setCsvError("Please enter at least one shop name.");
      return;
    }
    saveShopsToDb(valid);
  };

  const handleCsvSubmit = () => {
    setCsvError(null);
    const lines = csvText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const parsed: RapidShopRow[] = [];
    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length < 1 || !parts[0]) continue;

      const name = parts[0];
      const region = parts[1] || defaultRegion;
      const intervalDays = parseInt(parts[2], 10) || 7;
      const contact = parts[3] || "";
      const balanceDue = parseFloat(parts[4]) || 0;

      parsed.push({ name, region, intervalDays, contact, balanceDue });
    }

    if (parsed.length === 0) {
      setCsvError("Could not parse any valid shop rows. Format: Name, Route, Interval, Contact, Balance");
      return;
    }

    saveShopsToDb(parsed);
  };

  return (
    <div className="space-y-4">
      {/* Tab selection */}
      <div className="grid grid-cols-3 gap-1 bg-[#E6E9EF]/60 p-1 rounded-xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => setTab("table")}
          className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            tab === "table" ? "bg-white text-ink shadow-xs" : "text-[#5C6B73] hover:text-ink"
          }`}
        >
          <Table size={14} />
          Rapid Table
        </button>
        <button
          type="button"
          onClick={() => setTab("csv")}
          className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            tab === "csv" ? "bg-white text-ink shadow-xs" : "text-[#5C6B73] hover:text-ink"
          }`}
        >
          <FileText size={14} />
          Paste CSV / Excel
        </button>
        <button
          type="button"
          onClick={() => setTab("skip")}
          className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            tab === "skip" ? "bg-white text-ink shadow-xs" : "text-[#5C6B73] hover:text-ink"
          }`}
        >
          <ArrowRight size={14} />
          Add as I Visit
        </button>
      </div>

      {csvError && (
        <div className="p-2.5 bg-[#D64545]/10 border border-[#D64545]/30 rounded-lg text-xs text-[#D64545]">
          {csvError}
        </div>
      )}

      {/* 1. Rapid Table View */}
      {tab === "table" && (
        <div className="space-y-3">
          <div className="text-xs text-[#5C6B73]">
            Type or edit shops directly. Hit + Add Row for next shop:
          </div>

          <div className="overflow-x-auto border border-[#E6E9EF] rounded-xl bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FBFBF9] border-b border-[#E6E9EF] text-[#5C6B73] font-semibold">
                  <th className="py-2 px-3">Shop Name *</th>
                  <th className="py-2 px-2">Route / Area</th>
                  <th className="py-2 px-2 w-20">Days</th>
                  <th className="py-2 px-2">Phone</th>
                  <th className="py-2 px-2 w-24">Due (₹)</th>
                  <th className="py-2 px-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E9EF]">
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FBFBF9]/60">
                    <td className="py-1.5 px-3">
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Kirana"
                        value={row.name}
                        onChange={(e) => handleUpdateRow(idx, "name", e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-[#E6E9EF] rounded-md focus:outline-none focus:border-[#F2A900]"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        placeholder="Route"
                        value={row.region}
                        onChange={(e) => handleUpdateRow(idx, "region", e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-[#E6E9EF] rounded-md focus:outline-none focus:border-[#F2A900]"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={row.intervalDays}
                        onChange={(e) => handleUpdateRow(idx, "intervalDays", parseInt(e.target.value, 10) || 7)}
                        className="w-full px-2 py-1 text-xs border border-[#E6E9EF] rounded-md focus:outline-none focus:border-[#F2A900] tabular-nums"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="tel"
                        placeholder="98..."
                        value={row.contact}
                        onChange={(e) => handleUpdateRow(idx, "contact", e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-[#E6E9EF] rounded-md focus:outline-none focus:border-[#F2A900] tabular-nums"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        placeholder="0"
                        value={row.balanceDue}
                        onChange={(e) => handleUpdateRow(idx, "balanceDue", parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-xs border border-[#E6E9EF] rounded-md focus:outline-none focus:border-[#F2A900] tabular-nums"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="text-[#5C6B73] hover:text-[#D64545] p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleAddRow}
              className="px-3 py-1.5 rounded-lg border border-[#E6E9EF] bg-white text-xs font-semibold text-ink hover:bg-[#E6E9EF]/40 flex items-center gap-1 shadow-2xs"
            >
              <Plus size={13} />
              Add Row
            </button>

            <button
              type="button"
              disabled={isImporting}
              onClick={handleTableSubmit}
              className="px-5 py-2 rounded-xl bg-[#F2A900] text-ink text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
            >
              {isImporting ? "Importing..." : "Save & Generate Today's Route →"}
            </button>
          </div>
        </div>
      )}

      {/* 2. CSV / Paste View */}
      {tab === "csv" && (
        <div className="space-y-3">
          <div className="text-xs text-[#5C6B73]">
            Copy columns from Excel or Google Sheets and paste here:
            <span className="block font-mono text-[11px] text-ink mt-0.5">
              Format: Shop Name, Route, Interval Days, Phone, Due Amount
            </span>
          </div>

          <textarea
            rows={6}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Gupta Kirana, North Market, 7, 9820011223, 1450"
            className="w-full p-3 font-mono text-xs border border-[#E6E9EF] rounded-xl bg-white focus:outline-none focus:border-[#F2A900]"
          />

          <button
            type="button"
            disabled={isImporting}
            onClick={handleCsvSubmit}
            className="w-full py-2.5 rounded-xl bg-[#F2A900] text-ink text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-sm"
          >
            {isImporting ? "Importing shops..." : "Import CSV & Generate Today's Route →"}
          </button>
        </div>
      )}

      {/* 3. Skip / Add as I Visit View */}
      {tab === "skip" && (
        <div className="p-5 border border-[#E6E9EF] rounded-xl bg-white text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#F2A900]/20 text-ink flex items-center justify-center mx-auto">
            <ArrowRight size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink font-heading">Add shops as you ride</h4>
            <p className="text-xs text-[#5C6B73] mt-1 max-w-sm mx-auto">
              You can skip importing right now and enter your app with a clean dashboard. Add your shops anytime as you visit retailers.
            </p>
          </div>

          <button
            type="button"
            disabled={isImporting}
            onClick={() => onComplete(0)}
            className="px-6 py-2.5 rounded-xl bg-[#F2A900] text-ink text-xs font-bold hover:opacity-90 transition-opacity"
          >
            Launch Today's Route →
          </button>
        </div>
      )}
    </div>
  );
};