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
    Calendar as CalendarIcon, Mail, Shield, CheckCircle
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
            <div className="w-[140px] h-[140px] rounded-2xl bg-slate-200 mb-6" />
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

    const form = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        values: {
            nome: profile?.nome || '',
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
                .eq('id', user.id)
                .single();
            const oldFotoUrl = profileData?.foto_url;

            // 2. Transforma Blob
            const blob = await getCroppedImg(rawImageSrc, croppedArea);

            // 3. Faz Upload com nome novo p/ o supabase storage
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
                cargo: data.cargo.trim() || null,
                matricula: data.matricula.trim() || null,
                data_nascimento: data.data_nascimento || null,
            });
            toast.success('Perfil atualizado com sucesso!');
        }
    };

    // URL do avatar a exibir (prioridade: preview local > profile.foto_url)
    const avatarUrl = localAvatarUrl || profile?.foto_url || null;
    const initials = profile?.nome
        ? profile.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    return (
        <div className="min-h-screen bg-[#EFF3F6] flex flex-col">
            <Toaster richColors position="top-center" />

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
                                        className="w-[130px] h-[130px] sm:w-[140px] sm:h-[140px] rounded-2xl overflow-hidden border-4 border-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] bg-blue-50 transition-transform duration-300 group-hover:scale-[1.03] mx-auto flex items-center justify-center shrink-0"
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
                                <p className="text-slate-400 text-[11px] mt-3">JPG, PNG ou WebP · máx. 5MB</p>
                            </div>

                            {/* 🟩 CARD 2 – INFORMAÇÕES PESSOAIS (COLUNA DIREITA 60% -> col-span-7) */}
                            <div className="md:col-span-7 bg-[#FAFAFA] rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-200/50 p-6 sm:p-8 flex flex-col h-full">
                                <div className="mb-6 flex items-center gap-3 border-b border-slate-200/60 pb-4">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                        <User size={16} className="stroke-[2.5]" />
                                    </div>
                                    <h3 className="font-bold text-slate-700 text-sm tracking-widest uppercase">
                                        Informações Pessoais
                                    </h3>
                                </div>

                                <div className="space-y-5 flex-1">
                                    {/* Nome */}
                                    <div>
                                        <label className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                                            <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center text-blue-600">
                                                <User size={12} />
                                            </div>
                                            Nome Completo <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            {...form.register('nome')}
                                            type="text"
                                            placeholder="Seu nome completo"
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-slate-300 shadow-sm"
                                        />
                                        {form.formState.errors.nome && (
                                            <p className="text-red-500 text-xs mt-1.5 ml-1">
                                                {form.formState.errors.nome.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Email (não editável) */}
                                    <div>
                                        <label className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                                            <div className="w-5 h-5 rounded-md bg-orange-100 flex items-center justify-center text-orange-600">
                                                <Mail size={12} />
                                            </div>
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={profile?.email || ''}
                                            readOnly
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200/60 bg-slate-100 text-slate-500 text-sm font-medium cursor-not-allowed shadow-sm"
                                        />
                                        <p className="text-slate-400 text-[11px] mt-1.5 ml-1">
                                            O email não pode ser alterado
                                        </p>
                                    </div>

                                    {/* Data de Nascimento */}
                                    <div>
                                        <label className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                                            <div className="w-5 h-5 rounded-md bg-red-100 flex items-center justify-center text-red-600">
                                                <CalendarIcon size={12} />
                                            </div>
                                            Data de Nascimento
                                        </label>
                                        <input
                                            {...form.register('data_nascimento')}
                                            type="date"
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                                        />
                                        {form.formState.errors.data_nascimento && (
                                            <p className="text-red-500 text-xs mt-1.5 ml-1">
                                                {form.formState.errors.data_nascimento.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Cargo */}
                                    <div>
                                        <label className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                                            <div className="w-5 h-5 rounded-md bg-purple-100 flex items-center justify-center text-purple-600">
                                                <Briefcase size={12} />
                                            </div>
                                            Cargo <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            {...form.register('cargo')}
                                            type="text"
                                            placeholder="Ex: Soldado BM, Cabo BM, Sargento BM..."
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-slate-300 shadow-sm"
                                        />
                                        {form.formState.errors.cargo && (
                                            <p className="text-red-500 text-xs mt-1.5 ml-1">
                                                {form.formState.errors.cargo.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Matrícula */}
                                    <div>
                                        <label className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                                            <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                <Hash size={12} />
                                            </div>
                                            Matrícula <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            {...form.register('matricula')}
                                            type="text"
                                            placeholder="Número de matrícula"
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-slate-300 shadow-sm"
                                        />
                                        {form.formState.errors.matricula && (
                                            <p className="text-red-500 text-xs mt-1.5 ml-1">
                                                {form.formState.errors.matricula.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* ── Botão Salvar ─────────────────────────────── */}
                                <div className="mt-8 pt-6 border-t border-slate-200/60">
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
        </div>
    );
};

export default MeuPerfil;
