import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const { profile } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent">
      <Sidebar
        user={profile}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-white/70 bg-white/80 px-3 backdrop-blur-xl md:hidden">
        <button
          type="button"
          aria-label="Open navigation menu"
          aria-expanded={mobileNavOpen}
          onClick={() => setMobileNavOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          <Menu className="h-5 w-5" />
        </button>
        <img
          src="https://media.base44.com/images/public/6a1f0e76a586461557ebf349/601f5c8df_WebsiteWhite.png"
          alt="Buzzory"
          className="h-7 w-auto rounded bg-slate-900 px-2 py-1"
        />
        <span className="ml-auto truncate text-xs font-medium text-muted-foreground">
          {profile?.full_name || 'CRM V3.2'}
        </span>
      </header>
      <main className="min-w-0 transition-all duration-300 md:ml-56">
        <div className="mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-5 sm:py-5 md:p-6">
          <Outlet context={{ user: profile }} />
        </div>
      </main>
    </div>
  );
}
