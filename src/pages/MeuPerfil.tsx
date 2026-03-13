"use client";

import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/contexts/ToastProvider';
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
    escala: z.string().optional().nullable(),
});

type ProfileForm = z.infer<typeof profileSchema>;

// ────────────────────────────────────────────────────────────
// Labels
// ────────────────────────────────────────────────────────────
const PERFIL_LABELS: Record<string, string> = {
    conferente: 'Membro',
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
    const { showSuccessToast, showErrorToast } = useToast();

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
            escala: profile?.escala || '',
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
            showErrorToast(validationError);
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
            showSuccessToast('Foto atualizada com sucesso!');

            // 6. Limpar antigo (Assíncrono sem travar UI)
            if (oldFotoUrl) {
                deleteOldAvatar(oldFotoUrl).catch(e => console.error('Erro silent ao deletar', e));
            }

            // UI limpa de imediato
            setShowCropper(false);

        } catch (err: any) {
            console.error('[handleCropConfirm] Erro completo:', err);
            showErrorToast(err?.message || 'Erro inesperado ao salvar a foto.');
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
            showErrorToast(error);
        } else {
            // Atualizar estado global otimisticamente
            updateProfile({
                nome: data.nome.trim(),
                apelido: data.apelido?.trim() || null,
                cargo: data.cargo.trim() || null,
                matricula: data.matricula.trim() || null,
                data_nascimento: data.data_nascimento || null,
                escala: data.escala || null,
            });
            showSuccessToast('Perfil atualizado com sucesso!');
        }
    };

    const handleUpdatePassword = async () => {
        if (!newPassword || !confirmPassword) {
            showErrorToast('Preencha todos os campos de senha');
            return;
        }

        if (newPassword !== confirmPassword) {
            showErrorToast('As senhas não coincidem');
            return;
        }

        if (newPassword.length < 6) {
            showErrorToast('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setChangingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            showSuccessToast('Senha alterada com sucesso!');
            setShowPasswordModal(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            showErrorToast(err.message || 'Erro ao alterar senha');
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
        <div className="min-h-screen flex flex-col items-stretch justify-start px-[14px] py-2 lg:p-0 md:gap-y-2 overflow-x-hidden md:overflow-visible text-slate-800">

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

            <section className="w-full lg:w-screen lg:relative lg:left-1/2 lg:right-1/2 lg:-ml-[50vw] lg:-mr-[50vw] pt-0 lg:pt-[82px] pb-0 lg:pb-8 bg-transparent lg:premium-subheader-bg lg:border-t-[3px] lg:border-[#2563eb] lg:shadow-[0_12px_28px_rgba(0,0,0,0.08)] mb-6">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-0 sm:pt-6">
                    {/* Cabeçalho do Módulo Interno */}
                    <div className="flex items-center justify-center md:justify-start gap-3 flex-1">
                        <h2 className="text-[1.2rem] md:text-[1.7rem] font-black tracking-tight flex items-center gap-3">
                            <div className="w-9 h-9 md:w-12 md:h-12 bg-gradient-to-br from-[#f0f7ff] via-[#e1effe] to-[#dbeafe] rounded-xl md:rounded-2xl border border-blue-200/50 shadow-[inset_0_1.5px_1.5px_white,0_2px_4px_rgba(37,99,235,0.06)] flex items-center justify-center shrink-0">
                                <span className="text-lg md:text-2xl">👤</span>
                            </div>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-900">Meu Perfil</span>
                        </h2>
                    </div>
                </div>
            </section>

            <div className="w-full max-w-5xl mx-auto px-0 sm:px-6 pb-8">

                {authLoading ? (
                    <ProfileSkeleton />
                ) : (
                    <form onSubmit={form.handleSubmit(handleSave)} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start md:items-stretch">
                        {/* 🟦 CARD 1 – PERFIL (COLUNA ESQUERDA 40% -> col-span-5) */}
                        <div className="md:col-span-5 h-full bg-white rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.04),inset_0_1.5px_1px_white] border border-slate-200 p-8 flex flex-col items-center text-center transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
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
                                className="w-full h-11 rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 text-white font-bold text-[15px] sm:text-[16px] shadow-[0_4px_0_#1d4ed8] hover:brightness-110 active:translate-y-[4px] active:shadow-none transition-all duration-200 flex items-center justify-center gap-2 border-none ring-0 outline-none disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <Camera size={16} className="text-white/90" />
                                {uploadingPhoto ? 'Enviando...' : 'Alterar Foto'}
                            </button>

                            <p className="text-slate-400 text-[11px] mt-2 mb-1">JPG, PNG ou WebP · máx. 15MB</p>

                            {/* Espaçador para empurrar o botão de senha para o rodapé em desktop */}
                            <div className="hidden md:block flex-1" />

                            <div className="w-full mt-10 pt-6 border-t border-slate-200/60">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewPassword('');
                                        setConfirmPassword('');
                                        setShowPasswordModal(true);
                                    }}
                                    className="w-full h-11 rounded-xl bg-gradient-to-b from-orange-400 to-orange-600 text-white font-bold text-[15px] sm:text-[16px] shadow-[0_4px_0_#c2410c] hover:brightness-110 active:translate-y-[4px] active:shadow-none transition-all duration-200 flex items-center justify-center gap-2 border-none ring-0 outline-none"
                                >
                                    <Lock size={16} className="text-white/90" />
                                    Alterar Senha
                                </button>
                            </div>
                        </div>

                        {/* 🟩 CARD 2 – INFORMAÇÕES PESSOAIS (COLUNA DIREITA 60% -> col-span-7) */}
                        <div className="md:col-span-7 bg-white rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.04),inset_0_1.5px_1px_white] border border-slate-200 p-6 sm:p-8 flex flex-col h-full">
                            <div className="mb-6 flex items-center gap-3.5 border-b border-slate-200/60 pb-4">
                                <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-200 shadow-[0_2px_0_#93c5fd,inset_0_1.5px_1px_white] border border-blue-200/80 shrink-0">
                                    <span className="text-xl drop-shadow-sm">ℹ️</span>
                                </div>
                                <h3 className="font-black text-[1.15rem] md:text-[1.3rem] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-900">
                                    Informações Pessoais
                                </h3>
                            </div>

                            <div className="grid grid-cols-12 gap-x-4 gap-y-5">
                                {/* LINHA 1: Nome (9) e Matrícula (3) */}
                                <div className="col-span-12 md:col-span-9">
                                    <label className="flex items-center gap-2 text-slate-600 text-[13px] font-bold mb-1.5 ml-1">
                                        <span className="text-sm">📝</span>
                                        Nome Completo <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        {...form.register('nome')}
                                        type="text"
                                        placeholder="Seu nome"
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-[#F0F7FF] text-slate-700 text-sm md:text-[15px] font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-slate-300 shadow-sm"
                                    />
                                    {form.formState.errors.nome && (
                                        <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">
                                            {form.formState.errors.nome.message}
                                        </p>
                                    )}
                                </div>

                                <div className="col-span-12 md:col-span-3">
                                    <label className="flex items-center gap-2 text-slate-600 text-[13px] font-bold mb-1.5 ml-1">
                                        <span className="text-sm">🆔</span>
                                        Matrícula <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        {...form.register('matricula')}
                                        type="text"
                                        placeholder="Nº"
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-[#F0F7FF] text-slate-700 text-sm md:text-[15px] font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-slate-300 shadow-sm"
                                    />
                                    {form.formState.errors.matricula && (
                                        <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">
                                            {form.formState.errors.matricula.message}
                                        </p>
                                    )}
                                </div>

                                {/* LINHA 2: Apelido (6) e Cargo (6) */}
                                <div className="col-span-12 md:col-span-6">
                                    <label className="flex items-center gap-2 text-slate-600 text-[13px] font-bold mb-1.5 ml-1">
                                        <span className="text-sm">🏷️</span>
                                        Apelido
                                    </label>
                                    <input
                                        {...form.register('apelido')}
                                        type="text"
                                        placeholder="Como prefere ser chamado"
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-[#F0F7FF] text-slate-700 text-sm md:text-[15px] font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-slate-300 shadow-sm"
                                    />
                                </div>

                                <div className="col-span-12 md:col-span-6">
                                    <label className="flex items-center gap-2 text-slate-600 text-[13px] font-bold mb-1.5 ml-1">
                                        <span className="text-sm">🎖️</span>
                                        Cargo <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        {...form.register('cargo')}
                                        type="text"
                                        placeholder="Ex: Soldado BM"
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-[#F0F7FF] text-slate-700 text-sm md:text-[15px] font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-slate-300 shadow-sm"
                                    />
                                    {form.formState.errors.cargo && (
                                        <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">
                                            {form.formState.errors.cargo.message}
                                        </p>
                                    )}
                                </div>

                                {/* LINHA 3: Email (12) */}
                                <div className="col-span-12">
                                    <label className="flex items-center gap-2 text-slate-600 text-[13px] font-bold mb-1.5 ml-1">
                                        <span className="text-sm">📧</span>
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={profile?.email || ''}
                                        readOnly
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200/60 bg-slate-100/50 text-slate-400 text-sm md:text-[15px] font-medium cursor-not-allowed shadow-sm"
                                    />
                                </div>

                                {/* LINHA 4: Data Nascimento (6) e Escala (6) */}
                                <div className="col-span-12 md:col-span-6">
                                    <label className="flex items-center gap-2 text-slate-600 text-[13px] font-bold mb-1.5 ml-1">
                                        <span className="text-sm">🎂</span>
                                        Data de Nascimento
                                    </label>
                                    <input
                                        {...form.register('data_nascimento')}
                                        type="date"
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-[#F0F7FF] text-slate-700 text-sm md:text-[15px] font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                                    />
                                </div>

                                <div className="col-span-12 md:col-span-6">
                                    <label className="flex items-center gap-2 text-slate-600 text-[13px] font-bold mb-1.5 ml-1">
                                        <span className="text-sm">📅</span>
                                        Escala Preferida
                                    </label>
                                    <select
                                        {...form.register('escala')}
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-[#F0F7FF] text-slate-700 text-sm md:text-[15px] font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm appearance-none cursor-pointer"
                                    >
                                        <option value="">Não Definida</option>
                                        <option value="Adm">👔 Escala Adm</option>
                                        <option value="12x36">👮 Escala 12x36</option>
                                        <option value="24x48">🧑‍🚒 Escala 24x48</option>
                                    </select>
                                </div>
                            </div>

                            {/* ── Botão Salvar ─────────────────────────────── */}
                            <div className="mt-10 pt-6 border-t border-slate-200/60 flex justify-center">
                                <button
                                    type="submit"
                                    disabled={saving || uploadingPhoto}
                                    className="w-full md:w-auto md:min-w-[280px] h-12 rounded-xl bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] text-white font-bold text-[16px] shadow-[0_4px_0_#1e3a8a] hover:brightness-110 active:translate-y-[4px] active:shadow-none transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:pointer-events-none"
                                >
                                    {saving ? (
                                        <><Loader2 size={20} className="animate-spin" /> Salvando...</>
                                    ) : (
                                        <>💾 Salvar Alterações</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
            {/* Footer exibido apenas em desktop */}
            <Footer className="hidden md:block" />

            {showPasswordModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 bg-black/60 backdrop-blur-sm">
                    <div className="absolute inset-0" onClick={() => setShowPasswordModal(false)} />
                    <div className="relative bg-gradient-to-br from-[#f8fbff] to-[#e0efff] rounded-[24px] shadow-2xl border border-white/60 p-7 md:p-9 w-[99%] md:max-w-[440px] z-10 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setShowPasswordModal(false)}
                            className="absolute right-4 top-4 md:right-6 md:top-6 w-8 h-8 flex items-center justify-center rounded-full bg-[#E53935] hover:bg-[#C62828] text-white shadow-md active:scale-90 transition-all"
                        >
                            <X size={18} strokeWidth={3} />
                        </button>

                        <div className="flex items-center gap-3 mb-8 md:mb-10">
                            <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-200 shadow-[0_2px_0_#93c5fd,inset_0_1.5px_1px_white] border border-blue-200/80 shrink-0">
                                <span className="text-xl md:text-2xl drop-shadow-sm">🔐</span>
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-[1.2rem] md:text-[1.4rem] font-black tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-900">
                                    Alterar Senha
                                </h3>
                                <p className="text-slate-500 font-medium text-[11px] md:text-[13px] leading-tight mt-0.5">Defina sua nova senha de acesso.</p>
                            </div>
                        </div>

                        <div className="space-y-5 md:space-y-6">
                            <div>
                                <label className="block text-[13px] md:text-[14px] font-black text-slate-500 mb-2 ml-1">Nova Senha</label>
                                <div className="relative">
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder=""
                                        autoComplete="new-password"
                                        className="w-full h-11 md:h-12 px-4 pr-10 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm md:text-base focus:outline-none focus:border-blue-500 transition-all font-bold"
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
                                <label className="block text-[13px] md:text-[14px] font-black text-slate-500 mb-2 ml-1">Confirmar Senha</label>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder=""
                                    autoComplete="new-password"
                                    className="w-full h-11 md:h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm md:text-base focus:outline-none focus:border-blue-500 transition-all font-bold"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-10 md:mt-12">
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="flex-1 h-12 md:h-13 rounded-xl bg-slate-200 border border-slate-300 text-slate-700 font-bold text-[16px] md:text-[17px] shadow-[0_4px_0_#CBD5E1] hover:bg-slate-300 active:translate-y-[2px] active:shadow-none transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpdatePassword}
                                disabled={changingPassword}
                                className="flex-1 h-12 md:h-13 rounded-xl bg-gradient-to-b from-blue-600 to-blue-700 text-white font-bold text-[16px] md:text-[17px] shadow-[0_4px_0_#1E3A8A] hover:brightness-110 active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {changingPassword ? <><Loader2 size={18} className="animate-spin" /> Alterando...</> : 'Alterar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeuPerfil;
