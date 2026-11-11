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
          src="/Buzzory-transparent.png"
          alt="Buzzory"
          className="h-7 w-[108px] object-contain"
        />
        <div className="ml-auto flex min-w-0 items-center gap-2">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name ? `${profile.full_name} profile photo` : 'Profile photo'}
              referrerPolicy="no-referrer"
              className="h-8 w-8 flex-shrink-0 rounded-full border border-white object-cover shadow-sm"
            />
          ) : (
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-semibold text-white">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          )}
          <span className="max-w-[100px] truncate text-sm font-medium text-slate-700">
            {profile?.full_name || 'Account'}
          </span>
        </div>
      </header>
      <main className="min-w-0 transition-all duration-300 md:ml-56">
        <div className="mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-5 sm:py-5 md:p-6">
          <Outlet context={{ user: profile }} />
        </div>
      </main>
    </div>
  );
}
