import React from 'react';
import { ArrowLeft, Pencil, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InvoicePreview from '@/components/invoices/InvoicePreview';

export default function InvoiceDetail({ invoice, onEdit, onDelete, onDownload, onBack }) {
  const subtotal = invoice.subtotal || 0;
  //const gstAmount = invoice.gst_amount || 0;
  const total = invoice.total_amount || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
          <p className="text-sm text-muted-foreground">{invoice.client_name}</p>
        </div>
        <Button variant="outline" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={onEdit} variant="outline" className="gap-2"><Pencil className="w-4 h-4" /> Edit</Button>
        <Button onClick={onDelete} variant="outline" className="gap-2 text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /> Delete</Button>
        <Button onClick={onDownload} className="bg-orange-500 hover:bg-orange-600 text-white gap-2"><Download className="w-4 h-4" /> Download PDF</Button>
      </div>

      <div className="max-w-2xl">
        <InvoicePreview form={invoice} subtotal={subtotal} total={total} />
      </div>
    </div>
  );
}