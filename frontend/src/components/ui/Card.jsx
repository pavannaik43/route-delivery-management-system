import React from 'react';

export const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 shadow-card transition-all duration-200 ${
        hover ? 'hover:shadow-card-hover hover:border-slate-300' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', title, subtitle, action }) => {
  if (title || subtitle || action) {
    return (
      <div className={`p-5 pb-4 border-b border-slate-100 flex items-center justify-between gap-4 ${className}`}>
        <div>
          {title && <h3 className="font-semibold text-slate-900 text-base">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    );
  }
  return <div className={`p-5 pb-4 border-b border-slate-100 ${className}`}>{children}</div>;
};

export const CardBody = ({ children, className = '' }) => {
  return <div className={`p-5 ${className}`}>{children}</div>;
};

export const CardFooter = ({ children, className = '' }) => {
  return <div className={`p-4 bg-slate-50/70 border-t border-slate-100 rounded-b-xl ${className}`}>{children}</div>;
};
