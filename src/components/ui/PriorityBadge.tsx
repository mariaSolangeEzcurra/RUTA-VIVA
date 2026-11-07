import React from 'react';
import type { PriorityCategory } from '../../types/data';
import { categoryLabel } from '../../data/ipivConfig';

const styles: Record<PriorityCategory, string> = {
  muy_alta: 'bg-[#E11D48] text-white',
  alta: 'bg-[#F97316] text-white',
  media: 'bg-[#FACC15] text-[#422006]',
  baja: 'bg-[#10B981] text-white'
};

export function PriorityBadge({ category, size = 'md' }: {category: PriorityCategory; size?: 'sm' | 'md';}) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full font-bold shadow-sm ${size === 'sm' ? 'px-1.5 py-px text-[10px]' : 'px-2.5 py-0.5 text-[11px]'} ${styles[category]}`}>
      {categoryLabel[category]}
    </span>);

}
