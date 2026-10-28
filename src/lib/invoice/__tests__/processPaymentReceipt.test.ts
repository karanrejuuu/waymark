import { describe, it, expect, beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { db, LocalShop } from "@/lib/db/dexie";
import { processPaymentReceipt } from "../processPaymentReceipt";
import { getCompanyProfile, saveCompanyProfile, DEFAULT_COMPANY_PROFILE } from "../companyProfile";

describe("processPaymentReceipt & companyProfile", () => {
  beforeEach(async () => {
    await db.invoices.clear();
    await db.company_profiles.clear();
    vi.restoreAllMocks();
  });

  it("retrieves and saves company profile", async () => {
    const profile = await getCompanyProfile();
    expect(profile.company_name).toBe(DEFAULT_COMPANY_PROFILE.company_name);
    expect(profile.gstin).toBe(DEFAULT_COMPANY_PROFILE.gstin);
    expect(profile.bank_name).toBe("DHANLAXMI BANK");

    const updated = await saveCompanyProfile({
      company_name: "KN Products LLP",
      mobile: "9999999999",
    });

    expect(updated.company_name).toBe("KN Products LLP");
    expect(updated.mobile).toBe("9999999999");
    const retrieved = await getCompanyProfile();
    expect(retrieved.company_name).toBe("KN Products LLP");
  });

  it("processes payment receipt with email dispatch and Dexie persistence", async () => {
    // Mock global fetch for /api/send-invoice
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = fetchMock;

    const sampleShop: LocalShop = {
      id: "shop-fortkochi-1",
      name: "Fort Kochi Mini Mart",
      region_id: "region-1",
      contact: "9876543210",
      email: "fortkochi@example.com",
      whatsapp_number: "9876543210",
      gstin: "32ABCDE1234F1Z5",
      billing_address: "Calvathy, Fort Kochi",
      state_name: "Kerala",
      state_code: "32",
      balance_due: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = await processPaymentReceipt({
      shop: sampleShop,
      amount: 4800,
      paymentMode: "cash",
      items: [
        {
          name: "Ginger Candy Nos (B4)",
          qty: 256,
          unitPrice: 18.75,
          unit: "nos",
          hsnSac: "0910",
        },
      ],
    });

    expect(result.invoice).toBeDefined();
    expect(result.invoice.invoice_no).toMatch(/^[A-Z]{2,3}\d+\/\d{2}-\d{2}$/);
    expect(result.invoice.total_amount).toBe(4800);
    expect(result.invoice.amount_in_words).toBe("INR Four Thousand Eight Hundred Only");
    expect(result.pdfDataUrl.startsWith("data:application/pdf")).toBe(true);
    expect(result.emailRecipient).toBe("fortkochi@example.com");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/send-invoice",
      expect.objectContaining({ method: "POST" })
    );

    // Verify stored in Dexie database
    const savedInDb = await db.invoices.get(result.invoice.id);
    expect(savedInDb).toBeDefined();
    expect(savedInDb?.shop_name).toBe("Fort Kochi Mini Mart");
  });

  it("generates 1-tap WhatsApp link when email is empty", async () => {
    const sampleShopNoEmail: LocalShop = {
      id: "shop-mattancherry-2",
      name: "Jew Town Spices",
      region_id: "region-1",
      contact: "9847012345",
      whatsapp_number: "9847012345",
      balance_due: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    const result = await processPaymentReceipt({
      shop: sampleShopNoEmail,
      amount: 2500,
      paymentMode: "upi",
    });

    expect(result.invoice.total_amount).toBe(2500);
    expect(result.emailRecipient).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.whatsAppUrl).toBeDefined();
    expect(result.whatsAppUrl).toContain("https://wa.me/919847012345");
    expect(decodeURIComponent(result.whatsAppUrl!)).toContain("Jew Town Spices");
  });
});
