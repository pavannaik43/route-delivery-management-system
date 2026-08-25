import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  color = 'primary',
  className = '',
  onClick
}) => {
  const colorMap = {
    primary: {
      bg: 'bg-blue-50/80',
      text: 'text-primary',
      iconBg: 'bg-primary text-white',
      border: 'border-blue-100',
    },
    secondary: {
      bg: 'bg-sky-50/80',
      text: 'text-secondary',
      iconBg: 'bg-secondary text-white',
      border: 'border-sky-100',
    },
    success: {
      bg: 'bg-emerald-50/80',
      text: 'text-emerald-600',
      iconBg: 'bg-emerald-600 text-white',
      border: 'border-emerald-100',
    },
    warning: {
      bg: 'bg-amber-50/80',
      text: 'text-amber-600',
      iconBg: 'bg-amber-500 text-white',
      border: 'border-amber-100',
    },
    danger: {
      bg: 'bg-rose-50/80',
      text: 'text-rose-600',
      iconBg: 'bg-rose-600 text-white',
      border: 'border-rose-100',
    }
  };

  const scheme = colorMap[color] || colorMap.primary;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border ${scheme.border} p-5 shadow-card hover:shadow-card-hover transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-1.5">{value}</h4>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${scheme.iconBg} shadow-sm`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-rose-600' : 'text-slate-500'
            }`}
          >
            {trend > 0 ? `+${trend}%` : `${trend}%`}
          </span>
          {trendLabel && <span className="text-slate-400">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
};
