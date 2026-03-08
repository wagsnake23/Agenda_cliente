import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/contexts/ToastProvider';
import {
    ArrowLeft, Plus, Search, RefreshCw, Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Profile } from '@/modules/auth/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import UserModal from './UserModal';
import UserList from './UserList';
import { profilesService } from '@/services/profiles';

const UsuariosPage: React.FC = () => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { showSuccessToast, showErrorToast } = useToast();

    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<Profile | null>(null);
    const [saving, setSaving] = useState(false);

    // Confirm delete state
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const fetchProfiles = useCallback(async () => {
        setLoading(true);
        try {
            const data = await profilesService.getAll();
            setProfiles(data);
        } catch (err: any) {
            showErrorToast('Erro ao carregar usuários');
        } finally {
            setLoading(false);
        }
    }, [showErrorToast]);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

    const filteredProfiles = useMemo(() => {
        const term = search.toLowerCase();
        return profiles.filter(p =>
            p.nome.toLowerCase().includes(term) ||
            p.email.toLowerCase().includes(term) ||
            (p.cargo?.toLowerCase().includes(term) ?? false)
        );
    }, [profiles, search]);

    const handleOpenCreateModal = () => {
        setUserToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (profile: Profile) => {
        setUserToEdit(profile);
        setIsModalOpen(true);
    };

    const handleSubmit = async (data: any) => {
        setSaving(true);
        try {
            if (userToEdit) {
                // Update
                await profilesService.update(userToEdit.id, data);
                showSuccessToast('Usuário atualizado com sucesso!');
            } else {
                // Create (Edge Function)
                await profilesService.adminCreateUser(data);
                showSuccessToast('Usuário criado com sucesso!');
            }
            fetchProfiles();
            setIsModalOpen(false);
        } catch (err: any) {
            showErrorToast(err.message || 'Erro ao realizar operação');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        if (confirmDelete === currentUser?.id) {
            showErrorToast('Você não pode deletar sua própria conta.');
            return;
        }

        try {
            await profilesService.adminDeleteUser(confirmDelete);
            showSuccessToast('Usuário removido permanentemente.');
            setProfiles(prev => prev.filter(p => p.id !== confirmDelete));
        } catch (err: any) {
            showErrorToast(err.message || 'Erro ao deletar usuário');
        } finally {
            setConfirmDelete(null);
        }
    };

    const handleResetPassword = async (userId: string) => {
        try {
            await profilesService.adminResetPassword(userId);
            showSuccessToast('Senha resetada para "Agenda1"');
        } catch (err: any) {
            showErrorToast('Erro ao resetar senha');
        }
    };

    return (
        <div className="min-h-screen bg-[#EFF3F6] flex flex-col items-center justify-start p-2 lg:p-0 gap-y-2 overflow-x-hidden md:overflow-visible text-slate-800">
            <Header />

            <main className="w-full lg:pt-[74px]">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-0 sm:pt-6 pb-6 md:py-8">

                    {/* Module Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(-1)}
                                className="hidden md:flex w-10 h-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm active:translate-y-[1px]"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                    👥 Gestão de Usuários
                                </h2>
                                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                                    Administre acessos e perfis
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchProfiles}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all shadow-sm active:rotate-180 duration-500"
                                title="Recarregar"
                            >
                                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            </button>
                            <button
                                onClick={handleOpenCreateModal}
                                className="h-10 md:h-12 px-4 md:px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] md:text-xs tracking-widest shadow-[0_4px_0_#1E3A8A] hover:shadow-[0_2px_0_#1E3A8A] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-2"
                            >
                                <Plus size={18} />
                                <span className="hidden sm:inline">Cadastrar Usuário</span>
                                <span className="sm:hidden">Novo</span>
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="bg-white p-2 rounded-2xl md:rounded-3xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-slate-100/60 mb-8 max-w-2xl">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 select-none">
                                <Search size={20} />
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por nome, email ou cargo..."
                                className="w-full h-11 md:h-14 pl-12 pr-6 rounded-xl md:rounded-2xl border border-transparent bg-slate-50/70 text-slate-700 text-sm md:text-base font-bold focus:outline-none focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder-slate-300"
                            />
                        </div>
                    </div>

                    {/* Body Content */}
                    <UserList
                        users={filteredProfiles}
                        loading={loading}
                        onEdit={handleOpenEditModal}
                        onDelete={setConfirmDelete}
                    />

                </div>
            </main>

            <Footer />

            {/* Modality & Dials */}
            <UserModal
                open={isModalOpen}
                userToEdit={userToEdit}
                saving={saving}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                onResetPassword={handleResetPassword}
            />

            <ConfirmDialog
                open={!!confirmDelete}
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(null)}
                title="Confirmar exclusão"
                message="Tem certeza que deseja EXCLUIR permanentemente este usuário? Esta ação removerá o acesso e o perfil dele do sistema."
            />

        </div>
    );
};

export default UsuariosPage;
