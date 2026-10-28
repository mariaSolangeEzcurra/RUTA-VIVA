import React from 'react';
import { Link } from 'react-router-dom';
import { DatabaseIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionLabel, actionTo, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface px-6 py-12 text-center">
      <div className="mb-3 text-muted">{icon ?? <DatabaseIcon className="h-6 w-6" />}</div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted">{description}</p>
      {actionLabel && actionTo &&
      <Link to={actionTo} className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-white transition-colors duration-150 ease-out hover:bg-primary/90">
          {actionLabel}
        </Link>
      }
    </div>);

}