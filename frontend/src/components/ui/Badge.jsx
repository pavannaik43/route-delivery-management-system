import React from 'react';

export const Badge = ({ children, variant = 'info', size = 'md', className = '' }) => {
  const variants = {
    primary: 'bg-primary-light text-primary border-primary/20',
    secondary: 'bg-secondary-light text-secondary border-secondary/20',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-100 text-slate-500 border-slate-200',
    low_stock: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold animate-pulse',
    out_of_stock: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
    not_loaded: 'bg-slate-100 text-slate-600 border-slate-200'
  };

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-0.5 font-medium',
    lg: 'text-sm px-3 py-1 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${variants[variant] || variants.neutral} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};
