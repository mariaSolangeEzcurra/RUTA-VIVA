import React from 'react';
import { twMerge } from 'tailwind-merge';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary/90 disabled:bg-primary/40',
  secondary: 'bg-surface text-ink border border-line hover:bg-canvas disabled:text-muted',
  ghost: 'text-primary hover:bg-primary-soft disabled:text-muted',
  danger: 'bg-surface text-fatal border border-fatal/30 hover:bg-fatal/5'
};

export function Button({ variant = 'primary', size = 'md', className, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={twMerge(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed',
        size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm',
        variants[variant],
        className
      )} />);


}