
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ListTodo, CheckCircle2 } from 'lucide-react';
import TaskPanel from './TaskPanel';
import { toDateKey } from '@/lib/calendarUtils';

export default function EmployeeTaskList({ user }) {
  const today = toDateKey(new Date());
  const queryClient = useQueryClient();

  const queryKey = ['dailyTaskEntry', user?.id, today];

  const { data: entry = null, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_task_entries')
        .select('*')
        .eq('employee_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const save = useMutation({
    mutationFn: async (change) => {
      // Always use the latest cached entry
      const current = queryClient.getQueryData(queryKey);

      const updated = {
        employee_id: user.id,
        date: today,
        tasks: current?.tasks || [],
        eod: current?.eod || [],
        ...change(current),
      };

      const { data, error } = await supabase
        .from('daily_task_entries')
        .upsert(updated, {
          onConflict: 'employee_id,date',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },

    onError: (error) => {
      console.error('Daily task save failed:', error);
    },
  });

  const tasks = entry?.tasks || [];
  const eod = entry?.eod || [];

  const addTo = (key) => (item) => {
    save.mutate((current) => ({
      [key]: [
        ...(current?.[key] || []),
        {
          ...item,
          id: crypto.randomUUID(),
          done: false,
        },
      ],
    }));
  };

  const toggleIn = (key) => (id) => {
    save.mutate((current) => ({
      [key]: (current?.[key] || []).map((item) =>
        item.id === id
          ? { ...item, done: !item.done }
          : item
      ),
    }));
  };

  // Only EOD items can be deleted
  const removeEod = (id) => {
    save.mutate((current) => ({
      eod: (current?.eod || []).filter((item) => item.id !== id),
    }));
  };

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
        canDelete={false}
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
        onDelete={removeEod}
        canDelete
      />
    </div>
  );
}
