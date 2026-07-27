import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const DELETE_THRESHOLD = 80;

export default function SwipeableUserRow({ user, canDelete, onDelete, roleLabels, roleColors }) {
  const x = useMotionValue(0);
  const [swiped, setSwiped] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmName, setConfirmName] = useState('');

  const deleteOpacity = useTransform(x, [-DELETE_THRESHOLD, -20], [1, 0]);
  const deleteScale = useTransform(x, [-DELETE_THRESHOLD, -20], [1, 0.7]);

  const resetSwipe = () => {
    animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
    setSwiped(false);
  };

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -DELETE_THRESHOLD) {
      animate(x, -DELETE_THRESHOLD, { type: 'spring', stiffness: 300, damping: 30 });
      setSwiped(true);
    } else {
      resetSwipe();
    }
  };

  const confirmTarget = user.full_name || user.email || '';
  const nameMatch = confirmTarget !== '' && confirmName === confirmTarget;

  const handleConfirm = () => {
    onDelete();
    setShowConfirm(false);
    setConfirmName('');
    resetSwipe();
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setConfirmName('');
    resetSwipe();
  };

  return (
    <>
      <div className="relative overflow-hidden border-b border-border/40 last:border-b-0">
        {canDelete && (
          <motion.div
            style={{ opacity: deleteOpacity, scale: deleteScale }}
            className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center bg-red-500"
          >
            <button onClick={() => setShowConfirm(true)} className="flex flex-col items-center gap-1">
              <Trash2 className="h-4 w-4 text-white" />
              <span className="text-[10px] text-white font-medium">Delete</span>
            </button>
          </motion.div>
        )}

        <motion.div
          drag={canDelete ? 'x' : false}
          dragConstraints={{ left: -DELETE_THRESHOLD, right: 0 }}
          dragElastic={0.1}
          style={{ x }}
          onDragEnd={handleDragEnd}
          onClick={() => { if (swiped) resetSwipe(); }}
          className={`relative z-10 ${canDelete ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >
          <div className="grid grid-cols-[1fr_1fr_140px] gap-3 px-4 py-3 items-center bg-card min-w-[480px]">
            <span className="text-sm font-medium truncate">{user.full_name || 'User'}</span>
            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
            <Badge className={`${roleColors[user.role] || roleColors.employee} border-0 text-[10px] justify-self-start`}>{roleLabels[user.role] || 'Employee'}</Badge>
          </div>
        </motion.div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={(v) => { if (!v) handleCancel(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{user.full_name || user.email}</strong> from the system. This action cannot be undone. Type the user's name exactly (case and spacing) to confirm:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirmName}
            onChange={e => setConfirmName(e.target.value)}
            placeholder={confirmTarget}
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-40"
              disabled={!nameMatch}
              onClick={handleConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}