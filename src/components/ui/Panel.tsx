import React from 'react';
import { twMerge } from 'tailwind-merge';

interface PanelProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function Panel({ title, subtitle, actions, className, children }: PanelProps) {
  return (
    <section className={twMerge('rounded-lg border border-line bg-surface', className)}>
      {(title || actions) &&
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {actions}
        </header>
      }
      <div className="p-4">{children}</div>
    </section>);

}