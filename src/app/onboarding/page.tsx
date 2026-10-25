"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { db } from "@/lib/db/dexie";
import { enqueueWrite } from "@/lib/db/sync";
import { ShopImportHub } from "@/components/onboarding/ShopImportHub";
import {
  Building2,
  Users,
  Truck,
  MapPin,
  Package,
  Compass,
  ArrowRight,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const ShopMap = dynamic(() => import("@/components/shop/ShopMap"), {
  ssr: false,
  loading: () => (
    <div className="h-56 bg-[#1B1B20] rounded-xl border border-white/[0.08] flex items-center justify-center text-xs text-zinc-500 font-mono">
      Loading interactive godown map...
    </div>
  ),
});

interface ProductConfig {
  name: string;
  interval: number;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 6;

  // Step 1: Organisation & Auth
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerRole, setOwnerRole] = useState<"Distributor / Owner" | "Wholesale Dealer">("Distributor / Owner");

  useEffect(() => {
    async function loadRegisteredProfile() {
      if (user?.user_metadata?.name) {
        setOwnerName(user.user_metadata.name);
      }
      if (user?.user_metadata?.business_name) {
        setBusinessName(user.user_metadata.business_name);
      }

      const profile = await db.profiles.toCollection().first();
      if (profile?.name) {
        setOwnerName((prev) => prev || profile.name);
      }
    }
    loadRegisteredProfile();
  }, [user]);

  // Step 2: Team Size
  const [teamSize, setTeamSize] = useState<"solo" | "team">("solo");
  const [staffPhone, setStaffPhone] = useState("");

  // Step 3: Vehicle & Fuel
  const [vehicleType, setVehicleType] = useState<string>("Tata Ace (Chhota Hathi)");
  const [mileage, setMileage] = useState<number>(18.0);
  const [petrolPrice, setPetrolPrice] = useState<number>(104.5);

  // Step 4: Central Godown Pin
  const [lat, setLat] = useState<number>(19.076);
  const [lng, setLng] = useState<number>(72.8777);

  // Step 5: Products & Intervals
  const [products, setProducts] = useState<ProductConfig[]>([]);
  const [newProdName, setNewProdName] = useState("");
  const [newProdInterval, setNewProdInterval] = useState(7);

  // Step 6: Region / Route Name
  const [primaryRoute] = useState("North Market");

  // Save intermediate configurations to Dexie
  const handleSaveStep = async (nextStep: number) => {
    const orgId = "org-waymark-demo";
    const nowIso = new Date().toISOString();

    if (currentStep === 1) {
      await enqueueWrite("organisations", "upsert", {
        id: orgId,
        name: businessName.trim(),
        currency: "INR",
        created_at: nowIso,
      });
    }

    if (currentStep === 3 || currentStep === 4) {
      await enqueueWrite("godowns", "upsert", {
        id: "godown-1",
        organisation_id: orgId,
        owner_id: "demo-user",
        lat,
        lng,
        vehicle_mileage_kmpl: mileage,
        petrol_price_per_l: petrolPrice,
        created_at: nowIso,
      });
    }

    if (currentStep === 5) {
      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        if (!p.name.trim()) continue;
        await enqueueWrite("products", "upsert", {
          id: `prod-${i + 1}`,
          organisation_id: orgId,
          owner_id: "demo-user",
          name: p.name.trim(),
          default_interval: p.interval || 7,
          created_at: nowIso,
        });
      }
    }

    setCurrentStep(nextStep);
  };

  const handleAddProduct = () => {
    if (!newProdName.trim()) return;
    setProducts([...products, { name: newProdName.trim(), interval: newProdInterval || 7 }]);
    setNewProdName("");
    setNewProdInterval(7);
  };

  const handleRemoveProduct = (idx: number) => {
    setProducts(products.filter((_, i) => i !== idx));
  };

  const handleImportComplete = (_count: number) => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-zinc-100 py-10 px-4 flex flex-col justify-between">
      <div className="max-w-xl mx-auto w-full">
        {/* Progress Bar & Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span className="text-[#B5F23D]">{Math.round((currentStep / totalSteps) * 100)}% Completed</span>
          </div>
          <div className="w-full h-1 bg-[#1B1B20] rounded-full overflow-hidden border border-white/[0.04]">
            <div
              className="h-full bg-[#B5F23D] transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard Box */}
        <div className="bg-[#131316] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          {/* STEP 1: Organisation & Auth */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1B1B20] border border-white/[0.08] text-[#B5F23D] flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Organisation & Profile</h2>
                  <p className="text-xs text-zinc-400">Tell us about your FMCG distribution setup</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Business / Agency Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Apex FMCG Agency"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-[#1B1B20] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#B5F23D] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Owner / Operator Name</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Your name"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-[#1B1B20] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#B5F23D] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Role in Business</label>
                  <select
                    value={ownerRole}
                    onChange={(e) => setOwnerRole(e.target.value as any)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-[#1B1B20] text-zinc-100 focus:outline-none focus:border-[#B5F23D] transition-colors"
                  >
                    <option value="Distributor / Owner">Distributor / Agency Owner</option>
                    <option value="Wholesale Dealer">Wholesale Dealer</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveStep(2)}
                  className="px-5 py-2.5 rounded-xl bg-[#B5F23D] hover:bg-[#c4f84c] text-[#0C1004] font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  Continue to Team <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Team Size */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1B1B20] border border-white/[0.08] text-[#B5F23D] flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Team Size</h2>
                  <p className="text-xs text-zinc-400">Do you run routes alone or manage delivery staff?</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTeamSize("solo")}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    teamSize === "solo"
                      ? "border-[#B5F23D] bg-[#1B1B20] text-white ring-1 ring-[#B5F23D]"
                      : "border-white/[0.08] bg-[#1B1B20]/40 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="font-semibold text-sm text-zinc-100 mb-1">Just Me</div>
                  <div className="text-xs text-zinc-400">I ride and deliver the rounds myself</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTeamSize("team")}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    teamSize === "team"
                      ? "border-[#B5F23D] bg-[#1B1B20] text-white ring-1 ring-[#B5F23D]"
                      : "border-white/[0.08] bg-[#1B1B20]/40 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="font-semibold text-sm text-zinc-100 mb-1">I Have Staff</div>
                  <div className="text-xs text-zinc-400">I manage drivers / delivery boys on routes</div>
                </button>
              </div>

              {teamSize === "team" && (
                <div className="pt-2">
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Invite First Driver (Phone Number)
                  </label>
                  <input
                    type="tel"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="e.g. 9820099887 (or skip for now)"
                    className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-[#1B1B20] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#B5F23D] transition-colors"
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    You can manage drivers and assign specific routes anytime under Team.
                  </span>
                </div>
              )}

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 rounded-xl border border-white/[0.08] text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft size={13} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveStep(3)}
                  className="px-5 py-2.5 rounded-xl bg-[#B5F23D] hover:bg-[#c4f84c] text-[#0C1004] font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  Continue to Vehicle <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Vehicle & Fuel */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1B1B20] border border-white/[0.08] text-[#B5F23D] flex items-center justify-center">
                  <Truck size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Vehicle & Fuel Cost</h2>
                  <p className="text-xs text-zinc-400">Used to calculate route fuel burn & delivery cost</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Vehicle Model / Type</label>
                  <input
                    type="text"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    placeholder="e.g. Tata Ace, Bolero Maxi, Hero Splendor"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-[#1B1B20] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#B5F23D] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Mileage (km / L)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={mileage}
                      onChange={(e) => setMileage(parseFloat(e.target.value) || 20)}
                      className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-[#1B1B20] text-zinc-100 focus:outline-none focus:border-[#B5F23D] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Petrol Price (₹ / L)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={petrolPrice}
                      onChange={(e) => setPetrolPrice(parseFloat(e.target.value) || 104)}
                      className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-[#1B1B20] text-zinc-100 focus:outline-none focus:border-[#B5F23D] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 rounded-xl border border-white/[0.08] text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft size={13} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveStep(4)}
                  className="px-5 py-2.5 rounded-xl bg-[#B5F23D] hover:bg-[#c4f84c] text-[#0C1004] font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  Set Godown Pin <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Central Godown Pin */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1B1B20] border border-white/[0.08] text-[#B5F23D] flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Godown / Warehouse Pin</h2>
                  <p className="text-xs text-zinc-400">Search or tap to pin where daily routes start and return</p>
                </div>
              </div>

              <ShopMap
                lat={lat}
                lng={lng}
                editable={true}
                height="240px"
                placeholder="Search godown address, landmark, or street..."
                onLocationChange={(newLat, newLng) => {
                  setLat(newLat);
                  setLng(newLng);
                }}
              />

              <div className="pt-3 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 rounded-xl border border-white/[0.08] text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft size={13} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveStep(5)}
                  className="px-5 py-2.5 rounded-xl bg-[#B5F23D] hover:bg-[#c4f84c] text-[#0C1004] font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  Configure Products <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Products & Default Intervals */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1B1B20] border border-white/[0.08] text-[#B5F23D] flex items-center justify-center">
                  <Package size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Products & Restock Cadence</h2>
                  <p className="text-xs text-zinc-400">Items you supply and default restock cycles</p>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="py-6 px-4 text-center border border-dashed border-white/[0.08] rounded-xl bg-[#1B1B20]/40 text-xs text-zinc-400">
                  No products configured yet. Type items you supply below (or skip to add them later in Settings).
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {products.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-white/[0.08] bg-[#1B1B20] text-xs"
                    >
                      <span className="font-semibold text-zinc-100 truncate pr-2">{p.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-zinc-400 font-mono text-[11px]">
                          Every {p.interval} days
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(i)}
                          className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Product inline */}
              <div className="p-3 bg-[#1B1B20]/70 rounded-xl border border-white/[0.08] flex items-center gap-2">
                <input
                  type="text"
                  placeholder="SKU (e.g. Britannia Bourbon Case)"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-white/[0.1] bg-[#131316] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#B5F23D]"
                />
                <input
                  type="number"
                  placeholder="Days"
                  min={1}
                  max={60}
                  value={newProdInterval}
                  onChange={(e) => setNewProdInterval(parseInt(e.target.value, 10) || 7)}
                  className="w-16 text-xs font-mono px-2 py-1.5 rounded-lg border border-white/[0.1] bg-[#131316] text-zinc-100 focus:outline-none focus:border-[#B5F23D]"
                />
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="px-3 py-1.5 rounded-lg bg-[#B5F23D] hover:bg-[#c4f84c] text-[#0C1004] font-semibold text-xs transition-colors"
                >
                  Add
                </button>
              </div>

              <div className="pt-3 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2 rounded-xl border border-white/[0.08] text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft size={13} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveStep(6)}
                  className="px-5 py-2.5 rounded-xl bg-[#B5F23D] hover:bg-[#c4f84c] text-[#0C1004] font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  Import Shops <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: 3-WAY SHOP IMPORT HUB */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1B1B20] border border-white/[0.08] text-[#B5F23D] flex items-center justify-center">
                  <Compass size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Import Retailer Route</h2>
                  <p className="text-xs text-zinc-400">
                    Choose the fastest way to register your shops into Waymark
                  </p>
                </div>
              </div>

              <ShopImportHub
                defaultRegion={primaryRoute}
                organisationId="org-waymark-demo"
                onComplete={handleImportComplete}
              />

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft size={13} /> Back to Products
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
