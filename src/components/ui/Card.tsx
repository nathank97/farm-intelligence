import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Card({ title, description, footer, children, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 ${className}`}>
      {(title || description) && (
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          {title && <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>}
          {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
      {footer && (
        <div className="border-t border-slate-200 px-6 py-4 dark:border-slate-700">{footer}</div>
      )}
    </div>
  );
}
