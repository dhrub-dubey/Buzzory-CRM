import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import CalendarGrid from './CalendarGrid';
import DayDetailsPanel from './DayDetailsPanel';
import EventDialog from './EventDialog';
import { toDateKey, monthLabel } from '@/lib/calendarUtils';

export default function CalendarView({ user }) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [presetDate, setPresetDate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ['calendarEvents'],
    queryFn: () => base44.entities.CalendarEvent.list('date', 500),
  });

  useEffect(() => {
    const unsubscribe = base44.entities.CalendarEvent.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    });
    return unsubscribe;
  }, [queryClient]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarEvent.create(data),
    onSuccess: () => { invalidate(); setDialogOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CalendarEvent.update(id, data),
    onSuccess: () => { invalidate(); setDialogOpen(false); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarEvent.delete(id),
    onSuccess: () => { invalidate(); setDeleteTarget(null); },
  });

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach(ev => {
      if (!ev.date) return;
      (map[ev.date] = map[ev.date] || []).push(ev);
    });
    Object.values(map).forEach(list => list.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')));
    return map;
  }, [events]);

  const handleSubmit = (data) => {
    const payload = { ...data, created_by_name: user?.full_name || '' };
    if (editingEvent) updateMutation.mutate({ id: editingEvent.id, data: payload });
    else createMutation.mutate(payload);
  };

  const openAdd = () => { setEditingEvent(null); setPresetDate(selectedDate); setDialogOpen(true); };
  const openEdit = (ev) => { setEditingEvent(ev); setPresetDate(null); setDialogOpen(true); };

  const shiftMonth = (delta) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
  const goToday = () => {
    const t = new Date();
    setCursor(new Date(t.getFullYear(), t.getMonth(), 1));
    setSelectedDate(toDateKey(t));
  };

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
            <CalendarIcon className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">Calendar</h2>
            <p className="text-xs text-gray-500">Plan and manage all your campaigns, shoots, meetings and deadlines</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shiftMonth(-1)}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shiftMonth(1)}><ChevronRight className="w-4 h-4" /></Button>
          <span className="text-sm font-semibold text-gray-700 min-w-[130px] text-center">{monthLabel(cursor)}</span>
          <Button size="sm" onClick={openAdd} className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5">
            <Plus className="w-4 h-4" /> Add Event
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className={`grid gap-4 ${selectedDate ? 'lg:grid-cols-[1fr_320px]' : 'grid-cols-1'}`}>
        <CalendarGrid
          cursor={cursor}
          eventsByDate={eventsByDate}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onOpenEvent={openEdit}
        />
        {selectedDate && (
          <DayDetailsPanel
            dateKey={selectedDate}
            events={selectedEvents}
            onClose={() => setSelectedDate(null)}
            onAdd={openAdd}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        presetDate={presetDate}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The event will be removed from the shared calendar for everyone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}