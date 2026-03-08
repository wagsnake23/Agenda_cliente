import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, X } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'loading';

export interface ToastData {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
}

interface PremiumToastProps {
    toast: ToastData;
    onDismiss: (id: string) => void;
}

// ── Config visual por tipo ─────────────────────────────────────────────────────

const TOAST_STYLES: Record<ToastType, {
    bg: string;
    border: string;
    iconBg: string;
    titleColor: string;
    descColor: string;
    progressColor: string;
    closeBtn: string;
    closeBtnHover: string;
    Icon: React.FC<{ className?: string }>;
}> = {
    success: {
        bg: 'bg-gradient-to-r from-[#F0FDF4] to-[#DCFCE7]',
        border: 'border-[#86EFAC]',
        iconBg: 'bg-[#DCFCE7]',
        titleColor: 'text-[#166534]',
        descColor: 'text-[#15803D]',
        progressColor: 'bg-emerald-500',
        closeBtn: 'bg-[#BBF7D0]',
        closeBtnHover: 'hover:bg-[#86EFAC]',
        Icon: ({ className }) => <CheckCircle2 className={className} />,
    },
    error: {
        bg: 'bg-gradient-to-r from-[#FEF2F2] to-[#FEE2E2]',
        border: 'border-[#FCA5A5]',
        iconBg: 'bg-[#FEE2E2]',
        titleColor: 'text-[#991B1B]',
        descColor: 'text-[#B91C1C]',
        progressColor: 'bg-red-500',
        closeBtn: 'bg-[#FEE2E2]',
        closeBtnHover: 'hover:bg-[#FECACA]',
        Icon: ({ className }) => <XCircle className={className} />,
    },
    loading: {
        bg: 'bg-white',
        border: 'border-blue-100',
        iconBg: 'bg-blue-50',
        titleColor: 'text-slate-800',
        descColor: 'text-slate-500',
        progressColor: 'bg-blue-500',
        closeBtn: 'bg-slate-100',
        closeBtnHover: 'hover:bg-slate-200',
        Icon: ({ className }) => <Loader2 className={`${className} animate-spin`} />,
    },
};

const ICON_COLORS: Record<ToastType, string> = {
    success: 'text-[#166534]',
    error: 'text-[#991B1B]',
    loading: 'text-blue-500',
};

const AUTO_DISMISS: Record<ToastType, number | null> = {
    success: 2000,
    error: 2000,
    loading: null,
};

// ── Component ──────────────────────────────────────────────────────────────────

const PremiumToast: React.FC<PremiumToastProps> = ({ toast: t, onDismiss }) => {
    const [visible, setVisible] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [progress, setProgress] = useState(100);
    const dismissDuration = AUTO_DISMISS[t.type];
    const startTimeRef = useRef<number>(Date.now());
    const animFrameRef = useRef<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Entrada suave
    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            requestAnimationFrame(() => setVisible(true));
        });
        return () => cancelAnimationFrame(raf);
    }, []);

    // Progress bar e auto-dismiss
    useEffect(() => {
        if (!dismissDuration) return;

        startTimeRef.current = Date.now();

        const tick = () => {
            const elapsed = Date.now() - startTimeRef.current;
            const remaining = Math.max(0, 1 - elapsed / dismissDuration);
            setProgress(remaining * 100);
            if (remaining > 0) {
                animFrameRef.current = requestAnimationFrame(tick);
            }
        };

        animFrameRef.current = requestAnimationFrame(tick);

        timerRef.current = setTimeout(() => {
            handleDismiss();
        }, dismissDuration);

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dismissDuration, t.id]);

    const handleDismiss = () => {
        if (leaving) return;
        setLeaving(true);
        setVisible(false);
        setTimeout(() => onDismiss(t.id), 340);
    };

    const style = TOAST_STYLES[t.type];
    const iconColor = ICON_COLORS[t.type];

    return (
        <div
            className={`
        relative w-full max-w-sm pointer-events-auto overflow-hidden
        rounded-2xl border shadow-[0_10px_35px_rgba(0,0,0,0.08)]
        transition-all duration-500 ease-out
        ${style.bg} ${style.border}
        ${visible && !leaving
                    ? 'translate-x-0 opacity-100'
                    : 'translate-x-full opacity-0'
                }
      `}
            style={{ willChange: 'transform, opacity' }}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
        >
            {/* Content */}
            <div className="flex items-start gap-3 p-4">
                {/* Icon */}
                <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${style.iconBg}`}>
                    <style.Icon className={`w-5 h-5 ${iconColor}`} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 pt-0.5">
                    <p className={`text-sm font-bold leading-tight ${style.titleColor}`}>
                        {t.title}
                    </p>
                    {t.description && (
                        <p className={`text-xs mt-1 leading-relaxed ${style.descColor}`}>
                            {t.description}
                        </p>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={handleDismiss}
                    className={`shrink-0 flex items-center justify-center rounded-full ${style.closeBtn} ${style.closeBtnHover} text-[#1F2937] transition-colors p-1.5 mt-0.5`}
                    aria-label="Fechar notificação"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Progress bar (only when auto-dismiss is set) */}
            {dismissDuration && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100">
                    <div
                        className={`h-full ${style.progressColor} transition-none`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
};

export default PremiumToast;
