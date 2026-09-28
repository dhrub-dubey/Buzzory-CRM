import React from 'react';
import { colorOf, toDateKey, formatTime } from '@/lib/calendarUtils';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarGrid({ cursor, eventsByDate, selectedDate, onSelectDate, onOpenEvent }) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const startOffset = new Date(year, month, 1).getDay();
  const days = Array.from({ length: 42 }, (_, i) => new Date(year, month, 1 - startOffset + i));
  const todayKey = toDateKey(new Date());

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden bg-white">
      <div className="grid grid-cols-7 bg-muted/40 border-b border-border/60">
        {WEEKDAYS.map(d => (
          <div key={d} className="py-2 text-center text-[11px] font-semibold text-gray-500">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const key = toDateKey(day);
          const inMonth = day.getMonth() === month;
          const dayEvents = eventsByDate[key] || [];
          const isSelected = key === selectedDate;
          const isToday = key === todayKey;
          return (
            <div
              key={i}
              onClick={() => onSelectDate(key)}
              className={`min-h-[92px] border-b border-r border-border/40 p-1.5 cursor-pointer transition-colors ${
                inMonth ? 'bg-white' : 'bg-muted/20'
              } ${isSelected ? 'ring-1 ring-inset ring-orange-400' : 'hover:bg-orange-50/40'}`}
            >
              <div className="mb-1">
                {isToday ? (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-[11px] font-semibold">{day.getDate()}</span>
                ) : (
                  <span className={`text-[11px] font-medium ${inMonth ? 'text-gray-700' : 'text-gray-300'}`}>{day.getDate()}</span>
                )}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(ev => {
                  const c = colorOf(ev.color);
                  return (
                    <button
                      key={ev.id}
                      onClick={(e) => { e.stopPropagation(); onOpenEvent(ev); }}
                      className={`w-full flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium text-left ${c.pill}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                      <span className="truncate">
                        {ev.start_time ? `${formatTime(ev.start_time)} ` : ''}{ev.title}
                      </span>
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-gray-400 pl-1">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}