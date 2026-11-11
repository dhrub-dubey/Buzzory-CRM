import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LogOut, Menu, Moon } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import Sidebar from './Sidebar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';

export default function AppLayout() {
  const { profile, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setDarkMode(root.classList.contains('dark')));
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const updateTheme = (enabled) => {
    document.documentElement.classList.toggle('dark', enabled);
    try {
      localStorage.setItem('buzzory-theme', enabled ? 'dark' : 'light');
    } catch {
      // Theme still applies for this session if storage is unavailable.
    }
    setDarkMode(enabled);
  };

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
          className="h-6 w-[88px] flex-shrink-0 object-contain min-[380px]:h-7 min-[380px]:w-[108px]"
        />
        <Popover open={accountMenuOpen} onOpenChange={setAccountMenuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Open account menu"
              className="ml-auto flex min-w-0 items-center gap-2 rounded-xl px-1.5 py-1 text-left transition-colors hover:bg-slate-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
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
              <span className="max-w-[35vw] truncate whitespace-nowrap text-[13px] font-medium text-slate-700 min-[380px]:text-sm">
                {profile?.full_name || 'Account'}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="bottom"
            align="end"
            sideOffset={8}
            className={`w-60 rounded-2xl p-3 shadow-xl backdrop-blur-2xl ${darkMode ? 'border border-white/10 bg-slate-800/95 text-gray-100' : 'border border-white/80 bg-white/95 text-slate-800'}`}
          >
            <div className={`mb-2 flex items-center gap-2 border-b px-1 pb-3 ${darkMode ? 'border-white/10' : 'border-slate-200/70'}`}>
              <Moon className={`h-4 w-4 ${darkMode ? 'text-gray-300' : 'text-slate-500'}`} />
              <span className="flex-1 text-sm font-medium">Dark mode</span>
              <Switch
                checked={darkMode}
                onCheckedChange={(enabled) => {
                  updateTheme(enabled);
                  setAccountMenuOpen(false);
                }}
                aria-label="Toggle dark mode"
              />
            </div>
            <button
              type="button"
              onClick={() => { setMobileNavOpen(false); logout(); }}
              className={`flex min-h-10 w-full items-center gap-2 rounded-lg px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${darkMode ? 'text-gray-100 hover:bg-white/10 hover:text-white' : 'text-slate-700 hover:bg-slate-900/5 hover:text-slate-900'}`}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </PopoverContent>
        </Popover>
      </header>
      <main className="min-w-0 transition-all duration-300 md:ml-56">
        <div className="mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-5 sm:py-5 md:p-6">
          <Outlet context={{ user: profile }} />
        </div>
      </main>
    </div>
  );
}
