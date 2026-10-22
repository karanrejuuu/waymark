"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { db } from "@/lib/db/dexie";
import { enqueueWrite } from "@/lib/db/sync";
import { saveRegion } from "@/lib/actions/regionActions";

const ShopMap = dynamic(() => import("@/components/shop/ShopMap").then((m) => m.ShopMap), {
  ssr: false,
  loading: () => <div className="h-56 bg-bg-subtle rounded border border-border flex items-center justify-center text-xs text-text-tertiary">Loading map...</div>,
});

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [lat, setLat] = useState<number>(19.076);
  const [lng, setLng] = useState<number>(72.8777);
  const [regionName, setRegionName] = useState("North Market");
  const [submitting, setSubmitting] = useState(false);

  const handleStep1 = async () => {
    // Save godown
    const godownRecord = {
      id: "godown-1",
      owner_id: "demo-user",
      lat,
      lng,
      vehicle_mileage_kmpl: 25.0,
      petrol_price_per_l: 104.5,
      created_at: new Date().toISOString(),
    };
    await enqueueWrite("godowns", "upsert", godownRecord);
    setStep(2);
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regionName.trim() || submitting) return;

    setSubmitting(true);
    try {
      await saveRegion(regionName.trim());
      router.push("/");
    } catch (err) {
      console.error("Onboarding failed:", err);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="mb-6 text-center">
        <div className="inline-block w-3 h-3 rounded-full bg-accent mb-2" />
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">
          Welcome to Waymark
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          {step === 1
            ? "Step 1 of 2: Pin your central godown (warehouse) location"
            : "Step 2 of 2: Name your primary delivery route"}
        </p>
      </div>

      <div className="border border-border rounded-lg bg-bg p-5 shadow-sm">
        {step === 1 ? (
          <div className="space-y-4">
            <div className="text-xs text-text-secondary leading-relaxed">
              Tap on the map to place your godown pin. This allows Waymark to calculate trip distances and fuel estimates.
            </div>

            <ShopMap
              lat={lat}
              lng={lng}
              editable={true}
              height="260px"
              placeholder="Search godown address or area..."
              onLocationChange={(newLat, newLng) => {
                setLat(newLat);
                setLng(newLng);
              }}
            />

            <button
              type="button"
              onClick={handleStep1}
              className="w-full py-2 bg-accent text-white text-xs font-medium rounded hover:opacity-90 transition-opacity"
            >
              Continue →
            </button>
          </div>
        ) : (
          <form onSubmit={handleFinish} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                First Route / Area Name
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Main Market, Station Road"
                value={regionName}
                onChange={(e) => setRegionName(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-border rounded bg-bg focus:outline-none focus:border-accent"
              />
            </div>

            <div className="text-[11px] text-text-tertiary">
              You can add more routes and shops anytime from the Routes menu.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-accent text-white text-xs font-medium rounded hover:opacity-90 transition-opacity"
            >
              {submitting ? "Setting up..." : "Start using Waymark"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
