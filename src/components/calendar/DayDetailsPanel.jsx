import React from 'react';
import { X, Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { colorOf, formatTime, fullDateLabel } from '@/lib/calendarUtils';

export default function DayDetailsPanel({ dateKey, events, onClose, onAdd, onEdit, onDelete }) {
  return (
    <div className="border border-border/60 rounded-xl bg-white p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">{fullDateLabel(dateKey)}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 mb-3">
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">No events for this day.</p>
        ) : (
          events.map(ev => {
            const c = colorOf(ev.color);
            return (
              <div key={ev.id} className="rounded-lg border border-border/50 p-3 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${c.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-500">
                      {formatTime(ev.start_time)}{ev.end_time ? ` - ${formatTime(ev.end_time)}` : ''}
                    </p>
                    <p className="text-sm font-medium text-gray-800 truncate">{ev.title}</p>
                    {ev.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ev.description}</p>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-gray-400 hover:text-gray-600 p-1 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(ev)}>
                        <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(ev)} className="text-red-600">
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button
        onClick={onAdd}
        className="w-full border border-orange-300 text-orange-500 hover:bg-orange-50 rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add Event
      </button>
    </div>
  );
}