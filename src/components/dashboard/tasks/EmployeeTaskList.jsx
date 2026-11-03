import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ListTodo, CheckCircle2 } from 'lucide-react';
import TaskPanel from './TaskPanel';
import { toDateKey } from '@/lib/calendarUtils';

export default function EmployeeTaskList({ user }) {
  const today = toDateKey(new Date());
  const queryClient = useQueryClient();

  const { data: entry = null, isLoading } = useQuery({
    queryKey: ['dailyTaskEntry', user?.email, today],
    queryFn: async () => {
      const rows = await base44.entities.DailyTaskEntry.filter({ date: today, employee_email: user?.email });
      return rows[0] || null;
    },
    enabled: !!user?.email,
  });

  const save = useMutation({
    mutationFn: async (patch) => {
      if (entry) return base44.entities.DailyTaskEntry.update(entry.id, patch);
      return base44.entities.DailyTaskEntry.create({
        employee_name: user?.full_name || '',
        employee_email: user?.email || '',
        date: today,
        tasks: [],
        eod: [],
        ...patch,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dailyTaskEntry'] }),
  });

  const tasks = entry?.tasks || [];
  const eod = entry?.eod || [];

  const addTo = (key) => (item) =>
    save.mutate({ [key]: [...(entry?.[key] || []), { ...item, id: crypto.randomUUID(), done: false }] });

  const toggleIn = (key) => (id) =>
    save.mutate({ [key]: (entry?.[key] || []).map(i => (i.id === id ? { ...i, done: !i.done } : i)) });

  const removeFrom = (key) => (id) =>
    save.mutate({ [key]: (entry?.[key] || []).filter(i => i.id !== id) });

  return (
    <div className="grid gap-4 md:grid-cols-2 items-start">
      <TaskPanel
        title="To-Do"
        subtitle="Plan what you'll work on today"
        icon={ListTodo}
        accent="from-orange-400 to-orange-600"
        addLabel="Add Task"
        emptyText="No tasks yet. Add the first one."
        items={tasks}
        withPriority
        isLoading={isLoading}
        onAdd={addTo('tasks')}
        onToggle={toggleIn('tasks')}
        onDelete={removeFrom('tasks')}
      />
      <TaskPanel
        title="End of Day (EOD)"
        subtitle="Record what you completed today"
        icon={CheckCircle2}
        accent="from-emerald-400 to-emerald-600"
        addLabel="Add Update"
        emptyText="Nothing recorded yet for today."
        items={eod}
        isLoading={isLoading}
        onAdd={addTo('eod')}
        onToggle={toggleIn('eod')}
        onDelete={removeFrom('eod')}
      />
    </div>
  );
}