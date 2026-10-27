import { describe, it, expect } from "vitest";
import { numberToWordsRupees } from "../numberToWords";
import { generateInvoicePdf } from "../generateInvoicePdf";
import { InvoiceData } from "../invoiceTypes";

describe("Invoice Generator & Number to Words", () => {
  it("converts amounts correctly to Indian Rupee words", () => {
    expect(numberToWordsRupees(4800)).toBe(
      "INR Four Thousand Eight Hundred Only"
    );
    expect(numberToWordsRupees(228.58)).toBe(
      "INR Two Hundred Twenty Eight and Fifty Eight paise Only"
    );
    expect(numberToWordsRupees(0)).toBe("INR Zero Only");
    expect(numberToWordsRupees(150000)).toBe(
      "INR One Lakh Fifty Thousand Only"
    );
  });

  it("generates a 2-page GST Tax Invoice matching KN Products layout", async () => {
    const sampleInvoice: InvoiceData = {
      metadata: {
        invoiceNo: "KN557/26-27",
        dated: "27-Oct-26",
        modeOfPayment: "Cash",
        deliveryNote: "DN-901",
        referenceNoAndDate: "REF-104",
        dispatchedThrough: "Tempo KL-07-CD-4912",
        destination: "Kochi",
      },
      seller: {
        companyName: "KN Products",
        addressLine1: "PARK ROAD",
        addressLine2: "COVENTHA, PERUMPADAPPU",
        cityPincode: "KOCHI -682006",
        mobile: "8714347600",
        contact: "9895047600",
        gstin: "32AOJPM2028P1ZR",
        stateName: "Kerala",
        stateCode: "32",
        bankName: "DHANLAXMI BANK",
        accountNumber: "001805300007729",
        branchIfsc: "Palluruthy & DLXB0000018",
        upiId: "8714347600@upi",
      },
      buyer: {
        shopName:
          "COCHIN SHIPYARD EMPLOYEES CONSUMER CO-OPERATIVE SOCIETY LTD, NO: E- 750, KOCHI -15",
        address: "Perumpadappu, Kochi - 682006",
        gstin: "32AADAC5517E1ZA",
        stateName: "Kerala",
        stateCode: "32",
        contact: "88922799",
        email: "shipyardsupermarket@gmail.com",
        whatsapp: "9895047600",
      },
      items: [
        {
          slNo: 1,
          description: "Ginger Candy Nos (B4)",
          hsnSac: "0910",
          quantity: 256,
          unit: "nos",
          rateInclTax: 18.75,
          rateExclTax: 17.86,
          amount: 4571.75,
          cgstRate: 2.5,
          cgstAmount: 114.29,
          sgstRate: 2.5,
          sgstAmount: 114.29,
        },
      ],
      subtotal: 4571.75,
      cgstAmount: 114.29,
      sgstAmount: 114.29,
      roundOff: -0.33,
      totalAmount: 4800,
      amountInWords: "INR Four Thousand Eight Hundred Only",
      taxAmountInWords: "INR Two Hundred Twenty Eight and Fifty Eight paise Only",
    };

    const { doc, blob, dataUrl, arrayBuffer } = await generateInvoicePdf(sampleInvoice);

    expect(doc.getNumberOfPages()).toBe(2);
    expect(blob.size).toBeGreaterThan(1000);
    expect(dataUrl.startsWith("data:application/pdf")).toBe(true);

    // Save sample mock PDF to public/ and brain artifact directory
    const fs = await import("fs");
    const path = await import("path");
    const buffer = Buffer.from(arrayBuffer);

    const publicPath = path.resolve(process.cwd(), "public/mock-tax-invoice-sample.pdf");
    fs.writeFileSync(publicPath, buffer);

    const brainPath = "/Users/karanreju/.gemini/antigravity/brain/e2c7e027-6e9a-4690-8813-d420c9201c5d/mock-tax-invoice-sample.pdf";
    try {
      fs.writeFileSync(brainPath, buffer);
    } catch {}

    // Save Page 2 isolated PDF so quicklook can render Page 2 thumbnail
    const docForP2 = await generateInvoicePdf(sampleInvoice);
    docForP2.doc.deletePage(1);
    fs.writeFileSync("/private/tmp/mock-p2.pdf", Buffer.from(docForP2.doc.output("arraybuffer")));
  });
});
