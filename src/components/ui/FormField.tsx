import React from 'react';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  helpText?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, htmlFor, error, helpText, children }) => (
  <div className="space-y-2">
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-600 dark:text-slate-300">
      {label}
    </label>
    {children}
    {helpText ? <p className="text-xs text-slate-500 dark:text-slate-400">{helpText}</p> : null}
    {error ? <p className="text-xs font-semibold text-rose-500">{error}</p> : null}
  </div>
);
