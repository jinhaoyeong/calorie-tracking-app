import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import './Toast.css';

interface ToastOptions {
  message: string;
  action?: { label: string; onClick: () => void };
}

const ToastContext = createContext<(toast: ToastOptions) => void>(() => {});

const VISIBLE_MS = 4500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastOptions & { key: number }) | null>(null);
  const timer = useRef<number>();

  const show = useCallback((next: ToastOptions) => {
    window.clearTimeout(timer.current);
    setToast({ ...next, key: Date.now() });
    timer.current = window.setTimeout(() => setToast(null), VISIBLE_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div className="toast" key={toast.key}>
            <span className="toast__message">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="toast__action"
                onClick={() => {
                  toast.action?.onClick();
                  setToast(null);
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
