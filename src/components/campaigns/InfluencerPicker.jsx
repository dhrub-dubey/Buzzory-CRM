import React, { useState } from 'react';
import { Search, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function InfluencerPicker({ influencers = [], existingIds = [], selectedIds = [], onToggle }) {
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const filtered = q
    ? influencers.filter(i =>
        i.full_name?.toLowerCase().includes(q) ||
        i.username?.toLowerCase().includes(q) ||
        i.city?.toLowerCase().includes(q)
      )
    : influencers;

  const selected = influencers.filter(i => selectedIds.includes(i.id));

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, username or city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 h-9 text-sm"
        />
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(i => (
            <span key={i.id} className="inline-flex items-center gap-1 bg-orange-500/10 text-orange-600 text-xs font-medium px-2 py-1 rounded-md">
              {i.full_name}
              <button type="button" onClick={() => onToggle(i.id)} className="hover:text-orange-800">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6 px-4">
            {influencers.length === 0
              ? 'No influencers in your database yet. Switch to Manual Entry to add one.'
              : 'No influencers match your search.'}
          </p>
        )}
        {filtered.map(i => {
          const checked = selectedIds.includes(i.id);
          const inCampaign = existingIds.includes(i.id);
          return (
            <button
              key={i.id}
              type="button"
              onClick={() => onToggle(i.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${checked ? 'bg-orange-50' : 'hover:bg-muted/50'}`}
            >
              <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${checked ? 'bg-orange-500 border-orange-500' : 'border-input'}`}>
                {checked && <Check className="w-3 h-3 text-white" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate">{i.full_name}</span>
                  {inCampaign && (
                    <span className="text-[9px] uppercase tracking-wide font-semibold text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded flex-shrink-0">In campaign</span>
                  )}
                </span>
                <span className="block text-[11px] text-muted-foreground truncate">
                  {[i.username ? `@${i.username.replace(/^@/, '')}` : null, i.city].filter(Boolean).join(' · ') || '—'}
                </span>
              </span>
              {!!i.followers && (
                <span className="text-[11px] text-muted-foreground flex-shrink-0">
                  {Number(i.followers).toLocaleString('en-IN')}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground">
        {filtered.length} shown · {selected.length} selected
      </p>
    </div>
  );
}