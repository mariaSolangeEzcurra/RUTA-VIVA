import React from 'react';
import type { PriorityCategory } from '../../types/data';
import { categoryLabel } from '../../data/ipivConfig';

const styles: Record<PriorityCategory, string> = {
  muy_alta: 'bg-prio-muyalta/10 text-prio-muyalta border-prio-muyalta/30',
  alta: 'bg-prio-alta/10 text-prio-alta border-prio-alta/30',
  media: 'bg-prio-media/10 text-[#8a5d00] border-prio-media/40',
  baja: 'bg-prio-baja/10 text-prio-baja border-prio-baja/30'
};

export function PriorityBadge({ category }: {category: PriorityCategory;}) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold ${styles[category]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {categoryLabel[category]}
    </span>);

}