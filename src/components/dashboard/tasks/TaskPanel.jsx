import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import TaskItem from './TaskItem';
import AddTaskForm from './AddTaskForm';

export default function TaskPanel({
  title, subtitle, icon: Icon, accent, addLabel, emptyText,
  items, readOnly, withPriority, onAdd, onToggle, onDelete, canDelete = true, isLoading,
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="glass-card rounded-2xl p-4 h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2.5">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${accent} text-white flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">{title}</h3>
            <p className="text-[11px] text-gray-500">{subtitle}</p>
          </div>
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1 text-[11px] font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-400 rounded-lg px-2.5 py-1.5 shadow-sm"
          >
            <Plus className="w-3 h-3" /> {showForm ? 'Close' : addLabel}
          </button>
        )}
      </div>

      {showForm && !readOnly && (
        <div className="mb-2">
          <AddTaskForm withPriority={withPriority} placeholder="What needs doing?" onAdd={(item) => onAdd(item)} />
        </div>
      )}

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-xs text-muted-foreground py-6 text-center">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">{emptyText}</p>
        ) : (
          items.map(item => (
            <TaskItem
              key={item.id}
              item={item}
              readOnly={readOnly}
              onToggle={onToggle}
              onDelete={onDelete}
              canDelete={canDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}