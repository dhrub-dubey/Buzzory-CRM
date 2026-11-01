import React from 'react';
import { Check, X, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';

const CARDS = [
  { key: 'present', label: 'Total Present Today', icon: Check, iconClass: 'bg-emerald-500/15 text-emerald-600' },
  { key: 'absent', label: 'Absent Today', icon: X, iconClass: 'bg-red-500/15 text-red-600' },
  { key: 'leave', label: 'On Leave Today', icon: Minus, iconClass: 'bg-amber-500/15 text-amber-600' },
];

export default function AttendanceStats({ counts, total }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {CARDS.map(({ key, label, icon: Icon, iconClass }) => (
        <Card key={key} className="p-4 flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold text-foreground whitespace-nowrap">{counts[key] || 0} / {total}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}