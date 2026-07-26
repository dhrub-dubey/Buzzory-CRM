import React, { useState } from 'react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

export default function DeleteInvoiceDialog({ open, onOpenChange, invoice, onConfirm, isPending }) {
  const [text, setText] = useState('');
  const canDelete = text.trim().toLowerCase() === 'delete';

  const handleOpenChange = (v) => {
    if (!v) setText('');
    onOpenChange(v);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete invoice <strong>{invoice?.invoice_number}</strong> for <strong>{invoice?.client_name}</strong>. Type <code>delete</code> below to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type 'delete' to confirm"
          autoFocus
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!canDelete || isPending}
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {isPending ? 'Deleting...' : 'Delete Invoice'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}