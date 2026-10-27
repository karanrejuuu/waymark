import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { InvoiceData } from "./invoiceTypes";

export async function generateInvoicePdf(data: InvoiceData): Promise<{
  doc: jsPDF;
  blob: Blob;
  dataUrl: string;
  arrayBuffer: ArrayBuffer;
}> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Generate UPI QR Code image as data URL
  let qrCodeDataUrl = "";
  try {
    const upiString = `upi://pay?pa=${encodeURIComponent(
      data.seller.upiId || "8714347600@upi"
    )}&pn=${encodeURIComponent(data.seller.companyName)}&am=${data.totalAmount.toFixed(
      2
    )}&cu=INR&tn=${encodeURIComponent("Inv " + data.metadata.invoiceNo)}`;
    qrCodeDataUrl = await QRCode.toDataURL(upiString, {
      margin: 1,
      width: 150,
      errorCorrectionLevel: "M",
    });
  } catch (err) {
    console.warn("QR code generation warning:", err);
  }

  // Draw Page 1: Original for Recipient
  drawInvoicePage(doc, data, qrCodeDataUrl, "(ORIGINAL FOR RECIPIENT)");

  // Draw Page 2: Duplicate for Transporter
  doc.addPage();
  drawInvoicePage(doc, data, qrCodeDataUrl, "(DUPLICATE FOR TRANSPORTER)");

  const arrayBuffer = doc.output("arraybuffer");
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
  const dataUrl = doc.output("dataurlstring");

  return { doc, blob, dataUrl, arrayBuffer };
}

