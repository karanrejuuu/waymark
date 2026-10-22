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
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">
            Settings
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Configure vehicle costs, notifications, and products.
          </p>
        </div>
        {saveStatus && (
          <span className="text-xs text-green-soft inline-flex items-center gap-1 font-medium">
            <CheckCircle2 size={13} />
            <span>{saveStatus}</span>
          </span>
        )}
      </div>

      <div className="space-y-8">
        {/* SECTION: VEHICLE & EXPENSES */}
        <div>
          <div className="text-[11px] font-semibold text-text-tertiary tracking-wider uppercase mb-2">
            Vehicle & Fuel Expenses
          </div>
          <div className="border border-border rounded-lg bg-bg divide-y divide-border text-xs">
            <div className="p-3 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-text-primary">Average Mileage</div>
                <div className="text-text-tertiary text-[11px]">Kilometers per litre (km/L)</div>
              </div>
              <input
                type="number"
                step="0.5"
                min="1"
                value={mileage}
                onChange={(e) => setMileage(parseFloat(e.target.value) || 20)}
                onBlur={handleSaveVehicleSettings}
                className="w-24 px-2.5 py-1 text-right font-medium border border-border rounded bg-bg focus:outline-none focus:border-accent"
              />
            </div>

            <div className="p-3 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-text-primary">Fuel Price</div>
                <div className="text-text-tertiary text-[11px]">Rupees per litre (₹/L)</div>
              </div>
              <input
                type="number"
                step="0.5"
                min="1"
                value={petrolPrice}
                onChange={(e) => setPetrolPrice(parseFloat(e.target.value) || 100)}
                onBlur={handleSaveVehicleSettings}
                className="w-24 px-2.5 py-1 text-right font-medium border border-border rounded bg-bg focus:outline-none focus:border-accent"
              />
            </div>

            <div className="p-3">
              <div className="font-medium text-text-primary mb-1">
                Central Warehouse / Godown Location
              </div>
              <div className="text-text-tertiary text-[11px] mb-2">
                Used to calculate trip distance and estimated fuel cost for each shop.
              </div>
              <ShopMap
                lat={godown?.lat ?? 19.076}
                lng={godown?.lng ?? 72.8777}
                editable={true}
                height="220px"
                placeholder="Search godown address or area..."
                onLocationChange={handleUpdateGodownCoords}
              />
            </div>
          </div>
        </div>

        {/* SECTION: PRODUCTS CATALOG */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-semibold text-text-tertiary tracking-wider uppercase">
              Products Catalog ({products.length})
            </div>
            <Link
              href="/products/new"
              className="text-xs text-accent hover:underline inline-flex items-center gap-1 font-medium"
            >
              <Plus size={13} />
              <span>Add product</span>
            </Link>
          </div>

          <div className="border border-border rounded-lg bg-bg divide-y divide-border text-xs">
            {products.length === 0 ? (
              <div className="p-4 text-center text-text-tertiary">
                No products in catalog.
              </div>
            ) : (
              products.map((p) => (
                <div key={p.id} className="p-3 flex items-center justify-between hover:bg-bg-subtle/50">
                  <div>
                    <div className="font-medium text-text-primary">{p.name}</div>
                    <div className="text-text-tertiary text-[11px]">
                      Default cycle: {p.default_interval} days
                    </div>
                  </div>
                  <Link
                    href={`/products/${p.id}/edit`}
                    className="text-xs text-text-secondary hover:text-text-primary font-medium"
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
          <div className="text-[11px] font-semibold text-text-tertiary tracking-wider uppercase mb-2">
            Notifications
          </div>
          <div className="border border-border rounded-lg bg-bg divide-y divide-border text-xs">
            <div className="p-3 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-text-primary">Morning Round Reminder</div>
                <div className="text-text-tertiary text-[11px]">Daily alert of shops due today</div>
              </div>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="px-2 py-1 border border-border rounded bg-bg text-xs font-medium"
              />
            </div>

            <div className="p-3 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-text-primary">Web Push Notifications</div>
                <div className="text-text-tertiary text-[11px]">
                  {notificationsEnabled ? "Enabled on this device" : "Receive background reminders"}
                </div>
              </div>
              <button
                type="button"
                onClick={handleRequestPush}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  notificationsEnabled
                    ? "bg-bg-subtle border border-border text-green-soft cursor-default"
                    : "bg-accent text-white hover:opacity-90"
                }`}
              >
                {notificationsEnabled ? "Active" : "Enable"}
              </button>
            </div>
          </div>
        </div>

        {/* SECTION: ACCOUNT & SYSTEM */}
        <div>
          <div className="text-[11px] font-semibold text-text-tertiary tracking-wider uppercase mb-2">
            System & Storage
          </div>
          <div className="border border-border rounded-lg bg-bg divide-y divide-border text-xs">
            <div className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-text-primary">Local Storage Status</div>
                <div className="text-text-tertiary text-[11px]">IndexedDB offline store</div>
              </div>
              <span className="text-green-soft font-medium">Ready (Persistent)</span>
            </div>

            <div className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-text-primary">Current Role</div>
                <div className="text-text-tertiary text-[11px]">Access permissions</div>
              </div>
              <span className="font-medium text-text-primary">Distributor Owner</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
