import { useEffect, useState } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

let toastIdCounter = 0;

// Create a global state for toasts
let toastCallbacks: Array<(toast: Toast) => void> = [];

export function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 3000) {
  const id = `toast-${toastIdCounter++}`;
  const toast: Toast = { id, message, type, duration };
  toastCallbacks.forEach(cb => cb(toast));
}

export function Toast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleAddToast = (toast: Toast) => {
      setToasts(prev => [...prev, toast]);
      if (toast.duration) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, toast.duration);
      }
    };

    toastCallbacks.push(handleAddToast);
    return () => {
      toastCallbacks = toastCallbacks.filter(cb => cb !== handleAddToast);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, x: 400 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 20, x: 400 }}
            transition={{ type: 'spring', damping: 15 }}
            className="mb-3 pointer-events-auto"
          >
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg backdrop-blur-sm border ${
              toast.type === 'success' 
                ? 'bg-green-500/10 border-green-500/20 text-green-500'
                : toast.type === 'error'
                ? 'bg-red-500/10 border-red-500/20 text-red-500'
                : toast.type === 'warning'
                ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
            }`}>
              {toast.type === 'success' && <Check className="w-5 h-5 shrink-0" />}
              {toast.type === 'error' && <X className="w-5 h-5 shrink-0" />}
              {toast.type === 'warning' && <AlertCircle className="w-5 h-5 shrink-0" />}
              {toast.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
