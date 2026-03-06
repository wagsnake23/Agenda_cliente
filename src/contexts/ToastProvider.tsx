import React, {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import PremiumToast, { ToastData, ToastType } from '@/components/ui/PremiumToast';
import { useIsMobile } from '@/hooks/use-mobile';

// ── Context Type ───────────────────────────────────────────────────────────────

interface ToastContextValue {
    showSuccessToast: (title: string, description?: string) => string;
    showErrorToast: (title: string, description?: string) => string;
    showLoadingToast: (title: string, description?: string) => string;
    updateToast: (id: string, type: ToastType, title?: string, description?: string) => void;
    dismissToast: (id: string) => void;
    toastPromise: <T>(
        promise: Promise<T>,
        messages: { loading: string; success: string; error: string }
    ) => Promise<T>;
}

// ── Context ────────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastData[]>([]);
    const isMobile = useIsMobile();

    // Track IDs scheduled for removal so we don't double-remove
    const removingRef = useRef<Set<string>>(new Set());

    // ── Helpers ─────────────────────────────────────────────────────────────────

    /**
     * Returns true if a toast with the same type+title+description already exists.
     */
    const isDuplicate = useCallback(
        (type: ToastType, title: string, description?: string) => {
            return toasts.some(
                (t) => t.type === type && t.title === title && t.description === description
            );
        },
        [toasts]
    );

    // ── Core API ─────────────────────────────────────────────────────────────────

    const add = useCallback(
        (type: ToastType, title: string, description?: string): string => {
            if (isDuplicate(type, title, description)) {
                // Return the existing toast's id so callers can still update it
                const existing = toasts.find(
                    (t) => t.type === type && t.title === title && t.description === description
                );
                return existing?.id ?? '';
            }
            const id = crypto.randomUUID();
            setToasts((prev) => [...prev, { id, type, title, description }]);
            return id;
        },
        [isDuplicate, toasts]
    );

    const showSuccessToast = useCallback(
        (title: string, description?: string) => add('success', title, description),
        [add]
    );

    const showErrorToast = useCallback(
        (title: string, description?: string) => add('error', title, description),
        [add]
    );

    const showLoadingToast = useCallback(
        (title: string, description?: string) => add('loading', title, description),
        [add]
    );

    const updateToast = useCallback(
        (id: string, type: ToastType, title?: string, description?: string) => {
            setToasts((prev) =>
                prev.map((t) =>
                    t.id === id
                        ? {
                            ...t,
                            type,
                            title: title ?? t.title,
                            description: description ?? t.description,
                        }
                        : t
                )
            );
        },
        []
    );

    const dismissToast = useCallback((id: string) => {
        if (removingRef.current.has(id)) return;
        removingRef.current.add(id);
        // Give a tiny buffer so the exit animation can trigger inside PremiumToast
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
            removingRef.current.delete(id);
        }, 350);
    }, []);

    const toastPromise = useCallback(
        async <T,>(
            promise: Promise<T>,
            messages: { loading: string; success: string; error: string }
        ): Promise<T> => {
            const id = showLoadingToast(messages.loading);
            try {
                const result = await promise;
                updateToast(id, 'success', messages.success, undefined);
                // auto dismiss handled by PremiumToast timer; cancel loading keeps the updated toast alive
                return result;
            } catch (err) {
                updateToast(id, 'error', messages.error, undefined);
                throw err;
            }
        },
        [showLoadingToast, updateToast]
    );

    // ── Render ───────────────────────────────────────────────────────────────────

    const containerClasses = isMobile
        ? // Mobile: centered at the bottom
        'fixed bottom-4 left-0 right-0 flex flex-col items-center gap-2 z-[9999] px-3 pointer-events-none'
        : // Desktop: bottom-right corner
        'fixed bottom-6 right-6 flex flex-col gap-2 z-[9999] pointer-events-none w-[360px]';

    return (
        <ToastContext.Provider
            value={{
                showSuccessToast,
                showErrorToast,
                showLoadingToast,
                updateToast,
                dismissToast,
                toastPromise,
            }}
        >
            {children}
            {createPortal(
                <div className={containerClasses} aria-label="Notificações">
                    {toasts.map((t) => (
                        <PremiumToast key={t.id} toast={t} onDismiss={dismissToast} />
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
};

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used inside <ToastProvider>');
    }
    return ctx;
}
