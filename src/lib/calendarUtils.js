export const EVENT_COLORS = {
    green: { dot: 'bg-green-500', solid: 'bg-green-500', pill: 'bg-green-50 text-green-700 hover:bg-green-100' },
    blue: { dot: 'bg-blue-500', solid: 'bg-blue-500', pill: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
    pink: { dot: 'bg-pink-500', solid: 'bg-pink-500', pill: 'bg-pink-50 text-pink-700 hover:bg-pink-100' },
    purple: { dot: 'bg-purple-500', solid: 'bg-purple-500', pill: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
    yellow: { dot: 'bg-yellow-500', solid: 'bg-yellow-500', pill: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
    orange: { dot: 'bg-orange-500', solid: 'bg-orange-500', pill: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
  };
  
  export const COLOR_KEYS = Object.keys(EVENT_COLORS);
  
  export function colorOf(c) {
    return EVENT_COLORS[c] || EVENT_COLORS.orange;
  }
  
  export function toDateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  
  export function formatTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr}:${String(m || 0).padStart(2, '0')} ${ampm}`;
  }
  
  export function monthLabel(d) {
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  
  export function fullDateLabel(dateKey) {
    const d = new Date(dateKey + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }