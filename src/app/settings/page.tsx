"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Plus, Bell, RefreshCw, CheckCircle2 } from "lucide-react";
import { db, LocalGodown, LocalProduct } from "@/lib/db/dexie";
import { enqueueWrite } from "@/lib/db/sync";

const ShopMap = dynamic(() => import("@/components/shop/ShopMap"), {
  ssr: false,
  loading: () => <div className="h-44 bg-bg-subtle rounded border border-border flex items-center justify-center text-xs text-text-tertiary">Loading godown map...</div>,
});

export default function SettingsPage() {
  const [godown, setGodown] = useState<LocalGodown | null>(null);
  const [mileage, setMileage] = useState<number>(25.0);
  const [petrolPrice, setPetrolPrice] = useState<number>(104.5);
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [reminderTime, setReminderTime] = useState("07:00");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const [gdw, prods] = await Promise.all([
        db.godowns.toCollection().first(),
        db.products.toArray(),
      ]);

      if (gdw) {
        setGodown(gdw);
        setMileage(gdw.vehicle_mileage_kmpl);
        setPetrolPrice(gdw.petrol_price_per_l);
      }

      setProducts(prods);

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] font-heading">
            Agency Settings
          </h1>
          <p className="text-xs text-[#475569] mt-1 font-medium">
            Configure vehicle expenses, central godown coordinates, and product packaging intervals.
          </p>
        </div>
        {saveStatus && (
          <span className="text-xs text-[#065F46] inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0]">
            <CheckCircle2 size={14} />
            <span>{saveStatus}</span>
          </span>
        )}
      </div>

      <div className="space-y-8">
        {/* SECTION: VEHICLE & EXPENSES */}
        <div>
          <div className="text-xs font-bold text-[#92400E] tracking-wider uppercase mb-2.5">
            Vehicle & Fuel Expenses
          </div>
          <div className="border border-[#CBD5E1] rounded-2xl bg-white divide-y divide-[#E2E8F0] text-xs shadow-xs overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#0F172A]">Average Tempo Mileage</div>
                <div className="text-[#475569] text-xs mt-0.5">Kilometers per litre (km/L)</div>
              </div>
              <input
                type="number"
                step="0.5"
                min="1"
                value={mileage}
                onChange={(e) => setMileage(parseFloat(e.target.value) || 20)}
                onBlur={handleSaveVehicleSettings}
                className="w-28 px-3 py-1.5 text-right font-bold border border-[#CBD5E1] rounded-xl bg-[#FAF8F5] text-[#0F172A] focus:outline-none focus:border-[#92400E]"
              />
            </div>

            <div className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#0F172A]">Current Fuel Price</div>
                <div className="text-[#475569] text-xs mt-0.5">Rupees per litre (₹/L)</div>
              </div>
              <input
                type="number"
                step="0.5"
                min="1"
                value={petrolPrice}
                onChange={(e) => setPetrolPrice(parseFloat(e.target.value) || 100)}
                onBlur={handleSaveVehicleSettings}
                className="w-28 px-3 py-1.5 text-right font-bold border border-[#CBD5E1] rounded-xl bg-[#FAF8F5] text-[#0F172A] focus:outline-none focus:border-[#92400E]"
              />
            </div>
          </div>
        </div>

        {/* SECTION: CENTRAL GODOWN LOCATION */}
        <div>
          <div className="text-xs font-bold text-[#92400E] tracking-wider uppercase mb-1">
            Central Warehouse / Godown Location
          </div>
          <p className="text-[#475569] text-xs mb-3">
            Used to calculate trip distance and estimated fuel cost for each shop.
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
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="text-xs font-bold text-[#92400E] tracking-wider uppercase">
              Products Catalog ({products.length})
            </div>
            <Link
              href="/products/new"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0F172A] text-white hover:bg-[#92400E] inline-flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus size={14} />
              <span>Add Product</span>
            </Link>
          </div>

          <div className="border border-[#CBD5E1] rounded-2xl bg-white divide-y divide-[#E2E8F0] text-xs shadow-xs overflow-hidden">
            {products.length === 0 ? (
              <div className="p-6 text-center text-[#475569]">
                No products in catalog. Add your supplied FMCG items.
              </div>
            ) : (
              products.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors">
                  <div>
                    <div className="font-bold text-[#0F172A] text-sm">{p.name}</div>
                    <div className="text-[#475569] text-xs mt-0.5 font-medium">
                      Default replenishment cycle: Every {p.default_interval} days
                    </div>
                  </div>
                  <Link
                    href={`/products/${p.id}/edit`}
                    className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] text-xs font-bold text-[#0F172A] hover:bg-[#F1F5F9]"
                  >
                    Edit
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION: NOTIFICATIONS */}
        <div>
          <div className="text-xs font-bold text-[#92400E] tracking-wider uppercase mb-2.5">
            Notifications & Dispatch Reminders
          </div>
          <div className="border border-[#CBD5E1] rounded-2xl bg-white divide-y divide-[#E2E8F0] text-xs shadow-xs overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#0F172A]">Morning Round Reminder</div>
                <div className="text-[#475569] text-xs mt-0.5">Daily dispatch alert of shops due today</div>
              </div>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="px-3 py-1.5 border border-[#CBD5E1] rounded-xl bg-[#FAF8F5] text-xs font-bold text-[#0F172A]"
              />
            </div>

            <div className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#0F172A]">Web Push Notifications</div>
                <div className="text-[#475569] text-xs mt-0.5">
                  {notificationsEnabled ? "Enabled on this device" : "Receive background reminders"}
                </div>
              </div>
              <button
                type="button"
                onClick={handleRequestPush}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  notificationsEnabled
                    ? "bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] cursor-default"
                    : "bg-[#0F172A] text-white hover:bg-[#92400E] shadow-xs"
                }`}
              >
                {notificationsEnabled ? "Active" : "Enable Push"}
              </button>
            </div>
          </div>
        </div>

        {/* SECTION: ACCOUNT & SYSTEM */}
        <div>
          <div className="text-xs font-bold text-[#92400E] tracking-wider uppercase mb-2.5">
            System & Storage
          </div>
          <div className="border border-[#CBD5E1] rounded-2xl bg-white divide-y divide-[#E2E8F0] text-xs shadow-xs overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-[#0F172A]">Local Storage Engine</div>
                <div className="text-[#475569] text-xs mt-0.5">IndexedDB encrypted offline store</div>
              </div>
              <span className="text-[#065F46] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0]">
                Ready (Persistent)
              </span>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-[#0F172A]">Current Agency Role</div>
                <div className="text-[#475569] text-xs mt-0.5">Access permissions</div>
              </div>
              <span className="font-bold text-[#0F172A]">Distributor Owner</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
