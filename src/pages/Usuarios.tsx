"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/contexts/ToastProvider';
import {
    ArrowLeft, Loader2, Plus, Trash2, Edit2, Shield,
    CheckCircle, XCircle, User, Search, RefreshCw, X, Key
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Profile } from '@/modules/auth/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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

const PERFIL_LABELS: Record<string, string> = {
    conferente: 'Membro',
    administrador: 'Administrador',
};

const ConfirmDialog: React.FC<{
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    message: string;
}> = ({ open, onConfirm, onCancel, message }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-[24px] shadow-2xl border border-gray-100 p-6 w-[99%] max-w-sm z-10 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center gap-2 mb-4">
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-1">
                        <Trash2 size={28} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Confirmar exclusão</h3>
                </div>

                <p className="text-slate-600 font-bold text-sm text-center mb-8 px-2 leading-relaxed">{message}</p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm 
                                 shadow-[0_4px_0_#CBD5E1] hover:bg-slate-200 active:translate-y-[2px] active:shadow-none transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 h-12 rounded-xl bg-red-600 text-white font-bold text-sm 
                                 shadow-[0_4px_0_#991B1B] hover:bg-red-700 active:translate-y-[2px] active:shadow-none transition-all"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

// ----- Modal de Usuário -----
const UserModal: React.FC<{
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    editingUser?: Profile | null;
}> = ({ open, onClose, onSaved, editingUser }) => {
    const isEditing = !!editingUser;
    const { session } = useAuth();
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
    const { showSuccessToast, showErrorToast } = useToast();

    const form = useForm<UserFormInput>({
        resolver: zodResolver(userFormSchema),
        defaultValues: {
            nome: '',
            email: '',
            password: '',
            cargo: '',
            matricula: '',
            perfil: 'conferente',
            ativo: true,
        },
    });

    useEffect(() => {
        if (editingUser) {
            form.reset({
                nome: editingUser.nome,
                email: editingUser.email,
                cargo: editingUser.cargo || '',
                matricula: editingUser.matricula || '',
                perfil: editingUser.perfil,
                ativo: editingUser.ativo,
                password: '',
            });
        } else {
            form.reset({ nome: '', email: '', password: '', cargo: '', matricula: '', perfil: 'conferente', ativo: true });
        }
    }, [editingUser, open, form]);

    const handleSubmit = async (data: UserFormInput) => {
        try {
            console.log("Iniciando salvamento:", data);
            if (isEditing && editingUser) {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        nome: data.nome,
                        cargo: data.cargo || null,
                        matricula: data.matricula || null,
                        perfil: data.perfil,
                        ativo: data.ativo,
                    })
                    .eq('id', editingUser.id);

                if (error) throw error;
                showSuccessToast('Usuário atualizado!');
            } else {
                if (!data.password) {
                    showErrorToast('Senha é obrigatória para novos usuários');
                    return;
                }

                // Chamar a Edge Function para criar o usuário com privilégios de admin
                const { data: functionData, error: functionError } = await supabase.functions.invoke('admin-create-user', {
                    body: {
                        email: data.email,
                        password: data.password,
                        nome: data.nome,
                        cargo: data.cargo,
                        matricula: data.matricula,
                        perfil: data.perfil,
                        ativo: data.ativo
                    }
                });

                if (functionError) {
                    console.error("Erro invoke:", functionError);
                    throw new Error(functionError.message || 'Erro de rede ou permissão');
                }

                if (functionData && functionData.success === false) {
                    console.error("Erro na função:", functionData.error);
                    throw new Error(functionData.error || 'Erro desconhecido no servidor');
                }

                showSuccessToast('Usuário criado com sucesso!');
            }

            onSaved();
            onClose();
        } catch (err: any) {
            console.error("Erro ao salvar:", err);
            showErrorToast(err.message || 'Erro ao salvar usuário');
        }
    };

    const handleResetPassword = async () => {
        if (!editingUser || !session) return;

        setActionLoading("reset-password");
        try {
            const { error } = await supabase.functions.invoke("reset-password", {
                body: { userId: editingUser.id },
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (error) throw error;

            showSuccessToast('Senha redefinida', 'Senha redefinida para Agenda1');
        } catch (error: any) {
            console.error("Erro ao resetar senha:", error);
            showErrorToast('Erro ao resetar senha', error.message);
        } finally {
            setActionLoading(null);
            setIsConfirmResetOpen(false);
        }
    };

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 md:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-[99%] max-w-[99%] md:max-w-md z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 md:p-5 bg-gradient-to-r from-[#0f3c78] to-[#2f80ed]">
                    <h3 className="font-bold text-white uppercase tracking-wider text-sm md:text-base">
                        {isEditing ? '✏️ Editar Usuário' : '👤 Novo Usuário'}
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#E53935] hover:bg-[#C62828] transition-all text-white shadow-md active:scale-90" title="Fechar">
                        <X size={18} strokeWidth={3} />
                    </button>
                </div>

                <form
                    onSubmit={form.handleSubmit(handleSubmit, (errors) => {
                        console.log("Erros de validação:", errors);
                        showErrorToast('Verifique os campos obrigatórios');
                    })}
                    className="p-5 space-y-4"
                >
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 mb-1 block">Nome</label>
                        <input {...form.register('nome')} type="text" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-blue-400 transition-all" />
                        {form.formState.errors.nome && <p className="text-red-500 text-xs mt-1 ml-1">{form.formState.errors.nome.message}</p>}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 mb-1 block">Email</label>
                        <input {...form.register('email')} type="email" readOnly={isEditing} className={`w-full h-10 px-3 rounded-xl border text-slate-700 text-sm focus:outline-none focus:border-blue-400 transition-all ${isEditing ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed' : 'border-slate-200'}`} />
                        {form.formState.errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{form.formState.errors.email.message}</p>}
                    </div>

                    {!isEditing && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 mb-1 block">Senha</label>
                            <input {...form.register('password')} type="password" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-blue-400 transition-all" />
                            {form.formState.errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{form.formState.errors.password.message}</p>}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 mb-1 block">Cargo</label>
                            <input {...form.register('cargo')} type="text" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-blue-400 transition-all" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 mb-1 block">Matrícula</label>
                            <input {...form.register('matricula')} type="text" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-blue-400 transition-all" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 mb-1 block">Perfil</label>
                            <select {...form.register('perfil')} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-blue-400 transition-all">
                                <option value="conferente">Membro</option>
                                <option value="administrador">Administrador</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 mb-1 block">Status</label>
                            <select {...form.register('ativo', { setValueAs: v => v === 'true' || v === true })} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-blue-400 transition-all">
                                <option value="true">Ativo</option>
                                <option value="false">Inativo</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        {isEditing && (
                            <button
                                type="button"
                                onClick={() => setIsConfirmResetOpen(true)}
                                disabled={actionLoading === "reset-password"}
                                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 border border-orange-500 shadow-sm transition-all disabled:opacity-60"
                            >
                                {actionLoading === "reset-password" ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Key size={16} />
                                )}
                                Resetar Senha
                            </button>
                        )}

                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-600 font-bold text-[15px] shadow-[0_4px_0_#CBD5E1] hover:bg-slate-200 active:translate-y-[2px] active:shadow-none transition-all">Cancelar</button>
                            <button type="submit" disabled={form.formState.isSubmitting} className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-[15px] shadow-[0_4px_0_#1E3A8A] hover:from-blue-500 hover:to-blue-600 active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                {form.formState.isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </form>

                <AlertDialog open={isConfirmResetOpen} onOpenChange={setIsConfirmResetOpen}>
                    <AlertDialogContent className="w-[99%] max-w-sm rounded-[24px] border-none shadow-2xl p-6">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center justify-center gap-2">
                                🔑 Redefinir Senha
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-600 font-bold text-sm leading-relaxed mt-2 text-center">
                                Deseja redefinir a senha do usuário para <strong className="text-orange-600">Agenda1</strong>?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex flex-row items-center gap-3 mt-6 sm:space-x-0 sm:justify-center w-full">
                            <AlertDialogCancel className="m-0 mt-0 flex-1 h-12 rounded-xl bg-slate-100 text-slate-600 font-bold text-[15px] border border-slate-200 shadow-[0_4px_0_#CBD5E1] hover:bg-slate-200 active:translate-y-[2px] active:shadow-none transition-all">
                                Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleResetPassword();
                                }}
                                className="m-0 flex-1 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-[15px] border-none shadow-[0_4px_0_#C2410C] hover:from-orange-600 hover:to-orange-700 active:translate-y-[2px] active:shadow-none transition-all"
                            >
                                Confirmar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
};

// ----- Página Principal -----
const UsuariosPage: React.FC = () => {
    const navigate = useNavigate();
    const [usuarios, setUsuarios] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Profile | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { showSuccessToast, showErrorToast } = useToast();

    const fetchUsuarios = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('nome');

        if (error) {
            showErrorToast('Erro ao carregar usuários');
        } else {
            setUsuarios(data as Profile[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

    const filtrados = usuarios.filter(u =>
        u.nome.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.cargo || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            // Chamando a função RPC do banco de dados que acabamos de criar via SQL
            const { data, error } = await supabase.rpc('delete_user_admin', {
                target_user_id: id
            });

            if (error) throw error;

            // A função RPC retorna { success: boolean, error?: string }
            if (data?.success === false) {
                throw new Error(data.error);
            }

            showSuccessToast('Usuário excluído permanentemente!');
            fetchUsuarios();
        } catch (err: any) {
            console.error("Erro ao deletar:", err);
            showErrorToast(err.message || 'Erro ao excluir usuário');
        } finally {
            setDeletingId(null);
            setConfirmDelete(null);
        }
    };

    const handleToggleAtivo = async (user: Profile) => {
        const { error } = await supabase
            .from('profiles')
            .update({ ativo: !user.ativo })
            .eq('id', user.id);
        if (error) {
            showErrorToast('Erro ao alterar status');
        } else {
            showSuccessToast(`Usuário ${!user.ativo ? 'ativado' : 'desativado'}!`);
            fetchUsuarios();
        }
    };
    return (
        <div className="min-h-screen bg-[#EFF3F6] flex flex-col items-center justify-start p-2 lg:p-0 gap-y-2 overflow-x-hidden md:overflow-visible text-slate-800">
            <Header />
            <ConfirmDialog
                open={!!confirmDelete}
                onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
                onCancel={() => setConfirmDelete(null)}
                message="Tem certeza que deseja EXCLUIR permanentemente este usuário? Esta ação removerá o acesso e o perfil dele do sistema."
            />
            <UserModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditingUser(null); }}
                onSaved={fetchUsuarios}
                editingUser={editingUser}
            />

            <div className="w-full lg:pt-[74px]">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-0 sm:pt-6 pb-6">

                    {/* Header interno do Módulo */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div className="flex items-center justify-center md:justify-start gap-3 w-full">
                            <button
                                onClick={() => navigate(-1)}
                                className="hidden md:flex w-10 h-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center md:justify-start gap-2 flex-1 md:flex-none">
                                👥 Usuários
                            </h2>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                                onClick={fetchUsuarios}
                                className="w-11 h-11 flex items-center justify-center shrink-0 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all shadow-sm hidden md:flex"
                                title="Atualizar"
                            >
                                <RefreshCw size={16} />
                            </button>
                            <button
                                onClick={() => { setEditingUser(null); setModalOpen(true); }}
                                className="w-full sm:w-auto shrink-0 whitespace-nowrap h-11 px-6 lg:px-8 flex items-center justify-center gap-2 rounded-xl lg:rounded-2xl font-black uppercase text-sm text-[#0B1221] bg-gradient-to-b from-[#fef08a] to-[#facc15] shadow-[0_4px_0_#eab308] hover:brightness-110 active:translate-y-[4px] active:shadow-none transition-all duration-200 cursor-pointer border-none ring-0 outline-none"
                            >
                                <Plus size={16} strokeWidth={3} /> Novo Usuário
                            </button>
                        </div>
                    </div>

                    {/* Busca */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar por nome, email ou cargo..."
                                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium focus:outline-none focus:border-blue-400 transition-all"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Usuário</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Email</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Cargo</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Matrícula</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Perfil</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtrados.map((u, i) => (
                                            <tr key={u.id} className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        {u.foto_url ? (
                                                            <img src={u.foto_url} alt={u.nome} className="w-10 h-10 rounded-lg object-cover" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                                                <span className="text-blue-600 text-[11px] font-black">
                                                                    {u.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <span className="text-slate-700 text-sm font-semibold">{u.nome}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500 text-sm">{u.email}</td>
                                                <td className="px-4 py-3 text-slate-600 text-sm">{u.cargo || '—'}</td>
                                                <td className="px-4 py-3 text-slate-600 text-sm">{u.matricula || '—'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${u.perfil === 'administrador' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                        <Shield size={9} className="inline mr-1" />
                                                        {PERFIL_LABELS[u.perfil]}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button onClick={() => handleToggleAtivo(u)} className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${u.ativo ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'} transition-all`}>
                                                        {u.ativo ? <><CheckCircle size={10} /> Ativo</> : <><XCircle size={10} /> Inativo</>}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => { setEditingUser(u); setModalOpen(true); }}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDelete(u.id)}
                                                            disabled={deletingId === u.id}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                                                        >
                                                            {deletingId === u.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filtrados.length === 0 && (
                                    <div className="py-12 text-center">
                                        <User size={32} className="text-slate-200 mx-auto mb-2" />
                                        <p className="text-slate-400 text-sm">Nenhum usuário encontrado</p>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-3">
                                {filtrados.map(u => (
                                    <div key={u.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="grid grid-cols-[56px_1fr] gap-x-3 flex-1">
                                                {/* ÁREA DO AVATAR - LINHA 1 */}
                                                <div className="col-start-1 row-start-1 shrink-0">
                                                    {u.foto_url ? (
                                                        <img src={u.foto_url} alt={u.nome} className="w-14 h-14 rounded-xl object-cover shadow-sm" />
                                                    ) : (
                                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm">
                                                            <span className="text-blue-600 text-sm font-black">
                                                                {u.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* ÁREA DE TEXTO - LINHA 1 */}
                                                <div className="col-start-2 row-start-1 min-w-0 pr-1">
                                                    <p className="text-slate-700 font-bold text-sm truncate">{u.nome}</p>
                                                    <p className="text-slate-400 text-[11px] truncate leading-tight mt-0.5">{u.email}</p>
                                                </div>

                                                {/* STATUS - LINHA 2 (ABAIXO DO AVATAR) */}
                                                <div className="col-start-1 row-start-2 flex justify-center mt-2">
                                                    <button onClick={() => handleToggleAtivo(u)} className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border whitespace-nowrap ${u.ativo ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                        {u.ativo ? 'Ativo' : 'Inativo'}
                                                    </button>
                                                </div>

                                                {/* BADGES - LINHA 2 (ABAIXO DO TEXTO) */}
                                                <div className="col-start-2 row-start-2 flex flex-wrap gap-1.5 items-center mt-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${u.perfil === 'administrador' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                        {PERFIL_LABELS[u.perfil]}
                                                    </span>
                                                    {u.cargo && <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-50 text-slate-500 border border-slate-100">{u.cargo}</span>}
                                                </div>
                                            </div>

                                            {/* AÇÕES À DIREITA */}
                                            <div className="flex flex-col gap-2 ml-3 shrink-0">
                                                <button
                                                    onClick={() => { setEditingUser(u); setModalOpen(true); }}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 active:scale-90 transition-all shadow-sm border border-blue-100"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDelete(u.id)}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-600 active:scale-90 transition-all shadow-sm border border-red-100"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/* Footer exibido apenas em desktop */}
            <Footer className="hidden md:block" />
        </div>
    );
};

export default UsuariosPage;
