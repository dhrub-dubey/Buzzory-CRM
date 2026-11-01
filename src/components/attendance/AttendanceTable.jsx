import React from 'react';
import { format } from 'date-fns';
import { Check, X, Minus } from 'lucide-react';
import SwipeEmployeeName from '@/components/attendance/SwipeEmployeeName';

const STATUS_STYLES = {
  present: 'bg-emerald-500/15 text-emerald-600',
  absent: 'bg-red-500/15 text-red-600',
  leave: 'bg-amber-500/15 text-amber-600',
};

const STATUS_ICONS = { present: Check, absent: X, leave: Minus };

function Cell({ record, canMark, onClick }) {
  const Icon = record ? STATUS_ICONS[record.status] : null;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canMark}
      title={canMark ? 'Mark attendance' : 'Only board members and admins can mark attendance'}
      className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
        record ? STATUS_STYLES[record.status] : 'bg-slate-900/5'
      } ${canMark ? 'hover:ring-2 hover:ring-orange-400/50 cursor-pointer' : 'cursor-default'}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function AttendanceTable({ employees, days, recordMap, canMark, onSelect, onDeleteRequest }) {
  const todayKey = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-0 w-full">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-white/85 backdrop-blur text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-[220px] min-w-[220px]">
                Employee
              </th>
              {days.map(day => {
                const key = format(day, 'yyyy-MM-dd');
                return (
                  <th key={key} className="px-0.5 py-2 text-center min-w-[32px]">
                    <div className="text-[10px] text-muted-foreground">{format(day, 'EEEEE')}</div>
                    <div className={`text-xs font-semibold ${key === todayKey ? 'text-orange-500' : 'text-foreground'}`}>
                      {format(day, 'd')}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => (
              <tr key={employee.id} className="group">
                <td className="sticky left-0 z-10 bg-white/90 backdrop-blur p-0 w-[220px] min-w-[220px]">
                  <SwipeEmployeeName employee={employee} canDelete={canMark} onDelete={() => onDeleteRequest?.(employee)} />
                </td>
                {days.map(day => {
                  const key = format(day, 'yyyy-MM-dd');
                  return (
                    <td key={key} className="px-0.5 py-2 text-center">
                      <div className="flex justify-center">
                        <Cell
                          record={recordMap[`${employee.id}|${key}`]}
                          canMark={canMark}
                          onClick={() => onSelect(employee, key)}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-t border-white/60 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-emerald-500/15 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-emerald-600" /></span> Present</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-red-500/15 flex items-center justify-center"><X className="w-2.5 h-2.5 text-red-600" /></span> Absent</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-amber-500/15 flex items-center justify-center"><Minus className="w-2.5 h-2.5 text-amber-600" /></span> Leave</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-slate-900/5" /> Not Marked</span>
      </div>
    </div>
  );
}