import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const MAX_TOASTS = 4;
const TOAST_DURATION_MS = 4000;

const TYPE_STYLES = {
  error: "border-l-red-500",
  success: "border-l-emerald-500",
  info: "border-l-[#FFBC42]",
};

const ToastContext = createContext(null);

function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-xs flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            onClick={() => onDismiss(toast.id)}
            className={`pointer-events-auto cursor-pointer rounded-lg border-l-4 bg-stone-800/95 px-3.5 py-2.5 text-sm text-white shadow-lg backdrop-blur-sm dark:bg-stone-900/95 ${
              TYPE_STYLES[toast.type] || TYPE_STYLES.info
            }`}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const remove = (id) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const timerMap = timers.current;
    return () => {
      timerMap.forEach((timer) => clearTimeout(timer));
      timerMap.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      push: (message, type = "info") => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { id, message, type }].slice(-MAX_TOASTS));
        const timer = setTimeout(() => remove(id), TOAST_DURATION_MS);
        timers.current.set(id, timer);
      },
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx ?? { push: () => {} };
}
