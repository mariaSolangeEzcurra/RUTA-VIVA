import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-ink sm:text-[30px] sm:leading-tight"><span className="h-7 w-1.5 shrink-0 rounded-full bg-signal" aria-hidden />{title}</h1>
        {description && <p className="mt-2 max-w-[68ch] pl-[18px] text-[15px] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>);

}
