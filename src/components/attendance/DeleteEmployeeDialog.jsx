import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DeleteEmployeeDialog({ employee, onClose, onConfirm, deleting }) {
  const [text, setText] = useState('');

  useEffect(() => setText(''), [employee?.id]);

  const matches = text.trim().toLowerCase() === (employee?.full_name || '').trim().toLowerCase();

  return (
    <Dialog open={!!employee} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Delete {employee?.full_name}?</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          This removes the employee from the attendance list along with all of their attendance records. This cannot be undone.
        </p>
        <div className="space-y-2">
          <Label>Type <span className="font-semibold text-foreground">{employee?.full_name}</span> to confirm</Label>
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={employee?.full_name} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={deleting}>Cancel</Button>
          <Button
            onClick={() => onConfirm(employee)}
            disabled={!matches || deleting}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {deleting ? 'Deleting...' : 'Delete Employee'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}