"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Plus, Bell, RefreshCw, CheckCircle2, Download, Upload, ShieldCheck, Database, HardDrive } from "lucide-react";
import { db, LocalGodown, LocalProduct } from "@/lib/db/dexie";
import { enqueueWrite } from "@/lib/db/sync";
import { checkStorageDurability, StorageStatus } from "@/lib/db/durability";
import { downloadDatabaseBackup, restoreDatabaseBackup } from "@/lib/db/backup";

const ShopMap = dynamic(() => import("@/components/shop/ShopMap"), {
  ssr: false,
  loading: () => <div className="h-44 bg-[#111827] rounded-2xl border border-white/[0.08] flex items-center justify-center text-xs text-[#94A3B8] font-mono">Loading godown map...</div>,
});

export default function SettingsPage() {
  const [godown, setGodown] = useState<LocalGodown | null>(null);
  const [mileage, setMileage] = useState<number>(25.0);
  const [petrolPrice, setPetrolPrice] = useState<number>(104.5);
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [reminderTime, setReminderTime] = useState("07:00");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSettings() {
      const [gdw, prods, sStatus] = await Promise.all([
        db.godowns.toCollection().first(),
        db.products.toArray(),
        checkStorageDurability(),
      ]);

      if (gdw) {
        setGodown(gdw);
        setMileage(gdw.vehicle_mileage_kmpl);
        setPetrolPrice(gdw.petrol_price_per_l);
      }

      setProducts(prods);
      setStorageStatus(sStatus);

      if (typeof window !== "undefined" && "Notification" in window) {
        setNotificationsEnabled(Notification.permission === "granted");
      }
    }
    loadSettings();
  }, []);

  const handleSaveVehicleSettings = async () => {
    const existing = godown || {
      id: "godown-1",
      owner_id: "demo-user",
      organisation_id: "org-waymark-demo",
      lat: 19.076,
      lng: 72.8777,
      created_at: new Date().toISOString(),
    };

    const updated: LocalGodown = {
      ...existing,
      vehicle_mileage_kmpl: mileage,
      petrol_price_per_l: petrolPrice,
    };

    await enqueueWrite("godowns", "upsert", updated);
    setGodown(updated);
    flashSaved();
  };

  const handleUpdateGodownCoords = async (newLat: number, newLng: number) => {
    const existing = godown || {
      id: "godown-1",
      owner_id: "demo-user",
      organisation_id: "org-waymark-demo",
      vehicle_mileage_kmpl: mileage,
      petrol_price_per_l: petrolPrice,
      created_at: new Date().toISOString(),
    };

    const updated: LocalGodown = {
      ...existing,
      lat: newLat,
      lng: newLng,
    };

    await enqueueWrite("godowns", "upsert", updated);
    setGodown(updated);
    flashSaved();
  };

  const flashSaved = () => {
    setSaveStatus("Saved");
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const handleRequestPush = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      setNotificationsEnabled(perm === "granted");
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = await restoreDatabaseBackup(text);
      if (res.success) {
        setBackupNotice(`Restored successfully: ${res.restoredCounts?.shops || 0} shops, ${res.restoredCounts?.regions || 0} routes`);
        // reload products
        const updatedProds = await db.products.toArray();
        setProducts(updatedProds);
      } else {
        setBackupNotice(`Error: ${res.message}`);
      }
    } catch (err: any) {
      setBackupNotice(`Failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#94A3B8]">
              Agency Configuration & Data Durability
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
            Agency Settings
          </h1>
        </div>
        {saveStatus && (
          <span className="text-xs font-mono text-[#3B82F6] inline-flex items-center gap-1 font-bold px-3 py-1 rounded-full bg-[#2563EB]/15 border border-[#3B82F6]/35">
            <CheckCircle2 size={14} />
            <span>{saveStatus}</span>
          </span>
        )}
      </div>

      <div className="space-y-6">
        {/* SECTION: DATA DURABILITY & 1-CLICK BACKUP */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-5 shadow-lift">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#3B82F6]" />
              <span className="font-bold text-sm text-[#F8FAFC]">
                Database Backup & Storage
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 font-bold">
              {storageStatus?.persisted ? "Storage Active" : "IndexedDB Ready"}
            </span>
          </div>

          <p className="text-xs text-[#94A3B8] mb-4 leading-relaxed">
            Your shops, replenishment cadences, and ledger balances are stored securely in local browser storage for offline operation. You can export a snapshot backup at any time.
          </p>

          {backupNotice && (
            <div className="mb-4 p-3 rounded-xl bg-[#2563EB]/15 border border-[#3B82F6]/35 text-xs font-mono text-[#3B82F6]">
              {backupNotice}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={downloadDatabaseBackup}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#2563EB] text-white hover:bg-[#1D4ED8] inline-flex items-center gap-2 transition-all shadow-sm active:scale-95"
            >
              <Download size={14} />
              <span>Download Backup (JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#1E293B] text-[#F8FAFC] hover:bg-[#283548] border border-white/[0.1] inline-flex items-center gap-2 transition-all"
            >
              <Upload size={14} />
              <span>Restore from Backup</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleRestoreFile}
              className="hidden"
            />
          </div>
        </div>

        {/* SECTION: VEHICLE & EXPENSES */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-5 shadow-lift">
          <div className="text-[11px] font-mono font-bold text-[#3B82F6] tracking-wider uppercase mb-3">
            Vehicle & Fuel Expenses
          </div>
          <div className="divide-y divide-white/[0.06] text-xs">
            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#F8FAFC]">Average Tempo Mileage</div>
                <div className="text-[#94A3B8] text-[11px] font-mono mt-0.5">Kilometers per litre (km/L)</div>
              </div>
              <input
                type="number"
                step="0.5"
                min="1"
                value={mileage}
                onChange={(e) => setMileage(parseFloat(e.target.value) || 20)}
                onBlur={handleSaveVehicleSettings}
                className="w-28 px-3 py-1.5 text-right font-mono font-bold border border-white/[0.12] rounded-xl bg-[#1E293B] text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#F8FAFC]">Current Fuel Price</div>
                <div className="text-[#94A3B8] text-[11px] font-mono mt-0.5">Rupees per litre (₹/L)</div>
              </div>
              <input
                type="number"
                step="0.5"
                min="1"
                value={petrolPrice}
                onChange={(e) => setPetrolPrice(parseFloat(e.target.value) || 100)}
                onBlur={handleSaveVehicleSettings}
                className="w-28 px-3 py-1.5 text-right font-mono font-bold border border-white/[0.12] rounded-xl bg-[#1E293B] text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>
        </div>

        {/* SECTION: CENTRAL GODOWN LOCATION */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-5 shadow-lift">
          <div className="text-[11px] font-mono font-bold text-[#3B82F6] tracking-wider uppercase mb-1">
            Central Warehouse / Godown Location
          </div>
          <p className="text-[#94A3B8] text-xs mb-3">
            Used to calculate trip distance and estimated fuel burn for each shop.
          </p>
          <ShopMap
            lat={godown?.lat ?? 19.076}
            lng={godown?.lng ?? 72.8777}
            editable={true}
            height="220px"
            placeholder="Search godown address or area..."
            onLocationChange={handleUpdateGodownCoords}
          />
        </div>

        {/* SECTION: PRODUCTS CATALOG */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-5 shadow-lift">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/[0.06]">
            <div>
              <div className="text-[11px] font-mono font-bold text-[#3B82F6] tracking-wider uppercase">
                Products Catalog ({products.length})
              </div>
              <div className="text-[#94A3B8] text-xs mt-0.5">
                Supplied FMCG SKUs and default restock intervals
              </div>
            </div>
            <Link
              href="/products/new"
              className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#2563EB] text-white hover:bg-[#1D4ED8] inline-flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Plus size={14} />
              <span>Add SKU</span>
            </Link>
          </div>

          <div className="divide-y divide-white/[0.04] text-xs">
            {products.length === 0 ? (
              <div className="py-6 text-center text-[#94A3B8] font-mono">
                No products in catalog. Add your supplied FMCG items.
              </div>
            ) : (
              products.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between hover:bg-[#1E293B]/40 transition-colors">
                  <div>
                    <div className="font-bold text-[#F8FAFC] text-xs sm:text-sm">{p.name}</div>
                    <div className="text-[#94A3B8] text-[11px] font-mono mt-0.5">
                      Replenishment cycle: Every {p.default_interval} days
                    </div>
                  </div>
                  <Link
                    href={`/products/${p.id}/edit`}
                    className="px-3 py-1 rounded-lg border border-white/[0.1] text-xs font-mono font-bold text-[#F8FAFC] hover:bg-white/[0.06]"
                  >
                    Edit
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION: NOTIFICATIONS */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-5 shadow-lift">
          <div className="text-[11px] font-mono font-bold text-[#3B82F6] tracking-wider uppercase mb-3">
            Morning Dispatch Reminders
          </div>
          <div className="divide-y divide-white/[0.06] text-xs">
            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#F8FAFC]">Morning Round Reminder</div>
                <div className="text-[#94A3B8] text-[11px] font-mono mt-0.5">Daily dispatch notification of shops due</div>
              </div>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="px-3 py-1.5 border border-white/[0.12] rounded-xl bg-[#1E293B] text-xs font-mono font-bold text-[#F8FAFC]"
              />
            </div>

            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#F8FAFC]">Web Push Notifications</div>
                <div className="text-[#94A3B8] text-[11px] font-mono mt-0.5">
                  {notificationsEnabled ? "Active on this device" : "Receive background reminders"}
                </div>
              </div>
              <button
                type="button"
                onClick={handleRequestPush}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  notificationsEnabled
                    ? "bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] cursor-default"
                    : "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                }`}
              >
                {notificationsEnabled ? "Active" : "Enable Push"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
