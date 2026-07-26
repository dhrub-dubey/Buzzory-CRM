import { jsPDF } from 'jspdf';

export function generateInvoicePdf(invoice) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  let y = 20;

  // Company header (left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(249, 115, 22);
  doc.text('Buzzory', 20, y);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Influencer Marketing Agency', 20, y + 6);
  doc.text('123, Park Street, Kolkata, West Bengal - 700016', 20, y + 11);
  doc.text('hello@buzzory.com  |  +91 98765 43210', 20, y + 15);

  // Invoice title (right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('INVOICE', pageWidth - 20, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Invoice No: ${invoice.invoice_number || '-'}`, pageWidth - 20, y + 7, { align: 'right' });
  doc.text(`Invoice Date: ${invoice.invoice_date || '-'}`, pageWidth - 20, y + 12, { align: 'right' });
  doc.text(`Due Date: ${invoice.due_date || '-'}`, pageWidth - 20, y + 17, { align: 'right' });

  y += 28;

  // Bill To box
  doc.setFillColor(248, 250, 252);
  doc.rect(20, y, pageWidth - 40, 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('BILL TO:', 24, y + 5);
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(invoice.client_name || '-', 24, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  if (invoice.billing_address) doc.text(invoice.billing_address, 24, y + 16);
  if (invoice.client_email) doc.text(`Email: ${invoice.client_email}`, 24, y + 20);
  if (invoice.client_phone) doc.text(`Phone: ${invoice.client_phone}`, pageWidth / 2, y + 20);

  y += 32;

  // Items table
  const tableX = 20;
  const tableW = pageWidth - 40;

  // Table header
  doc.setFillColor(17, 24, 39);
  doc.rect(tableX, y, tableW, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Item / Description', tableX + 2, y + 5.5);
  doc.text('Qty', tableX + tableW * 0.6, y + 5.5, { align: 'center' });
  doc.text('Rate', tableX + tableW * 0.78, y + 5.5, { align: 'right' });
  doc.text('Amount', tableX + tableW - 2, y + 5.5, { align: 'right' });

  y += 8;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  const items = (invoice.items || []).filter(i => i.description);
  items.forEach((item, idx) => {
    const rowHeight = item.sub_description ? 12 : 8;
    if (y > 275) { doc.addPage(); y = 20; }
    if (idx % 2 === 0) {
      doc.setFillColor(249, 250, 252);
      doc.rect(tableX, y, tableW, rowHeight, 'F');
    }
    doc.setFontSize(9);
    doc.text(String(item.description || ''), tableX + 2, y + 5);
    if (item.sub_description) {
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text(String(item.sub_description), tableX + 2, y + 9);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
    }
    doc.text(String(item.quantity || 0), tableX + tableW * 0.6, y + 5, { align: 'center' });
    doc.text(`${(item.rate || 0).toLocaleString('en-IN')}`, tableX + tableW * 0.78, y + 5, { align: 'right' });
    doc.text(`${(item.amount || 0).toLocaleString('en-IN')}`, tableX + tableW - 2, y + 5, { align: 'right' });
    y += rowHeight;
  });

  // Totals
  y += 5;
  const subtotal = invoice.subtotal || 0;
  const gstAmount = invoice.gst_amount || 0;
  const total = invoice.total_amount || 0;
  const gstPercent = invoice.gst_percent || 18;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Sub Total', tableX + tableW * 0.55, y, { align: 'left' });
  doc.text(`Rs. ${subtotal.toLocaleString('en-IN')}`, tableX + tableW - 2, y, { align: 'right' });
  y += 6;
  doc.text(`GST (${gstPercent}%)`, tableX + tableW * 0.55, y, { align: 'left' });
  doc.text(`Rs. ${gstAmount.toLocaleString('en-IN')}`, tableX + tableW - 2, y, { align: 'right' });
  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(tableX + tableW * 0.55, y, tableX + tableW, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(249, 115, 22);
  doc.text('Total Amount', tableX + tableW * 0.55, y, { align: 'left' });
  doc.text(`Rs. ${total.toLocaleString('en-IN')}`, tableX + tableW - 2, y, { align: 'right' });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(160, 160, 160);
  doc.text('Thank you for your business!', pageWidth / 2, 285, { align: 'center' });
  doc.text('We look forward to working with you again.', pageWidth / 2, 290, { align: 'center' });

  return doc;
}

export function downloadInvoicePdf(invoice) {
  const doc = generateInvoicePdf(invoice);
  doc.save(`${invoice.invoice_number || 'invoice'}.pdf`);
}

export function getInvoicePdfBytes(invoice) {
  const doc = generateInvoicePdf(invoice);
  return new Uint8Array(doc.output('arraybuffer'));
}