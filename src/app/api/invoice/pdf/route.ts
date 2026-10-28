import { NextRequest, NextResponse } from "next/server";
import { generateInvoicePdf } from "@/lib/invoice/generateInvoicePdf";
import { InvoiceData, InvoiceLineItem } from "@/lib/invoice/invoiceTypes";
import { numberToWordsRupees } from "@/lib/invoice/numberToWords";
import { DEFAULT_COMPANY_PROFILE } from "@/lib/invoice/companyProfile";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const invoiceNo = searchParams.get("no") || "KN557/26-27";
    const shopName = searchParams.get("shop") || "Valued Customer";
    const totalAmount = parseFloat(searchParams.get("amt") || "0") || 0;
    const datedStr =
      searchParams.get("date") ||
      new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      }).replace(/ /g, "-");
    const modeOfPayment = searchParams.get("mode") || "Cash";
    const shopGstin = searchParams.get("gstin") || "Unregistered";
    const shopAddress = searchParams.get("addr") || "Kochi, Kerala";
    const itemDesc = searchParams.get("item") || "Ginger Candy Nos (B4)";
    const itemQty = parseInt(searchParams.get("qty") || "1", 10) || 1;

    // Standard 5% GST calculation (2.5% CGST + 2.5% SGST)
    const totalTaxRate = 0.05;
    const rateIncl = totalAmount / itemQty;
    const rateExcl = rateIncl / (1 + totalTaxRate);
    const taxableAmt = rateExcl * itemQty;
    const cgst = taxableAmt * 0.025;
    const sgst = taxableAmt * 0.025;
    const unroundedTotal = taxableAmt + cgst + sgst;
    const roundOff = parseFloat((totalAmount - unroundedTotal).toFixed(2));

    const lineItems: InvoiceLineItem[] = [
      {
        slNo: 1,
        description: itemDesc,
        hsnSac: "0910",
        quantity: itemQty,
        unit: "nos",
        rateInclTax: parseFloat(rateIncl.toFixed(2)),
        rateExclTax: parseFloat(rateExcl.toFixed(2)),
        amount: parseFloat(taxableAmt.toFixed(2)),
        cgstRate: 2.5,
        cgstAmount: parseFloat(cgst.toFixed(2)),
        sgstRate: 2.5,
        sgstAmount: parseFloat(sgst.toFixed(2)),
      },
    ];

    const cgstAmount = parseFloat(cgst.toFixed(2));
    const sgstAmount = parseFloat(sgst.toFixed(2));
    const totalTaxAmount = parseFloat((cgstAmount + sgstAmount).toFixed(2));

    const invoiceData: InvoiceData = {
      metadata: {
        invoiceNo,
        dated: datedStr,
        modeOfPayment,
        deliveryNote: `DN-${Date.now().toString().slice(-4)}`,
        dispatchedThrough: "Tempo / Van",
        destination: shopName,
        termsOfDelivery: "Doorstep Kirana Delivery against Payment",
      },
      seller: {
        companyName: DEFAULT_COMPANY_PROFILE.company_name,
        addressLine1: DEFAULT_COMPANY_PROFILE.address_line1,
        addressLine2: DEFAULT_COMPANY_PROFILE.address_line2,
        cityPincode: DEFAULT_COMPANY_PROFILE.city_pincode,
        mobile: DEFAULT_COMPANY_PROFILE.mobile,
        contact: DEFAULT_COMPANY_PROFILE.contact,
        gstin: DEFAULT_COMPANY_PROFILE.gstin,
        stateName: DEFAULT_COMPANY_PROFILE.state_name,
        stateCode: DEFAULT_COMPANY_PROFILE.state_code,
        bankName: DEFAULT_COMPANY_PROFILE.bank_name,
        accountNumber: DEFAULT_COMPANY_PROFILE.account_number,
        branchIfsc: DEFAULT_COMPANY_PROFILE.branch_ifsc,
        upiId: DEFAULT_COMPANY_PROFILE.upi_id,
      },
      buyer: {
        shopName,
        address: shopAddress,
        gstin: shopGstin,
        stateName: "Kerala",
        stateCode: "32",
      },
      items: lineItems,
      subtotal: parseFloat(taxableAmt.toFixed(2)),
      cgstAmount,
      sgstAmount,
      roundOff,
      totalAmount,
      amountInWords: numberToWordsRupees(totalAmount),
      taxAmountInWords: numberToWordsRupees(totalTaxAmount),
    };

    const { arrayBuffer } = await generateInvoicePdf(invoiceData);

    const safeFilename = `Tax_Invoice_${invoiceNo.replace(/[\/\\]/g, "_")}.pdf`;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${safeFilename}"`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err: any) {
    console.error("Failed to generate dynamic invoice PDF:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate invoice PDF" },
      { status: 500 }
    );
  }
}
