import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ListTodo, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TaskPanel from './TaskPanel';
import { toDateKey } from '@/lib/calendarUtils';

export default function EmployeeReportDialog({ open, initialDate, onOpenChange }) {
  const [date, setDate] = useState(initialDate || toDateKey(new Date()));
  const [employeeId, setEmployeeId] = useState('');

  useEffect(() => {
    if (open && initialDate) {
      setDate(initialDate);
      setEmployeeId('');
    }
  }, [open, initialDate]);

  const { data: employees = [], isLoading: loadingEmployees, error: employeesError } = useQuery({
    queryKey: ['attendance-employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, status')
        .eq('role', 'employee')
        .eq('status', 'approved')
        .order('full_name');

      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const employee = employees.find((item) => item.id === employeeId);
  const {
    data: entry = null,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dailyTaskEntry', employeeId, date],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from('daily_task_entries')
        .select('tasks, eod')
        .eq('employee_id', employeeId)
        .eq('date', date)
        .maybeSingle();

      if (queryError) throw queryError;
      return data;
    },
    enabled: open && !!employeeId && !!date,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Employee Updates</DialogTitle></DialogHeader>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-9 rounded-lg border border-input bg-white/70 px-3 text-sm text-gray-700 outline-none"
          />
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="h-9 flex-1 text-sm"><SelectValue placeholder="Select an employee" /></SelectTrigger>
            <SelectContent>
              {employees.map((item) => (
                <SelectItem key={item.id} value={item.id}>{item.full_name || item.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loadingEmployees ? (
          <p className="text-xs text-muted-foreground py-8 text-center">Loading employees...</p>
        ) : employeesError ? (
          <p className="text-sm text-red-600 py-5 text-center">Unable to load employees: {employeesError.message}</p>
        ) : !employee ? (
          <p className="text-xs text-muted-foreground py-8 text-center">
            Select an employee to view their To-Do and EOD for this day.
          </p>
        ) : isLoading ? (
          <p className="text-xs text-muted-foreground py-8 text-center">Loading updates...</p>
        ) : error ? (
          <p className="text-sm text-red-600 py-5 text-center">Unable to load updates: {error.message}</p>
        ) : !entry ? (
          <p className="text-sm text-gray-600 py-8 text-center">
            {employee.full_name || 'This employee'} has not yet updated for {date}.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 items-start">
            <TaskPanel
              title="To-Do"
              subtitle={`${employee.full_name || 'Employee'}'s plan`}
              icon={ListTodo}
              accent="from-orange-400 to-orange-600"
              items={entry.tasks || []}
              emptyText="No tasks on this day."
              readOnly
              onAdd={() => {}}
              onToggle={() => {}}
              onDelete={() => {}}
            />
            <TaskPanel
              title="End of Day (EOD)"
              subtitle="What was completed"
              icon={CheckCircle2}
              accent="from-emerald-400 to-emerald-600"
              items={entry.eod || []}
              emptyText="No EOD entries on this day."
              readOnly
              onAdd={() => {}}
              onToggle={() => {}}
              onDelete={() => {}}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
