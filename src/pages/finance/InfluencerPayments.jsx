import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Plus, Search, Pencil, Trash2, Users, Calendar, User, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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
import { format } from 'date-fns';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const emptyForm = { influencer_name: '', campaign: '', amount: 0, status: 'Pending', payment_date: '', notes: '' };

export default function InfluencerPayments() {
  const now = new Date();
  //const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(() => {
    const saved = localStorage.getItem(
      "selectedInfluencerPaymentCampaign"
    );
  
    return saved ? JSON.parse(saved) : null;
  });
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [yearFilter, setYearFilter] = useState(String(now.getFullYear()));
  //const [showDialog, setShowDialog] = useState(false);
  const [showDialog, setShowDialog] = useState(
    () => localStorage.getItem("influencerPaymentDialog") === "true"
  );
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
 // const [form, setForm] = useState(emptyForm);
  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem(
      "influencerPaymentDraft"
    );

    return saved ? JSON.parse(saved) : emptyForm;
  });

  useEffect(() => {
    localStorage.setItem(
      "influencerPaymentDialog",
      showDialog.toString()
    );
  }, [showDialog]);
  
  useEffect(() => {
    localStorage.setItem(
      "influencerPaymentDraft",
      JSON.stringify(form)
    );
  }, [form]);
  
  useEffect(() => {
    if (selectedCampaign) {
      localStorage.setItem(
        "selectedInfluencerPaymentCampaign",
        JSON.stringify(selectedCampaign)
      );
    } else {
      localStorage.removeItem(
        "selectedInfluencerPaymentCampaign"
      );
    }
  }, [selectedCampaign]);
  
  const queryClient = useQueryClient();

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date', 100),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['influencerPayments'],
    queryFn: () => base44.entities.InfluencerPayment.list('-created_date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InfluencerPayment.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['influencerPayments'] }); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InfluencerPayment.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['influencerPayments'] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InfluencerPayment.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['influencerPayments'] }); setDeleteId(null); },
  });

  // const closeDialog = () => { setShowDialog(false); setEditing(null); setForm(emptyForm); };
  const closeDialog = () => {
    localStorage.removeItem(
      "influencerPaymentDraft"
    );
  
    localStorage.removeItem(
      "influencerPaymentDialog"
    );
  
    setShowDialog(false);
    setEditing(null);
    setForm(emptyForm);
  };
  const openEdit = (p) => { setEditing(p); setForm({ influencer_name: p.influencer_name, campaign: p.campaign || '', amount: p.amount, status: p.status, payment_date: p.payment_date || '', notes: p.notes || '' }); setShowDialog(true); };
  const handleSave = () => { if (editing) updateMutation.mutate({ id: editing.id, data: form }); else createMutation.mutate({ ...form, campaign: selectedCampaign?.name, campaign_id: selectedCampaign?.id }); };

  // Filter campaigns by month/year (based on start_date)
  const allYears = [...new Set(campaigns.map(c => c.start_date?.slice(0,4)).filter(Boolean))].sort((a,b) => b-a);

  const filteredCampaigns = campaigns.filter(c => {
    const camMonth = c.start_date?.slice(5,7);
    const camYear = c.start_date?.slice(0,4);
    const matchMonth = !monthFilter || camMonth === monthFilter;
    const matchYear = !yearFilter || camYear === yearFilter;
    return matchMonth && matchYear;
  });

  // If a campaign is selected, show its influencer payments
  if (selectedCampaign) {
    const campaignPayments = payments.filter(p =>
      (p.campaign_id === selectedCampaign.id || p.campaign === selectedCampaign.name) &&
      p.influencer_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div>
        <PageHeader icon={Users} title={selectedCampaign.name} subtitle={`Influencer payments for ${selectedCampaign.client_name}`}>
          <Button onClick={() => setShowDialog(true)} className="bg-orange-500 hover:bg-orange-600 text-white gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Payment
          </Button>
        </PageHeader>
        <button onClick={() => { setSelectedCampaign(null); setSearch(''); }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Campaigns
        </button>

        <div className="relative mb-4 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search influencer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        <Card className="border border-border/50 overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead className="text-xs">Influencer</TableHead><TableHead className="text-xs">Amount</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Payment Date</TableHead><TableHead className="text-xs">Notes</TableHead><TableHead className="text-xs">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {campaignPayments.map(p => (
                <TableRow key={p.id} className="hover:bg-muted/30">
                  <TableCell className="text-sm font-medium">{p.influencer_name}</TableCell>
                  <TableCell className="text-sm font-semibold">₹{(p.amount || 0).toLocaleString('en-IN')}</TableCell>
                  <TableCell><Badge className={`${p.status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-700'} border-0 text-[10px]`}>{p.status}</Badge></TableCell>
                  <TableCell className="text-xs">{p.payment_date || '-'}</TableCell>
                  <TableCell className="text-xs max-w-[120px] truncate">{p.notes || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteId(p.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {campaignPayments.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payments for this campaign</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={showDialog} onOpenChange={v => { if (!v) closeDialog(); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit Payment' : 'Add Payment'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Influencer Name *</Label><Input value={form.influencer_name} onChange={e => setForm({...form, influencer_name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Amount (₹) *</Label><Input type="number" value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})} /></div>
                <div><Label className="text-xs">Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Paid">Paid</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-xs">Payment Date</Label><Input type="date" value={form.payment_date} onChange={e => setForm({...form, payment_date: e.target.value})} /></div>
              <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} /></div>
              <Button onClick={handleSave} disabled={!form.influencer_name || !form.amount} className="w-full bg-orange-500 hover:bg-orange-600 text-white">{editing ? 'Update' : 'Add Payment'}</Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Payment</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Campaign list screen
  return (
    <div>
      <PageHeader icon={Users} title="Influencer Payments" subtitle="Select a campaign to view payments">
      </PageHeader>
      <Link to="/finance" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Finance
      </Link>

      {/* Month/Year filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Month" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Months</SelectItem>
            {MONTHS.map((m, i) => <SelectItem key={m} value={String(i+1).padStart(2,'0')}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-28"><SelectValue placeholder="Year" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Years</SelectItem>
            {(allYears.length > 0 ? allYears : [String(now.getFullYear())]).map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''}</span>
      </div>

      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No campaigns found for this period</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map(c => {
            const campPayments = payments.filter(p => p.campaign_id === c.id || p.campaign === c.name);
            const total = campPayments.reduce((s, p) => s + (p.amount || 0), 0);
            const paid = campPayments.filter(p => p.status === 'Paid').reduce((s, p) => s + (p.amount || 0), 0);
            return (
              <Card
                key={c.id}
                className="p-4 border border-border/50 hover:border-orange-500/40 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setSelectedCampaign(c)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold group-hover:text-orange-500 transition-colors">{c.name}</h3>
                  <Badge className={c.status === 'active' ? 'bg-green-500/10 text-green-600 border-0 text-[10px]' : 'bg-gray-500/10 text-gray-500 border-0 text-[10px]'}>
                    {c.status === 'active' ? 'Active' : 'Completed'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{c.client_name}</p>
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground mb-2">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{c.start_date ? format(new Date(c.start_date), 'MMM d, yyyy') : 'No date'}</span>
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{c.assigned_manager || 'Unassigned'}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] mt-2 pt-2 border-t border-border/40">
                  <span className="text-muted-foreground">{campPayments.length} payments · ₹{total.toLocaleString('en-IN')} total</span>
                  <span className="text-green-600 font-medium">₹{paid.toLocaleString('en-IN')} paid</span>
                </div>
                <div className="flex items-center justify-end mt-1">
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}