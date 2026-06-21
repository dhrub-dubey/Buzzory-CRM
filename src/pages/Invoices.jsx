import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Plus, ArrowLeft, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import PageHeader from '@/components/shared/PageHeader';
import InvoicePreview from '@/components/invoices/InvoicePreview';

const DELETE_THRESHOLD = 60;

function SwipeableRow({ children, onDelete }) {
  const x = useMotionValue(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [swiped, setSwiped] = useState(false);

  const deleteOpacity = useTransform(x, [-DELETE_THRESHOLD, -20], [1, 0]);
  const deleteScale = useTransform(x, [-DELETE_THRESHOLD, -20], [1, 0.7]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -DELETE_THRESHOLD) {
      animate(x, -DELETE_THRESHOLD, { type: 'spring', stiffness: 300, damping: 30 });
      setSwiped(true);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
      setSwiped(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
    setSwiped(false);
  };

  return (
    <>
      <div className="relative overflow-hidden">
        <motion.div
          style={{ opacity: deleteOpacity, scale: deleteScale }}
          className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-center bg-red-500"
        >
          <button onClick={() => setShowConfirm(true)} className="flex flex-col items-center gap-1">
            <Trash2 className="h-4 w-4 text-white" />
            <span className="text-[10px] text-white font-medium">Delete</span>
          </button>
        </motion.div>

        <motion.div
          drag="x"
          dragConstraints={{ left: -DELETE_THRESHOLD, right: 0 }}
          dragElastic={0.1}
          style={{ x }}
          onDragEnd={handleDragEnd}
          onClick={() => {
            if (swiped) {
              animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
              setSwiped(false);
            }
          }}
          className="relative z-10 cursor-grab active:cursor-grabbing"
        >
          {children}
        </motion.div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This transaction will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowConfirm(false); onDelete(); }} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const emptyItem = { description: '', sub_description: '', quantity: 1, rate: 0, amount: 0 };


export default function Invoices() {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('invoice_mode') || 'list';
  }); // list, create
  const defaultForm = {
    client_name: '',
    client_email: '',
    client_phone: '',
    billing_address: '',
    invoice_number: '',
    invoice_date: '',
    due_date: '',
    currency: 'INR (₹)',
    items: [{ ...emptyItem }],
    gst_percent: 18,
  };
  
  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem('invoice_form');
    return saved ? JSON.parse(saved) : defaultForm;
  });

  useEffect(() => {
    localStorage.setItem('invoice_mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('invoice_form', JSON.stringify(form));
  }, [form]);

  const queryClient = useQueryClient();

  const [deleteId, setDeleteId] = useState(null);

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    
      localStorage.removeItem('invoice_form');
      localStorage.removeItem('invoice_mode');
    
      setForm(defaultForm);
      setMode('list');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) =>
      base44.entities.Invoice.delete(id),
  
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['invoices']
      });
      setDeleteId(null);
    },
  });

  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    if (field === 'quantity' || field === 'rate') {
      items[idx].amount = (items[idx].quantity || 0) * (items[idx].rate || 0);
    }
    setForm({ ...form, items });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { ...emptyItem }] });
  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const subtotal = form.items.reduce((s, i) => s + (i.amount || 0), 0);
  const gstAmount = subtotal * (form.gst_percent / 100);
  const total = subtotal + gstAmount;

  const handleSave = () => {
    createMutation.mutate({
      ...form,
      subtotal, gst_amount: gstAmount, total_amount: total,
      status: 'Draft', type: 'client',
    });
  };

  const resetForm = () => {
    setForm(defaultForm);
    localStorage.removeItem('invoice_form');
  };

  // List view
  if (mode === 'list') {
    return (
      <div>
        <PageHeader icon={FileText} title="Invoices" subtitle="Generate and manage invoices">
          <Button onClick={() => { resetForm(); setMode('create'); }} className="bg-orange-500 hover:bg-orange-600 text-white gap-2"><Plus className="w-4 h-4" /> Create Invoice</Button>
        </PageHeader>

        {/* <Card className="border border-border/50 overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead className="text-xs">Invoice #</TableHead><TableHead className="text-xs">Client</TableHead><TableHead className="text-xs">Amount</TableHead><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Due</TableHead><TableHead className="text-xs">Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {invoices.map(inv => (
                <TableRow key={inv.id} className="hover:bg-muted/30">
                  <TableCell className="text-sm font-medium">{inv.invoice_number}</TableCell>
                  <TableCell className="text-sm">{inv.client_name}</TableCell>
                  <TableCell className="text-sm font-semibold">₹{(inv.total_amount || 0).toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-xs">{inv.invoice_date || '-'}</TableCell>
                  <TableCell className="text-xs">{inv.due_date || '-'}</TableCell>
                  <TableCell><Badge className={`border-0 text-[10px] ${inv.status === 'Paid' ? 'bg-green-100 text-green-600' : inv.status === 'Sent' ? 'bg-blue-100 text-blue-600' : inv.status === 'Overdue' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{inv.status}</Badge></TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No invoices yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card> */}

        <Card className="border border-border/50 overflow-hidden">

        <div className="grid grid-cols-[120px_1fr_140px_120px_120px_100px] gap-2 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
          <span>Invoice #</span>
          <span>Client</span>
          <span>Amount</span>
          <span>Date</span>
          <span>Due</span>
          <span>Status</span>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No invoices yet
          </div>
        ) : (
          invoices.map((inv, i) => (
            <SwipeableRow
              key={inv.id}
              onDelete={() => deleteMutation.mutate(inv.id)}
            >
              <div
                className={`grid grid-cols-[120px_1fr_140px_120px_120px_100px] gap-2 px-4 py-4 items-center border-b border-border/30 ${
                  i % 2 === 0
                    ? 'bg-white'
                    : 'bg-muted/20'
                }`}
              >
                <span className="font-medium text-sm">
                  {inv.invoice_number}
                </span>

                <span className="text-sm">
                  {inv.client_name}
                </span>

                <span className="font-semibold">
                  ₹{(inv.total_amount || 0).toLocaleString('en-IN')}
                </span>

                <span className="text-xs">
                  {inv.invoice_date || '-'}
                </span>

                <span className="text-xs">
                  {inv.due_date || '-'}
                </span>

                <span>
                  <Badge
                    className={`border-0 text-[10px]
                    ${
                      inv.status === 'Paid'
                        ? 'bg-green-100 text-green-600'
                        : inv.status === 'Sent'
                        ? 'bg-blue-100 text-blue-600'
                        : inv.status === 'Overdue'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {inv.status}
                  </Badge>
                </span>
              </div>
            </SwipeableRow>
          ))
        )}
        </Card>

      </div>
    );
  }

  // Create view - matches uploaded UX
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Create Invoice</h1>
          <p className="text-sm text-muted-foreground">Fill the details and generate professional invoice for your client.</p>
        </div>
        <Button variant="outline" onClick={() => setMode('list')} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back to Dashboard</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-6">
          {/* Client Details */}
          <Card className="p-5 border border-border/50">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><span className="w-6 h-6 rounded bg-orange-500/10 flex items-center justify-center text-orange-500 text-xs">👤</span> 1. Client Details</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Client Name *</Label><Input value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} /></div>
              <div><Label className="text-xs">Email *</Label><Input value={form.client_email} onChange={e => setForm({...form, client_email: e.target.value})} /></div>
              <div><Label className="text-xs">Billing Address *</Label><Input value={form.billing_address} onChange={e => setForm({...form, billing_address: e.target.value})} /></div>
              <div><Label className="text-xs">Phone Number *</Label><Input value={form.client_phone} onChange={e => setForm({...form, client_phone: e.target.value})} /></div>
            </div>
          </Card>

          {/* Invoice Details */}
          <Card className="p-5 border border-border/50">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><span className="w-6 h-6 rounded bg-orange-500/10 flex items-center justify-center text-orange-500 text-xs">📄</span> 2. Invoice Details</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Invoice Number *</Label><Input value={form.invoice_number} onChange={e => setForm({...form, invoice_number: e.target.value})} placeholder="INV-2026-0012" /></div>
              <div><Label className="text-xs">Invoice Date *</Label><Input type="date" value={form.invoice_date} onChange={e => setForm({...form, invoice_date: e.target.value})} /></div>
              <div><Label className="text-xs">Due Date *</Label><Input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} /></div>
              <div><Label className="text-xs">Currency</Label>
                <Select value={form.currency} onValueChange={v => setForm({...form, currency: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="INR (₹)">INR (₹)</SelectItem><SelectItem value="USD ($)">USD ($)</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Items */}
          <Card className="p-5 border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2"><span className="w-6 h-6 rounded bg-orange-500/10 flex items-center justify-center text-orange-500 text-xs">📦</span> 3. Items / Services</h2>
              <Button variant="ghost" size="sm" onClick={addItem} className="text-orange-500 text-xs gap-1"><Plus className="w-3 h-3" /> Add Item</Button>
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Item / Description</TableHead><TableHead className="text-xs w-20">Quantity</TableHead><TableHead className="text-xs w-28">Rate (₹)</TableHead><TableHead className="text-xs w-28">Amount (₹)</TableHead><TableHead className="text-xs w-12">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {form.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Item name" className="text-xs h-8 mb-1" />
                      <Input value={item.sub_description} onChange={e => updateItem(idx, 'sub_description', e.target.value)} placeholder="Sub description" className="text-[10px] h-7" />
                    </TableCell>
                    <TableCell><Input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} className="text-xs h-8" /></TableCell>
                    <TableCell><Input type="number" value={item.rate} onChange={e => updateItem(idx, 'rate', Number(e.target.value))} className="text-xs h-8" /></TableCell>
                    <TableCell className="text-sm font-medium">{(item.amount || 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeItem(idx)}><Trash2 className="w-3 h-3" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 space-y-1 text-right">
              <p className="text-sm">Sub Total: <span className="font-semibold">₹{subtotal.toLocaleString('en-IN')}</span></p>
              <p className="text-sm">GST ({form.gst_percent}%): <span className="font-semibold">₹{gstAmount.toLocaleString('en-IN')}</span></p>
              <p className="text-base font-bold">Total Amount: <span className="text-orange-500">₹{total.toLocaleString('en-IN')}</span></p>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={resetForm} className="flex-1">Reset</Button>
            <Button onClick={handleSave} disabled={!form.client_name || !form.invoice_number || createMutation.isPending} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white gap-2">
              <Download className="w-4 h-4" /> {createMutation.isPending ? 'Saving...' : 'Download PDF'}
            </Button>
          </div>
        </div>

        {/* Preview */}
        <InvoicePreview form={form} subtotal={subtotal} gstAmount={gstAmount} total={total} />
      </div>
    </div>
  );
}