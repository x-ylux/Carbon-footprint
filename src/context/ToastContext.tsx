import React, { useState, useCallback, useEffect } from 'react';
import { X, CircleCheck as CheckCircle, CircleAlert as AlertCircle, TriangleAlert as AlertTriangle, Info } from 'lucide-react';
import { ToastContext, type Toast, type ToastType } from './toast-context';

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-sky-primary" />,
  };
  return icons[type];
};

const bgColors = {
  success: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50',
  error: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50',
  warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50',
  info: 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/50',
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration ?? 5000);
    return () => clearTimeout(timer);
  }, [toast.duration, onClose]);

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${bgColors[toast.type]} animate-slide-in`}
      role="alert"
    >
      <ToastIcon type={toast.type} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4 text-slate-400" />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <div
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]"
        aria-live="polite"
        aria-relevant="additions removals"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
