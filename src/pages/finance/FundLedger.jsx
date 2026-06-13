import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Plus, Wallet, TrendingUp, TrendingDown, DollarSign, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';

const DELETE_THRESHOLD = 60;

function SwipeableRow({ children, onDelete }) {
  const x = useMotionValue(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [swiped, setSwiped] = useState(false);

  const deleteOpacity = useTransform(x, [-DELETE_THRESHOLD, -20], [1, 0]);
  const deleteScale = useTransform(x, [-DELETE_THRESHOLD, -20], [1, 0.7]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -DELETE_THRESHOLD) {
      animate(x, -DELETE_THRESHOLD, { type: 'spring', stiffness: 300, damping: 30 });
      setSwiped(true);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
      setSwiped(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
    setSwiped(false);
  };

  return (
    <>
      <div className="relative overflow-hidden">
        <motion.div
          style={{ opacity: deleteOpacity, scale: deleteScale }}
          className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-center bg-red-500"
        >
          <button onClick={() => setShowConfirm(true)} className="flex flex-col items-center gap-1">
            <Trash2 className="h-4 w-4 text-white" />
            <span className="text-[10px] text-white font-medium">Delete</span>
          </button>
        </motion.div>

        <motion.div
          drag="x"
          dragConstraints={{ left: -DELETE_THRESHOLD, right: 0 }}
          dragElastic={0.1}
          style={{ x }}
          onDragEnd={handleDragEnd}
          onClick={() => {
            if (swiped) {
              animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
              setSwiped(false);
            }
          }}
          className="relative z-10 cursor-grab active:cursor-grabbing"
        >
          {children}
        </motion.div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This transaction will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowConfirm(false); onDelete(); }} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const emptyForm = { date: '', transaction_type: 'Credit', description: '', amount_credited: 0, amount_debited: 0, notes: '' };

export default function FundLedger() {
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const queryClient = useQueryClient();

  const { data: transactions = [] } = useQuery({
    queryKey: ['fundTransactions'],
    queryFn: () => base44.entities.FundTransaction.list('-date', 500),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FundTransaction.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fundTransactions'] }); },
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const balance = transactions.reduce((s, t) => s + (t.amount_credited || 0) - (t.amount_debited || 0), 0);
      const newBalance = balance + (data.amount_credited || 0) - (data.amount_debited || 0);
      return base44.entities.FundTransaction.create({ ...data, running_balance: newBalance });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fundTransactions'] }); setShowDialog(false); setForm(emptyForm); },
  });

  const handleSave = () => {
    const data = { ...form };
    if (form.transaction_type === 'Credit') data.amount_debited = 0;
    else data.amount_credited = 0;
    createMutation.mutate(data);
  };

  const totalCredited = transactions.reduce((s, t) => s + (t.amount_credited || 0), 0);
  const totalDebited = transactions.reduce((s, t) => s + (t.amount_debited || 0), 0);
  const balance = totalCredited - totalDebited;
  const fmt = (v) => `₹${v.toLocaleString('en-IN')}`;

  return (
    <div>
      <PageHeader icon={Wallet} title="Company Fund Ledger" subtitle="Track all fund transactions">
        <Button onClick={() => setShowDialog(true)} className="bg-orange-500 hover:bg-orange-600 text-white gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Transaction
        </Button>
      </PageHeader>
      <Link to="/finance" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Finance
      </Link>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Current Balance" value={fmt(balance)} icon={Wallet} color="orange" />
        <StatCard title="Total Credited" value={fmt(totalCredited)} icon={TrendingUp} color="green" />
        <StatCard title="Total Debited" value={fmt(totalDebited)} icon={TrendingDown} color="pink" />
        <StatCard title="Net Change" value={fmt(balance)} icon={DollarSign} color="blue" />
      </div>

      <Card className="border border-border/50 overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[90px_70px_1fr_90px_90px_90px_100px] gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border/50">
          <span>Date</span>
          <span>Type</span>
          <span>Description</span>
          <span className="text-right">Credited</span>
          <span className="text-right">Debited</span>
          <span className="text-right">Balance</span>
          <span>Notes</span>
        </div>

        {/* Transaction rows */}
        {transactions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">No transactions found</div>
        ) : (
          transactions.map((t, i) => (
            <SwipeableRow key={t.id} onDelete={() => deleteMutation.mutate(t.id)}>
              <div className={`grid grid-cols-[90px_70px_1fr_90px_90px_90px_100px] gap-2 px-4 py-3 text-sm items-center ${i % 2 === 0 ? 'bg-white' : 'bg-muted/20'} border-b border-border/30 last:border-b-0`}>
                <span className="text-xs text-muted-foreground">{t.date || '-'}</span>
                <span>
                  <Badge className={`${t.transaction_type === 'Credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'} border-0 text-[10px] px-1.5`}>
                    {t.transaction_type}
                  </Badge>
                </span>
                <span className="truncate text-sm">{t.description || '-'}</span>
                <span className="text-right text-green-600 font-medium text-xs">
                  {t.amount_credited > 0 ? `₹${t.amount_credited.toLocaleString('en-IN')}` : '-'}
                </span>
                <span className="text-right text-red-500 font-medium text-xs">
                  {t.amount_debited > 0 ? `₹${t.amount_debited.toLocaleString('en-IN')}` : '-'}
                </span>
                <span className="text-right font-semibold text-xs">₹{(t.running_balance || 0).toLocaleString('en-IN')}</span>
                <span className="text-xs text-muted-foreground truncate">{t.notes || '-'}</span>
              </div>
            </SwipeableRow>
          ))
        )}
      </Card>

      {/* Add transaction dialog */}
      <Dialog open={showDialog} onOpenChange={v => { if (!v) { setShowDialog(false); setForm(emptyForm); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Date *</Label><Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
              <div>
                <Label className="text-xs">Type *</Label>
                <Select value={form.transaction_type} onValueChange={v => setForm({...form, transaction_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit">Credit</SelectItem>
                    <SelectItem value="Debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Description</Label><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            {form.transaction_type === 'Credit' ? (
              <div><Label className="text-xs">Amount Credited (₹)</Label><Input type="number" value={form.amount_credited} onChange={e => setForm({...form, amount_credited: Number(e.target.value)})} /></div>
            ) : (
              <div><Label className="text-xs">Amount Debited (₹)</Label><Input type="number" value={form.amount_debited} onChange={e => setForm({...form, amount_debited: Number(e.target.value)})} /></div>
            )}
            <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} /></div>
            <Button onClick={handleSave} disabled={!form.date} className="w-full bg-orange-500 hover:bg-orange-600 text-white">Add Transaction</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}