import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { COLOR_KEYS, EVENT_COLORS } from '@/lib/calendarUtils';

const EMPTY = { title: '', date: '', start_time: '', end_time: '', color: 'orange', description: '' };

export default function EventDialog({ open, onOpenChange, event, presetDate, onSubmit, isPending }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    if (event) {
      setForm({
        title: event.title || '',
        date: event.date || '',
        start_time: event.start_time || '',
        end_time: event.end_time || '',
        color: event.color || 'orange',
        description: event.description || '',
      });
    } else {
      setForm({ ...EMPTY, date: presetDate || '' });
    }
  }, [open, event, presetDate]);

  const submit = (e) => {
    e.preventDefault();
    if (!form.title || !form.date) return;
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Add Event'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Client Call - Cashify" />
          </div>
          <div>
            <Label className="text-xs">Date</Label>
            <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Start Time</Label>
              <Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">End Time</Label>
              <Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Colour</Label>
            <div className="flex items-center gap-2 mt-1.5">
              {COLOR_KEYS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-7 h-7 rounded-full transition-transform ${EVENT_COLORS[c].solid} ${
                    form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Description / Notes</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Optional details..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending || !form.title || !form.date} className="bg-orange-500 hover:bg-orange-600 text-white">
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}