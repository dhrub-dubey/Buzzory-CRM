import React, { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

const REVEAL = 64;

export default function SwipeEmployeeName({ employee, canDelete, onDelete }) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(null);
  const startOffset = useRef(0);

  const handleDown = (e) => {
    if (!canDelete) return;
    startX.current = e.clientX;
    startOffset.current = offset;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleMove = (e) => {
    if (startX.current === null) return;
    const delta = e.clientX - startX.current;
    setOffset(Math.min(0, Math.max(-REVEAL, startOffset.current + delta)));
  };

  const handleUp = () => {
    if (startX.current === null) return;
    startX.current = null;
    setDragging(false);
    setOffset(offset <= -REVEAL / 2 ? -REVEAL : 0);
  };

  return (
    <div className="relative overflow-hidden w-[220px]">
      {canDelete && (
        <button
          type="button"
          onClick={() => { setOffset(0); onDelete(); }}
          className="absolute inset-y-0 right-0 w-16 bg-red-500 text-white flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold hover:bg-red-600"
        >
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      )}
      <div
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        style={{ transform: `translateX(${offset}px)`, touchAction: 'pan-y' }}
        className={`relative flex items-center gap-3 px-4 py-2 bg-white/90 backdrop-blur ${
          dragging ? '' : 'transition-transform duration-200'
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {employee.full_name?.[0]?.toUpperCase() || 'E'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{employee.full_name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{employee.designation || 'Employee'}</p>
        </div>
      </div>
    </div>
  );
}