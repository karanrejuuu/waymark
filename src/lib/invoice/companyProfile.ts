import { db, LocalCompanyProfile } from "@/lib/db/dexie";

export const DEFAULT_COMPANY_PROFILE: LocalCompanyProfile = {
  id: "default",
  company_name: "KN Products",
  address_line1: "PARK ROAD",
  address_line2: "COVENTHA, PERUMPADAPPU",
  city_pincode: "KOCHI -682006",
  mobile: "8714347600",
  contact: "9895047600",
  gstin: "32AOJPM2028P1ZR",
  state_name: "Kerala",
  state_code: "32",
  bank_name: "DHANLAXMI BANK",
  account_number: "001805300007729",
  branch_ifsc: "Palluruthy & DLXB0000018",
  upi_id: "8714347600@upi",
  updated_at: new Date().toISOString(),
};

export async function getCompanyProfile(): Promise<LocalCompanyProfile> {
  const hasStorage = typeof window !== "undefined" && typeof localStorage !== "undefined";
  try {
    const existing = await db.company_profiles.get("default");
    if (existing) {
      return existing;
    }
    // Also check localStorage
    if (hasStorage) {
      const saved = localStorage.getItem("waymark_company_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        await db.company_profiles.put(parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch company profile from Dexie:", err);
  }

  // Seed default KN Products profile
  try {
    await db.company_profiles.put(DEFAULT_COMPANY_PROFILE);
    if (hasStorage) {
      localStorage.setItem(
        "waymark_company_profile",
        JSON.stringify(DEFAULT_COMPANY_PROFILE)
      );
    }
  } catch {}

  return DEFAULT_COMPANY_PROFILE;
}

export async function saveCompanyProfile(
  profile: Partial<LocalCompanyProfile>
): Promise<LocalCompanyProfile> {
  const current = await getCompanyProfile();
  const updated: LocalCompanyProfile = {
    ...current,
    ...profile,
    id: "default",
    updated_at: new Date().toISOString(),
  };

  try {
    await db.company_profiles.put(updated);
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.setItem("waymark_company_profile", JSON.stringify(updated));
    }
  } catch (err) {
    console.error("Failed to save company profile:", err);
  }

  return updated;
}
