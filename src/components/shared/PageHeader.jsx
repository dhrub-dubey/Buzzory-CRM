import React from 'react';

export default function PageHeader({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-md ring-1 ring-inset ring-orange-500/25 shadow-sm flex items-center justify-center">
            <Icon className="w-5 h-5 text-orange-500" />
          </div>
        )}
        <div>
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}