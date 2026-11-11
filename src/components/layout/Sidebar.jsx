import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  DollarSign,
  Megaphone,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  CalendarCheck,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const ADMIN_EMAIL = 'buzzory.it@gmail.com';

const allNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['all'] },
  { label: 'Campaigns', icon: Megaphone, path: '/campaigns', roles: ['all'] },
  { label: 'Influencers', icon: Users, path: '/influencers', roles: ['all'] },
  { label: 'Finance', icon: DollarSign, path: '/finance', roles: ['admin', 'board_member'] },
  { label: 'Invoices', icon: FileText, path: '/invoices', roles: ['admin', 'board_member'] },
  { label: 'Sales', icon: BarChart3, path: '/sales', roles: ['all'] },
  { label: 'Attendance', icon: CalendarCheck, path: '/attendance', roles: ['all'] },
  { label: 'Settings', icon: Settings, path: '/settings', roles: ['all'] },
  { label: 'User Approvals', icon: Shield, path: '/admin/approvals', roles: ['admin'] },
];

function getNavItems(user) {
  if (!user) return allNavItems.filter((item) => item.roles.includes('all'));
  const isAdmin = user.email === ADMIN_EMAIL || user.role === 'admin' || user.role === 'super_admin';
  if (isAdmin) return allNavItems;
  return allNavItems.filter((item) => item.roles.includes('all') || item.roles.includes(user.role));
}

export default function Sidebar({ user, mobileOpen = false, onMobileClose = () => {} }) {
  const { logout } = useAuth();
  const location = useLocation();
  const navItems = getNavItems(user);

  const isActive = (path) => path === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(path);

  const isAdmin = user?.email === ADMIN_EMAIL || user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onMobileClose}
        className={`fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] transition-opacity md:hidden ${mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <aside className={`fixed left-0 top-0 z-50 flex h-[100dvh] w-72 flex-col border-r border-white/10 bg-[#0b1120]/95 text-white shadow-[0_20px_60px_-20px_rgba(11,17,32,0.5)] backdrop-blur-2xl transition-transform duration-300 md:w-56 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-start justify-between px-4 pb-2 pt-5 md:pt-6">
          <div>
            <Link to="/" className="flex items-center" onClick={onMobileClose}>
              <img
                src="https://media.base44.com/images/public/6a1f0e76a586461557ebf349/601f5c8df_WebsiteWhite.png"
                alt="Buzzory"
                className="h-8 w-auto"
              />
            </Link>
            <p className="mt-1 text-[10px] tracking-wide text-gray-500">CRM V3.2</p>
          </div>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={onMobileClose}
            className="-mr-2 -mt-1 flex h-10 w-10 items-center justify-center rounded-xl text-gray-300 hover:bg-white/10 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto px-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onMobileClose}
                className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 md:min-h-0 md:text-base ${
                  active
                    ? 'bg-gradient-to-r from-[#ff7324] to-[#ff8f4d] text-white shadow-lg shadow-orange-500/30 ring-1 ring-inset ring-white/20'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 md:h-[18px] md:w-[18px] ${active ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mb-4 px-2">
          <button
            onClick={() => { onMobileClose(); logout(); }}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-400 transition-all hover:bg-white/5 hover:text-white md:text-base"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>

        <div className="border-t border-white/10 px-3 py-3">
          <div className="flex items-center gap-3">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || 'User'}
                className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-white">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="min-w-0 overflow-hidden">
              <p className="truncate text-xs font-medium text-white md:text-sm">{user?.full_name || 'User'}</p>
              <p className="truncate text-[10px] text-gray-500 md:text-xs">
                {isAdmin ? '⭐ Admin' : user?.role === 'board_member' ? '🎯 Board Member' : user?.role === 'employee' ? '✅ Employee' : user?.role || ''}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
