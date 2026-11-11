import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CheckCircle2, ListTodo } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TaskPanel from '@/components/dashboard/tasks/TaskPanel';

export default function AttendanceEmployeeUpdatesDialog({
  date,
  employees,
  open,
  onOpenChange,
}) {
  const [employeeId, setEmployeeId] = useState('');

  useEffect(() => {
    if (open) setEmployeeId('');
  }, [open, date]);

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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Employee Updates</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground -mt-2">
          {date ? format(new Date(`${date}T00:00:00`), 'EEEE, MMMM d, yyyy') : ''}
        </p>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Select an employee</p>
          {employees.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No approved employees found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {employees.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setEmployeeId(item.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    employeeId === item.id
                      ? 'border-orange-400 bg-orange-50 text-orange-900'
                      : 'border-white/80 bg-white/70 text-foreground hover:bg-white'
                  }`}
                >
                  {item.avatar_url ? (
                    <img src={item.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-semibold">
                      {(item.full_name?.trim()[0] || 'E').toUpperCase()}
                    </span>
                  )}
                  <span className="truncate">{item.full_name || item.email || 'Employee'}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {!employee ? (
          <p className="text-xs text-muted-foreground py-5 text-center">
            Select an employee to view their To-Do and EOD for this day.
          </p>
        ) : isLoading ? (
          <p className="text-xs text-muted-foreground py-8 text-center">Loading updates...</p>
        ) : error ? (
          <p className="text-sm text-red-600 py-5 text-center">
            Unable to load updates: {error.message}
          </p>
        ) : !entry ? (
          <p className="text-sm text-gray-600 py-8 text-center">
            {employee.full_name || 'This employee'} has not updated this day.
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
