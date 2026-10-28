"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  Download,
  Share2,
  Mail,
  CheckCircle2,
  Printer,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { LocalInvoice } from "@/lib/db/dexie";

interface InvoiceReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: LocalInvoice | null;
  pdfDataUrl?: string;
  whatsAppUrl?: string | null;
  emailSent?: boolean;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  isOpen,
  onClose,
  invoice,
  pdfDataUrl,
  whatsAppUrl,
  emailSent,
}) => {
  const [resendEmail, setResendEmail] = useState(invoice?.recipient_email || "");
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(emailSent || false);

  useEffect(() => {
    if (invoice?.recipient_email) {
      setResendEmail(invoice.recipient_email);
    }
    setSendSuccess(emailSent || false);
  }, [invoice?.recipient_email, emailSent]);

  if (!isOpen || !invoice) return null;

  const handleDownload = () => {
    if (!pdfDataUrl) return;
    const a = document.createElement("a");
    a.href = pdfDataUrl;
    a.download = `Invoice_${invoice.invoice_no.replace(/[\/\\]/g, "_")}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSendEmail = async () => {
    if (!resendEmail || !resendEmail.includes("@") || !pdfDataUrl) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: invoice.invoice_no,
          recipientEmail: resendEmail.trim(),
          shopName: invoice.shop_name,
          amount: invoice.total_amount,
          pdfBase64: pdfDataUrl,
        }),
      });
      if (res.ok) {
        setSendSuccess(true);
      }
    } catch (err) {
      console.error("Failed to send email:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (whatsAppUrl) {
      window.open(whatsAppUrl, "_blank");
    } else {
      const phone = invoice.recipient_whatsapp?.replace(/\D/g, "");
      if (phone) {
        const p = phone.length === 10 ? `91${phone}` : phone;
        const msg = `*Tax Invoice: ${invoice.invoice_no}*\nDear ${invoice.shop_name},\nYour payment of *₹${invoice.total_amount.toLocaleString(
          "en-IN"
        )}* has been received on ${invoice.dated}.`;
        window.open(`https://wa.me/${p}?text=${encodeURIComponent(msg)}`, "_blank");
      }
    }
  };

  const handlePrint = () => {
    if (!pdfDataUrl) return;
    const printWindow = window.open(pdfDataUrl);
    if (printWindow) {
      printWindow.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-[#13141C] border border-black/[0.1] dark:border-white/[0.1] rounded-3xl p-6 shadow-2xl relative text-zinc-950 dark:text-white space-y-5 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-[#D4F638] flex items-center justify-center border border-emerald-500/20">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-[#D4F638]">
                  GST Tax Invoice Generated
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <h3 className="text-lg font-extrabold text-zinc-950 dark:text-white tracking-tight">
                {invoice.invoice_no}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/[0.06] hover:bg-zinc-200 dark:hover:bg-white/[0.12] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Invoice Summary Card */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#181924] border border-black/[0.06] dark:border-white/[0.06] space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                Buyer / Customer
              </span>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                {invoice.shop_name}
              </h4>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                Dated: {invoice.dated} · Mode: {invoice.mode_of_payment}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                Total Amount
              </span>
              <span className="text-lg font-extrabold text-zinc-950 dark:text-white font-mono">
                ₹{invoice.total_amount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-500">
              Tax: ₹{(invoice.cgst_amount + invoice.sgst_amount).toFixed(2)} (CGST + SGST)
            </span>
            <span className="text-emerald-600 dark:text-[#D4F638] font-bold">
              2 Pages: Recipient + Transporter
            </span>
          </div>
        </div>

        {/* Delivery Status Indicator */}
        <div className="space-y-2">
          {sendSuccess ? (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 font-mono">
              <CheckCircle2 size={15} className="text-emerald-600 dark:text-[#D4F638]" />
              <span>Tax invoice PDF sent via email to {invoice.recipient_email}</span>
            </div>
          ) : invoice.recipient_email ? (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-500/20 text-blue-800 dark:text-blue-300 text-xs flex items-center justify-between font-mono">
              <div className="flex items-center gap-2">
                <Mail size={14} />
                <span>Ready to email: {invoice.recipient_email}</span>
              </div>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSending}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold"
              >
                {isSending ? "Sending..." : "Send Now"}
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2 font-mono">
              <MessageSquare size={14} />
              <span>No email on file — WhatsApp delivery ready for customer</span>
            </div>
          )}
        </div>

        {/* Quick Share Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="py-3 px-4 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-2xl font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Share2 size={15} />
            <span>Send on WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="py-3 px-4 bg-[#D4F638] hover:bg-[#C2E426] text-[#0A0D02] rounded-2xl font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Download size={15} />
            <span>Download PDF</span>
          </button>
        </div>

        {/* Secondary Actions: Print Preview & Email input */}
        <div className="pt-2 border-t border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handlePrint}
            className="text-zinc-500 hover:text-zinc-950 dark:hover:text-white flex items-center gap-1.5 font-mono text-[11px] transition-colors"
          >
            <Printer size={13} />
            <span>Print Preview</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#181924] dark:hover:bg-[#202230] text-zinc-800 dark:text-zinc-200 font-mono text-xs font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
