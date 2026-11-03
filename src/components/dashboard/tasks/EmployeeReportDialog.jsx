import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ListTodo, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TaskPanel from './TaskPanel';
import { toDateKey } from '@/lib/calendarUtils';

export default function EmployeeReportDialog({ open, initialDate, onOpenChange }) {
  const [date, setDate] = useState(initialDate || toDateKey(new Date()));
  const [employeeId, setEmployeeId] = useState('');

  useEffect(() => {
    if (open && initialDate) setDate(initialDate);
  }, [open, initialDate]);

  const { data: employees = [] } = useQuery({
    queryKey: ['attendance-employees'],
    queryFn: () => base44.entities.AttendanceEmployee.filter({ status: 'active' }),
    enabled: open,
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['dailyTaskEntries', date],
    queryFn: () => base44.entities.DailyTaskEntry.filter({ date }),
    enabled: open,
  });

  const employee = employees.find(e => e.id === employeeId);
  const entry = employee
    ? entries.find(e => (employee.email && e.employee_email === employee.email) || e.employee_name === employee.full_name)
    : null;

  const panelProps = { readOnly: true, onAdd: () => {}, onToggle: () => {}, onDelete: () => {} };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Employee Updates</DialogTitle></DialogHeader>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 rounded-lg border border-input bg-white/70 px-3 text-sm text-gray-700 outline-none"
          />
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="h-9 flex-1 text-sm"><SelectValue placeholder="Select an employee" /></SelectTrigger>
            <SelectContent>
              {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {!employee ? (
          <p className="text-xs text-muted-foreground py-8 text-center">Select an employee to view their To-Do and EOD for this day.</p>
        ) : isLoading ? (
          <p className="text-xs text-muted-foreground py-8 text-center">Loading...</p>
        ) : !entry ? (
          <p className="text-sm text-gray-600 py-8 text-center">{employee.full_name} has not yet updated.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 items-start">
            <TaskPanel
              title="To-Do"
              subtitle={`${employee.full_name}'s plan`}
              icon={ListTodo}
              accent="from-orange-400 to-orange-600"
              items={entry.tasks || []}
              emptyText="No tasks on this day."
              {...panelProps}
            />
            <TaskPanel
              title="End of Day (EOD)"
              subtitle="What was completed"
              icon={CheckCircle2}
              accent="from-emerald-400 to-emerald-600"
              items={entry.eod || []}
              emptyText="No EOD entries on this day."
              {...panelProps}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}