/**
 * src/components/Toast.jsx - Lightweight in-app toast notifications.
 */

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timeoutMapRef = useRef(new Map());

    const removeToast = useCallback((id) => {
        const timeoutId = timeoutMapRef.current.get(id);
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutMapRef.current.delete(id);
        }
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
        (message, type = 'success') => {
            const id = ++toastId;
            setToasts((prev) => [...prev, { id, message, type }]);

            const timeoutId = setTimeout(() => {
                removeToast(id);
            }, 3500);
            timeoutMapRef.current.set(id, timeoutId);
        },
        [removeToast]
    );

    useEffect(() => {
        return () => {
            timeoutMapRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
            timeoutMapRef.current.clear();
        };
    }, []);

    const toast = {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        info: (msg) => addToast(msg, 'info'),
    };

    const typeStyles = {
        success: 'bg-green-600 text-white',
        error: 'bg-red-600 text-white',
        info: 'bg-blue-600 text-white',
    };

    const typeIcons = {
        success: 'OK',
        error: '!',
        info: 'i',
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div
                role="region"
                aria-label="Notifications"
                aria-live="polite"
                style={{
                    position: 'fixed',
                    bottom: '1.5rem',
                    right: '1.5rem',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                }}
            >
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        role={t.type === 'error' ? 'alert' : 'status'}
                        aria-live={t.type === 'error' ? 'assertive' : 'polite'}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-sm font-medium ${typeStyles[t.type]}`}
                        style={{ minWidth: '260px', maxWidth: '380px', animation: 'slideIn 0.25s ease' }}
                    >
                        <span className="text-base font-bold">{typeIcons[t.type]}</span>
                        <span style={{ flex: 1 }}>{t.message}</span>
                        <button
                            onClick={() => removeToast(t.id)}
                            className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none"
                            aria-label="Dismiss notification"
                        >
                            x
                        </button>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within a ToastProvider');
    return ctx;
}
