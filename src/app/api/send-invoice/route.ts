import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      invoiceNumber,
      recipientEmail,
      shopName,
      amount,
      pdfBase64,
      smtpConfig,
    } = body;

    if (!recipientEmail || !recipientEmail.includes("@")) {
      return NextResponse.json(
        { error: "Invalid recipient email address" },
        { status: 400 }
      );
    }

    if (!pdfBase64) {
      return NextResponse.json(
        { error: "Missing PDF attachment data" },
        { status: 400 }
      );
    }

    // Defensive normalization
    const safeInvoiceNo = invoiceNumber ? String(invoiceNumber) : "INV-UNKNOWN";
    const safeShopName = shopName ? String(shopName) : "Valued Customer";
    const safeAmount = typeof amount === "number" ? amount : Number(amount) || 0;
    const filename = `Invoice_${safeInvoiceNo.replace(/[\/\\]/g, "_")}.pdf`;

    // Strip data URL prefix if present
    const base64Content = pdfBase64.replace(/^data:application\/pdf;base64,/, "");

    // 1. Check if Resend API Key is provided
    const resendApiKey = smtpConfig?.resendApiKey || process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const fromEmail =
          smtpConfig?.fromEmail ||
          process.env.RESEND_FROM ||
          "billing@apexwholesale.com";

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: recipientEmail,
            subject: `Tax Invoice ${safeInvoiceNo} — ${safeShopName} (₹${safeAmount.toLocaleString(
              "en-IN"
            )})`,
            html: `
              <div style="font-family: sans-serif; line-height: 1.5; color: #111;">
                <h2>Tax Invoice & Payment Receipt</h2>
                <p>Dear ${safeShopName},</p>
                <p>Thank you for your business. Please find attached your official Tax Invoice & Receipt <strong>${safeInvoiceNo}</strong> for the amount of <strong>₹${safeAmount.toLocaleString(
              "en-IN"
            )}</strong>.</p>
                <p>Payment has been recorded in our wholesale dispatch system.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #666;">This is a computer generated invoice. For any inquiries, please contact your delivery agent.</p>
              </div>
            `,
            attachments: [
              {
                filename,
                content: base64Content,
              },
            ],
          }),
        });

        const resendData = await resendRes.json();
        if (resendRes.ok) {
          return NextResponse.json({
            success: true,
            provider: "resend",
            messageId: resendData.id,
          });
        } else {
          console.warn("Resend API warning:", resendData);
        }
      } catch (resendErr) {
        console.warn("Resend attempt failed, falling back to SMTP:", resendErr);
      }
    }

    // 2. Check SMTP configuration
    const host = smtpConfig?.smtpHost || process.env.SMTP_HOST;
    const port = smtpConfig?.smtpPort || Number(process.env.SMTP_PORT) || 587;
    const user = smtpConfig?.smtpUser || process.env.SMTP_USER;
    const pass = smtpConfig?.smtpPass || process.env.SMTP_PASS;
    const from =
      smtpConfig?.fromEmail ||
      process.env.SMTP_FROM ||
      user ||
      "billing@distributor.com";

    if (host && user && pass) {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      const info = await transporter.sendMail({
        from,
        to: recipientEmail,
        subject: `Tax Invoice ${safeInvoiceNo} — ${safeShopName} (₹${safeAmount.toLocaleString(
          "en-IN"
        )})`,
        text: `Dear ${safeShopName},\n\nPlease find attached your Tax Invoice ${safeInvoiceNo} for ₹${safeAmount.toLocaleString(
          "en-IN"
        )}.\n\nThank you for your business.`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.5; color: #111;">
            <h2>Tax Invoice & Payment Receipt</h2>
            <p>Dear ${safeShopName},</p>
            <p>Please find attached your Tax Invoice & Receipt <strong>${safeInvoiceNo}</strong> for the amount of <strong>₹${safeAmount.toLocaleString(
          "en-IN"
        )}</strong>.</p>
            <p>Payment has been recorded successfully.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666;">This is a computer generated invoice.</p>
          </div>
        `,
        attachments: [
          {
            filename,
            content: Buffer.from(base64Content, "base64"),
            contentType: "application/pdf",
          },
        ],
      });

      return NextResponse.json({
        success: true,
        provider: "smtp",
        messageId: info.messageId,
      });
    }

    // 3. Fallback / Test Mode when credentials are not yet entered in Settings
    return NextResponse.json({
      success: true,
      simulated: true,
      message:
        "Preview Mode: Email prepared with PDF attachment. Configure SMTP or Resend credentials in Settings to deliver live emails.",
    });
  } catch (err: any) {
    console.error("Failed to process send-invoice request:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send invoice" },
      { status: 500 }
    );
  }
}
