import React, { useState } from 'react';
import { Plus } from 'lucide-react';

const CATEGORIES = ['Campaigns', 'Sales', 'Content', 'Marketing', 'Internal'];
const PRIORITIES = ['High', 'Medium', 'Low'];

export default function AddTaskForm({ withPriority, placeholder, onAdd }) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState('Medium');

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd({ text: text.trim(), category, priority: withPriority ? priority : undefined });
    setText('');
  };

  return (
    <form onSubmit={submit} className="rounded-xl bg-white/80 border border-white/90 p-2.5 space-y-2">
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
      />
      <div className="flex items-center gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="flex-1 text-[11px] bg-white/70 border border-gray-200 rounded-md px-2 py-1 text-gray-600 outline-none"
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {withPriority && (
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="text-[11px] bg-white/70 border border-gray-200 rounded-md px-2 py-1 text-gray-600 outline-none"
          >
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
        <button
          type="submit"
          className="flex items-center gap-1 text-[11px] font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-400 rounded-md px-2.5 py-1.5"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
    </form>
  );
}