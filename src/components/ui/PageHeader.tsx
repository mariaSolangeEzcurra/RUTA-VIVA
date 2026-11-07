import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl border-l-4 border-signal pl-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[28px] sm:leading-tight">{title}</h1>
        {description && <p className="mt-1.5 max-w-[70ch] text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>);

}
