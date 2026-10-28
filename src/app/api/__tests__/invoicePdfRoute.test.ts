import { describe, it, expect } from "vitest";
import { GET } from "../invoice/pdf/route";
import { NextRequest } from "next/server";

describe("API: GET /api/invoice/pdf", () => {
  it("dynamically generates a 2-page GST Tax Invoice PDF", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/invoice/pdf?no=KP557/26-27&shop=Mattancherry%20Kirana%20Depot&amt=1750&mode=Cash"
    );

    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toContain("Tax_Invoice_KP557_26-27.pdf");

    const arrayBuffer = await res.arrayBuffer();
    expect(arrayBuffer.byteLength).toBeGreaterThan(1000);

    // PDF magic bytes: %PDF-
    const header = Buffer.from(arrayBuffer.slice(0, 5)).toString("utf-8");
    expect(header).toBe("%PDF-");
  });
});
