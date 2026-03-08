import React, { useState } from 'react';
import { Loader2, Lock, X, Eye, EyeOff } from 'lucide-react';

interface PasswordModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (password: string) => Promise<void>;
    loading: boolean;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ open, onClose, onConfirm, loading }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);

    const handleUpdate = async () => {
        if (newPassword !== confirmPassword) return; // Should be handled by validation outside if possible
        await onConfirm(newPassword);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 bg-black/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="relative bg-gradient-to-br from-[#f8fbff] to-[#e0efff] rounded-[24px] shadow-2xl border border-white/60 p-6 w-[99%] max-w-sm z-10 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#E53935] hover:bg-[#C62828] text-white shadow-md active:scale-90 transition-all"
                >
                    <X size={18} strokeWidth={3} />
                </button>

                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 mb-1">
                        <span className="text-2xl select-none">🔐</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Alterar Senha</h3>
                    <p className="text-slate-600 font-medium text-xs px-2 leading-relaxed">Defina sua nova senha de acesso.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Nova Senha</label>
                        <div className="relative">
                            <input
                                type={showPass ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder=""
                                autoComplete="new-password"
                                className="w-full h-11 px-4 pr-10 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm focus:outline-none focus:border-blue-500 transition-all font-bold"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Confirmar Senha</label>
                        <input
                            type={showPass ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder=""
                            autoComplete="new-password"
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm focus:outline-none focus:border-blue-500 transition-all font-bold"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-600 font-bold text-base uppercase tracking-wider shadow-[0_4px_0_#CBD5E1] hover:bg-slate-200 active:translate-y-[2px] active:shadow-none transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleUpdate}
                        disabled={loading || !newPassword || newPassword !== confirmPassword}
                        className="flex-1 h-12 rounded-xl bg-blue-600 text-white font-bold text-base uppercase tracking-wider shadow-[0_4px_0_#1E3A8A] hover:bg-blue-700 active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : 'Alterar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PasswordModal;
