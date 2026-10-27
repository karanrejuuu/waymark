import { db, LocalShop, LocalInvoice } from "@/lib/db/dexie";
import { getCompanyProfile } from "./companyProfile";
import { generateInvoicePdf } from "./generateInvoicePdf";
import { InvoiceData, InvoiceLineItem } from "./invoiceTypes";
import { numberToWordsRupees } from "./numberToWords";

export interface ProcessReceiptOptions {
  shop: LocalShop;
  amount: number;
  paymentMode: string;
  items?: Array<{
    name: string;
    qty: number;
    unitPrice?: number;
    unit?: string;
    hsnSac?: string;
  }>;
  deliveryId?: string;
  paymentId?: string;
}

export interface ProcessReceiptResult {
  invoice: LocalInvoice;
  pdfDataUrl: string;
  pdfBlob: Blob;
  whatsAppUrl: string | null;
  emailSent: boolean;
  emailRecipient: string | null;
  message: string;
}

/**
 * Generates the official GST Tax Invoice matching KN Products layout,
 * saves it to Dexie, emails it if email exists, and prepares 1-tap WhatsApp share.
 */
export async function processPaymentReceipt(
  options: ProcessReceiptOptions
): Promise<ProcessReceiptResult> {
  const { shop, amount, paymentMode, items, deliveryId, paymentId } = options;
  const seller = await getCompanyProfile();

  // Compute fiscal year (e.g. 2026-2027 -> "26-27")
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (April is 3)
  const fyStart = currentMonth >= 3 ? currentYear : currentYear - 1;
  const fyEnd = fyStart + 1;
  const fyString = `${String(fyStart).slice(-2)}-${String(fyEnd).slice(-2)}`;

  // Generate sequential invoice number (e.g. KN557/26-27)
  const totalInvoices = await db.invoices.count();
  const invSeq = 557 + totalInvoices;
  const prefix = seller.company_name
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 3) || "KN";
  const invoiceNo = `${prefix}${invSeq}/${fyString}`;

  // Date in format: "27-Oct-26"
  const dayStr = String(now.getDate()).padStart(2, "0");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthStr = monthNames[now.getMonth()];
  const yearStr = String(now.getFullYear()).slice(-2);
  const datedStr = `${dayStr}-${monthStr}-${yearStr}`;

  // Calculate items and GST (standard 5% GST: 2.5% CGST + 2.5% SGST)
  const totalTaxRate = 0.05; // 5%
  const lineItems: InvoiceLineItem[] = [];

  if (items && items.length > 0) {
    items.forEach((it, idx) => {
      const qty = it.qty || 1;
      const rateIncl = it.unitPrice || amount / qty;
      const rateExcl = rateIncl / (1 + totalTaxRate);
      const taxableAmt = rateExcl * qty;
      const cgst = taxableAmt * 0.025;
      const sgst = taxableAmt * 0.025;

      lineItems.push({
        slNo: idx + 1,
        description: it.name || "Ginger Candy Nos (B4)",
        hsnSac: it.hsnSac || "0910",
        quantity: qty,
        unit: it.unit || "nos",
        rateInclTax: parseFloat(rateIncl.toFixed(2)),
        rateExclTax: parseFloat(rateExcl.toFixed(2)),
        amount: parseFloat(taxableAmt.toFixed(2)),
        cgstRate: 2.5,
        cgstAmount: parseFloat(cgst.toFixed(2)),
        sgstRate: 2.5,
        sgstAmount: parseFloat(sgst.toFixed(2)),
      });
    });
  } else {
    // Default single line item if specific products aren't passed
    const qty = 1;
    const rateIncl = amount;
    const rateExcl = rateIncl / (1 + totalTaxRate);
    const taxableAmt = rateExcl;
    const cgst = taxableAmt * 0.025;
    const sgst = taxableAmt * 0.025;

    lineItems.push({
      slNo: 1,
      description: "FMCG Goods & Confectionery (B4)",
      hsnSac: "0910",
      quantity: qty,
      unit: "nos",
      rateInclTax: parseFloat(rateIncl.toFixed(2)),
      rateExclTax: parseFloat(rateExcl.toFixed(2)),
      amount: parseFloat(taxableAmt.toFixed(2)),
      cgstRate: 2.5,
      cgstAmount: parseFloat(cgst.toFixed(2)),
      sgstRate: 2.5,
      sgstAmount: parseFloat(sgst.toFixed(2)),
    });
  }

  // Sum subtotals and compute round-off
  const subtotal = lineItems.reduce((acc, it) => acc + it.amount, 0);
  const cgstAmount = lineItems.reduce((acc, it) => acc + it.cgstAmount, 0);
  const sgstAmount = lineItems.reduce((acc, it) => acc + it.sgstAmount, 0);
  const unroundedTotal = subtotal + cgstAmount + sgstAmount;
  const roundOff = parseFloat((amount - unroundedTotal).toFixed(2));
  const finalTotal = amount;

  const amountInWords = numberToWordsRupees(finalTotal);
  const totalTaxAmount = parseFloat((cgstAmount + sgstAmount).toFixed(2));
  const taxAmountInWords = numberToWordsRupees(totalTaxAmount);

  // Construct InvoiceData
  const invoiceData: InvoiceData = {
    metadata: {
      invoiceNo,
      dated: datedStr,
      modeOfPayment: paymentMode === "upi" ? "UPI" : paymentMode === "cheque" ? "Cheque" : "Cash",
      deliveryNote: `DN-${Date.now().toString().slice(-4)}`,
      dispatchedThrough: "Van / Tempo",
      destination: shop.name,
      termsOfDelivery: "Doorstep Kirana Delivery against Payment",
    },
    seller: {
      companyName: seller.company_name,
      addressLine1: seller.address_line1,
      addressLine2: seller.address_line2,
      cityPincode: seller.city_pincode,
      mobile: seller.mobile,
      contact: seller.contact,
      gstin: seller.gstin,
      stateName: seller.state_name,
      stateCode: seller.state_code,
      bankName: seller.bank_name,
      accountNumber: seller.account_number,
      branchIfsc: seller.branch_ifsc,
      upiId: seller.upi_id,
    },
    buyer: {
      shopName: shop.name,
      address: shop.billing_address || shop.notes || "Kochi",
      contact: shop.contact,
      email: shop.email,
      whatsapp: shop.whatsapp_number || shop.contact,
      gstin: shop.gstin || "Unregistered",
      stateName: shop.state_name || "Kerala",
      stateCode: shop.state_code || "32",
    },
    items: lineItems,
    subtotal: parseFloat(subtotal.toFixed(2)),
    cgstAmount: parseFloat(cgstAmount.toFixed(2)),
    sgstAmount: parseFloat(sgstAmount.toFixed(2)),
    roundOff,
    totalAmount: finalTotal,
    amountInWords,
    taxAmountInWords,
  };

  // Generate 2-Page Vector PDF
  const { blob, dataUrl } = await generateInvoicePdf(invoiceData);

  // Save to Dexie Invoices table
  const invoiceId = `inv-${Date.now()}`;
  const nowIso = now.toISOString();

  const localInvoice: LocalInvoice = {
    id: invoiceId,
    invoice_no: invoiceNo,
    shop_id: shop.id,
    shop_name: shop.name,
    delivery_id: deliveryId || null,
    payment_id: paymentId || null,
    dated: datedStr,
    delivery_note: invoiceData.metadata.deliveryNote,
    mode_of_payment: invoiceData.metadata.modeOfPayment,
    subtotal: invoiceData.subtotal,
    cgst_amount: invoiceData.cgstAmount,
    sgst_amount: invoiceData.sgstAmount,
    round_off: invoiceData.roundOff,
    total_amount: invoiceData.totalAmount,
    amount_in_words: invoiceData.amountInWords,
    tax_amount_in_words: invoiceData.taxAmountInWords,
    items_json: JSON.stringify(lineItems),
    pdf_data_url: dataUrl,
    recipient_email: shop.email || null,
    recipient_whatsapp: shop.whatsapp_number || shop.contact || null,
    sent_via_email: false,
    sent_via_whatsapp: false,
    created_at: nowIso,
  };

  await db.invoices.put(localInvoice);

  // Automated Email Dispatch if shop has email
  let emailSent = false;
  if (shop.email && shop.email.includes("@")) {
    try {
      const emailRes = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: invoiceNo,
          recipientEmail: shop.email,
          shopName: shop.name,
          amount: finalTotal,
          pdfBase64: dataUrl,
          smtpConfig: {
            smtpHost: seller.smtp_host,
            smtpPort: seller.smtp_port,
            smtpUser: seller.smtp_user,
            smtpPass: seller.smtp_pass,
            fromEmail: seller.from_email,
            resendApiKey: seller.resend_api_key,
          },
        }),
      });

      if (emailRes.ok) {
        emailSent = true;
        await db.invoices.update(invoiceId, { sent_via_email: true });
      }
    } catch (err) {
      console.warn("Background invoice email dispatch warning:", err);
    }
  }

  // Prepare WhatsApp 1-Tap Share Link (e.g. if email is empty or for direct messaging)
  const phoneRaw = shop.whatsapp_number || shop.contact || "";
  const phoneClean = phoneRaw.replace(/\D/g, "");
  let whatsAppUrl: string | null = null;

  if (phoneClean) {
    const formattedPhone = phoneClean.length === 10 ? `91${phoneClean}` : phoneClean;
    const msg = `*Tax Invoice: ${invoiceNo}*\nDear ${shop.name},\nThank you for your payment of *₹${finalTotal.toLocaleString(
      "en-IN"
    )}*.\n\nReceipt Details:\n• Date: ${datedStr}\n• Mode: ${
      invoiceData.metadata.modeOfPayment
    }\n• Amount: ₹${finalTotal.toLocaleString(
      "en-IN"
    )}\n\n_Generated by ${seller.company_name} Wholesale Dispatch._`;

    whatsAppUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
  }

  let message = "";
  if (emailSent) {
    message = `Tax Invoice ${invoiceNo} sent to ${shop.email}`;
  } else if (whatsAppUrl) {
    message = `Tax Invoice ${invoiceNo} ready for WhatsApp dispatch`;
  } else {
    message = `Tax Invoice ${invoiceNo} generated successfully`;
  }

  return {
    invoice: localInvoice,
    pdfDataUrl: dataUrl,
    pdfBlob: blob,
    whatsAppUrl,
    emailSent,
    emailRecipient: shop.email || null,
    message,
  };
}
