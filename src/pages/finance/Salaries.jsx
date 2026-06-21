import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Plus, Search, Pencil, Trash2, Briefcase } from 'lucide-react';
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

//const emptyForm = { employee_name: '', salary: 0, commission: 0, month: '', payment_date: '', status: 'Pending', notes: '' };

const emptyForm = {
  employee_name: '',
  salary: 0,
  commission: 0,
  month: currentMonthLabel,
  payment_date: '',
  status: 'Pending',
  notes: ''
};

export default function Salaries() {
  const now = new Date();
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const currentMonthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
 // const [showDialog, setShowDialog] = useState(false);
  const [showDialog, setShowDialog] = useState(
    () => localStorage.getItem("salaryDialog") === "true"
  );
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
 // const [form, setForm] = useState(emptyForm);
  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem(
      "salaryDraft"
    );

    return saved ? JSON.parse(saved) : emptyForm;
  });

  useEffect(() => {
    localStorage.setItem(
      "salaryDialog",
      showDialog.toString()
    );
  }, [showDialog]);
  
  useEffect(() => {
    localStorage.setItem(
      "salaryDraft",
      JSON.stringify(form)
    );
  }, [form]);

  const queryClient = useQueryClient();

  const { data: payments = [] } = useQuery({
    queryKey: ['salaryPayments'],
    queryFn: () => base44.entities.SalaryPayment.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SalaryPayment.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['salaryPayments'] }); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SalaryPayment.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['salaryPayments'] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SalaryPayment.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['salaryPayments'] }); setDeleteId(null); },
  });

  const closeDialog = () => {
    localStorage.removeItem(
      "salaryDraft"
    );
  
    localStorage.removeItem(
      "salaryDialog"
    );
  
    setShowDialog(false);
    setEditing(null);
    setForm(emptyForm);
  };
  const openEdit = (p) => { setEditing(p); setForm({ employee_name: p.employee_name, salary: p.salary, commission: p.commission || 0, month: p.month || '', payment_date: p.payment_date || '', status: p.status, notes: p.notes || '' }); setShowDialog(true); };
  const handleSave = () => { if (editing) updateMutation.mutate({ id: editing.id, data: form }); else createMutation.mutate(form); };

  const years = [...new Set(payments.map(p => p.month?.split(' ')[1]).filter(Boolean))].sort((a,b) => b-a);
  const filtered = payments.filter(p => {
    const matchSearch = p.employee_name?.toLowerCase().includes(search.toLowerCase());
    const [pMonth, pYear] = (p.month || '').split(' ');
    const monthIndex = MONTHS.indexOf(pMonth);
    const paddedMonth = monthIndex >= 0 ? String(monthIndex + 1).padStart(2, '0') : '';
    const matchMonth = !selectedMonth || paddedMonth === selectedMonth;
    const matchYear = !selectedYear || pYear === selectedYear;
    return matchSearch && matchMonth && matchYear;
  });

  console.log("payments", payments);
  console.log("filtered", filtered);

  return (
    <div>
      <PageHeader icon={Briefcase} title="Employee Salaries" subtitle="Monthly salary management">
        <Button onClick={() => setShowDialog(true)} className="bg-orange-500 hover:bg-orange-600 text-white gap-2 text-sm"><Plus className="w-4 h-4" /> Add Salary</Button>
      </PageHeader>
      <Link to="/finance" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="w-4 h-4" /> Back to Finance</Link>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
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
          <TableHeader><TableRow className="bg-muted/50">
            <TableHead className="text-xs">Employee</TableHead><TableHead className="text-xs">Month</TableHead><TableHead className="text-xs">Salary</TableHead><TableHead className="text-xs">Commission</TableHead><TableHead className="text-xs">Total</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Payment Date</TableHead><TableHead className="text-xs">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map(p => (
              <TableRow key={p.id} className="hover:bg-muted/30">
                <TableCell className="text-sm font-medium">{p.employee_name}</TableCell>
                <TableCell className="text-xs">{p.month || '-'}</TableCell>
                <TableCell className="text-sm">₹{(p.salary || 0).toLocaleString('en-IN')}</TableCell>
                <TableCell className="text-sm">₹{(p.commission || 0).toLocaleString('en-IN')}</TableCell>
                <TableCell className="text-sm font-semibold">₹{((p.salary || 0) + (p.commission || 0)).toLocaleString('en-IN')}</TableCell>
                <TableCell><Badge className={`${p.status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-700'} border-0 text-[10px]`}>{p.status}</Badge></TableCell>
                <TableCell className="text-xs">{p.payment_date || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteId(p.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No salary records found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showDialog} onOpenChange={v => { if (!v) closeDialog(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Salary' : 'Add Salary'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Employee Name *</Label><Input value={form.employee_name} onChange={e => setForm({...form, employee_name: e.target.value})} /></div>
              <div><Label className="text-xs">Month</Label><Input value={form.month} readOnly placeholder="e.g. June 2026" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Salary (₹) *</Label><Input type="number" value={form.salary} onChange={e => setForm({...form, salary: Number(e.target.value)})} /></div>
              <div><Label className="text-xs">Commission (₹)</Label><Input type="number" value={form.commission} onChange={e => setForm({...form, commission: Number(e.target.value)})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Payment Date</Label><Input type="date" value={form.payment_date} onChange={e => setForm({...form, payment_date: e.target.value})} /></div>
              <div><Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Paid">Paid</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} /></div>
            <Button onClick={handleSave} disabled={!form.employee_name || !form.salary} className="w-full bg-orange-500 hover:bg-orange-600 text-white">{editing ? 'Update' : 'Add Salary'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Record</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}