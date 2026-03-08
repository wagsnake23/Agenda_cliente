import React from 'react';
import { Trash2, AlertTriangle, LucideIcon } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    icon?: LucideIcon;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    onConfirm,
    onCancel,
    title = "Confirmar",
    message,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    variant = 'danger',
    icon: customIcon
}) => {
    if (!open) return null;

    const Icon = customIcon || (variant === 'danger' ? Trash2 : AlertTriangle);

    const variantStyles = {
        danger: {
            iconBg: 'bg-red-50',
            iconColor: 'text-red-600',
            buttonBg: 'bg-red-600',
            buttonShadow: 'shadow-[0_4px_0_#991B1B]',
            buttonHover: 'hover:bg-red-700'
        },
        warning: {
            iconBg: 'bg-orange-50',
            iconColor: 'text-orange-600',
            buttonBg: 'bg-orange-600',
            buttonShadow: 'shadow-[0_4px_0_#C2410C]',
            buttonHover: 'hover:bg-orange-700'
        },
        info: {
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            buttonBg: 'bg-blue-600',
            buttonShadow: 'shadow-[0_4px_0_#1E3A8A]',
            buttonHover: 'hover:bg-blue-700'
        }
    };

    const { iconBg, iconColor, buttonBg, buttonShadow, buttonHover } = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-[24px] shadow-2xl border border-gray-100 p-6 w-[99%] max-w-sm z-10 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center gap-2 mb-4">
                    <div className={`w-14 h-14 rounded-full ${iconBg} flex items-center justify-center ${iconColor} mb-1`}>
                        <Icon size={28} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{title}</h3>
                </div>

                <p className="text-slate-600 font-bold text-sm text-center mb-8 px-2 leading-relaxed">{message}</p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm 
                     shadow-[0_4px_0_#CBD5E1] hover:bg-slate-200 active:translate-y-[2px] active:shadow-none transition-all"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 h-12 rounded-xl ${buttonBg} text-white font-bold text-sm 
                     ${buttonShadow} ${buttonHover} active:translate-y-[2px] active:shadow-none transition-all`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
