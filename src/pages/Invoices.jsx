import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Plus, Download, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getInvoicePdfBytes } from '@/lib/invoicePdf';
import InvoicePreview from "@/components/invoices/InvoicePreview";
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/shared/PageHeader';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import InvoiceDetail from '@/components/invoices/InvoiceDetail';
import DeleteInvoiceDialog from '@/components/invoices/DeleteInvoiceDialog';
import { exportFilesToZip } from '@/lib/exportUtils';

const emptyItem = { description: '', sub_description: '', quantity: 1, rate: 0, amount: 0 };
const emptyForm = {
  client_name: '', client_email: '', client_phone: '', billing_address: '',
  invoice_number: '', invoice_date: '', due_date: '', currency: 'INR (₹)',
  items: [{ ...emptyItem }], gst_percent: 18,
};

export default function Invoices() {
  const [mode, setMode] = useState('list'); // list, detail, create, edit
  const [selectedId, setSelectedId] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadInvoice, setDownloadInvoice] = useState(false);
  const queryClient = useQueryClient();

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); setMode('list'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); setMode('list'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Invoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowDelete(false);
      setMode('list');
    },
  });

  const selectedInvoice = invoices.find(i => i.id === selectedId);

  useEffect(() => {
    if (!downloadInvoice || isDownloading) return;
  
    setIsDownloading(true);
  
    requestAnimationFrame(() => {
      requestAnimationFrame(async () => {
        try {
          await downloadPreviewPDF(downloadInvoice);
        } finally {
          setDownloadInvoice(null);
          setIsDownloading(false);
        }
      });
    });
  }, [downloadInvoice, isDownloading]);

  const downloadPreviewPDF = async (invoice) => {
    const element = document.getElementById("invoice-pdf");
  
    if (!element) {
      console.log("Invoice preview not found");
      return;
    }
  
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff",
    });
  
    const imgData = canvas.toDataURL("image/png");
  
    const pdf = new jsPDF("p", "mm", "a4");
  
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
    pdf.addImage(
      imgData,
      "PNG",
      0,
      0,
      pdfWidth,
      pdfHeight
    );
  
    pdf.save(`${invoice.invoice_number || "invoice"}.pdf`);
  };

  const handleDownloadZip = async () => {
    if (invoices.length === 0) return;
    setDownloadingZip(true);
    try {
      const files = invoices.map(inv => ({
        name: `${inv.invoice_number || 'invoice'}.pdf`,
        data: getInvoicePdfBytes(inv),
      }));
      exportFilesToZip(files, 'invoices.zip');
    } finally {
      setDownloadingZip(false);
    }
  };

  // List view
  if (mode === 'list') {
    return (
      <div>
        <PageHeader icon={FileText} title="Invoices" subtitle="Generate and manage invoices">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadZip} disabled={invoices.length === 0 || downloadingZip} className="gap-2">
              <Archive className="w-4 h-4" /> {downloadingZip ? 'Preparing...' : 'Download All (ZIP)'}
            </Button>
            <Button onClick={() => setMode('create')} className="bg-orange-500 hover:bg-orange-600 text-white gap-2"><Plus className="w-4 h-4" /> Create Invoice</Button>
          </div>
        </PageHeader>

        <Card className="border border-border/50 overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead className="text-xs">Invoice #</TableHead><TableHead className="text-xs">Client</TableHead><TableHead className="text-xs">Amount</TableHead><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Due</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs w-16">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {invoices.map(inv => (
                <TableRow key={inv.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => { setSelectedId(inv.id); setMode('detail'); }}>
                  <TableCell className="text-sm font-medium">{inv.invoice_number}</TableCell>
                  <TableCell className="text-sm">{inv.client_name}</TableCell>
                  <TableCell className="text-sm font-semibold">₹{(inv.total_amount || 0).toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-xs">{inv.invoice_date || '-'}</TableCell>
                  <TableCell className="text-xs">{inv.due_date || '-'}</TableCell>
                  <TableCell><Badge className={`border-0 text-[10px] ${inv.status === 'Paid' ? 'bg-green-100 text-green-600' : inv.status === 'Sent' ? 'bg-blue-100 text-blue-600' : inv.status === 'Overdue' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{inv.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-orange-500" 
                          
                          onClick={(e) => {
                            e.stopPropagation();
                            setDownloadInvoice(inv);
                        }}

                          title="Download PDF"><Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No invoices yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>

        {downloadInvoice && (
        <div
          style={{
            position: "fixed",
            left: "-10000px",
            top: 0,
            width: "800px",
            zIndex: -1,
          }}
        >
          <InvoicePreview
            form={downloadInvoice}
            subtotal={downloadInvoice.subtotal || 0}
            total={downloadInvoice.total_amount || 0}
          />
        </div>
      )}

      </div>
    );
  }

  // Detail view
  if (mode === 'detail' && selectedInvoice) {
    return (
      <>
        <InvoiceDetail
          invoice={selectedInvoice}
          onEdit={() => setMode('edit')}
          onDelete={() => setShowDelete(true)}
          onDownload={() => downloadPreviewPDF(selectedInvoice)}
          onBack={() => setMode('list')}
        />
        <DeleteInvoiceDialog
          open={showDelete}
          onOpenChange={setShowDelete}
          invoice={selectedInvoice}
          onConfirm={() => deleteMutation.mutate(selectedInvoice.id)}
          isPending={deleteMutation.isPending}
        />
      </>
    );
  }

  // Create or Edit view
  return (
    <InvoiceForm
      initialForm={mode === 'edit' && selectedInvoice ? selectedInvoice : emptyForm}
      isEdit={mode === 'edit'}
      isPending={createMutation.isPending || updateMutation.isPending}
      onSave={(data) => {
        const { id, created_date, updated_date, created_by_id, ...cleanData } = data;
        if (mode === 'edit' && selectedInvoice) {
          updateMutation.mutate({ id: selectedInvoice.id, data: cleanData });
        } else {
          createMutation.mutate({ ...cleanData, status: 'Draft', type: 'client' });
        }
      }}
      onCancel={() => setMode('list')}
    />
  );
}