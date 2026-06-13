import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, DollarSign, Megaphone, Users, FileText, Settings, LogOut, ChevronLeft, Shield } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const ADMIN_EMAIL = "buzzory.it@gmail.com";

const allNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['all'] },
  { label: 'Campaigns', icon: Megaphone, path: '/campaigns', roles: ['all'] },
  { label: 'Influencers', icon: Users, path: '/influencers', roles: ['all'] },
  { label: 'Finance', icon: DollarSign, path: '/finance', roles: ['admin', 'board_member'] },
  { label: 'Invoices', icon: FileText, path: '/invoices', roles: ['admin', 'board_member'] },
  { label: 'Settings', icon: Settings, path: '/settings', roles: ['admin'] },
  { label: 'User Approvals', icon: Shield, path: '/admin/approvals', roles: ['admin'] },
];

function getNavItems(user) {
  if (!user) return allNavItems.filter(i => i.roles.includes('all'));
  const isAdmin = user.email === ADMIN_EMAIL || user.role === 'admin';
  if (isAdmin) return allNavItems; // admin sees everything
  return allNavItems.filter(i => i.roles.includes('all') || i.roles.includes(user.role));
}

export default function Sidebar({ user, collapsed, onToggle }) {
  const { logout } = useAuth();
  const location = useLocation();
  const navItems = getNavItems(user);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
  };

  const isAdmin = user?.email === ADMIN_EMAIL || user?.role === 'admin';

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-[hsl(222,47%,11%)] text-white flex flex-col z-50 transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>
      {/* Logo */}
      <div className="px-4 pt-6 pb-2">
        <Link to="/" className="flex items-center">
          {!collapsed ? (
            <img src="https://media.base44.com/images/public/6a1f0e76a586461557ebf349/601f5c8df_WebsiteWhite.png" alt="Buzzory" className="h-8 w-auto" />
          ) : (
            <img src="https://media.base44.com/images/public/6a1f0e76a586461557ebf349/601f5c8df_WebsiteWhite.png" alt="Buzzory" className="h-6 w-6 object-left object-cover" />
          )}
        </Link>
        {!collapsed && <p className="text-[10px] text-gray-500 mt-1">CRM V0.01</p>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 mt-6 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                active
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${active ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 mb-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* User Profile */}
      <div className="border-t border-white/10 px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.full_name?.[0] || 'U'}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-white truncate">{user?.full_name || 'User'}</p>
              <p className="text-[10px] text-gray-500 truncate">
                {isAdmin ? '⭐ Admin' : user?.role === 'board_member' ? 'Board Member' : user?.role === 'employee' ? 'Employee' : user?.role || ''}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}