"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
    ArrowLeft, Loader2, Plus, Trash2, Edit2, Shield, CheckCircle,
    XCircle, User, Search, RefreshCw, X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
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
    conferente: 'Conferente',
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10 animate-in zoom-in-95 duration-200">
                <p className="text-slate-700 font-medium text-sm text-center mb-6">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Cancelar</button>
                    <button onClick={onConfirm} className="flex-1 h-10 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700">Confirmar</button>
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
                toast.success('Usuário atualizado!');
            } else {
                if (!data.password) {
                    toast.error('Senha é obrigatória para novos usuários');
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

                toast.success('Usuário criado com sucesso!');
            }

            onSaved();
            onClose();
        } catch (err: any) {
            console.error("Erro ao salvar:", err);
            toast.error(err.message || 'Erro ao salvar usuário');
        }
    };

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-[#0f3c78] to-[#2f80ed]">
                    <h3 className="font-bold text-white uppercase tracking-wider text-sm">
                        {isEditing ? '✏️ Editar Usuário' : '👤 Novo Usuário'}
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all">
                        <X size={16} />
                    </button>
                </div>

                <form
                    onSubmit={form.handleSubmit(handleSubmit, (errors) => {
                        console.log("Erros de validação:", errors);
                        toast.error('Verifique os campos obrigatórios');
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
                                <option value="conferente">Conferente</option>
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

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">Cancelar</button>
                        <button type="submit" disabled={form.formState.isSubmitting} className="flex-1 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-sm hover:from-blue-500 hover:to-blue-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                            {form.formState.isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : 'Salvar'}
                        </button>
                    </div>
                </form>
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

    const fetchUsuarios = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('nome');

        if (error) {
            toast.error('Erro ao carregar usuários');
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

            toast.success('Usuário excluído permanentemente!');
            fetchUsuarios();
        } catch (err: any) {
            console.error("Erro ao deletar:", err);
            toast.error(err.message || 'Erro ao excluir usuário');
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
            toast.error('Erro ao alterar status');
        } else {
            toast.success(`Usuário ${!user.ativo ? 'ativado' : 'desativado'}!`);
            fetchUsuarios();
        }
    };
    return (
        <div className="min-h-screen bg-[#EFF3F6] flex flex-col">
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
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6">

                    {/* Header interno do Módulo */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(-1)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                👥 Usuários
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={fetchUsuarios} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all shadow-sm hidden md:flex">
                                <RefreshCw size={16} />
                            </button>
                            <button
                                onClick={() => { setEditingUser(null); setModalOpen(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
                            >
                                <Plus size={16} /> Novo Usuário
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
                                                            <img src={u.foto_url} alt={u.nome} className="w-8 h-8 rounded-lg object-cover" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                                                <span className="text-blue-600 text-[10px] font-black">
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
                                            <div className="flex items-center gap-3">
                                                {u.foto_url ? (
                                                    <img src={u.foto_url} alt={u.nome} className="w-10 h-10 rounded-xl object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                                        <span className="text-blue-600 text-xs font-black">
                                                            {u.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-slate-700 font-bold text-sm">{u.nome}</p>
                                                    <p className="text-slate-400 text-xs">{u.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => { setEditingUser(u); setModalOpen(true); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => setConfirmDelete(u.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${u.perfil === 'administrador' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                {PERFIL_LABELS[u.perfil]}
                                            </span>
                                            <button onClick={() => handleToggleAtivo(u)} className={`px-2 py-0.5 rounded-full text-xs font-bold border ${u.ativo ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                {u.ativo ? 'Ativo' : 'Inativo'}
                                            </button>
                                            {u.cargo && <span className="px-2 py-0.5 rounded-full text-xs bg-slate-50 text-slate-500 border border-slate-100">{u.cargo}</span>}
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
