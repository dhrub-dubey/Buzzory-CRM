import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const REPLY_OPTIONS = [
  'No Response', 'Interested', 'Very Interested', 'Call Back Later',
  'Meeting Scheduled', 'Proposal Sent', 'Follow-up Required',
  'Not Interested', 'Budget Issue', 'Already Working with Another Agency', 'Wrong Contact'
];

const EMPTY_FORM = {
  lead_name: '', date_added: '', contact_number: '', email_id: '', instagram: '',
  contacted_by: '', contacted_on: '', reply: 'No Response', follow_up_date: '',
  status: 'Pending', status_response: '', notes: ''
};

export default function LeadDialog({ open, onOpenChange, editingLead, onSubmit, isPending }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(editingLead
        ? { ...EMPTY_FORM, ...editingLead }
        : { ...EMPTY_FORM, date_added: new Date().toISOString().split('T')[0] }
      );
    }
  }, [open, editingLead]);

  const handleSubmit = () => {
    if (!form.lead_name) return;
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{editingLead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Lead Name *</Label><Input value={form.lead_name} onChange={e => setForm({ ...form, lead_name: e.target.value })} /></div>
            <div><Label className="text-xs">Date Added</Label><Input type="date" value={form.date_added} onChange={e => setForm({ ...form, date_added: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Contact Number</Label><Input value={form.contact_number} onChange={e => setForm({ ...form, contact_number: e.target.value })} /></div>
            <div><Label className="text-xs">Email ID</Label><Input value={form.email_id} onChange={e => setForm({ ...form, email_id: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Instagram</Label><Input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} /></div>
            <div><Label className="text-xs">Contacted By</Label><Input value={form.contacted_by} onChange={e => setForm({ ...form, contacted_by: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Contacted On</Label><Input type="date" value={form.contacted_on} onChange={e => setForm({ ...form, contacted_on: e.target.value })} /></div>
            <div><Label className="text-xs">Reply</Label>
              <Select value={form.reply} onValueChange={v => setForm({ ...form, reply: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REPLY_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Converted">Converted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Follow-up Date</Label><Input type="date" value={form.follow_up_date} onChange={e => setForm({ ...form, follow_up_date: e.target.value })} /></div>
          </div>
          <div><Label className="text-xs">Conversation Summary</Label><Textarea value={form.status_response} onChange={e => setForm({ ...form, status_response: e.target.value })} rows={3} placeholder="Detailed summary of the conversation..." /></div>
          <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Internal notes / action items..." /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!form.lead_name || isPending} className="bg-orange-500 hover:bg-orange-600 text-white">
            {isPending ? 'Saving...' : editingLead ? 'Update Lead' : 'Add Lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}