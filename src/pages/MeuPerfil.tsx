"use client";

import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import {
    ArrowLeft, Camera, Loader2, Save, User, Briefcase, Hash,
    Calendar as CalendarIcon, Mail, Shield, CheckCircle, Lock, X, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getCroppedImg } from '@/utils/cropImage';
import { validateImageFile, uploadAvatar, updateProfilePhoto } from '@/utils/uploadAvatar';
import { deleteOldAvatar } from '@/utils/deleteOldAvatar';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import ImageCropperModal from '@/components/ImageCropperModal';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Area } from 'react-easy-crop';

// ────────────────────────────────────────────────────────────
// Schema Zod
// ────────────────────────────────────────────────────────────
const profileSchema = z.object({
    nome: z.string().min(1, 'Nome é obrigatório').min(3, 'Mínimo 3 caracteres'),
    apelido: z.string().optional().nullable(),
    cargo: z.string().min(1, 'Cargo é obrigatório'),
    matricula: z.string().min(1, 'Matrícula é obrigatória'),
    data_nascimento: z.string().optional().nullable(),
});

type ProfileForm = z.infer<typeof profileSchema>;

// ────────────────────────────────────────────────────────────
// Labels
// ────────────────────────────────────────────────────────────
const PERFIL_LABELS: Record<string, string> = {
    conferente: 'Conferente',
    administrador: 'Administrador',
};

// ────────────────────────────────────────────────────────────
// Skeleton de Carregamento
// ────────────────────────────────────────────────────────────
const ProfileSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-pulse w-full max-w-5xl mx-auto">
        <div className="md:col-span-5 bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col items-center">
            <div className="w-[150px] h-[150px] sm:w-[160px] sm:h-[160px] rounded-2xl bg-slate-200 mb-6" />
            <div className="h-6 w-40 bg-slate-200 rounded-lg mb-3" />
            <div className="h-4 w-32 bg-slate-100 rounded-full mb-6" />
            <div className="flex gap-2 mb-8">
                <div className="h-6 w-24 bg-slate-100 rounded-full" />
                <div className="h-6 w-16 bg-slate-100 rounded-full" />
            </div>
            <div className="h-10 w-full bg-slate-100 rounded-xl" />
        </div>
        <div className="md:col-span-7 bg-[#FAFAFA] rounded-3xl shadow-sm border border-slate-100 p-8 space-y-6">
            <div className="h-5 w-48 bg-slate-200 rounded-lg mb-8" />
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="space-y-2">
                    <div className="h-4 w-32 bg-slate-100 rounded" />
                    <div className="h-12 w-full bg-slate-100 rounded-xl" />
                </div>
            ))}
            <div className="h-14 w-full bg-slate-200 rounded-xl mt-8" />
        </div>
    </div>
);

