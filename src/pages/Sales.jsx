import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart3, Plus, Search, Download, Users, Send, CheckCircle, XCircle, Clock, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { exportToCSV } from '@/lib/exportUtils';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import StatCard from '@/components/shared/StatCard';
import LeadDialog from '@/components/sales/LeadDialog';

const CONVERTED_REPLIES = new Set(['Interested', 'Very Interested', 'Meeting Scheduled', 'Proposal Sent']);
const REJECTED_REPLIES = new Set(['Not Interested', 'Budget Issue', 'Already Working with Another Agency', 'Wrong Contact']);
const PENDING_REPLIES = new Set(['No Response', 'Call Back Later', 'Follow-up Required']);
const ITEMS_PER_PAGE = 10;

function getReplyBadgeClass(reply) {
  if (CONVERTED_REPLIES.has(reply)) return 'bg-green-500/10 text-green-600 border-0';
  if (REJECTED_REPLIES.has(reply)) return 'bg-red-500/10 text-red-600 border-0';
  return 'bg-orange-500/10 text-orange-600 border-0';
}

function getStatusBadgeClass(status) {
  if (status === 'Converted') return 'bg-green-500/10 text-green-600 border-0';
  if (status === 'Rejected') return 'bg-red-500/10 text-red-600 border-0';
  return 'bg-orange-500/10 text-orange-600 border-0';
}

function fmtDate(dateStr) {
  if (!dateStr) return '-';
  try { return format(new Date(dateStr + 'T00:00:00'), 'MMM d, yyyy'); } catch { return '-'; }
}

