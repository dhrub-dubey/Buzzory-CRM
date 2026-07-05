import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Plus, Search, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageHeader from '@/components/shared/PageHeader';

const emptyForm = { client_name: '', campaign: '', date: '', profit_amount: 0, notes: '' };

export default function ProfitLedger() {
  const now = new Date();
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [showDialog, setShowDialog] = useState(
    () => localStorage.getItem("showProfitDialog") === "true"
  );
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem("profitDraft");
    return saved ? JSON.parse(saved) : emptyForm;
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log("ProfitLedger mounted");
  
    return () => {
      console.log("ProfitLedger unmounted");
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "showProfitDialog",
      showDialog.toString()
    );
  }, [showDialog]);
  
  useEffect(() => {
    localStorage.setItem(
      "profitDraft",
      JSON.stringify(form)
    );
  }, [form]);

  const { data: entries = [] } = useQuery({
    queryKey: ['profitEntries'],
    queryFn: () => base44.entities.ProfitEntry.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProfitEntry.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profitEntries'] }); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProfitEntry.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profitEntries'] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProfitEntry.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profitEntries'] }); setDeleteId(null); },
  });

  const closeDialog = () => {
    localStorage.removeItem("showProfitDialog");
    localStorage.removeItem("profitDraft");
  
    setShowDialog(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const openEdit = (e) => {
    setEditing(e);
    setForm({ client_name: e.client_name, campaign: e.campaign || '', date: e.date || '', profit_amount: e.profit_amount || 0, notes: e.notes || '' });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const years = [...new Set(entries.map(e => e.date?.slice(0,4)).filter(Boolean))].sort((a,b) => b-a);
  const filtered = entries.filter(e => {
    const matchSearch = e.client_name?.toLowerCase().includes(search.toLowerCase()) || e.campaign?.toLowerCase().includes(search.toLowerCase());
    const entryMonth = e.date?.slice(5,7);
    const entryYear = e.date?.slice(0,4);
    const matchMonth = !selectedMonth || entryMonth === selectedMonth;
    const matchYear = !selectedYear || entryYear === selectedYear;
    return matchSearch && matchMonth && matchYear;
  });

  const totalProfit = filtered.reduce((s, e) => s + (e.profit_amount || 0), 0);

  return (
    <div>
      <PageHeader icon={TrendingUp} title="Total Profit" subtitle="Track profit entries per client and campaign">
        <Button onClick={() => setShowDialog(true)} className="bg-orange-500 hover:bg-orange-600 text-white gap-2 text-sm"><Plus className="w-4 h-4" /> Add Profit</Button>
      </PageHeader>

      <Link to="/finance" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Finance
      </Link>

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
        <div className="ml-auto text-sm font-semibold text-emerald-600">Total: ₹{totalProfit.toLocaleString('en-IN')}</div>
      </div>

      <Card className="border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs">Client</TableHead>
              <TableHead className="text-xs">Campaign</TableHead>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Profit Amount</TableHead>
              <TableHead className="text-xs">Note</TableHead>
              <TableHead className="text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(e => (
              <TableRow key={e.id} className="hover:bg-muted/30">
                <TableCell className="text-sm font-medium">{e.client_name}</TableCell>
                <TableCell className="text-xs">{e.campaign || '-'}</TableCell>
                <TableCell className="text-xs">{e.date || '-'}</TableCell>
                <TableCell className="text-sm font-semibold text-emerald-600">₹{(e.profit_amount || 0).toLocaleString('en-IN')}</TableCell>
                <TableCell className="text-xs max-w-[160px] truncate">{e.notes || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteId(e.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No profit entries found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showDialog} onOpenChange={v => { if (!v) closeDialog(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Profit' : 'Add Profit'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Client Name *</Label><Input value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} /></div>
              <div><Label className="text-xs">Campaign</Label><Input value={form.campaign} onChange={e => setForm({...form, campaign: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Date</Label><Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
              <div><Label className="text-xs">Profit Amount (₹) *</Label><Input type="number" value={form.profit_amount} onChange={e => setForm({...form, profit_amount: Number(e.target.value)})} /></div>
            </div>
            <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} /></div>
            <Button onClick={handleSave} disabled={!form.client_name || !form.profit_amount} className="w-full bg-orange-500 hover:bg-orange-600 text-white">{editing ? 'Update' : 'Add Profit'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Profit Entry</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}