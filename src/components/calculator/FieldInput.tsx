import type { ForwardedRef, ReactNode } from 'react';
import { forwardRef } from 'react';
import { Info } from 'lucide-react';

interface FieldInputProps {
  label: string;
  unit: string;
  helpText?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}

/**
 * Accessible form field wrapper: renders label (associated via htmlFor),
 * the input element (passed as children), an optional help text line
 * (aria-describedby), and validation error text.
 */
export const FieldInput = forwardRef<HTMLDivElement, FieldInputProps>(
  ({ label, unit, helpText, error, children, htmlFor }, ref: ForwardedRef<HTMLDivElement>) => {
    const helpId = htmlFor ? `${htmlFor}-help` : undefined;
    const errorId = htmlFor ? `${htmlFor}-error` : undefined;
    const describedBy = [helpId, error ? errorId : null].filter(Boolean).join(' ') || undefined;

    return (
      <div className="space-y-2" ref={ref}>
        <div className="flex items-baseline justify-between">
          <label htmlFor={htmlFor} className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {label}
          </label>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{unit}</span>
        </div>
        {children}
        {helpText && (
          <p id={helpId} className="text-xs text-slate-400 dark:text-slate-500 flex items-start gap-1">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>{helpText}</span>
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs font-semibold text-rose-500">
            {error}
          </p>
        )}
        {/* describedBy is read by screen readers from the input; this hidden span keeps it in scope */}
        {describedBy && <span data-describedby={describedBy} className="sr-only" />}
      </div>
    );
  },
);

FieldInput.displayName = 'FieldInput';
