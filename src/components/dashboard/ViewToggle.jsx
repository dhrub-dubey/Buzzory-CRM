import React from 'react';

export default function ViewToggle({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-full border border-white/70 bg-white/50 p-0.5 backdrop-blur-md shadow-sm">
      {options.map(o => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
            value === o.id
              ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}