function drawInvoicePage(
  doc: jsPDF,
  data: InvoiceData,
  qrCodeDataUrl: string,
  copyLabel: string
) {
  // Page boundaries (A4: 210 x 297 mm)
  const left = 10;
  const top = 14;
  const right = 200;
  const width = right - left; // 190 mm
  const boxHeight = 268; // ends at 282 mm

  doc.setDrawColor(0, 0, 0);
  doc.setTextColor(0, 0, 0);

  // 1. Top Title & Copy Label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Tax Invoice", 105, top - 2, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(copyLabel, right, top - 2, { align: "right" });

  // 2. Outer Rectangle Frame
  doc.setLineWidth(0.3);
  doc.rect(left, top, width, boxHeight);

  // 3. Upper Section: Seller (Left) & Metadata Grid (Right)
  const midX = 105;
  const upperSectionHeight = 72; // y = 14 to 86
  doc.line(midX, top, midX, top + upperSectionHeight);

  // --- Seller Box (Left Column, Top Half) ---
  let curY = top + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(data.seller.companyName || "KN Products", left + 2, curY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  curY += 3.5;
  if (data.seller.addressLine1) {
    doc.text(data.seller.addressLine1, left + 2, curY);
    curY += 3.5;
  }
  if (data.seller.addressLine2) {
    doc.text(data.seller.addressLine2, left + 2, curY);
    curY += 3.5;
  }
  if (data.seller.cityPincode) {
    doc.text(data.seller.cityPincode, left + 2, curY);
    curY += 3.5;
  }
  doc.text(`Mob : ${data.seller.mobile || ""}`, left + 2, curY);
  curY += 3.5;
  doc.text(`GSTIN/UIN: ${data.seller.gstin || ""}`, left + 2, curY);
  curY += 3.5;
  doc.text(
    `State Name : ${data.seller.stateName || "Kerala"}, Code : ${
      data.seller.stateCode || "32"
    }`,
    left + 2,
    curY
  );
  curY += 3.5;
  doc.text(`Contact : ${data.seller.contact || ""}`, left + 2, curY);

  // --- Buyer Box (Left Column, Lower Half) ---
  const buyerDividerY = top + 34;
  doc.line(left, buyerDividerY, midX, buyerDividerY);

  curY = buyerDividerY + 3.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Buyer (Bill to)", left + 2, curY);

  curY += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  // Split long shop name if needed
  const splitBuyerName = doc.splitTextToSize(
    data.buyer.shopName || "Cochin Kirana Store",
    midX - left - 4
  );
  doc.text(splitBuyerName, left + 2, curY);
  curY += splitBuyerName.length * 3.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  if (data.buyer.address) {
    const splitAddr = doc.splitTextToSize(data.buyer.address, midX - left - 4);
    doc.text(splitAddr, left + 2, curY);
    curY += splitAddr.length * 3.2;
  }

  doc.text(`GSTIN/UIN : ${data.buyer.gstin || "Unregistered"}`, left + 2, curY);
  curY += 3.5;
  doc.text(
    `State Name : ${data.buyer.stateName || "Kerala"}, Code : ${
      data.buyer.stateCode || "32"
    }`,
    left + 2,
    curY
  );
  curY += 3.5;
  doc.text(`Contact : ${data.buyer.contact || ""}`, left + 2, curY);
  curY += 3.5;
  doc.text(`E-Mail : ${data.buyer.email || ""}`, left + 2, curY);

  // --- Metadata Grid (Right Column) ---
  const metaMidX = 152.5;
  const rowHeight = 10.28; // 7 rows = ~72mm
  for (let r = 1; r < 7; r++) {
    doc.line(midX, top + r * rowHeight, right, top + r * rowHeight);
  }
  // Vertical column inside metadata rows 1-6
  doc.line(metaMidX, top, metaMidX, top + 6 * rowHeight);

  // Helper to draw metadata cell
  const drawMetaCell = (
    label: string,
    value: string | undefined,
    x: number,
    y: number
  ) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(label, x + 1.5, y + 3);
    if (value) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(value, x + 1.5, y + 7.5);
    }
  };

  // Row 1
  drawMetaCell("Invoice No.", data.metadata.invoiceNo, midX, top);
  drawMetaCell("Dated", data.metadata.dated, metaMidX, top);

  // Row 2
  drawMetaCell("Delivery Note", data.metadata.deliveryNote, midX, top + rowHeight);
  drawMetaCell(
    "Mode/Terms of Payment",
    data.metadata.modeOfPayment,
    metaMidX,
    top + rowHeight
  );

  // Row 3
  drawMetaCell(
    "Reference No. & Date.",
    data.metadata.referenceNoAndDate,
    midX,
    top + 2 * rowHeight
  );
  drawMetaCell(
    "Other References",
    data.metadata.otherReferences,
    metaMidX,
    top + 2 * rowHeight
  );

  // Row 4
  drawMetaCell(
    "Buyer's Order No.",
    data.metadata.buyersOrderNo,
    midX,
    top + 3 * rowHeight
  );
  drawMetaCell("Dated", data.metadata.orderDated, metaMidX, top + 3 * rowHeight);

  // Row 5
  drawMetaCell(
    "Dispatch Doc No.",
    data.metadata.dispatchDocNo,
    midX,
    top + 4 * rowHeight
  );
  drawMetaCell(
    "Delivery Note Date",
    data.metadata.deliveryNoteDate,
    metaMidX,
    top + 4 * rowHeight
  );

  // Row 6
  drawMetaCell(
    "Dispatched through",
    data.metadata.dispatchedThrough || "Van / Tempo",
    midX,
    top + 5 * rowHeight
  );
  drawMetaCell(
    "Destination",
    data.metadata.destination || data.buyer.shopName,
    metaMidX,
    top + 5 * rowHeight
  );

  // Row 7 (Full width terms)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("Terms of Delivery", midX + 1.5, top + 6 * rowHeight + 3);
  if (data.metadata.termsOfDelivery) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(
      data.metadata.termsOfDelivery,
      midX + 1.5,
      top + 6 * rowHeight + 7.5
    );
  }

  // 4. Line Items Table (y = 86 to 175)
  const tableTopY = top + upperSectionHeight; // 86
  const tableHeaderHeight = 9;
  const tableBottomY = 175;

  // Horizontal line separating upper section & line items table
  doc.line(left, tableTopY, right, tableTopY);
  // Line separating line items header row
  doc.line(left, tableTopY + tableHeaderHeight, right, tableTopY + tableHeaderHeight);

  // Table Columns
  // Sl No (10-18), Desc (18-95), HSN (95-112), Qty (112-132), RateIncl (132-152), Rate (152-168), per (168-176), Amount (176-200)
  const colX = {
    slNo: 10,
    desc: 18,
    hsn: 95,
    qty: 112,
    rateIncl: 132,
    rate: 152,
    per: 168,
    amount: 176,
    end: 200,
  };

  // Draw Vertical lines for columns down to tableBottomY
  const colKeys = [
    colX.desc,
    colX.hsn,
    colX.qty,
    colX.rateIncl,
    colX.rate,
    colX.per,
    colX.amount,
  ];
  for (const cx of colKeys) {
    doc.line(cx, tableTopY, cx, tableBottomY);
  }

  // Column Headers
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("Sl\nNo.", colX.slNo + 4, tableTopY + 3.5, { align: "center" });
  doc.text("Description of Goods", colX.desc + 2, tableTopY + 5.5);
  doc.text("HSN/SAC", colX.hsn + 8.5, tableTopY + 5.5, { align: "center" });
  doc.text("Quantity", colX.qty + 10, tableTopY + 5.5, { align: "center" });
  doc.text("Rate\n(Incl. of Tax)", colX.rateIncl + 10, tableTopY + 3.5, {
    align: "center",
  });
  doc.text("Rate", colX.rate + 8, tableTopY + 5.5, { align: "center" });
  doc.text("per", colX.per + 4, tableTopY + 5.5, { align: "center" });
  doc.text("Amount", colX.amount + 12, tableTopY + 5.5, { align: "center" });

  // Render Line Items
  let itemY = tableTopY + tableHeaderHeight + 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  let totalQty = 0;
  data.items.forEach((item, idx) => {
    totalQty += item.quantity;
    doc.setFont("helvetica", "normal");
    doc.text(String(idx + 1), colX.slNo + 4, itemY, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.text(item.description, colX.desc + 2, itemY);

    doc.setFont("helvetica", "normal");
    doc.text(item.hsnSac || "0910", colX.hsn + 8.5, itemY, { align: "center" });
    doc.text(`${item.quantity} ${item.unit || "nos"}`, colX.qty + 10, itemY, {
      align: "center",
    });
    doc.text(item.rateInclTax.toFixed(2), colX.rateIncl + 18, itemY, {
      align: "right",
    });
    doc.text(item.rateExclTax.toFixed(2), colX.rate + 16, itemY, {
      align: "right",
    });
    doc.text(item.unit || "nos", colX.per + 4, itemY, { align: "center" });
    doc.text(item.amount.toFixed(2), colX.end - 2, itemY, { align: "right" });

    itemY += 6;
  });

  // Under line items: CGST, SGST, Round off
  itemY = Math.max(itemY + 4, 138);

  // CGST line
  doc.setFont("helvetica", "bold");
  doc.text("Cgst", colX.qty - 2, itemY, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(data.cgstAmount.toFixed(2), colX.end - 2, itemY, { align: "right" });
  itemY += 5;

  // SGST line
  doc.setFont("helvetica", "bold");
  doc.text("Sgst", colX.qty - 2, itemY, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(data.sgstAmount.toFixed(2), colX.end - 2, itemY, { align: "right" });
  itemY += 5;

  // Round Off line
  if (data.roundOff !== 0) {
    doc.setFont("helvetica", "normal");
    doc.text("Less :", colX.desc + 2, itemY);
    doc.setFont("helvetica", "bold");
    doc.text("Round Off", colX.qty - 2, itemY, { align: "right" });
    doc.setFont("helvetica", "normal");
    const roundOffStr =
      data.roundOff < 0
        ? `(-)${Math.abs(data.roundOff).toFixed(2)}`
        : data.roundOff.toFixed(2);
    doc.text(roundOffStr, colX.end - 2, itemY, { align: "right" });
    itemY += 5;
  }

  // Total Line Row
  const totalRowY = tableBottomY - 7;
  doc.line(left, totalRowY, right, totalRowY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Total", colX.qty - 2, totalRowY + 4.5, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.text(`${totalQty} nos`, colX.qty + 10, totalRowY + 4.5, {
    align: "center",
  });
  doc.text(`INR ${data.totalAmount.toFixed(2)}`, colX.end - 2, totalRowY + 4.5, {
    align: "right",
  });

  // 5. Amount in Words Row (y = 175 to 184)
  const amountWordsY = tableBottomY; // 175
  doc.line(left, amountWordsY, right, amountWordsY);
  const amountWordsEndY = amountWordsY + 9;
  doc.line(left, amountWordsEndY, right, amountWordsEndY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("Amount Chargeable (in words)", left + 2, amountWordsY + 3.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(data.amountInWords, left + 2, amountWordsY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("E. & O.E", right - 2, amountWordsY + 7, { align: "right" });

  // 6. Tax Summary Table & UPI QR Code (y = 184 to 226)
  const taxSectionY = amountWordsEndY; // 184
  const qrBoxWidth = 38;
  const qrDividerX = left + qrBoxWidth; // 48
  const taxSectionHeight = 42; // ends at 226
  const taxSectionEndY = taxSectionY + taxSectionHeight;

  doc.line(qrDividerX, taxSectionY, qrDividerX, taxSectionEndY);

  // Render UPI QR Code inside Left Sub-Box
  if (qrCodeDataUrl) {
    try {
      doc.addImage(qrCodeDataUrl, "PNG", left + 4, taxSectionY + 2, 30, 30);
    } catch {}
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Scan to pay", left + 19, taxSectionY + 35, { align: "center" });

  // Tax Breakdown Table (Right Sub-Box: x = 48 to 200)
  const taxColX = {
    hsn: 48,
    taxVal: 76,
    cgst: 104,
    sgst: 140,
    totalTax: 176,
    end: 200,
  };

  const taxTableTop = taxSectionY;
  const taxHeaderHeight = 9;
  doc.line(qrDividerX, taxTableTop + taxHeaderHeight, right, taxTableTop + taxHeaderHeight);

  // Vertical lines in tax breakdown
  doc.line(taxColX.taxVal, taxTableTop, taxColX.taxVal, taxTableTop + 24);
  doc.line(taxColX.cgst, taxTableTop, taxColX.cgst, taxTableTop + 24);
  doc.line(taxColX.sgst, taxTableTop, taxColX.sgst, taxTableTop + 24);
  doc.line(taxColX.totalTax, taxTableTop, taxColX.totalTax, taxTableTop + 24);

  // Sub-division inside CGST and SGST headers
  const cgstMidX = (taxColX.cgst + taxColX.sgst) / 2; // 122
  const sgstMidX = (taxColX.sgst + taxColX.totalTax) / 2; // 158

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("HSN/SAC", (taxColX.hsn + taxColX.taxVal) / 2, taxTableTop + 5.5, {
    align: "center",
  });
  doc.text(
    "Taxable\nValue",
    (taxColX.taxVal + taxColX.cgst) / 2,
    taxTableTop + 3.5,
    { align: "center" }
  );

  // CGST header
  doc.text("CGST", (taxColX.cgst + taxColX.sgst) / 2, taxTableTop + 3.5, {
    align: "center",
  });
  doc.text("Rate", (taxColX.cgst + cgstMidX) / 2, taxTableTop + 7.5, {
    align: "center",
  });
  doc.text("Amount", (cgstMidX + taxColX.sgst) / 2, taxTableTop + 7.5, {
    align: "center",
  });
  doc.line(taxColX.cgst, taxTableTop + 4.5, taxColX.sgst, taxTableTop + 4.5);
  doc.line(cgstMidX, taxTableTop + 4.5, cgstMidX, taxTableTop + 24);

  // SGST header
  doc.text("SGST/UTGST", (taxColX.sgst + taxColX.totalTax) / 2, taxTableTop + 3.5, {
    align: "center",
  });
  doc.text("Rate", (taxColX.sgst + sgstMidX) / 2, taxTableTop + 7.5, {
    align: "center",
  });
  doc.text("Amount", (sgstMidX + taxColX.totalTax) / 2, taxTableTop + 7.5, {
    align: "center",
  });
  doc.line(taxColX.sgst, taxTableTop + 4.5, taxColX.totalTax, taxTableTop + 4.5);
  doc.line(sgstMidX, taxTableTop + 4.5, sgstMidX, taxTableTop + 24);

  // Total Tax Header
  doc.text(
    "Total\nTax Amount",
    (taxColX.totalTax + taxColX.end) / 2,
    taxTableTop + 3.5,
    { align: "center" }
  );

  // Tax Row Values
  const taxValY = taxTableTop + taxHeaderHeight + 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(data.items[0]?.hsnSac || "0910", (taxColX.hsn + taxColX.taxVal) / 2, taxValY, {
    align: "center",
  });
  doc.text(data.subtotal.toFixed(2), taxColX.cgst - 2, taxValY, {
    align: "right",
  });
  doc.text("2.50%", (taxColX.cgst + cgstMidX) / 2, taxValY, {
    align: "center",
  });
  doc.text(data.cgstAmount.toFixed(2), taxColX.sgst - 2, taxValY, {
    align: "right",
  });
  doc.text("2.50%", (taxColX.sgst + sgstMidX) / 2, taxValY, {
    align: "center",
  });
  doc.text(data.sgstAmount.toFixed(2), taxColX.totalTax - 2, taxValY, {
    align: "right",
  });
  const totalTaxAmt = data.cgstAmount + data.sgstAmount;
  doc.text(totalTaxAmt.toFixed(2), taxColX.end - 2, taxValY, {
    align: "right",
  });

  // Tax Total Row
  const taxTotalRowY = taxTableTop + 19;
  doc.line(qrDividerX, taxTotalRowY, right, taxTotalRowY);
  doc.setFont("helvetica", "bold");
  doc.text("Total", (taxColX.hsn + taxColX.taxVal) / 2, taxTotalRowY + 4, {
    align: "center",
  });
  doc.text(data.subtotal.toFixed(2), taxColX.cgst - 2, taxTotalRowY + 4, {
    align: "right",
  });
  doc.text(data.cgstAmount.toFixed(2), taxColX.sgst - 2, taxTotalRowY + 4, {
    align: "right",
  });
  doc.text(data.sgstAmount.toFixed(2), taxColX.totalTax - 2, taxTotalRowY + 4, {
    align: "right",
  });
  doc.text(totalTaxAmt.toFixed(2), taxColX.end - 2, taxTotalRowY + 4, {
    align: "right",
  });

  // Tax Amount in Words (below tax breakdown)
  const taxWordsDividerY = taxTableTop + 24;
  doc.line(qrDividerX, taxWordsDividerY, right, taxWordsDividerY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    `Tax Amount (in words) :  ${data.taxAmountInWords}`,
    qrDividerX + 2,
    taxWordsDividerY + 4.5
  );

  // 7. Footer: Declaration, Company Bank Details, Signatory (y = 226 to 276)
  doc.line(left, taxSectionEndY, right, taxSectionEndY);

  const footerDividerX = 120;
  doc.line(footerDividerX, taxSectionEndY, footerDividerX, top + boxHeight);

  // --- Left Footer: Declaration & Bank Details ---
  let footY = taxSectionEndY + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("Declaration", left + 2, footY);
  footY += 3.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  const declText =
    "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.";
  const splitDecl = doc.splitTextToSize(declText, footerDividerX - left - 4);
  doc.text(splitDecl, left + 2, footY);
  footY += splitDecl.length * 3.2 + 3;

  // Bank Details Box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("Company's Bank Details", left + 2, footY);
  footY += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`Bank Name          :  ${data.seller.bankName}`, left + 2, footY);
  footY += 3.5;
  doc.text(`A/c No.               :  ${data.seller.accountNumber}`, left + 2, footY);
  footY += 3.5;
  doc.text(`Branch & IFS Code :  ${data.seller.branchIfsc}`, left + 2, footY);

  // --- Right Footer: Signatory ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(`for ${data.seller.companyName}`, right - 4, taxSectionEndY + 4, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Authorised Signatory", right - 4, top + boxHeight - 4, {
    align: "right",
  });

  // 8. Bottom Center Disclaimer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("This is a Computer Generated Invoice", 105, top + boxHeight + 4, {
    align: "center",
  });
}
