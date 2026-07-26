import React, { useState } from 'react';
import { Plus, ArrowLeft, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import InvoicePreview from '@/components/invoices/InvoicePreview';

const emptyItem = { description: '', sub_description: '', quantity: 1, rate: 0, amount: 0 };

export default function InvoiceForm({ initialForm, onSave, onCancel, isPending, isEdit }) {
  const [form, setForm] = useState(initialForm);

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
  const gstAmount = subtotal * ((form.gst_percent || 0) / 100);
  const total = subtotal + gstAmount;

  const handleSave = () => {
    onSave({
      ...form,
      subtotal, gst_amount: gstAmount, total_amount: total,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? 'Edit Invoice' : 'Create Invoice'}</h1>
          <p className="text-sm text-muted-foreground">Fill the details and generate professional invoice for your client.</p>
        </div>
        <Button variant="outline" onClick={onCancel} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back to Dashboard</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Client Details */}
          <Card className="p-5 border border-border/50">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><span className="w-6 h-6 rounded bg-orange-500/10 flex items-center justify-center text-orange-500 text-xs">👤</span> 1. Client Details</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Client Name *</Label><Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} /></div>
              <div><Label className="text-xs">Email *</Label><Input value={form.client_email} onChange={e => setForm({ ...form, client_email: e.target.value })} /></div>
              <div><Label className="text-xs">Billing Address *</Label><Input value={form.billing_address} onChange={e => setForm({ ...form, billing_address: e.target.value })} /></div>
              <div><Label className="text-xs">Phone Number *</Label><Input value={form.client_phone} onChange={e => setForm({ ...form, client_phone: e.target.value })} /></div>
            </div>
          </Card>

          {/* Invoice Details */}
          <Card className="p-5 border border-border/50">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><span className="w-6 h-6 rounded bg-orange-500/10 flex items-center justify-center text-orange-500 text-xs">📄</span> 2. Invoice Details</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Invoice Number *</Label><Input value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })} placeholder="INV-2026-0012" /></div>
              <div><Label className="text-xs">Invoice Date *</Label><Input type="date" value={form.invoice_date} onChange={e => setForm({ ...form, invoice_date: e.target.value })} /></div>
              <div><Label className="text-xs">Due Date *</Label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
              <div><Label className="text-xs">Currency</Label>
                <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
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
            <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={!form.client_name || !form.invoice_number || isPending} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white gap-2">
              <Download className="w-4 h-4" /> {isPending ? 'Saving...' : (isEdit ? 'Update Invoice' : 'Save Invoice')}
            </Button>
          </div>
        </div>

        <InvoicePreview form={form} subtotal={subtotal} gstAmount={gstAmount} total={total} />
      </div>
    </div>
  );
}