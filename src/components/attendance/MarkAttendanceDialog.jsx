import React from 'react';
import { format } from 'date-fns';
import { Check, X, Minus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const OPTIONS = [
  { value: 'present', label: 'Present', icon: Check, classes: 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20' },
  { value: 'absent', label: 'Absent', icon: X, classes: 'bg-red-500/10 text-red-700 hover:bg-red-500/20' },
  { value: 'leave', label: 'Leave', icon: Minus, classes: 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20' },
];

export default function MarkAttendanceDialog({ cell, current, saving, onClose, onSelect }) {
  return (
    <Dialog open={!!cell} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{cell?.employee?.full_name}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          {cell?.date ? format(new Date(`${cell.date}T00:00:00`), 'EEEE, MMMM d, yyyy') : ''}
        </p>
        <div className="space-y-2">
          {OPTIONS.map(({ value, label, icon: Icon, classes }) => (
            <button
              key={value}
              type="button"
              disabled={saving}
              onClick={() => onSelect(value)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 ${classes} ${
                current === value ? 'ring-2 ring-offset-1 ring-current' : ''
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
        {current && (
          <Button variant="ghost" size="sm" className="text-muted-foreground gap-2" onClick={() => onSelect(null)} disabled={saving}>
            <Trash2 className="w-3.5 h-3.5" /> Clear mark
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}