export default function Sales() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('this_month');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leads'] }); setDialogOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leads'] }); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Lead.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leads'] }); setDeleteId(null); },
  });

  const validMonths = useMemo(() => {
    const now = new Date();
    if (dateFilter === 'this_month') return new Set([`${now.getFullYear()}-${now.getMonth()}`]);
    if (dateFilter === 'last_month') { const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1); return new Set([`${lm.getFullYear()}-${lm.getMonth()}`]); }
    if (dateFilter === 'last_3_months') return new Set([0, 1, 2].map(i => { const x = new Date(now.getFullYear(), now.getMonth() - i, 1); return `${x.getFullYear()}-${x.getMonth()}`; }));
    return null;
  }, [dateFilter]);

  const inRange = (dateStr) => {
    if (!validMonths) return true;
    if (!dateStr) return false;
    const d = new Date(dateStr + 'T00:00:00');
    return validMonths.has(`${d.getFullYear()}-${d.getMonth()}`);
  };

  const teamMembers = useMemo(() => [...new Set(leads.map(l => l.contacted_by).filter(Boolean))].sort(), [leads]);

  const filtered = useMemo(() => {
    return leads.filter(l => {
      if (!inRange(l.date_added)) return false;
      if (statusFilter !== 'all') {
        const approached = !!(l.contacted_by || l.contacted_on);
        if (statusFilter === 'approached' && !approached) return false;
        if (statusFilter === 'not_approached' && approached) return false;
        if (!['approached', 'not_approached'].includes(statusFilter)) {
          if ((l.status || 'Pending') !== statusFilter) return false;
        }
      }
      if (teamFilter !== 'all' && l.contacted_by !== teamFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = [l.lead_name, l.contact_number, l.email_id, l.instagram, l.contacted_by].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [leads, validMonths, statusFilter, teamFilter, search]);

  const isApproached = (l) => !!(l.contacted_by || l.contacted_on);
  const approachedLeads = filtered.filter(isApproached);
  const totalLeads = filtered.length;
  const approached = approachedLeads.length;
  const converted = filtered.filter(l => l.status === 'Converted').length;
  const rejected = filtered.filter(l => l.status === 'Rejected').length;
  const pending = filtered.filter(l => !l.status || l.status === 'Pending').length;
  const conversionRate = approached > 0 ? ((converted / approached) * 100).toFixed(1) : '0.0';

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSubmit = (data) => {
    if (editingLead) {
      updateMutation.mutate({ id: editingLead.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleExport = () => {
    exportToCSV(filtered, [
      { label: 'Lead Name', key: 'lead_name' }, { label: 'Date Added', key: 'date_added' },
      { label: 'Contact Number', key: 'contact_number' }, { label: 'Email ID', key: 'email_id' },
      { label: 'Instagram', key: 'instagram' }, { label: 'Contacted By', key: 'contacted_by' },
      { label: 'Contacted On', key: 'contacted_on' }, { label: 'Reply', key: 'reply' },
      { label: 'Follow-up Date', key: 'follow_up_date' }, { label: 'Status/Response', key: 'status_response' },
      { label: 'Notes', key: 'notes' }
    ], 'sales-leads.csv');
  };

  const openAdd = () => { setEditingLead(null); setDialogOpen(true); };
  const openEdit = (lead) => { setEditingLead(lead); setDialogOpen(true); };

  return (
    <div>
      <PageHeader icon={BarChart3} title="Sales Tracker" subtitle="Track your leads and conversions">
        <Select value={dateFilter} onValueChange={v => { setDateFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
            <SelectItem value="last_3_months">Last 3 Months</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleExport} disabled={filtered.length === 0}>
          <Download className="w-4 h-4" /> Export Report
        </Button>
        <Button onClick={openAdd} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <Plus className="w-4 h-4" /> Add Lead
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard title="Total Leads" value={totalLeads} icon={Users} color="indigo" />
        <StatCard title="Approached" value={approached} icon={Send} color="blue" />
        <StatCard title="Converted" value={converted} icon={CheckCircle} color="green" />
        <StatCard title="Rejected" value={rejected} icon={XCircle} color="orange" />
        <StatCard title="Pending" value={pending} icon={Clock} color="purple" />
        <StatCard title="Conversion Rate" value={`${conversionRate}%`} icon={BarChart3} color="pink" />
      </div>

      {/* Filter Bar */}
      <Card className="p-4 border border-border/50 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search leads by name, email, phone or Instagram..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
          </div>
          <Select value={teamFilter} onValueChange={v => { setTeamFilter(v); setPage(1); }}>
            <SelectTrigger className="w-44 h-9 text-xs"><SelectValue placeholder="All Team Members" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Team Members</SelectItem>
              {teamMembers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36 h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approached">Approached</SelectItem>
              <SelectItem value="not_approached">Not Approached</SelectItem>
              <SelectItem value="Converted">Converted</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="border border-border/50 overflow-hidden">
        {paginated.length === 0 ? (
          <EmptyState icon={BarChart3} title="No leads found" description="Add your first lead to start tracking sales" actionLabel="Add Lead" onAction={openAdd} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs whitespace-nowrap">Lead Name</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Date Added</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Contact No.</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Email ID</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Instagram</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Contacted By</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Contacted On</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Reply</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Follow Up</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Status/Response</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Notes</TableHead>
                  <TableHead className="text-xs whitespace-nowrap text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map(lead => (
                  <TableRow key={lead.id} className="hover:bg-muted/30">
                    <TableCell className="text-xs font-medium whitespace-nowrap">{lead.lead_name}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{fmtDate(lead.date_added)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{lead.contact_number || '-'}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{lead.email_id || '-'}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{lead.instagram || '-'}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{lead.contacted_by || '-'}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{fmtDate(lead.contacted_on)}</TableCell>
                    <TableCell className="whitespace-nowrap"><Badge className={getReplyBadgeClass(lead.reply)}>{lead.reply || 'No Response'}</Badge></TableCell>
                    <TableCell className="whitespace-nowrap"><Badge className={getStatusBadgeClass(lead.status)}>{lead.status || 'Pending'}</Badge></TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{fmtDate(lead.follow_up_date)}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate" title={lead.status_response}>{lead.status_response || '-'}</TableCell>
                    <TableCell className="text-xs max-w-[150px] truncate" title={lead.notes}>{lead.notes || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(lead)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => setDeleteId(lead.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-4 text-xs text-muted-foreground">
          <span>Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)} to {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} leads</span>
          <div className="flex items-center gap-1 flex-wrap">
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Button key={p} variant={page === p ? 'default' : 'outline'} size="icon" className={`h-7 w-7 text-xs ${page === p ? 'bg-orange-500 hover:bg-orange-600 border-orange-500' : ''}`} onClick={() => setPage(p)}>{p}</Button>
            ))}
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === totalPages} onClick={() => setPage(page + 1)}>›</Button>
          </div>
        </div>
      )}

      <LeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingLead={editingLead}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The lead will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}