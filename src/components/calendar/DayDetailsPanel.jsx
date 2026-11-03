import React from 'react';
import { X, Plus, MoreVertical, Pencil, Trash2, ClipboardList } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { colorOf, formatTime, fullDateLabel } from '@/lib/calendarUtils';

export default function DayDetailsPanel({ dateKey, events, onClose, onAdd, onEdit, onDelete, onReview }) {
  return (
    <div className="border border-white/70 rounded-2xl bg-white/45 backdrop-blur-md p-4 h-full">
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

      {onReview && (
        <button
          onClick={() => onReview(dateKey)}
          className="w-full mt-2 border border-white/80 bg-white/60 hover:bg-white/80 rounded-lg py-2 text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 transition-colors"
        >
          <ClipboardList className="w-3.5 h-3.5" /> Employee Updates
        </button>
      )}
    </div>
  );
}