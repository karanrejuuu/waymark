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
  Check,
  Plus,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const ShopMap = dynamic(() => import("@/components/shop/ShopMap"), {
  ssr: false,
  loading: () => (
    <div className="h-56 bg-[#FBFBF9] rounded-xl border border-[#E6E9EF] flex items-center justify-center text-xs text-[#5C6B73]">
      Loading interactive map...
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

  // Step 1: Organisation & Auth (auto-populated with user's real signup info)
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerRole, setOwnerRole] = useState<"Distributor / Owner" | "Wholesale Dealer">("Distributor / Owner");

  useEffect(() => {
    async function loadRegisteredProfile() {
      // 1. From active Supabase auth session
      if (user?.user_metadata?.name) {
        setOwnerName(user.user_metadata.name);
      }
      if (user?.user_metadata?.business_name) {
        setBusinessName(user.user_metadata.business_name);
      }

      // 2. From local profile if present
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

  // Step 5: Products & Intervals (clean zero-mock)
  const [products, setProducts] = useState<ProductConfig[]>([]);
  const [newProdName, setNewProdName] = useState("");
  const [newProdInterval, setNewProdInterval] = useState(7);

  // Step 6: Region / Route Name
  const [primaryRoute, setPrimaryRoute] = useState("North Market");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Save intermediate configurations to Dexie
  const handleSaveStep = async (nextStep: number) => {
    const orgId = "org-waymark-demo";
    const nowIso = new Date().toISOString();

    if (currentStep === 1) {
      // Upsert organisation
      await enqueueWrite("organisations", "upsert", {
        id: orgId,
        name: businessName.trim(),
        currency: "INR",
        created_at: nowIso,
      });
    }

    if (currentStep === 3 || currentStep === 4) {
      // Upsert godown vehicle settings
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
      // Save all products
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
    <div className="min-h-screen bg-[#FBFBF9] py-8 px-4 flex flex-col justify-between">
      <div className="max-w-xl mx-auto w-full">
        {/* Progress Bar & Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5C6B73] mb-2 font-heading">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% Completed</span>
          </div>
          <div className="w-full h-1.5 bg-[#E6E9EF] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#F2A900] transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard Box */}
        <div className="bg-white border border-[#E6E9EF] rounded-2xl p-6 shadow-xs">
          {/* STEP 1: Organisation & Auth */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#F2A900]/15 text-ink flex items-center justify-center">
                  <Building2 size={20} className="text-[#F2A900]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink font-heading">Organisation & Profile</h2>
                  <p className="text-xs text-[#5C6B73]">Tell us about your FMCG distribution setup</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Business Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Apex FMCG Agency"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E6E9EF] focus:outline-none focus:border-[#F2A900]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Owner / Operator Name</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Your name"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E6E9EF] focus:outline-none focus:border-[#F2A900]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Role in Business</label>
                  <select
                    value={ownerRole}
                    onChange={(e) => setOwnerRole(e.target.value as any)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E6E9EF] bg-white focus:outline-none focus:border-[#F2A900]"
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
                  className="px-6 py-2.5 rounded-xl bg-[#F2A900] text-ink font-bold text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
                >
                  Continue to Team <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Team Size */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#F2A900]/15 text-ink flex items-center justify-center">
                  <Users size={20} className="text-[#F2A900]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink font-heading">Team Size</h2>
                  <p className="text-xs text-[#5C6B73]">Do you run routes alone or manage delivery staff?</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTeamSize("solo")}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    teamSize === "solo"
                      ? "border-[#F2A900] bg-[#F2A900]/10 shadow-xs"
                      : "border-[#E6E9EF] hover:bg-[#FBFBF9]"
                  }`}
                >
                  <div className="font-bold text-sm text-ink mb-1">Just Me</div>
                  <div className="text-xs text-[#5C6B73]">I ride and deliver the rounds myself</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTeamSize("team")}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    teamSize === "team"
                      ? "border-[#F2A900] bg-[#F2A900]/10 shadow-xs"
                      : "border-[#E6E9EF] hover:bg-[#FBFBF9]"
                  }`}
                >
                  <div className="font-bold text-sm text-ink mb-1">I Have Staff</div>
                  <div className="text-xs text-[#5C6B73]">I have delivery boys / drivers on routes</div>
                </button>
              </div>

              {teamSize === "team" && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Invite First Driver (Phone Number)
                  </label>
                  <input
                    type="tel"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="e.g. 9820099887 (or skip for now)"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E6E9EF] tabular-nums focus:outline-none focus:border-[#F2A900]"
                  />
                  <span className="text-[11px] text-[#5C6B73] mt-1 block">
                    You can manage drivers and assign specific routes anytime under Team.
                  </span>
                </div>
              )}

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 rounded-xl border border-[#E6E9EF] text-xs font-semibold text-ink hover:bg-[#E6E9EF]/30 flex items-center gap-1"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveStep(3)}
                  className="px-6 py-2.5 rounded-xl bg-[#F2A900] text-ink font-bold text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
                >
                  Continue to Vehicle <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Vehicle & Fuel */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#F2A900]/15 text-ink flex items-center justify-center">
                  <Truck size={20} className="text-[#F2A900]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink font-heading">Vehicle & Petrol Cost</h2>
                  <p className="text-xs text-[#5C6B73]">Used to calculate route fuel burn & delivery cost</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Vehicle Model / Type</label>
                  <input
                    type="text"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    placeholder="e.g. Tata Ace, Bolero Maxi, Hero Splendor"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E6E9EF] focus:outline-none focus:border-[#F2A900]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Mileage (km / L)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={mileage}
                      onChange={(e) => setMileage(parseFloat(e.target.value) || 20)}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E6E9EF] tabular-nums focus:outline-none focus:border-[#F2A900]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Petrol Price (₹ / L)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={petrolPrice}
                      onChange={(e) => setPetrolPrice(parseFloat(e.target.value) || 104)}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E6E9EF] tabular-nums focus:outline-none focus:border-[#F2A900]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 rounded-xl border border-[#E6E9EF] text-xs font-semibold text-ink hover:bg-[#E6E9EF]/30 flex items-center gap-1"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveStep(4)}
                  className="px-6 py-2.5 rounded-xl bg-[#F2A900] text-ink font-bold text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
                >
                  Set Godown Pin <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Central Godown Pin */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#F2A900]/15 text-ink flex items-center justify-center">
                  <MapPin size={20} className="text-[#F2A900]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink font-heading">Godown / Warehouse Pin</h2>
                  <p className="text-xs text-[#5C6B73]">Search or tap to pin where daily routes start and end</p>
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
                  className="px-4 py-2 rounded-xl border border-[#E6E9EF] text-xs font-semibold text-ink hover:bg-[#E6E9EF]/30 flex items-center gap-1"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveStep(5)}
                  className="px-6 py-2.5 rounded-xl bg-[#F2A900] text-ink font-bold text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
                >
                  Configure Products <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Products & Default Intervals */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#F2A900]/15 text-ink flex items-center justify-center">
                  <Package size={20} className="text-[#F2A900]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink font-heading">Products & Restock Intervals</h2>
                  <p className="text-xs text-[#5C6B73]">Items you supply and default restock days</p>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="py-6 px-4 text-center border border-dashed border-[#E6E9EF] rounded-xl bg-[#FBFBF9] text-xs text-[#5C6B73]">
                  No products configured yet. Type the items you supply below (or skip to add them anytime from the Products menu).
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {products.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-[#E6E9EF] bg-[#FBFBF9] text-xs"
                    >
                      <span className="font-semibold text-ink truncate pr-2">{p.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[#5C6B73] tabular-nums font-medium">
                          Every {p.interval} days
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(i)}
                          className="text-[#5C6B73] hover:text-[#D64545] p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Product inline */}
              <div className="p-3 bg-[#E6E9EF]/30 rounded-xl border border-[#E6E9EF] flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add item (e.g. Britannia Bourbon)"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-[#E6E9EF] bg-white focus:outline-none focus:border-[#F2A900]"
                />
                <input
                  type="number"
                  placeholder="Days"
                  min={1}
                  max={60}
                  value={newProdInterval}
                  onChange={(e) => setNewProdInterval(parseInt(e.target.value, 10) || 7)}
                  className="w-16 text-xs px-2 py-1.5 rounded-lg border border-[#E6E9EF] bg-white tabular-nums focus:outline-none focus:border-[#F2A900]"
                />
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="px-3 py-1.5 rounded-lg bg-[#F2A900] text-ink font-semibold text-xs hover:opacity-90"
                >
                  Add
                </button>
              </div>

              <div className="pt-3 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2 rounded-xl border border-[#E6E9EF] text-xs font-semibold text-ink hover:bg-[#E6E9EF]/30 flex items-center gap-1"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveStep(6)}
                  className="px-6 py-2.5 rounded-xl bg-[#F2A900] text-ink font-bold text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
                >
                  Import Shops <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: 3-WAY SHOP IMPORT HUB (Make-or-Break) */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#F2A900]/15 text-ink flex items-center justify-center">
                  <Compass size={20} className="text-[#F2A900]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink font-heading">Import Existing Shops</h2>
                  <p className="text-xs text-[#5C6B73]">
                    Choose the fastest way to get your retailer route into Waymark
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
                  className="text-xs font-semibold text-[#5C6B73] hover:text-ink flex items-center gap-1"
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