// ────────────────────────────────────────────────────────────
// Componente Principal
// ────────────────────────────────────────────────────────────
const MeuPerfil: React.FC = () => {
    const { profile, user, loading: authLoading, updateProfile } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { saving, saveProfile } = useProfile();

    // Estado do crop
    const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);

    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    // Preview local (exibido imediatamente após crop)
    const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);

    // Estado para alteração de senha
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const form = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        values: {
            nome: profile?.nome || '',
            apelido: profile?.apelido || '',
            cargo: profile?.cargo || '',
            matricula: profile?.matricula || '',
            data_nascimento: profile?.data_nascimento || '',
        },
    });

    // ── Selecionar arquivo → abrir cropper ────────────────────
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // Limpar o input para permitir re-selecionar o mesmo arquivo
        e.target.value = '';

        if (!file) return;

        const validationError = validateImageFile(file);
        if (validationError) {
            toast.error(validationError);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setRawImageSrc(objectUrl);
        setShowCropper(true);
    }, []);

    // ── Confirmar corte → upload → atualizar UI ──────────────
    const handleCropConfirm = useCallback(async (croppedArea: Area) => {
        if (!rawImageSrc || !user) return;

        setUploadingPhoto(true);

        try {
            // 1. Obter snapshot da foto de perfil antiga
            const { data: profileData } = await supabase
                .from('profiles')
                .select('foto_url')
                .eq('id', user?.id)
                .single();
            const oldFotoUrl = profileData?.foto_url;

            // 2. Transforma Blob
            const blob = await getCroppedImg(rawImageSrc, croppedArea);

            // 3. Faz Upload com nome novo p/ o supabase storage
            if (!user?.id) throw new Error("Usuário não autenticado");
            const { publicUrl, filePath } = await uploadAvatar(user.id, blob);

            try {
                // 4. Update BD Profile
                await updateProfilePhoto(user.id, publicUrl);
            } catch (updateErr: any) {
                // Rollback manual via Supabase Storage
                await supabase.storage.from('avatars').remove([filePath]);
                throw updateErr;
            }

            // 5. Sucesso - Atualizar UI local
            updateProfile({ foto_url: publicUrl });
            setLocalAvatarUrl(publicUrl);
            toast.success('Foto atualizada com sucesso!');

            // 6. Limpar antigo (Assíncrono sem travar UI)
            if (oldFotoUrl) {
                deleteOldAvatar(oldFotoUrl).catch(e => console.error('Erro silent ao deletar', e));
            }

            // UI limpa de imediato
            setShowCropper(false);

        } catch (err: any) {
            console.error('[handleCropConfirm] Erro completo:', err);
            toast.error(err?.message || 'Erro inesperado ao alterar a foto.');
        } finally {
            // Em qualquer cenário, cancela o "Enviando"
            setUploadingPhoto(false);
            if (rawImageSrc) {
                URL.revokeObjectURL(rawImageSrc);
                setRawImageSrc(null);
            }
        }
    }, [rawImageSrc, user, updateProfile]);

    const handleCropCancel = useCallback(() => {
        setShowCropper(false);
        if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
        setRawImageSrc(null);
    }, [rawImageSrc]);

    // ── Salvar dados do perfil ────────────────────────────────
    const handleSave = async (data: ProfileForm) => {
        const { error } = await saveProfile(data as any);
        if (error) {
            toast.error(error);
        } else {
            // Atualizar estado global otimisticamente
            updateProfile({
                nome: data.nome.trim(),
                apelido: data.apelido?.trim() || null,
                cargo: data.cargo.trim() || null,
                matricula: data.matricula.trim() || null,
                data_nascimento: data.data_nascimento || null,
            });
            toast.success('Perfil atualizado com sucesso!');
        }
    };

    const handleUpdatePassword = async () => {
        if (!newPassword || !confirmPassword) {
            toast.error('Preencha todos os campos de senha');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('As senhas não coincidem');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setChangingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            toast.success('Senha alterada com sucesso!');
            setShowPasswordModal(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            toast.error(err.message || 'Erro ao alterar senha');
        } finally {
            setChangingPassword(false);
        }
    };

    // URL do avatar a exibir (prioridade: preview local > profile.foto_url)
    const avatarUrl = localAvatarUrl || profile?.foto_url || null;
    const initials = profile?.nome
        ? profile.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    return (
        <div className="min-h-screen bg-[#EFF3F6] flex flex-col">

            {/* Cropper Modal */}
            {showCropper && rawImageSrc && (
                <ImageCropperModal
                    imageSrc={rawImageSrc}
                    onConfirm={handleCropConfirm}
                    onCancel={handleCropCancel}
                    uploading={uploadingPhoto}
                />
            )}
            {/* Header Global */}
            <Header />

            <div className="w-full h-full lg:pt-[74px]">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                    {/* Cabeçalho do Módulo Interno */}
                    <div className="flex items-center gap-3 mb-8">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            👤 Meu Perfil
                        </h2>
                    </div>

                    {authLoading ? (
                        <ProfileSkeleton />
                    ) : (
                        <form onSubmit={form.handleSubmit(handleSave)} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                            {/* 🟦 CARD 1 – PERFIL (COLUNA ESQUERDA 40% -> col-span-5) */}
                            <div className="md:col-span-5 bg-white rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100/60 p-8 flex flex-col items-center text-center transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                                {/* Avatar */}
                                <div className="relative group cursor-pointer mb-5" onClick={() => fileInputRef.current?.click()}>
                                    <div
                                        className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] rounded-2xl overflow-hidden border-4 border-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] bg-blue-50 transition-transform duration-300 group-hover:scale-[1.03] mx-auto flex items-center justify-center shrink-0"
                                        title="Clique para alterar foto"
                                    >
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt="Foto de perfil"
                                                className="w-full h-full object-cover"
                                                onError={() => setLocalAvatarUrl(null)}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                                                <span className="text-4xl font-black text-blue-600 select-none">
                                                    {initials}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Overlay hover */}
                                    <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-1">
                                            {uploadingPhoto ? (
                                                <Loader2 size={24} className="text-white animate-spin" />
                                            ) : (
                                                <Camera size={24} className="text-white drop-shadow-md" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Botão câmera flutuante fixo */}
                                    <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 w-10 h-10 rounded-full bg-blue-600 border-2 border-white text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 pointer-events-none">
                                        {uploadingPhoto ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Camera size={16} />
                                        )}
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />
                                </div>

                                {/* Info de perfil */}
                                <h2 className="font-bold text-slate-800 text-[20px] leading-tight tracking-tight mb-1">
                                    {profile?.nome}
                                </h2>
                                <p className="text-slate-500 text-[13px] mb-4">{profile?.email}</p>

                                <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                                    <span className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${profile?.perfil === 'administrador'
                                        ? 'bg-red-50 text-red-700 border border-red-100'
                                        : 'bg-blue-50 text-blue-700 border border-blue-100'
                                        }`}>
                                        <Shield size={12} />
                                        {PERFIL_LABELS[profile?.perfil || 'conferente']}
                                    </span>
                                    {profile?.ativo && (
                                        <span className="px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-100 flex items-center gap-1.5">
                                            <CheckCircle size={12} />
                                            Ativo
                                        </span>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingPhoto}
                                    className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500/60"
                                >
                                    <Camera size={16} className="text-white/90" />
                                    {uploadingPhoto ? 'Enviando...' : 'Alterar Foto de Perfil'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewPassword('');
                                        setConfirmPassword('');
                                        setShowPasswordModal(true);
                                    }}
                                    className="w-full h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-sm font-semibold flex items-center justify-center gap-2 transition-all mt-3 hover:bg-slate-100 hover:border-slate-300"
                                >
                                    <Lock size={16} className="text-slate-400" />
                                    Alterar Senha de Acesso
                                </button>

                                <p className="text-slate-400 text-[11px] mt-3">JPG, PNG ou WebP · máx. 5MB</p>
                            </div>

                            {/* 🟩 CARD 2 – INFORMAÇÕES PESSOAIS (COLUNA DIREITA 60% -> col-span-7) */}
                            <div className="md:col-span-7 bg-[#FAFAFA] rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-200/50 p-6 sm:p-8 flex flex-col h-full">
                                <div className="mb-6 flex items-center gap-3 border-b border-slate-200/60 pb-4">
                                    <span className="text-2xl select-none filter drop-shadow-sm">👤</span>
                                    <h3 className="font-bold text-slate-700 text-sm tracking-widest uppercase">
                                        Informações Pessoais
                                    </h3>
                                </div>

                                <div className="grid grid-cols-12 gap-x-4 gap-y-5">
                                    {/* LINHA 1: Nome (9) e Matrícula (3) */}
                                    <div className="col-span-12 md:col-span-9">
                                        <label className="flex items-center gap-2 text-slate-600 text-[11px] font-bold uppercase tracking-wider mb-1.5 ml-1">
                                            <span className="text-sm">📝</span>
                                            Nome Completo <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            {...form.register('nome')}
                                            type="text"
                                            placeholder="Seu nome"
                                            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-slate-300 shadow-sm"
                                        />
                                        {form.formState.errors.nome && (
                                            <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">
                                                {form.formState.errors.nome.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="col-span-12 md:col-span-3">
                                        <label className="flex items-center gap-2 text-slate-600 text-[11px] font-bold uppercase tracking-wider mb-1.5 ml-1">
                                            <span className="text-sm">🆔</span>
                                            Matrícula <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            {...form.register('matricula')}
                                            type="text"
                                            placeholder="Nº"
                                            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-slate-300 shadow-sm"
                                        />
                                        {form.formState.errors.matricula && (
                                            <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">
                                                {form.formState.errors.matricula.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* LINHA 2: Apelido (6) e Cargo (6) */}
                                    <div className="col-span-12 md:col-span-6">
                                        <label className="flex items-center gap-2 text-slate-600 text-[11px] font-bold uppercase tracking-wider mb-1.5 ml-1">
                                            <span className="text-sm">🏷️</span>
                                            Apelido
                                        </label>
                                        <input
                                            {...form.register('apelido')}
                                            type="text"
                                            placeholder="Como prefere ser chamado"
                                            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-slate-300 shadow-sm"
                                        />
                                    </div>

                                    <div className="col-span-12 md:col-span-6">
                                        <label className="flex items-center gap-2 text-slate-600 text-[11px] font-bold uppercase tracking-wider mb-1.5 ml-1">
                                            <span className="text-sm">🎖️</span>
                                            Cargo <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            {...form.register('cargo')}
                                            type="text"
                                            placeholder="Ex: Soldado BM"
                                            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-slate-300 shadow-sm"
                                        />
                                        {form.formState.errors.cargo && (
                                            <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">
                                                {form.formState.errors.cargo.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* LINHA 3: Email (12) */}
                                    <div className="col-span-12">
                                        <label className="flex items-center gap-2 text-slate-600 text-[11px] font-bold uppercase tracking-wider mb-1.5 ml-1">
                                            <span className="text-sm">📧</span>
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={profile?.email || ''}
                                            readOnly
                                            className="w-full h-11 px-4 rounded-xl border border-slate-200/60 bg-slate-100/50 text-slate-400 text-sm font-medium cursor-not-allowed shadow-sm"
                                        />
                                    </div>

                                    {/* LINHA 4: Data Nascimento (12) */}
                                    <div className="col-span-12">
                                        <label className="flex items-center gap-2 text-slate-600 text-[11px] font-bold uppercase tracking-wider mb-1.5 ml-1">
                                            <span className="text-sm">🎂</span>
                                            Data de Nascimento
                                        </label>
                                        <input
                                            {...form.register('data_nascimento')}
                                            type="date"
                                            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                                        />
                                    </div>
                                </div>

                                {/* ── Botão Salvar ─────────────────────────────── */}
                                <div className="mt-10 pt-6 border-t border-slate-200/60">
                                    <button
                                        type="submit"
                                        disabled={saving || uploadingPhoto}
                                        className="w-full h-14 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1e40af] text-white font-bold uppercase tracking-widest text-[13px] shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_12px_28px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                                    >
                                        {saving ? (
                                            <><Loader2 size={20} className="animate-spin" /> Salvando Alterações...</>
                                        ) : (
                                            <>💾 Salvar Alterações</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
            {/* Footer exibido apenas em desktop */}
            <Footer className="hidden md:block" />

            {/* Modal de Alterar Senha */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
                    <div className="bg-slate-50 w-[98%] max-w-[98%] sm:max-w-sm rounded-[32px] overflow-hidden shadow-2xl border-4 border-white animate-in zoom-in-95 duration-200">
                        <div className="relative p-6 sm:p-8">
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center text-center mb-6">
                                <span className="text-4xl mb-3 select-none filter drop-shadow-sm transform hover:scale-110 transition-transform duration-300">
                                    🔐
                                </span>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Alterar Senha</h3>
                                <p className="text-slate-500 text-[13px] mt-1 font-medium">Defina sua nova senha de acesso</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Nova Senha</label>
                                    <div className="relative">
                                        <input
                                            type={showPass ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder=""
                                            autoComplete="new-password"
                                            className="w-full h-11 px-4 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm focus:outline-none focus:border-blue-500 transition-all font-sans"
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
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Confirmar Senha</label>
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder=""
                                        autoComplete="new-password"
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm focus:outline-none focus:border-blue-500 transition-all font-sans"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-9">
                                <button
                                    onClick={() => setShowPasswordModal(false)}
                                    className="flex-1 h-12 rounded-2xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-black text-[15px] uppercase tracking-wider transition-all duration-300 shadow-[0_4px_0_rgb(203,213,225)] active:shadow-none active:translate-y-[4px] border border-slate-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleUpdatePassword}
                                    disabled={changingPassword}
                                    className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black text-[15px] uppercase tracking-wider transition-all duration-300 shadow-[0_4px_0_rgb(29,78,216)] active:shadow-none active:translate-y-[4px] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-blue-500/50"
                                >
                                    {changingPassword ? <Loader2 size={20} className="animate-spin" /> : 'Alterar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeuPerfil;
