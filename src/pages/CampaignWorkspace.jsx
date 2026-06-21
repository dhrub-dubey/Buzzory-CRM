import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Plus, Search, Pencil, Trash2, AlertTriangle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const STATUSES = ['Not Contacted', 'Contacted', 'Confirmed', 'Mail Done', 'Brief Given', 'Shoot Done', 'Content Received', 'Approved', 'Posted'];
const statusColors = {
  'Not Contacted': 'bg-gray-100 text-gray-600',
  'Contacted': 'bg-blue-100 text-blue-600',
  'Confirmed': 'bg-green-100 text-green-600',
  'Mail Done': 'bg-purple-100 text-purple-600',
  'Brief Given': 'bg-indigo-100 text-indigo-600',
  'Shoot Done': 'bg-pink-100 text-pink-600',
  'Content Received': 'bg-yellow-100 text-yellow-700',
  'Approved': 'bg-emerald-100 text-emerald-600',
  'Posted': 'bg-orange-100 text-orange-600',
};

const emptyForm = { influencer_name: '', instagram_link: '', contact_number: '', status: 'Not Contacted', pricing: 0, payment_status: 'Pending', posting_date: '', posting_link: '', notes: '' };

export default function CampaignWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  //const [showDialog, setShowDialog] = useState(false);
  const [showDialog, setShowDialog] = useState(
    () => localStorage.getItem(`campaign_${id}_influencerDialog`) === "true"
  );
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
 // const [form, setForm] = useState(emptyForm);
  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem(
      `campaign_${id}_influencerDraft`
    );

    return saved ? JSON.parse(saved) : emptyForm;
  });
  const [showDeleteCampaign, setShowDeleteCampaign] = useState(false);
  const [confirmName, setConfirmName] = useState('');

  const [showEditCampaign, setShowEditCampaign] = useState(
    () => localStorage.getItem(`campaign_${id}_editDialog`) === "true"
  );
  
  const [campaignForm, setCampaignForm] = useState(() => {
    const saved = localStorage.getItem(
      `campaign_${id}_editDraft`
    );
  
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem(
      `campaign_${id}_influencerDialog`,
      showDialog.toString()
    );
  }, [showDialog, id]);
  
  useEffect(() => {
    localStorage.setItem(
      `campaign_${id}_influencerDraft`,
      JSON.stringify(form)
    );
  }, [form, id]);

  useEffect(() => {
    localStorage.setItem(
      `campaign_${id}_editDialog`,
      showEditCampaign.toString()
    );
  }, [showEditCampaign, id]);
  
  useEffect(() => {
    localStorage.setItem(
      `campaign_${id}_editDraft`,
      JSON.stringify(campaignForm)
    );
  }, [campaignForm, id]);

  const queryClient = useQueryClient();

  const { data: campaign } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => { const list = await base44.entities.Campaign.filter({ id }); return list[0]; },
    enabled: !!id,
  });

  const { data: influencers = [] } = useQuery({
    queryKey: ['campaignInfluencers', id],
    queryFn: () => base44.entities.CampaignInfluencer.filter({ campaign_id: id }, '-created_date', 200),
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CampaignInfluencer.create({ ...data, campaign_id: id, campaign_name: campaign?.name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['campaignInfluencers', id] }); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ rid, data }) => base44.entities.CampaignInfluencer.update(rid, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['campaignInfluencers', id] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (rid) => base44.entities.CampaignInfluencer.delete(rid),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['campaignInfluencers', id] }); setDeleteId(null); },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Campaign.delete(id);
    },
    onSuccess: () => { navigate('/campaigns'); },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: (data) => base44.entities.Campaign.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      closeEditCampaign();
    },
  });

  //const closeDialog = () => { setShowDialog(false); setEditing(null); setForm(emptyForm); };

  const closeDialog = () => {
    localStorage.removeItem(
      `campaign_${id}_influencerDraft`
    );
  
    localStorage.removeItem(
      `campaign_${id}_influencerDialog`
    );
  
    setShowDialog(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const closeEditCampaign = () => {
    localStorage.removeItem(
      `campaign_${id}_editDialog`
    );
  
    localStorage.removeItem(
      `campaign_${id}_editDraft`
    );
  
    setShowEditCampaign(false);
    setCampaignForm({});
  };

  const openEdit = (inf) => { setEditing(inf); setForm({ influencer_name: inf.influencer_name, instagram_link: inf.instagram_link || '', contact_number: inf.contact_number || '', status: inf.status, pricing: inf.pricing || 0, payment_status: inf.payment_status, posting_date: inf.posting_date || '', posting_link: inf.posting_link || '', notes: inf.notes || '' }); setShowDialog(true); };

  const handleSave = () => {
    if (editing) updateMutation.mutate({ rid: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const filtered = influencers.filter(i => i.influencer_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <Link to="/campaigns" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Campaigns
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{campaign?.name || 'Campaign Workspace'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{campaign?.client_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={campaign?.status === 'active' ? 'bg-green-500/10 text-green-600 border-0' : 'bg-gray-500/10 text-gray-500 border-0'}>
            {campaign?.status === 'active' ? 'Active' : 'Completed'}
          </Badge>
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => {
                    if (!localStorage.getItem(`campaign_${id}_editDraft`)) {
                      setCampaignForm({
                        name: campaign?.name,
                        client_name: campaign?.client_name,
                        budget: campaign?.budget || 0,
                        assigned_manager: campaign?.assigned_manager || '',
                        start_date: campaign?.start_date || '',
                        end_date: campaign?.end_date || '',
                        brief: campaign?.brief || '',
                        status: campaign?.status || 'active'
                      });
                    }

                    setShowEditCampaign(true);
                  }}>
            <Settings className="w-3 h-3" /> Edit Campaign
          </Button>
          <Button variant="destructive" size="sm" className="gap-1 text-xs" onClick={() => { setConfirmName(''); setShowDeleteCampaign(true); }}>
            <Trash2 className="w-3 h-3" /> Delete Campaign
          </Button>
        </div>
      </div>

      {/* Campaign Info */}
      <Card className="p-4 border border-border/50 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-muted-foreground text-xs">Client</span><p className="font-medium">{campaign?.client_name || '-'}</p></div>
          <div><span className="text-muted-foreground text-xs">Manager</span><p className="font-medium">{campaign?.assigned_manager || '-'}</p></div>
          <div><span className="text-muted-foreground text-xs">Start</span><p className="font-medium">{campaign?.start_date || '-'}</p></div>
          <div><span className="text-muted-foreground text-xs">End</span><p className="font-medium">{campaign?.end_date || '-'}</p></div>
        </div>
        {campaign?.brief && <p className="text-xs text-muted-foreground mt-3 border-t pt-3"><span className="font-medium text-foreground">Brief:</span> {campaign.brief}</p>}
      </Card>

      {/* Influencer Tracking */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">Influencer Tracking</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 w-48 h-8 text-xs" />
          </div>
          <Button onClick={() => setShowDialog(true)} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white gap-1 text-xs">
            <Plus className="w-3 h-3" /> Add Influencer
          </Button>
        </div>
      </div>

      <Card className="border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Influencer</TableHead>
                <TableHead className="text-xs">Instagram</TableHead>
                <TableHead className="text-xs">Contact</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Pricing</TableHead>
                <TableHead className="text-xs">Payment</TableHead>
                <TableHead className="text-xs">Posting Date</TableHead>
                <TableHead className="text-xs">Notes</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(inf => (
                <TableRow key={inf.id} className="hover:bg-muted/30">
                  <TableCell className="text-sm font-medium">{inf.influencer_name}</TableCell>
                  <TableCell className="text-xs">{inf.instagram_link ? <a href={inf.instagram_link} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">View</a> : '-'}</TableCell>
                  <TableCell className="text-xs">{inf.contact_number || '-'}</TableCell>
                  <TableCell><Badge className={`${statusColors[inf.status] || 'bg-gray-100 text-gray-600'} border-0 text-[10px]`}>{inf.status}</Badge></TableCell>
                  <TableCell className="text-xs font-medium">₹{(inf.pricing || 0).toLocaleString('en-IN')}</TableCell>
                  <TableCell><Badge className={inf.payment_status === 'Paid' ? 'bg-green-100 text-green-600 border-0 text-[10px]' : 'bg-yellow-100 text-yellow-700 border-0 text-[10px]'}>{inf.payment_status}</Badge></TableCell>
                  <TableCell className="text-xs">{inf.posting_date || '-'}</TableCell>
                  <TableCell className="text-xs max-w-[120px] truncate">{inf.notes || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(inf)}><Pencil className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteId(inf.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-sm">No influencers added yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={v => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Influencer' : 'Add Influencer'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Name *</Label><Input value={form.influencer_name} onChange={e => setForm({...form, influencer_name: e.target.value})} /></div>
              <div><Label className="text-xs">Contact Number</Label><Input value={form.contact_number} onChange={e => setForm({...form, contact_number: e.target.value})} /></div>
            </div>
            <div><Label className="text-xs">Instagram Link</Label><Input value={form.instagram_link} onChange={e => setForm({...form, instagram_link: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Pricing (₹)</Label><Input type="number" value={form.pricing} onChange={e => setForm({...form, pricing: Number(e.target.value)})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Payment Status</Label>
                <Select value={form.payment_status} onValueChange={v => setForm({...form, payment_status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Paid">Paid</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Posting Date</Label><Input type="date" value={form.posting_date} onChange={e => setForm({...form, posting_date: e.target.value})} /></div>
            </div>
            <div><Label className="text-xs">Posting Link</Label><Input value={form.posting_link} onChange={e => setForm({...form, posting_link: e.target.value})} /></div>
            <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} /></div>
            <Button onClick={handleSave} disabled={!form.influencer_name} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
              {editing ? 'Update' : 'Add Influencer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog open={showEditCampaign} onOpenChange={(v) => { if (!v) closeEditCampaign(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Campaign</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Campaign Name *</Label><Input value={campaignForm.name || ''} onChange={e => setCampaignForm({...campaignForm, name: e.target.value})} /></div>
              <div><Label className="text-xs">Client Name</Label><Input value={campaignForm.client_name || ''} onChange={e => setCampaignForm({...campaignForm, client_name: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Status</Label>
                <Select value={campaignForm.status || 'active'} onValueChange={v => setCampaignForm({...campaignForm, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Influencer Cost (₹)</Label><Input type="number" value={campaignForm.budget || 0} onChange={e => setCampaignForm({...campaignForm, budget: Number(e.target.value)})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Start Date</Label><Input type="date" value={campaignForm.start_date || ''} onChange={e => setCampaignForm({...campaignForm, start_date: e.target.value})} /></div>
              <div><Label className="text-xs">End Date</Label><Input type="date" value={campaignForm.end_date || ''} onChange={e => setCampaignForm({...campaignForm, end_date: e.target.value})} /></div>
            </div>
            <div><Label className="text-xs">Assigned Manager</Label><Input value={campaignForm.assigned_manager || ''} onChange={e => setCampaignForm({...campaignForm, assigned_manager: e.target.value})} /></div>
            <div><Label className="text-xs">Brief</Label><Textarea value={campaignForm.brief || ''} onChange={e => setCampaignForm({...campaignForm, brief: e.target.value})} rows={2} /></div>
            <Button onClick={() => updateCampaignMutation.mutate(campaignForm)} disabled={!campaignForm.name || updateCampaignMutation.isPending} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
              {updateCampaignMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Campaign Dialog */}
      <AlertDialog open={showDeleteCampaign} onOpenChange={v => { if (!v) setShowDeleteCampaign(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Delete Campaign
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{campaign?.name}</strong> and cannot be undone.<br /><br />
              Type the campaign name to confirm:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirmName}
            onChange={e => setConfirmName(e.target.value)}
            placeholder={campaign?.name}
            className="mt-1"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteCampaign(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmName !== campaign?.name || deleteCampaignMutation.isPending}
              onClick={() => deleteCampaignMutation.mutate()}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-40"
            >
              {deleteCampaignMutation.isPending ? 'Deleting...' : 'Delete Campaign'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Influencer</AlertDialogTitle><AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}