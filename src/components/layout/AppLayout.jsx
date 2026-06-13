import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const { profile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={profile} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className={`transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-56'}`}>
        <div className="p-6 max-w-[1400px]">
          <Outlet context={{ user: profile }} />
        </div>
      </main>
    </div>
  );
}
