import React from 'react';
import { twMerge } from 'tailwind-merge';

interface PanelProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Panel({ title, subtitle, actions, className, icon, children }: PanelProps) {
  return (
    <section className={twMerge('rounded-2xl border border-line/80 bg-surface shadow-[0_1px_3px_rgba(15,42,61,0.05)]', className)}>
      {(title || actions) &&
      <header className="flex items-start justify-between gap-4 px-5 pb-1 pt-5 sm:px-6">
          <div className="flex min-w-0 items-start gap-2.5">
            {icon && <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">{icon}</span>}
            <div className="min-w-0">
              {title && <h2 className="text-[15px] font-bold leading-snug text-ink">{title}</h2>}
              {subtitle && <p className="mt-0.5 text-xs leading-relaxed text-muted">{subtitle}</p>}
            </div>
          </div>
          {actions}
        </header>
      }
      <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">{children}</div>
    </section>);

}
