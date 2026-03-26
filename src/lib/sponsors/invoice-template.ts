/**
 * Sponsor Invoice HTML Generator
 *
 * Generates professional HTML invoices with inline CSS for
 * sponsor billing. Designed for print / PDF export.
 */

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  stationName: string;
  stationAddress?: string;
  stationEmail?: string;
  billTo: {
    businessName: string;
    contactName?: string;
    email?: string;
    phone?: string;
  };
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax?: number;
  total: number;
  notes?: string;
  paymentTerms?: string;
}

export function generateInvoiceHtml(data: InvoiceData): string {
  const lineItemRows = data.lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #27272a; color: #d4d4d8;">${item.description}</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #27272a; text-align: center; color: #d4d4d8;">${item.quantity}</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #27272a; text-align: right; color: #d4d4d8;">$${item.unitPrice.toFixed(2)}</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #27272a; text-align: right; font-weight: 600; color: #fafafa;">$${item.total.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${data.invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; background: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #fafafa;">
  <div style="max-width: 800px; margin: 0 auto; padding: 40px 24px;">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #3f3f46; padding-bottom: 24px;">
      <div>
        <h1 style="margin: 0 0 4px 0; font-size: 28px; font-weight: 700; color: #fafafa;">${data.stationName}</h1>
        ${data.stationEmail ? `<p style="margin: 0; font-size: 14px; color: #71717a;">${data.stationEmail}</p>` : ""}
        ${data.stationAddress ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #71717a;">${data.stationAddress}</p>` : ""}
      </div>
      <div style="text-align: right;">
        <h2 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 800; color: #3b82f6; letter-spacing: -1px;">INVOICE</h2>
        <p style="margin: 0; font-size: 14px; color: #a1a1aa;">${data.invoiceNumber}</p>
      </div>
    </div>

    <!-- Bill To + Dates -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 32px;">
      <div>
        <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #71717a;">Bill To</p>
        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #fafafa;">${data.billTo.businessName}</p>
        ${data.billTo.contactName ? `<p style="margin: 2px 0 0 0; font-size: 14px; color: #a1a1aa;">${data.billTo.contactName}</p>` : ""}
        ${data.billTo.email ? `<p style="margin: 2px 0 0 0; font-size: 14px; color: #a1a1aa;">${data.billTo.email}</p>` : ""}
        ${data.billTo.phone ? `<p style="margin: 2px 0 0 0; font-size: 14px; color: #a1a1aa;">${data.billTo.phone}</p>` : ""}
      </div>
      <div style="text-align: right;">
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #a1a1aa;">Invoice Date: <strong style="color: #fafafa;">${data.invoiceDate}</strong></p>
        <p style="margin: 0; font-size: 14px; color: #a1a1aa;">Due Date: <strong style="color: #fbbf24;">${data.dueDate}</strong></p>
      </div>
    </div>

    <!-- Line Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="background: #18181b;">
          <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #71717a; border-bottom: 2px solid #3f3f46;">Description</th>
          <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #71717a; border-bottom: 2px solid #3f3f46;">Qty</th>
          <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #71717a; border-bottom: 2px solid #3f3f46;">Unit Price</th>
          <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #71717a; border-bottom: 2px solid #3f3f46;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemRows}
      </tbody>
    </table>

    <!-- Totals -->
    <div style="display: flex; justify-content: flex-end; margin-bottom: 32px;">
      <div style="width: 280px;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #27272a;">
          <span style="color: #a1a1aa;">Subtotal</span>
          <span style="color: #fafafa; font-weight: 500;">$${data.subtotal.toFixed(2)}</span>
        </div>
        ${
          data.tax !== undefined
            ? `<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #27272a;">
          <span style="color: #a1a1aa;">Tax</span>
          <span style="color: #fafafa; font-weight: 500;">$${data.tax.toFixed(2)}</span>
        </div>`
            : ""
        }
        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid #3b82f6;">
          <span style="font-size: 18px; font-weight: 700; color: #fafafa;">Total Due</span>
          <span style="font-size: 18px; font-weight: 700; color: #3b82f6;">$${data.total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- Payment Terms -->
    <div style="background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #71717a;">Payment Terms</p>
      <p style="margin: 0; font-size: 14px; color: #d4d4d8;">${data.paymentTerms || "Net 30 — Payment due within 30 days of invoice date."}</p>
    </div>

    ${
      data.notes
        ? `<div style="margin-bottom: 24px;">
      <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #71717a;">Notes</p>
      <p style="margin: 0; font-size: 14px; color: #a1a1aa;">${data.notes}</p>
    </div>`
        : ""
    }

    <!-- Footer -->
    <div style="text-align: center; padding-top: 24px; border-top: 1px solid #27272a;">
      <p style="margin: 0; font-size: 13px; color: #52525b;">Thank you for your partnership with ${data.stationName}!</p>
    </div>
  </div>
</body>
</html>`;
}
