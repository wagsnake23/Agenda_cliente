import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Edit2, Shield, XCircle, User, X, Key } from 'lucide-react';
import { Profile } from '@/modules/auth/types';
import { PERFIL_LABELS } from '@/constants/labels';

const userFormSchema = z.object({
    nome: z.string().min(3, 'Nome mínimo 3 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().optional().refine(val => !val || val.length >= 6, {
        message: 'Senha deve ter no mínimo 6 caracteres',
    }),
    cargo: z.string().optional().nullable(),
    matricula: z.string().optional().nullable(),
    perfil: z.enum(['conferente', 'administrador']),
    ativo: z.boolean(),
});

type UserFormInput = z.infer<typeof userFormSchema>;

interface UserModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: UserFormInput) => Promise<void>;
    onResetPassword?: (userId: string) => Promise<void>;
    userToEdit: Profile | null;
    saving: boolean;
}

const UserModal: React.FC<UserModalProps> = ({
    open,
    onClose,
    onSubmit,
    onResetPassword,
    userToEdit,
    saving
}) => {
    const [resetting, setResetting] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<UserFormInput>({
        resolver: zodResolver(userFormSchema),
        values: {
            nome: userToEdit?.nome || '',
            email: userToEdit?.email || '',
            password: '',
            cargo: userToEdit?.cargo || '',
            matricula: userToEdit?.matricula || '',
            perfil: userToEdit?.perfil || 'conferente',
            ativo: userToEdit?.ativo ?? true,
        },
    });

    if (!open) return null;

    const handleReset = async () => {
        if (!userToEdit || !onResetPassword) return;
        setResetting(true);
        try {
            await onResetPassword(userToEdit.id);
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="relative bg-white rounded-[24px] shadow-2xl border border-gray-100 p-6 sm:p-8 w-full max-w-lg z-10 animate-in zoom-in-95 duration-200 my-auto">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 active:scale-95 transition-all"
                >
                    <X size={18} />
                </button>

                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${userToEdit ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                        {userToEdit ? <Edit2 size={24} /> : <Plus size={24} />}
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                            {userToEdit ? 'Editar Usuário' : 'Novo Usuário'}
                        </h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-none">
                            Gerenciar permissões e dados
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Nome Completo</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><User size={16} /></span>
                                <input
                                    {...register('nome')}
                                    placeholder="Ex: Fulano de Tal"
                                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
                                />
                            </div>
                            {errors.nome && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors.nome.message}</p>}
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Email de Acesso</label>
                            <input
                                {...register('email')}
                                placeholder="email@exemplo.com"
                                disabled={!!userToEdit}
                                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium disabled:opacity-60 disabled:bg-slate-100 cursor-not-allowed"
                            />
                            {errors.email && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors.email.message}</p>}
                        </div>

                        {!userToEdit && (
                            <div className="sm:col-span-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Senha Provisória</label>
                                <input
                                    {...register('password')}
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
                                />
                                {errors.password && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors.password.message}</p>}
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Cargo / Patente</label>
                            <input
                                {...register('cargo')}
                                placeholder="Ex: Soldado"
                                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-1">RE / Matrícula</label>
                            <input
                                {...register('matricula')}
                                placeholder="Nº registro"
                                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Nível de Acesso</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Shield size={16} /></span>
                                <select
                                    {...register('perfil')}
                                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm focus:outline-none focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer"
                                >
                                    <option value="conferente">Membro</option>
                                    <option value="administrador">Administrador</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Estado da Conta</label>
                            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                                <label className="flex-1">
                                    <input type="radio" {...register('ativo')} value="true" className="peer hidden" checked={register('ativo').value} />
                                    <div className="h-9 rounded-lg flex items-center justify-center text-[10px] font-black uppercase tracking-widest cursor-pointer peer-checked:bg-green-600 peer-checked:text-white transition-all text-slate-400">Ativo</div>
                                </label>
                                <label className="flex-1">
                                    <input type="radio" {...register('ativo')} value="false" className="peer hidden" />
                                    <div className="h-9 rounded-lg flex items-center justify-center text-[10px] font-black uppercase tracking-widest cursor-pointer peer-checked:bg-red-600 peer-checked:text-white transition-all text-slate-400">Inativo</div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-50">
                        {userToEdit && (
                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={resetting || saving}
                                className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest border border-slate-200 hover:bg-slate-200 active:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                            >
                                {resetting ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                                Resetar Senha
                            </button>
                        )}
                        <button
                            disabled={saving || resetting}
                            type="submit"
                            className={`flex-[2] h-12 rounded-xl ${userToEdit ? 'bg-amber-500 shadow-[0_4px_0_#B45309] hover:bg-amber-600' : 'bg-blue-600 shadow-[0_4px_0_#1E3A8A] hover:bg-blue-700'} text-white font-black text-xs uppercase tracking-widest active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2`}
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : (userToEdit ? 'Salvar Edição' : 'Criar Usuário')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;
