import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Plus, Search, Pencil, Trash2, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageHeader from '@/components/shared/PageHeader';

const emptyForm = { client_name: '', campaign: '', amount: 0, invoice_date: '', received_date: '', status: 'Pending', notes: '' };

export default function ClientPayments() {
  const now = new Date();
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const queryClient = useQueryClient();

  const { data: payments = [] } = useQuery({
    queryKey: ['clientPayments'],
    queryFn: () => base44.entities.ClientPayment.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientPayment.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clientPayments'] }); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ClientPayment.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clientPayments'] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClientPayment.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clientPayments'] }); setDeleteId(null); },
  });

  const closeDialog = () => { setShowDialog(false); setEditing(null); setForm(emptyForm); };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ client_name: p.client_name, campaign: p.campaign || '', amount: p.amount, invoice_date: p.invoice_date || '', received_date: p.received_date || '', status: p.status, notes: p.notes || '' });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const years = [...new Set(payments.map(p => p.invoice_date?.slice(0,4)).filter(Boolean))].sort((a,b) => b-a);
  const filtered = payments.filter(p => {
    const matchSearch = p.client_name?.toLowerCase().includes(search.toLowerCase()) || p.campaign?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const payMonth = p.invoice_date?.slice(5,7);
    const payYear = p.invoice_date?.slice(0,4);
    const matchMonth = !selectedMonth || payMonth === selectedMonth;
    const matchYear = !selectedYear || payYear === selectedYear;
    return matchSearch && matchStatus && matchMonth && matchYear;
  });

  const statusColor = { Pending: 'bg-yellow-100 text-yellow-700', 'Partially Paid': 'bg-blue-100 text-blue-600', Paid: 'bg-green-100 text-green-600' };

  return (
    <div>
      <PageHeader icon={CreditCard} title="Client Payments" subtitle="Track all client payment records">
        <Button onClick={() => setShowDialog(true)} className="bg-orange-500 hover:bg-orange-600 text-white gap-2 text-sm"><Plus className="w-4 h-4" /> Add Payment</Button>
      </PageHeader>

      <Link to="/finance" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Finance
      </Link>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Partially Paid">Partially Paid</SelectItem><SelectItem value="Paid">Paid</SelectItem></SelectContent>
        </Select>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Month" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Months</SelectItem>
            {MONTHS.map((m, i) => <SelectItem key={m} value={String(i+1).padStart(2,'0')}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-28"><SelectValue placeholder="Year" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Years</SelectItem>
            {(years.length > 0 ? years : [String(now.getFullYear())]).map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs">Client</TableHead>
              <TableHead className="text-xs">Campaign</TableHead>
              <TableHead className="text-xs">Amount</TableHead>
              <TableHead className="text-xs">Invoice Date</TableHead>
              <TableHead className="text-xs">Received Date</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Notes</TableHead>
              <TableHead className="text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => (
              <TableRow key={p.id} className="hover:bg-muted/30">
                <TableCell className="text-sm font-medium">{p.client_name}</TableCell>
                <TableCell className="text-xs">{p.campaign || '-'}</TableCell>
                <TableCell className="text-sm font-semibold">₹{(p.amount || 0).toLocaleString('en-IN')}</TableCell>
                <TableCell className="text-xs">{p.invoice_date || '-'}</TableCell>
                <TableCell className="text-xs">{p.received_date || '-'}</TableCell>
                <TableCell><Badge className={`${statusColor[p.status] || ''} border-0 text-[10px]`}>{p.status}</Badge></TableCell>
                <TableCell className="text-xs max-w-[120px] truncate">{p.notes || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteId(p.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No payments found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showDialog} onOpenChange={v => { if (!v) closeDialog(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Payment' : 'Add Payment'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Client Name *</Label><Input value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} /></div>
              <div><Label className="text-xs">Campaign</Label><Input value={form.campaign} onChange={e => setForm({...form, campaign: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Amount (₹) *</Label><Input type="number" value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})} /></div>
              <div><Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Partially Paid">Partially Paid</SelectItem><SelectItem value="Paid">Paid</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Invoice Date</Label><Input type="date" value={form.invoice_date} onChange={e => setForm({...form, invoice_date: e.target.value})} /></div>
              <div><Label className="text-xs">Received Date</Label><Input type="date" value={form.received_date} onChange={e => setForm({...form, received_date: e.target.value})} /></div>
            </div>
            <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} /></div>
            <Button onClick={handleSave} disabled={!form.client_name || !form.amount} className="w-full bg-orange-500 hover:bg-orange-600 text-white">{editing ? 'Update' : 'Add Payment'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Payment</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}