"use client";

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// Importa dinamicamente a lib que renderiza um Web Component super leve e completo, 
// Bypass NPM travado: A API em web component é carregada via script CDN no index.html
// e tipada globalmente para o React.

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'emoji-picker': any;
        }
    }
}

interface EmojiPickerProps {
    open: boolean;
    onClose: () => void;
    onSelect: (emoji: string) => void;
    currentEmoji?: string;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ open, onClose, onSelect, currentEmoji }) => {
    const pickerRef = useRef<any>(null);

    useEffect(() => {
        if (!open) return;

        const handleEmojiSelect = (e: any) => {
            onSelect(e.detail.unicode);
            onClose();
        };

        if (pickerRef.current) {
            pickerRef.current.addEventListener('emoji-click', handleEmojiSelect);
        }

        return () => {
            if (pickerRef.current) {
                pickerRef.current.removeEventListener('emoji-click', handleEmojiSelect);
            }
        };
    }, [open, onSelect, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-1 sm:p-3 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative bg-white rounded-[24px] shadow-2xl border border-slate-200 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),inset_0_1.5px_1px_white] w-[99%] max-w-[360px] max-h-[70vh] z-10 flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#0f3c78] to-[#2f80ed] rounded-t-[24px] shrink-0">
                    <div>
                        <h3 className="font-black text-white tracking-tight text-sm">
                            Escolher emoji
                        </h3>
                        {currentEmoji && (
                            <p className="text-white/70 text-xs mt-0.5">
                                Atual: <span className="text-base">{currentEmoji}</span>
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-[#E53935] hover:bg-[#C62828] text-white shadow-lg active:scale-90 transition-all"
                        title="Fechar"
                    >
                        <X className="w-4 h-4 md:w-[22px] md:h-[22px]" strokeWidth={4} />
                    </button>
                </div>

                {/* Emoji Picker Web Component */}
                <div className="flex-1 bg-white p-2 overflow-y-auto">
                    {/* As variáveis nativas mudam a cor base para combinar com o tema do app */}
                    <emoji-picker
                        ref={pickerRef}
                        class="light"
                        locale="pt"
                        style={{
                            width: '100%',
                            height: '100%',
                            '--num-columns': '8',
                            '--emoji-size': '1.8rem',
                            '--background': '#ffffff',
                            '--indicator-color': '#2f80ed',
                            '--search-focus-border-color': '#2f80ed',
                            '--input-border-color': '#e2e8f0',
                            '--category-font-color': '#64748b'
                        } as React.CSSProperties}
                    />
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 rounded-b-[24px] shrink-0">
                    <button
                        onClick={() => { onSelect(''); onClose(); }}
                        className="w-full h-10 rounded-xl bg-slate-200 text-slate-600 hover:bg-slate-300 hover:text-slate-800 text-sm font-bold transition-all shadow-sm active:translate-y-[2px] active:shadow-none"
                    >
                        ✖ Remover emoji
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmojiPicker;
