import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Megaphone, Plus, Search, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';

export default function Campaigns() {
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ name: '', client_name: '', status: 'active', assigned_manager: '', start_date: '', end_date: '', brief: '', notes: '', budget: 0 });
  const queryClient = useQueryClient();

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Campaign.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['campaigns'] }); setShowDialog(false); resetForm(); },
  });

  const resetForm = () => setForm({ name: '', client_name: '', status: 'active', assigned_manager: '', start_date: '', end_date: '', brief: '', notes: '', budget: 0 });

  const filtered = campaigns.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) || c.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  const active = filtered.filter(c => c.status === 'active');
  const completed = filtered.filter(c => c.status === 'completed');

  return (
    <div>
      <PageHeader icon={Megaphone} title="Campaigns" subtitle="Manage all your influencer marketing campaigns">
        <Button onClick={() => setShowDialog(true)} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <Plus className="w-4 h-4" /> New Campaign
        </Button>
      </PageHeader>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {campaigns.length === 0 && !isLoading && (
        <EmptyState title="No campaigns yet" description="Create your first campaign to get started" actionLabel="New Campaign" onAction={() => setShowDialog(true)} />
      )}

      {active.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            Active Campaigns <Badge className="bg-green-500/10 text-green-600 border-0">{active.length}</Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map(c => <CampaignCard key={c.id} campaign={c} />)}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            Completed Campaigns <Badge className="bg-gray-500/10 text-gray-500 border-0">{completed.length}</Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completed.map(c => <CampaignCard key={c.id} campaign={c} />)}
          </div>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create New Campaign</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Campaign Name *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div><Label>Client Name *</Label><Input value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} /></div>
              <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} /></div>
            </div>
            <div><Label>Campaign Manager</Label><Input value={form.assigned_manager} onChange={e => setForm({...form, assigned_manager: e.target.value})} /></div>
            <div><Label>Influencer Budget (₹)</Label><Input type="number" value={form.budget} onChange={e => setForm({...form, budget: Number(e.target.value)})} /></div>
            <div><Label>Brief</Label><Textarea value={form.brief} onChange={e => setForm({...form, brief: e.target.value})} rows={3} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} /></div>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.name || !form.client_name || createMutation.isPending} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
              {createMutation.isPending ? 'Creating...' : 'Create Campaign'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CampaignCard({ campaign }) {
  return (
    <Link to={`/campaigns/${campaign.id}`}>
      <Card className="p-4 border border-border/50 hover:border-orange-500/30 hover:shadow-md transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-orange-500 transition-colors">{campaign.name}</h3>
          <Badge className={campaign.status === 'active' ? 'bg-green-500/10 text-green-600 border-0 text-[10px]' : 'bg-gray-500/10 text-gray-500 border-0 text-[10px]'}>
            {campaign.status === 'active' ? 'Active' : 'Completed'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-3">{campaign.client_name}</p>
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{campaign.start_date ? format(new Date(campaign.start_date), 'MMM d, yyyy') : 'No date'}</span>
          <span className="flex items-center gap-1"><User className="w-3 h-3" />{campaign.assigned_manager || 'Unassigned'}</span>
        </div>
        {/* {(campaign.budget > 0 || campaign.revenue > 0) && (
          <div className="flex items-center gap-4 text-[10px] mt-2">
            <span className="text-muted-foreground">Budget: ₹{(campaign.budget || 0).toLocaleString('en-IN')}</span>
            <span className="text-orange-500 font-medium">Revenue: ₹{(campaign.revenue || 0).toLocaleString('en-IN')}</span>
          </div>
        )} */}

        {/* {campaign.budget > 0 && (
          <div className="text-[10px] mt-2">
            <span className="text-muted-foreground">
              Influencer Budget: ₹{(campaign.budget || 0).toLocaleString('en-IN')}
            </span>
          </div>
        )} */}

        {campaign.budget > 0 && (
          <div className="text-[10px] mt-2">
            <span className="text-muted-foreground">
              Influencer Budget:{' '}
            </span>
            <span className="text-orange-500 font-semibold">
              ₹{(campaign.budget || 0).toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </Card>
    </Link>
  );
}