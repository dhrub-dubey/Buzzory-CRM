import React from 'react';

export default function PageHeader({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 mb-5 sm:mb-6">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-md ring-1 ring-inset ring-orange-500/25 shadow-sm flex items-center justify-center">
            <Icon className="w-5 h-5 text-orange-500" />
          </div>
        )}
        <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[26px]">
          {title}
        </h1>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">{children}</div>}
    </div>
  );
}
