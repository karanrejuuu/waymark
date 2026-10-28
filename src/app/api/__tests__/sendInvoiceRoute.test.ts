import { describe, it, expect } from "vitest";
import { POST } from "../send-invoice/route";
import { NextRequest } from "next/server";

describe("API: /api/send-invoice", () => {
  it("rejects requests with missing or invalid email", async () => {
    const req = new NextRequest("http://localhost:3000/api/send-invoice", {
      method: "POST",
      body: JSON.stringify({
        recipientEmail: "invalid-email",
        pdfBase64: "data:application/pdf;base64,JVBERi0x...",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid recipient email address");
  });

  it("rejects requests with missing PDF attachment data", async () => {
    const req = new NextRequest("http://localhost:3000/api/send-invoice", {
      method: "POST",
      body: JSON.stringify({
        recipientEmail: "shop@example.com",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Missing PDF attachment data");
  });

  it("returns simulated preview mode when no SMTP or Resend credentials are configured", async () => {
    const req = new NextRequest("http://localhost:3000/api/send-invoice", {
      method: "POST",
      body: JSON.stringify({
        invoiceNumber: "KN557/26-27",
        recipientEmail: "shop@example.com",
        shopName: "Seagull Provisions",
        amount: 3200,
        pdfBase64: "data:application/pdf;base64,JVBERi0xLjQKJ...",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.simulated).toBe(true);
    expect(json.message).toContain("Preview Mode");
  });
});
