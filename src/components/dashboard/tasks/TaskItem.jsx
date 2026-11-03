import React from 'react';
import { Check, Trash2 } from 'lucide-react';

const PRIORITY_STYLES = {
  High: 'bg-amber-50 text-amber-700',
  Medium: 'bg-blue-50 text-blue-600',
  Low: 'bg-green-50 text-green-700',
};

export default function TaskItem({ item, readOnly, onToggle, onDelete, canDelete = true }) {
  return (
    <div className="group flex items-center gap-3 rounded-xl bg-white/70 border border-white/80 px-3 py-2.5">
      <button
        type="button"
        disabled={readOnly}
        onClick={() => onToggle(item.id)}
        className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 ${
          item.done ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300 bg-white'
        } ${readOnly ? 'cursor-default' : ''}`}
      >
        {item.done && <Check className="w-3 h-3" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${item.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.text}</p>
        {(item.category || item.priority) && (
          <div className="flex items-center gap-1.5 mt-1">
            {item.category && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{item.category}</span>
            )}
            {item.priority && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORITY_STYLES[item.priority] || ''}`}>
                {item.priority}
              </span>
            )}
          </div>
        )}
      </div>
      {!readOnly && canDelete && (
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}