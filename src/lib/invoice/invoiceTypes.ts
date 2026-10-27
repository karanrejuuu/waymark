export interface InvoiceLineItem {
  slNo: number;
  description: string;
  hsnSac: string;
  quantity: number;
  unit: string;
  rateInclTax: number;
  rateExclTax: number;
  amount: number;
  cgstRate: number; // e.g. 2.5
  cgstAmount: number;
  sgstRate: number; // e.g. 2.5
  sgstAmount: number;
}

export interface InvoiceSellerDetails {
  companyName: string;
  addressLine1: string;
  addressLine2: string;
  cityPincode: string;
  mobile: string;
  contact: string;
  gstin: string;
  stateName: string;
  stateCode: string;
  bankName: string;
  accountNumber: string;
  branchIfsc: string;
  upiId?: string;
}

export interface InvoiceBuyerDetails {
  shopName: string;
  address: string;
  contact?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  gstin?: string | null;
  stateName: string;
  stateCode: string;
}

export interface InvoiceMetadata {
  invoiceNo: string;
  dated: string; // e.g. "27-Oct-26"
  deliveryNote?: string;
  modeOfPayment: string; // "Cash" | "UPI" | "Cheque"
  referenceNoAndDate?: string;
  otherReferences?: string;
  buyersOrderNo?: string;
  orderDated?: string;
  dispatchDocNo?: string;
  deliveryNoteDate?: string;
  dispatchedThrough?: string;
  destination?: string;
  termsOfDelivery?: string;
}

export interface InvoiceData {
  metadata: InvoiceMetadata;
  seller: InvoiceSellerDetails;
  buyer: InvoiceBuyerDetails;
  items: InvoiceLineItem[];
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  roundOff: number;
  totalAmount: number;
  amountInWords: string;
  taxAmountInWords: string;
}
