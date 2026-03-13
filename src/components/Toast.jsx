/**
 * src/components/Toast.jsx - Lightweight In-App Toast Notifications
 *
 * Provides a `useToast` hook that returns { toast } object with:
 *   toast.success(message)
 *   toast.error(message)
 *   toast.info(message)
 *
 * Usage:
 *   1. Wrap your layout with <ToastProvider> (or use it at the component level)
 *   2. const { toast } = useToast();
 *   3. toast.success('Saved successfully!');
 */

import React, { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success') => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3500);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = {
        success: (msg) => addToast(msg, 'success'),
        error:   (msg) => addToast(msg, 'error'),
        info:    (msg) => addToast(msg, 'info'),
    };

    const typeStyles = {
        success: 'bg-green-600 text-white',
        error:   'bg-red-600 text-white',
        info:    'bg-blue-600 text-white',
    };

    const typeIcons = {
        success: '✓',
        error:   '✕',
        info:    'ℹ',
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {/* Toast container — fixed bottom-right */}
            <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-sm font-medium ${typeStyles[t.type]}`}
                        style={{ minWidth: '260px', maxWidth: '380px', animation: 'slideIn 0.25s ease' }}
                    >
                        <span className="text-base font-bold">{typeIcons[t.type]}</span>
                        <span style={{ flex: 1 }}>{t.message}</span>
                        <button
                            onClick={() => removeToast(t.id)}
                            className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none"
                            aria-label="Dismiss"
                        >
                            ×
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
